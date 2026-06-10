import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

let cache: Record<string, string> | null = null;

export async function getSetting(key: string): Promise<string> {
  if (cache?.[key]) return cache[key];
  const envVal = process.env[key];
  if (envVal) return envVal;
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', key).single();
    if (data?.value) return data.value;
  } catch {}
  return '';
}

export async function getAllSettings(): Promise<Record<string, string>> {
  if (cache) return cache;
  const merged: Record<string, string> = {};
  try {
    const { data } = await supabase.from('settings').select('*');
    const dbSettings: Record<string, string> = {};
    (data || []).forEach((s: { key: string; value: string }) => { dbSettings[s.key] = s.value; });
    const keys = [
      'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET', 'ADMIN_PASSWORD', 'NEXT_PUBLIC_WHATSAPP_NUMBER',
    ];
    for (const key of keys) {
      merged[key] = dbSettings[key] || process.env[key] || '';
    }
  } catch {
    const keys = [
      'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET', 'ADMIN_PASSWORD', 'NEXT_PUBLIC_WHATSAPP_NUMBER',
    ];
    for (const key of keys) {
      merged[key] = process.env[key] || '';
    }
  }
  cache = merged;
  return merged;
}

export function clearSettingsCache() {
  cache = null;
}
