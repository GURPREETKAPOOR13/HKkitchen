'use client';

import React, { useEffect, useState } from 'react';
import { Phone, MapPin, MessageSquare, AlertCircle, RefreshCw, Loader2, Calendar } from 'lucide-react';
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

const STATUSES: Order['order_status'][] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  async function fetchOrders(showLoader = false) {
    if (showLoader) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  // Initial fetch and Setup Auto-Refresh
  useEffect(() => {
    fetchOrders(true);

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchOrders(false);
      setRefreshCountdown(30);
    }, 30000);

    // Countdown timer interval
    const countdownInterval = setInterval(() => {
      setRefreshCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);

  // Handler to update order status
  const handleStatusChange = async (id: number, newStatus: Order['order_status']) => {
    setUpdatingId(id);
    try {
      // Optimistic update
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, order_status: newStatus } : order))
      );

      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update status. Please try again.');
      fetchOrders(false); // Refetch to reset state
    } finally {
      setUpdatingId(null);
    }
  };

  const handleManualRefresh = () => {
    fetchOrders(true);
    setRefreshCountdown(30);
  };

  // Filter orders by status
  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((order) => order.order_status === statusFilter);

  // Formats date/time elegantly
  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Refresh Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a4a1a]">Order Operations</h1>
          <p className="text-gray-500 text-sm mt-1">Live customer orders incoming. Auto-refreshing in {refreshCountdown}s</p>
        </div>
        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-1.5 bg-white border border-[#1a4a1a]/20 text-[#1a4a1a] font-bold px-4 py-2.5 rounded-xl hover:bg-gray-50 shadow-sm active:scale-95 transition-all"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Now</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            statusFilter === 'all'
              ? 'bg-[#1a4a1a] text-white border-[#1a4a1a] shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          All ({orders.length})
        </button>
        {STATUSES.map((status) => {
          const count = orders.filter((o) => o.order_status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border uppercase ${
                statusFilter === status
                  ? 'bg-[#1a4a1a] text-white border-[#1a4a1a] shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
          <Loader2 size={36} className="animate-spin text-[#1a4a1a]" />
          <p className="font-semibold text-sm">Loading latest orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium">No orders found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between transition-all duration-300 ${
                order.order_status === 'pending'
                  ? 'border-yellow-200 bg-yellow-50/10'
                  : 'border-[#1a4a1a]/5'
              }`}
            >
              {/* Card Header */}
              <div className="border-b border-gray-100 pb-3 mb-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Order ID</span>
                    <h3 className="text-base font-extrabold text-[#1a4a1a]">{order.order_number}</h3>
                  </div>
                  <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase ${
                    order.order_type === 'delivery'
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  }`}>
                    {order.order_type === 'delivery' ? '🚗 Delivery' : '🛍️ Pickup'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                  <Calendar size={14} />
                  <span>{formatDateTime(order.created_at)}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="font-bold text-gray-800">{order.customer_name}</span>
                </div>
                
                {/* Contact links */}
                <div className="flex gap-3 text-xs">
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="flex items-center gap-1 text-[#1a4a1a] hover:underline font-bold"
                  >
                    <Phone size={12} />
                    <span>Call</span>
                  </a>
                  <span className="text-gray-300">|</span>
                  <a
                    href={`https://wa.me/${order.customer_phone.startsWith('91') ? order.customer_phone : '91' + order.customer_phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#25D366] hover:underline font-bold"
                  >
                    <MessageSquare size={12} />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {order.order_type === 'delivery' && (
                  <div className="flex items-start gap-1.5 text-xs text-gray-500 mt-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed font-medium">{order.customer_address}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="bg-[#fdfbf7] border border-[#1a4a1a]/5 p-4 rounded-2xl mb-4 space-y-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Items Ordered</span>
                <ul className="space-y-1.5 divide-y divide-gray-100/50">
                  {order.items.map((item: any, idx: number) => (
                    <li key={idx} className="flex justify-between items-center text-xs font-bold text-gray-800 pt-1.5 first:pt-0">
                      <span>{item.name} <span className="text-gray-400 font-semibold text-[10px]">x {item.quantity}</span></span>
                      <span className="text-gray-600">₹{item.price_min * item.quantity}</span>
                    </li>
                  ))}
                </ul>

                {order.notes && (
                  <div className="bg-white/80 p-2 rounded-lg text-[10px] text-gray-500 border border-gray-100 mt-2">
                    <span className="font-bold text-[#1a4a1a] block mb-0.5">Note:</span>
                    <p className="italic">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Amount and Status Controls */}
              <div className="border-t border-gray-100 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-auto">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Amount</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-lg text-[#f5a623]">₹{order.total_amount}</span>
                    <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded uppercase">
                      Paid
                    </span>
                  </div>
                </div>

                <div className="relative shrink-0">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Update Status</span>
                  <select
                    disabled={updatingId === order.id}
                    value={order.order_status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as Order['order_status'])}
                    className="w-full sm:w-auto pl-3 pr-8 py-2 text-xs font-bold bg-[#1a4a1a] text-white rounded-xl border-none outline-none focus:ring-2 focus:ring-[#f5a623] cursor-pointer disabled:bg-[#1a4a1a]/50"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status} className="bg-white text-gray-800 font-medium">
                        {status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
