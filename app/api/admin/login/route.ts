import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const correctPassword = await getSetting('ADMIN_PASSWORD') || 'hkkitchen2024';

    if (password === correctPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, message: 'Incorrect admin password' },
        { status: 401 }
      );
    }
  } catch (error: unknown) {
    console.error('Admin login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server login error' },
      { status: 500 }
    );
  }
}
