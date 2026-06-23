import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAllSettings } from '@/lib/settings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ message: 'Phone number required' }, { status: 400 });
    }

    const settings = await getAllSettings();
    const enabled = settings.LOYALTY_ENABLED !== 'false';
    const starsRequired = Number(settings.LOYALTY_STARS) || 6;
    const freeItem = settings.LOYALTY_FREE_ITEM || 'Free Item';

    let stamps = 0;
    let lastStampDate: string | null = null;
    let canStampToday = false;
    let rewardAvailable = false;

    if (enabled) {
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at')
        .eq('customer_phone', phone)
        .order('created_at', { ascending: false });

      if (orders) {
        const seenDates = new Set<string>();
        for (const order of orders) {
          const d = new Date(order.created_at);
          const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          seenDates.add(dateKey);
        }

        stamps = seenDates.size;
        const orderedDates = Array.from(seenDates).sort().reverse();
        lastStampDate = orderedDates[0] || null;

        const today = new Date();
        const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        canStampToday = !seenDates.has(todayKey);

        rewardAvailable = stamps > 0 && stamps % starsRequired === 0;
      }
    }

    return NextResponse.json({
      enabled,
      stamps,
      starsRequired,
      freeItem,
      stampsUntilReward: starsRequired - (stamps % starsRequired),
      canStampToday,
      rewardAvailable,
      lastStampDate,
    });
  } catch (error) {
    console.error('Error fetching loyalty:', error);
    return NextResponse.json({ message: 'Failed to load loyalty data' }, { status: 500 });
  }
}
