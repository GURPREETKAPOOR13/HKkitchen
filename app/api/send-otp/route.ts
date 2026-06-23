import { NextResponse } from 'next/server';
import otpStore from '@/lib/otp-store';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone || phone.length < 10) {
      return NextResponse.json({ message: 'Valid phone number required' }, { status: 400 });
    }

    const otp = '1234';
    otpStore.set(phone, { otp, expires: Date.now() + 300000 });

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch {
    return NextResponse.json({ message: 'Failed to send OTP' }, { status: 500 });
  }
}
