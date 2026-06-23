import { NextResponse } from 'next/server';
import { getAllSettings } from '@/lib/settings';

export async function GET() {
  try {
    const settings = await getAllSettings();
    return NextResponse.json({
      deliveryCharge: Number(settings.DELIVERY_CHARGE) || 40,
      freeDeliveryMin: Number(settings.FREE_DELIVERY_MIN) || 200,
      kitchenLat: Number(settings.KITCHEN_LAT) || 28.7041,
      kitchenLng: Number(settings.KITCHEN_LNG) || 77.1025,
      deliveryRadiusKm: Number(settings.DELIVERY_RADIUS_KM) || 5,
      kitchenOpen: settings.KITCHEN_OPEN !== 'false',
      todaysOffer: settings.TODAYS_OFFER || '',
      rushHours: settings.RUSH_HOURS || '[]',
    });
  } catch {
    return NextResponse.json({
      deliveryCharge: 40,
      freeDeliveryMin: 200,
      kitchenLat: 28.7041,
      kitchenLng: 77.1025,
      deliveryRadiusKm: 5,
      kitchenOpen: true,
      todaysOffer: '',
      rushHours: '[]',
    });
  }
}
