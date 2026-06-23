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

    if (order_type !== 'pickup') {
      return NextResponse.json(
        { message: 'Cash payment is only available for self pickup' },
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
      order_status: 'pending',
      notes: notes || null,
    });

    return NextResponse.json(orderData);
  } catch (error: unknown) {
    console.error('Error creating cash order:', error);
    const message = error instanceof Error ? error.message : 'System error';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
