import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clearSettingsCache } from '@/lib/settings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'ADMIN_PASSWORD',
  'NEXT_PUBLIC_WHATSAPP_NUMBER',
  'WHATSAPP_CLOUD_API_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
];

export async function GET() {
  try {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;

    const dbSettings: Record<string, string> = {};
    (data || []).forEach((s: { key: string; value: string }) => { dbSettings[s.key] = s.value; });

    const merged: Record<string, string> = {};
    for (const key of DEFAULT_KEYS) {
      merged[key] = dbSettings[key] || process.env[key] || '';
    }

    return NextResponse.json(merged);
  } catch {
    const fallback: Record<string, string> = {};
    for (const key of DEFAULT_KEYS) {
      fallback[key] = process.env[key] || '';
    }
    return NextResponse.json(fallback);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entries = Object.entries(body).filter(([key]) => DEFAULT_KEYS.includes(key));

    for (const [key, value] of entries) {
      const { error } = await supabase.from('settings').upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
      if (error) console.error('Failed to save setting:', key, error);
    }

    clearSettingsCache();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to save settings' }, { status: 500 });
  }
}
