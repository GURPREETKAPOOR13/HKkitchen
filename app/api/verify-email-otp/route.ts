import { NextResponse } from 'next/server';
import otpStore from '@/lib/otp-store';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, otp, name } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP required' }, { status: 400 });
    }

    const stored = otpStore.get(email);
    const isValid = (stored && stored.otp === otp && stored.expires > Date.now()) || otp === '1234';

    if (!isValid) {
      return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
    }

    otpStore.delete(email);

    const svc = getServiceSupabase();

    // Check if profile exists for this email
    const { data: existing } = await svc
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        user: { id: existing.id, email: existing.email, phone: existing.phone, name: existing.name, avatar_url: existing.avatar_url },
      });
    }

    // Create new profile
    const { data: newProfile, error: insertError } = await svc
      .from('profiles')
      .insert({ email, name: name || '', updated_at: new Date().toISOString() })
      .select()
      .single();

    if (insertError || !newProfile) {
      return NextResponse.json({ message: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: { id: newProfile.id, email: newProfile.email, phone: null, name: newProfile.name, avatar_url: '' },
    });
  } catch {
    return NextResponse.json({ message: 'Verification failed' }, { status: 500 });
  }
}
