'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle2, ShoppingBag, ArrowRight, MessageSquare, Loader2,
  Clock, Check, CookingPot, PackageCheck, Truck, IndianRupee,
  Smartphone, CreditCard, Printer,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  id: number;
  name: string;
  price_min: number;
  price_max?: number | null;
  quantity: number;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  order_type: 'delivery' | 'pickup';
  items: OrderItem[];
  total_amount: number;
  payment_status: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  notes: string | null;
  created_at: string;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Placed', icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { key: 'confirmed', label: 'Confirmed', icon: Check, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { key: 'preparing', label: 'Preparing', icon: CookingPot, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { key: 'ready', label: 'Ready', icon: PackageCheck, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { key: 'delivered', label: 'Delivered', icon: Truck, color: 'text-green-600 bg-green-50 border-green-200' },
];

export default function OrderConfirmationPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchOrder() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();

    const channel = supabase
      .channel(`order_status_${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => { setOrder(payload.new as Order); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const getPaymentLabel = () => {
    const rzpId = order?.razorpay_order_id || '';
    const payStatus = order?.payment_status;
    if (!rzpId && payStatus === 'pending') return 'Cash on Pickup';
    if (rzpId.startsWith('UPI_')) return 'UPI';
    return 'Razorpay';
  };

  const getPaymentIcon = () => {
    const rzpId = order?.razorpay_order_id || '';
    const payStatus = order?.payment_status;
    if (!rzpId && payStatus === 'pending') return IndianRupee;
    if (rzpId.startsWith('UPI_')) return Smartphone;
    return CreditCard;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center text-stone-400 gap-3">
        <Loader2 size={36} className="animate-spin text-brand-600" />
        <p className="font-semibold text-sm">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-heading text-xl font-bold text-red-600 mb-2">Order Not Found</h2>
        <p className="text-stone-500 text-sm mb-6">We couldn&apos;t locate this order in our system.</p>
        <Link href="/" className="bg-brand-600 text-white font-bold px-6 py-3 rounded-2xl shadow-md hover:bg-brand-700 transition-colors">
          Return to Menu
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(step => step.key === order.order_status);
  const PaymentIcon = getPaymentIcon();

  const handleWhatsAppContact = () => {
    const phone = '919818066376';
    const text = encodeURIComponent(
      `Hello HK Kitchen! I am checking on my Order *${order.order_number}*. Please update me.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handlePrintBill = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const itemsHtml = order.items.map((item: OrderItem) =>
      `<tr>
        <td style="padding:6px 4px;border-bottom:1px dashed #ccc;font-size:13px">${item.name} x${item.quantity}</td>
        <td style="padding:6px 4px;border-bottom:1px dashed #ccc;text-align:right;font-size:13px">₹${item.price_min * item.quantity}</td>
      </tr>`
    ).join('');

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bill - ${order.order_number}</title>
  <style>
    @page { margin: 10mm; }
    body { font-family: 'Courier New', monospace; margin:0; padding:20px; color:#000; background:#fff; }
    .header { text-align:center; margin-bottom:16px; border-bottom:2px solid #000; padding-bottom:12px; }
    .header h1 { font-size:20px; margin:0 0 4px; letter-spacing:1px; }
    .header p { font-size:11px; margin:0; color:#333; }
    .order-info { font-size:12px; margin-bottom:12px; line-height:1.6; }
    .order-info strong { display:inline-block; width:100px; }
    table { width:100%; border-collapse:collapse; margin-bottom:12px; }
    th { text-align:left; padding:6px 4px; border-bottom:2px solid #000; font-size:12px; }
    .total { font-size:15px; font-weight:bold; text-align:right; margin-top:8px; border-top:2px solid #000; padding-top:8px; }
    .footer { text-align:center; margin-top:20px; font-size:11px; border-top:1px dashed #ccc; padding-top:12px; color:#555; }
    .footer strong { color:#000; }
  </style>
</head>
<body>
  <div class="header">
    <h1>HK Kitchen</h1>
    <p>Prashant Vihar, Rohini, Delhi</p>
    <p>Phone: 70115 31528 / 98180 66376</p>
  </div>
  <div class="order-info">
    <div><strong>Order No:</strong> ${order.order_number}</div>
    <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
    <div><strong>Customer:</strong> ${order.customer_name}</div>
    <div><strong>Phone:</strong> ${order.customer_phone}</div>
    <div><strong>Type:</strong> ${order.order_type.toUpperCase()}</div>
    ${order.order_type === 'delivery' ? `<div><strong>Address:</strong> ${order.customer_address}</div>` : ''}
    <div><strong>Payment:</strong> ${getPaymentLabel()}</div>
  </div>
  <table>
    <thead>
      <tr><th>Item</th><th style="text-align:right">Amount</th></tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <div class="total">Total: ₹${order.total_amount}</div>
  ${order.notes ? `<div style="font-size:12px;margin-top:8px;padding:6px;border:1px dashed #ccc;"><strong>Notes:</strong> ${order.notes}</div>` : ''}
  <div class="footer">
    <strong>Thank you for ordering with HK Kitchen!</strong><br>
    Homemade Goodness, Just Like Home!
  </div>
  <script>window.onload=function(){window.print();}<\\/script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <main className="min-h-screen bg-cream-50 pb-16">
      {/* Success Banner */}
      <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-10 text-center">
          <div className="bg-white/15 p-3 rounded-full w-fit mx-auto mb-4 border border-white/20">
            <CheckCircle2 size={36} className="text-amber-400" />
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Order Placed Successfully!</h1>
          <p className="text-white/70 text-sm">Thank you for ordering from HK Kitchen</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Order Tracker */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-stone-200/60 shadow-soft space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">Order Number</p>
              <h2 className="font-heading text-lg font-bold text-amber-500">{order.order_number}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">Status</p>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full uppercase border mt-1 ${
                order.order_status === 'cancelled'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-green-50 text-brand-700 border-brand-200'
              }`}>
                {order.order_status}
              </span>
            </div>
          </div>

          {order.order_status === 'cancelled' ? (
            <div className="bg-red-50/90 text-red-700 p-4 rounded-2xl text-center text-sm font-semibold border border-red-100">
              This order has been cancelled by the kitchen. Please contact support.
            </div>
          ) : (
            <div className="relative pt-4 pb-2">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-stone-100 -translate-y-1/2 rounded-full z-0" />
              <div
                className="absolute top-1/2 left-0 h-1 bg-brand-600 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                style={{ width: `${(Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1)) * 100}%` }}
              />

              <div className="relative z-10 flex justify-between">
                {STATUS_STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isCompleted = idx <= currentStepIndex;
                  const isActive = idx === currentStepIndex;

                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                          isCompleted
                            ? 'bg-brand-600 border-brand-600 text-white shadow-md'
                            : 'bg-white border-stone-200 text-stone-400'
                        } ${isActive ? 'scale-110 ring-4 ring-brand-600/15' : ''}`}
                      >
                        <StepIcon size={18} className="stroke-[2.5]" />
                      </div>
                      <span className={`text-[10px] md:text-xs font-bold mt-2 text-center transition-colors ${
                        isCompleted ? 'text-brand-700' : 'text-stone-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-stone-200/60 shadow-soft space-y-4">
          <h3 className="font-heading font-bold text-brand-700 border-b border-stone-100 pb-3 flex items-center gap-2">
            <ShoppingBag size={18} className="text-amber-500" />
            <span>Order Summary</span>
          </h3>

          <div className="divide-y divide-stone-100">
            {order.items.map((item: OrderItem, idx: number) => (
              <div key={idx} className="py-3 flex justify-between items-center text-sm gap-2">
                <div className="flex-grow">
                  <p className="font-bold text-brand-700">
                    {item.name} <span className="text-stone-400 font-semibold text-xs">x {item.quantity}</span>
                  </p>
                </div>
                <span className="font-bold text-brand-700/80 shrink-0 tabular-nums">₹{item.price_min * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-100 pt-4 flex justify-between items-center font-bold text-base text-brand-700">
            <div className="flex items-center gap-2">
              <PaymentIcon size={18} className="text-amber-500" />
              <span>Total Paid ({getPaymentLabel()})</span>
            </div>
            <span className="font-heading text-amber-500 text-lg tabular-nums">₹{order.total_amount}</span>
          </div>

          {order.notes && (
            <div className="bg-amber-50/50 border border-amber-200/30 p-3 rounded-2xl text-xs text-stone-700">
              <span className="font-bold text-brand-700 block mb-0.5">Special Instructions:</span>
              <p className="italic">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Customer Details */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-stone-200/60 shadow-soft space-y-3">
          <h3 className="font-heading font-bold text-brand-700 border-b border-stone-100 pb-3">Delivery & Contact Info</h3>
          <div className="text-sm space-y-2 text-stone-600">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-brand-700">Customer:</span>
              <span className="col-span-2 text-stone-800 font-medium">{order.customer_name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-brand-700">Phone:</span>
              <span className="col-span-2 text-stone-800 font-medium">{order.customer_phone}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-brand-700">Order Mode:</span>
              <span className="col-span-2 text-stone-800 font-bold uppercase">{order.order_type}</span>
            </div>
            {order.order_type === 'delivery' && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-bold text-brand-700">Address:</span>
                <span className="col-span-2 text-stone-800 font-medium">{order.customer_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={handleWhatsAppContact}
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all duration-300 active:scale-[0.97] text-sm"
          >
            <MessageSquare size={16} />
            <span>Contact Kitchen</span>
          </button>
          <button
            onClick={handlePrintBill}
            className="flex items-center justify-center gap-2 bg-white border-2 border-brand-600 text-brand-700 font-bold py-3.5 px-6 rounded-2xl shadow-md hover:bg-brand-50 transition-all duration-300 active:scale-[0.97] text-sm"
          >
            <Printer size={16} />
            <span>Print Bill</span>
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all duration-300 active:scale-[0.97] text-sm"
          >
            <span>Order Again</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
