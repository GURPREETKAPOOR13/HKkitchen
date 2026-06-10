import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { getSetting } from '@/lib/settings';
import { sendRestaurantNotification, sendCustomerConfirmation } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer_name,
      customer_phone,
      customer_address,
      order_type,
      items,
      total_amount,
      notes,
    } = await req.json();

    const keySecret = await getSetting('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      console.error('Razorpay key secret is missing!');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { message: 'Missing payment signature details' },
        { status: 400 }
      );
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { message: 'Payment verification failed (invalid signature)' },
        { status: 400 }
      );
    }

    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utcTime + 3600000 * 5.5);

    const year = istTime.getFullYear();
    const month = String(istTime.getMonth() + 1).padStart(2, '0');
    const day = String(istTime.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const startOfIstDay = new Date(istTime);
    startOfIstDay.setHours(0, 0, 0, 0);
    const startOfIstDayUTC = new Date(startOfIstDay.getTime() - 3600000 * 5.5).toISOString();

    const endOfIstDay = new Date(istTime);
    endOfIstDay.setHours(23, 59, 59, 999);
    const endOfIstDayUTC = new Date(endOfIstDay.getTime() - 3600000 * 5.5).toISOString();

    const { count, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfIstDayUTC)
      .lte('created_at', endOfIstDayUTC);

    if (countError) {
      console.error('Error fetching today\'s order count:', countError);
    }

    const nextSeq = String((count || 0) + 1).padStart(4, '0');
    const orderNumber = `HK-${dateStr}-${nextSeq}`;

    const { data: orderData, error: insertError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name,
        customer_phone,
        customer_address,
        order_type,
        items,
        total_amount,
        payment_status: 'paid',
        razorpay_order_id,
        razorpay_payment_id,
        order_status: 'pending',
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving order to Supabase:', insertError);
      return NextResponse.json(
        { message: 'Payment was verified, but failed to save order: ' + insertError.message },
        { status: 500 }
      );
    }

    sendRestaurantNotification({
      order_number: orderNumber,
      customer_name,
      customer_phone,
      customer_address: customer_address || 'Self Pickup',
      order_type,
      items,
      total_amount,
      notes,
    });
    sendCustomerConfirmation({
      order_number: orderNumber,
      customer_name,
      customer_phone,
      customer_address: customer_address || 'Self Pickup',
      order_type,
      items,
      total_amount,
      notes,
    });

    return NextResponse.json(orderData);
  } catch (error: unknown) {
    console.error('Error verifying payment:', error);
    const message = error instanceof Error ? error.message : 'Verification system error';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
