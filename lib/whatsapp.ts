import { getSetting } from './settings';

interface OrderInfo {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  order_type: string;
  items: { name: string; quantity: number; price_min: number }[];
  total_amount: number;
  notes?: string | null;
}

export async function sendRestaurantNotification(order: OrderInfo) {
  const phoneNumberId = await getSetting('WHATSAPP_PHONE_NUMBER_ID');
  const apiToken = await getSetting('WHATSAPP_CLOUD_API_TOKEN');
  const restaurantPhone = await getSetting('NEXT_PUBLIC_WHATSAPP_NUMBER') || '919818066376';

  if (!phoneNumberId || !apiToken) return false;

  const itemsList = order.items.map(i => `• ${i.name} x${i.quantity} — ₹${i.price_min * i.quantity}`).join('\n');

  const message = `🔔 *New Order Received!*
━━━━━━━━━━━━━━━
*Order:* ${order.order_number}
*Customer:* ${order.customer_name}
*Phone:* ${order.customer_phone}
*Type:* ${order.order_type.toUpperCase()}
${order.order_type === 'delivery' ? `*Address:* ${order.customer_address}` : '*Pickup:* Self Pickup'}
━━━━━━━━━━━━━━━
*Items:*
${itemsList}
━━━━━━━━━━━━━━━
*Total:* ₹${order.total_amount} ✅ PAID
${order.notes ? `━━━━━━━━━━━━━━━\n*Notes:* ${order.notes}` : ''}`;

  return sendWhatsApp(phoneNumberId, apiToken, restaurantPhone, message);
}

export async function sendCustomerConfirmation(order: OrderInfo) {
  const phoneNumberId = await getSetting('WHATSAPP_PHONE_NUMBER_ID');
  const apiToken = await getSetting('WHATSAPP_CLOUD_API_TOKEN');

  if (!phoneNumberId || !apiToken) return false;

  const itemsList = order.items.map(i => `• ${i.name} x${i.quantity}`).join('\n');

  const pickupOrDelivery = order.order_type === 'delivery'
    ? `Your order will be delivered to: ${order.customer_address}`
    : 'Please pick up your order from HK Kitchen, Rohini, Delhi.';

  const message = `✅ *Order Confirmed!*
━━━━━━━━━━━━━━━
*Order No:* ${order.order_number}
*Thank you for ordering from HK Kitchen!*
━━━━━━━━━━━━━━━
*Items:*
${itemsList}
*Total Paid:* ₹${order.total_amount}
━━━━━━━━━━━━━━━
${pickupOrDelivery}
${order.notes ? `\n*Your Instructions:* ${order.notes}` : ''}
━━━━━━━━━━━━━━━
For any changes, call us at 70115 31528 / 98180 66376`;

  return sendWhatsApp(phoneNumberId, apiToken, order.customer_phone, message);
}

async function sendWhatsApp(phoneNumberId: string, apiToken: string, to: string, message: string): Promise<boolean> {
  try {
    const cleanPhone = to.replace(/[^0-9]/g, '');
    if (!cleanPhone) return false;

    const res = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('WhatsApp API error:', err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('WhatsApp send failed:', err);
    return false;
  }
}
