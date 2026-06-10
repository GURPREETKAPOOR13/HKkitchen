'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, ShoppingBag, ArrowRight, MessageSquare, Loader2, Clock, Check, CookingPot, PackageCheck, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  order_type: 'delivery' | 'pickup';
  items: any[];
  total_amount: number;
  payment_status: string;
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

    // Subscribe to realtime status updates for this specific order
    const channel = supabase
      .channel(`order_status_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 size={36} className="animate-spin text-[#1a4a1a]" />
        <p className="font-semibold text-sm">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Order Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">We couldn&apos;t locate this order in our system.</p>
        <Link href="/" className="bg-[#1a4a1a] text-white font-bold px-6 py-3 rounded-xl shadow-md hover:bg-[#153b15] transition-colors">
          Return to Menu
        </Link>
      </div>
    );
  }

  // Get index of current status in steps list
  const currentStepIndex = STATUS_STEPS.findIndex(step => step.key === order.order_status);

  const handleWhatsAppContact = () => {
    const phone = '919818066376';
    const text = encodeURIComponent(
      `Hello HK Kitchen! I am checking on my Order *${order.order_number}*. Please update me.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-[#fdfbf7] pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-5 shadow-sm text-center">
        <div className="max-w-2xl mx-auto px-4 flex flex-col items-center">
          <div className="bg-green-50 p-2.5 rounded-full border border-green-200 mb-3 text-green-600">
            <CheckCircle2 size={32} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1a4a1a]">Order Placed Successfully!</h1>
          <p className="text-gray-500 text-sm mt-1">Thank you for ordering from HK Kitchen</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Real-time Order Tracker Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#1a4a1a]/5 shadow-sm space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-xs font-bold text-[#1a4a1a] uppercase tracking-wide">Order Number</p>
              <h2 className="text-lg font-extrabold text-[#f5a623]">{order.order_number}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-[#1a4a1a] uppercase tracking-wide">Status</p>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full uppercase border mt-1 ${
                order.order_status === 'cancelled'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-green-50 text-[#1a4a1a] border-[#1a4a1a]/20'
              }`}>
                {order.order_status}
              </span>
            </div>
          </div>

          {order.order_status === 'cancelled' ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-center text-sm font-semibold border border-red-100">
              🚨 This order has been cancelled by the kitchen. Please contact support.
            </div>
          ) : (
            /* Visual Progress Stepper */
            <div className="relative pt-4 pb-2">
              {/* Stepper Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 rounded-full z-0"></div>
              <div
                className="absolute top-1/2 left-0 h-1 bg-[#1a4a1a] -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                style={{ width: `${(Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1)) * 100}%` }}
              ></div>

              {/* Stepper Dots */}
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
                            ? 'bg-[#1a4a1a] border-[#1a4a1a] text-white shadow-md'
                            : 'bg-white border-gray-200 text-gray-400'
                        } ${isActive ? 'scale-110 ring-4 ring-[#1a4a1a]/15' : ''}`}
                      >
                        <StepIcon size={18} className="stroke-[2.5]" />
                      </div>
                      <span className={`text-[10px] md:text-xs font-bold mt-2 text-center transition-colors ${
                        isCompleted ? 'text-[#1a4a1a]' : 'text-gray-400'
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

        {/* Order Details Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#1a4a1a]/5 shadow-sm space-y-4">
          <h3 className="font-bold text-[#1a4a1a] border-b border-gray-100 pb-3 flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#f5a623]" />
            <span>Order Summary</span>
          </h3>

          <div className="divide-y divide-gray-100">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="py-3 flex justify-between items-center text-sm gap-2">
                <div className="flex-grow">
                  <p className="font-bold text-[#1a4a1a]">
                    {item.name} <span className="text-gray-400 font-semibold text-xs">x {item.quantity}</span>
                  </p>
                </div>
                <span className="font-bold text-[#1a4a1a]/80 shrink-0">₹{item.price_min * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 flex justify-between items-center font-bold text-base text-[#1a4a1a]">
            <span>Total Paid (via Razorpay)</span>
            <span className="text-[#f5a623] text-lg">₹{order.total_amount}</span>
          </div>

          {order.notes && (
            <div className="bg-yellow-50/50 border border-[#f5a623]/10 p-3 rounded-xl text-xs text-gray-700">
              <span className="font-bold text-[#1a4a1a] block mb-0.5">Special Instructions:</span>
              <p className="italic">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-3xl p-6 border border-[#1a4a1a]/5 shadow-sm space-y-3">
          <h3 className="font-bold text-[#1a4a1a] border-b border-gray-100 pb-3">Delivery & Contact Info</h3>
          <div className="text-sm space-y-2 text-gray-600">
            <div className="grid grid-cols-3">
              <span className="font-bold text-[#1a4a1a]">Customer:</span>
              <span className="col-span-2 text-gray-800 font-medium">{order.customer_name}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-bold text-[#1a4a1a]">Phone:</span>
              <span className="col-span-2 text-gray-800 font-medium">{order.customer_phone}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-bold text-[#1a4a1a]">Order Mode:</span>
              <span className="col-span-2 text-gray-800 font-bold uppercase">{order.order_type}</span>
            </div>
            {order.order_type === 'delivery' && (
              <div className="grid grid-cols-3">
                <span className="font-bold text-[#1a4a1a]">Address:</span>
                <span className="col-span-2 text-gray-800 font-medium">{order.customer_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleWhatsAppContact}
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all duration-300 transform active:scale-95 text-sm"
          >
            <MessageSquare size={16} />
            <span>Contact Kitchen</span>
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-[#1a4a1a] hover:bg-[#153b15] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all duration-300 transform active:scale-95 text-sm"
          >
            <span>Order Another Item</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
