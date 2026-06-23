import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSetting } from '@/lib/settings';
import { insertOrder } from '@/lib/order';

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

    const orderData = await insertOrder({
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
