import { getServiceSupabase } from './supabase';

const supabase = getServiceSupabase();

export function generateOrderNumber(): string {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utcTime + 3600000 * 5.5);
  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const ms = String(istTime.getTime()).slice(-8);
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `HK-${dateStr}-${ms}${rand}`;
}

export async function insertOrder(orderData: Record<string, unknown>) {
  const orderNumber = generateOrderNumber();
  const { data, error } = await supabase
    .from('orders')
    .insert({ ...orderData, order_number: orderNumber })
    .select()
    .single();
  if (error) {
    if (error.message?.includes('duplicate key') || error.code === '23505') {
      return insertOrder(orderData);
    }
    throw error;
  }
  return data;
}
