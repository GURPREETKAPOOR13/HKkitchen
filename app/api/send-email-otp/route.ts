import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import otpStore from '@/lib/otp-store';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ message: 'Valid email address required' }, { status: 400 });
    }

    // Get Gmail credentials from settings
    const svc = getServiceSupabase();
    const { data: settings } = await svc.from('settings').select('key, value').in('key', ['GMAIL_EMAIL', 'GMAIL_APP_PASSWORD']);
    const rows = settings || [];
    const gmailEmail = rows.find((s: { key: string }) => s.key === 'GMAIL_EMAIL')?.value || '';
    const gmailPass = rows.find((s: { key: string }) => s.key === 'GMAIL_APP_PASSWORD')?.value || '';
    const fromName = 'HK Kitchen';

    if (!gmailEmail || !gmailPass) {
      return NextResponse.json({ message: 'Gmail SMTP not configured. Admin must set GMAIL_EMAIL and GMAIL_APP_PASSWORD in settings.' }, { status: 500 });
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    otpStore.set(email, { otp, expires: Date.now() + 300000 });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailEmail, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${gmailEmail}>`,
      to: email,
      subject: 'Your HK Kitchen Login OTP',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #fdfbf7; border-radius: 16px; border: 1px solid #e8dcc8;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a4a1a; font-size: 24px; margin: 0;">HK Kitchen</h1>
            <p style="color: #b8860b; font-style: italic; margin: 4px 0 0;">Homemade Goodness, Just Like Home!</p>
          </div>
          <p style="color: #333; font-size: 14px; margin-bottom: 16px;">Your login OTP is:</p>
          <div style="background: #1a4a1a; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 16px; border-radius: 12px; letter-spacing: 8px; margin-bottom: 16px;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 12px; text-align: center;">This OTP expires in 5 minutes.</p>
          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 24px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Email OTP error:', error);
    return NextResponse.json({ message: 'Failed to send OTP. Check Gmail credentials in settings.' }, { status: 500 });
  }
}
