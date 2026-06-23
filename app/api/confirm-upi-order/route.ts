import { NextResponse } from 'next/server';
import { insertOrder } from '@/lib/order';

export async function POST(req: Request) {
  try {
    const {
      customer_name,
      customer_phone,
      customer_address,
      order_type,
      items,
      total_amount,
      notes,
    } = await req.json();

    if (!customer_name || !customer_phone || !items || !total_amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
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
      payment_status: 'pending',
      razorpay_order_id: `UPI_${Date.now()}`,
      razorpay_payment_id: `UPI_${Date.now()}`,
      order_status: 'pending',
      notes: notes || null,
    });

    return NextResponse.json(orderData);
  } catch (error: unknown) {
    console.error('Error creating UPI order:', error);
    const message = error instanceof Error ? error.message : 'System error';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
