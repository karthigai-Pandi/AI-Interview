import { Response } from 'express';
import { config } from '../config';
import { generateAccessToken, generateRefreshToken, JwtPayload } from '../middleware/auth';

export function setAuthCookies(res: Response, payload: JwtPayload): { accessToken: string } {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken };
}

export function formatUser(user: {
  _id: { toString(): string };
  email: string;
  name: string;
  role: string;
  isEmailVerified: boolean;
  avatar?: string;
  profile?: unknown;
  createdAt: Date;
}) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    avatar: user.avatar,
    profile: user.profile,
    createdAt: user.createdAt,
  };
}
