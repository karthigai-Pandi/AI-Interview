import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { config } from '../config';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (config.email.resendApiKey) {
    if (!resendClient) {
      resendClient = new Resend(config.email.resendApiKey);
    }
    return resendClient;
  }
  return null;
}

async function sendViaSmtp(to: string, subject: string, html: string): Promise<void> {
  if (!config.email.smtp.host) {
    console.log(`[Email Dev] To: ${to}, Subject: ${subject}`);
    console.log(html);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: false,
    auth: {
      user: config.email.smtp.user,
      pass: config.email.smtp.pass,
    },
  });

  await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  });
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = getResendClient();

  if (resend) {
    await resend.emails.send({
      from: config.email.from,
      to,
      subject,
      html,
    });
    return;
  }

  await sendViaSmtp(to, subject, html);
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  const html = `
    <h2>Verify your email</h2>
    <p>Click the link below to verify your email address:</p>
    <a href="${verifyUrl}">${verifyUrl}</a>
    <p>This link expires in 24 hours.</p>
  `;
  await sendEmail(email, 'Verify your email - AI Interview Platform', html);
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  const html = `
    <h2>Reset your password</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link expires in 1 hour.</p>
  `;
  await sendEmail(email, 'Reset your password - AI Interview Platform', html);
}

export async function sendNotificationEmail(
  email: string,
  title: string,
  message: string
): Promise<void> {
  const html = `<h2>${title}</h2><p>${message}</p>`;
  await sendEmail(email, title, html);
}
