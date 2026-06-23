import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getSetting } from '@/lib/settings';

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { message: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const keyId = await getSetting('NEXT_PUBLIC_RAZORPAY_KEY_ID');
    const keySecret = await getSetting('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials missing!');
      return NextResponse.json(
        { message: 'Payment gateway configuration error' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    const whatsappNumber = await getSetting('NEXT_PUBLIC_WHATSAPP_NUMBER') || '919818066376';
    const upiId = await getSetting('UPI_ID');

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      whatsapp_number: whatsappNumber,
      upi_id: upiId,
    });
  } catch (error: unknown) {
    console.error('Error creating Razorpay order:', error);
    const message = error instanceof Error ? error.message : 'Failed to create payment order';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
