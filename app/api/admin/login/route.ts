import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const correctPassword = process.env.ADMIN_PASSWORD || 'hkkitchen2024';

    if (password === correctPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, message: 'Incorrect admin password' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Admin login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server login error' },
      { status: 500 }
    );
  }
}
