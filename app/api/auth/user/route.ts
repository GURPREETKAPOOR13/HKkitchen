import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const svc = getServiceSupabase();
    const { data: profile } = await svc
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone: profile?.phone || null,
      name: profile?.name || user.user_metadata?.full_name || '',
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
    });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { phone, name } = await req.json();
    const svc = getServiceSupabase();

    // Check phone uniqueness if provided
    if (phone) {
      const { data: existing } = await svc
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .neq('id', user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ message: 'Phone number already in use by another account' }, { status: 409 });
      }
    }

    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (phone !== undefined) updates.phone = phone;
    if (name !== undefined) updates.name = name;

    const { error } = await svc.from('profiles').upsert(
      { id: user.id, email: user.email, ...updates },
      { onConflict: 'id' }
    );

    if (error) {
      return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}
