import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { verifyRefreshToken } from '../middleware/auth';
import { User } from '../models';
import { config } from '../config';
import { generateToken, hashToken } from '../utils/tokens';
import { setAuthCookies, formatUser } from '../utils/auth';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/email';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId || 'placeholder',
      clientSecret: config.google.clientSecret || 'placeholder',
      callbackURL: config.google.callbackUrl,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.findOne({ email: profile.emails?.[0]?.value });
          if (user) {
            user.googleId = profile.id;
            user.isEmailVerified = true;
            if (profile.photos?.[0]?.value) user.avatar = profile.photos[0].value;
            await user.save();
          } else {
            user = await User.create({
              email: profile.emails?.[0]?.value,
              name: profile.displayName,
              googleId: profile.id,
              role: 'candidate',
              isEmailVerified: true,
              avatar: profile.photos?.[0]?.value,
            });
          }
        }

        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    }
  )
);

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { email, password, name, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = generateToken();
    const hashedToken = hashToken(verificationToken);

    const user = await User.create({
      email,
      passwordHash,
      name,
      role,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      profile: { skills: [], experience: [], education: [], certifications: [], portfolioLinks: [] },
    });

    await sendVerificationEmail(email, verificationToken);

    const { accessToken } = setAuthCookies(res, {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: { user: formatUser(user), accessToken },
    });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const { accessToken } = setAuthCookies(res, {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      data: { user: formatUser(user), accessToken },
    });
  },

  async me(req: Request, res: Response): Promise<void> {
    res.json({ success: true, data: { user: formatUser(req.user!) } });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token required' });
      return;
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId);
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      const { accessToken } = setAuthCookies(res, {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.json({ success: true, data: { accessToken } });
    } catch {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const resetToken = generateToken();
      user.resetPasswordToken = hashToken(resetToken);
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      await sendPasswordResetEmail(email, resetToken);
    }

    res.json({
      success: true,
      message: 'If an account exists, a reset link has been sent',
    });
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      return;
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  },

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.body;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
      return;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  },

  googleAuth: passport.authenticate('google', { scope: ['profile', 'email'], session: false }),

  googleAuthCallback: passport.authenticate('google', {
    session: false,
    failureRedirect: `${config.frontendUrl}/login?error=google_auth_failed`,
  }),

  async googleCallback(req: Request, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      res.redirect(`${config.frontendUrl}/login?error=google_auth_failed`);
      return;
    }

    const { accessToken } = setAuthCookies(res, {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.redirect(`${config.frontendUrl}/auth/callback?token=${accessToken}`);
  },
};
