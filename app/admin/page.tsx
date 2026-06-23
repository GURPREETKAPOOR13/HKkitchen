'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, ShoppingBag, Clock, ArrowRight, ClipboardList, Loader2, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayOrdersCount: 0,
    todayRevenue: 0,
    pendingOrdersCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // 1. Calculate Today's boundaries in IST
        const now = new Date();
        const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
        const istTime = new Date(utcTime + 3600000 * 5.5);

        const startOfIstDay = new Date(istTime);
        startOfIstDay.setHours(0, 0, 0, 0);
        const startOfIstDayUTC = new Date(startOfIstDay.getTime() - 3600000 * 5.5).toISOString();

        const endOfIstDay = new Date(istTime);
        endOfIstDay.setHours(23, 59, 59, 999);
        const endOfIstDayUTC = new Date(endOfIstDay.getTime() - 3600000 * 5.5).toISOString();

        // 2. Fetch today's orders
        const { data: todayOrders, error: todayError } = await supabase
          .from('orders')
          .select('total_amount, order_status, payment_status')
          .gte('created_at', startOfIstDayUTC)
          .lte('created_at', endOfIstDayUTC);

        if (todayError) throw todayError;

        const countToday = todayOrders?.length || 0;
        const revenueToday = todayOrders
          ?.filter(o => o.payment_status === 'paid' && o.order_status !== 'cancelled')
          .reduce((sum, o) => sum + o.total_amount, 0) || 0;

        // 3. Fetch total pending orders (any day)
        const { count: pendingCount, error: pendingError } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('order_status', 'pending');

        if (pendingError) throw pendingError;

        setStats({
          todayOrdersCount: countToday,
          todayRevenue: revenueToday,
          pendingOrdersCount: pendingCount || 0,
        });

        // 4. Fetch 5 most recent orders
        const { data: recent, error: recentError } = await supabase
          .from('orders')
          .select('id, order_number, customer_name, customer_phone, total_amount, order_status, payment_status, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentError) throw recentError;
        setRecentOrders(recent || []);

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
        <Loader2 size={36} className="animate-spin text-[#1a4a1a]" />
        <p className="font-semibold text-sm">Aggregating dashboard analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome banner */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a4a1a]">Kitchen Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time performance and kitchen overview for today</p>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Orders */}
        <div className="bg-white rounded-3xl p-6 border border-[#1a4a1a]/5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Today&apos;s Orders</p>
            <h3 className="text-3xl font-extrabold text-[#1a4a1a]">{stats.todayOrdersCount}</h3>
            <p className="text-[10px] text-gray-500">Orders placed since 12:00 AM IST</p>
          </div>
          <div className="bg-[#1a4a1a]/5 text-[#1a4a1a] p-4 rounded-2xl border border-[#1a4a1a]/10">
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-[#1a4a1a]/5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Today&apos;s Revenue</p>
            <h3 className="text-3xl font-extrabold text-[#f5a623]">₹{stats.todayRevenue}</h3>
            <p className="text-[10px] text-gray-500">From verified payment orders</p>
          </div>
          <div className="bg-[#f5a623]/5 text-[#f5a623] p-4 rounded-2xl border border-[#f5a623]/10">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-3xl p-6 border border-[#1a4a1a]/5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pending Orders</p>
            <h3 className="text-3xl font-extrabold text-indigo-600">{stats.pendingOrdersCount}</h3>
            <p className="text-[10px] text-gray-500">Requires confirmation or preparation</p>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl border border-indigo-100">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Quick navigation and Recent orders list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="bg-white rounded-3xl p-6 border border-[#1a4a1a]/5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-bold text-[#1a4a1a] text-lg flex items-center gap-2">
              <ClipboardList size={18} className="text-[#f5a623]" />
              <span>Recent Orders</span>
            </h3>
            <Link href="/admin/orders" className="text-xs font-bold text-[#1a4a1a] hover:underline flex items-center gap-0.5">
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">No orders placed recently.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold text-xs uppercase">
                    <th className="pb-3">Order No</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 text-[#1a4a1a] font-bold">{order.order_number}</td>
                      <td className="py-3.5">
                        <div>
                          <p className="text-gray-800">{order.customer_name}</p>
                          <p className="text-xs text-gray-400">{order.customer_phone}</p>
                        </div>
                      </td>
                      <td className="py-3.5 text-[#f5a623] font-bold">₹{order.total_amount}</td>
                      <td className="py-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          order.order_status === 'pending'
                            ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                            : order.order_status === 'cancelled'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {order.order_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-3xl p-6 border border-[#1a4a1a]/5 shadow-sm space-y-4 h-fit">
            <h3 className="font-bold text-[#1a4a1a] text-lg border-b border-gray-100 pb-3">Quick Links</h3>
            
            <div className="space-y-3">
              <Link
                href="/admin/orders"
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-[#1a4a1a]/5 border border-gray-200/50 hover:border-[#1a4a1a]/15 rounded-2xl transition-all group"
              >
                <div>
                  <p className="font-bold text-[#1a4a1a] text-sm">Manage Active Orders</p>
                  <p className="text-[10px] text-gray-400">View orders and update status</p>
                </div>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-[#1a4a1a] transition-colors" />
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-[#1a4a1a]/5 border border-gray-200/50 hover:border-[#1a4a1a]/15 rounded-2xl transition-all group"
              >
                <div>
                  <p className="font-bold text-[#1a4a1a] text-sm">Settings</p>
                  <p className="text-[10px] text-gray-400">Kitchen, delivery, and API config</p>
                </div>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-[#1a4a1a] transition-colors" />
              </Link>

              <Link
                href="/admin/menu"
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-[#1a4a1a]/5 border border-gray-200/50 hover:border-[#1a4a1a]/15 rounded-2xl transition-all group"
              >
                <div>
                  <p className="font-bold text-[#1a4a1a] text-sm">Update Menu Offerings</p>
                  <p className="text-[10px] text-gray-400">Toggle availability & edit pricing</p>
                </div>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-[#1a4a1a] transition-colors" />
              </Link>

              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between p-4 bg-[#fdfbf7] hover:bg-[#f5a623]/5 border border-[#1a4a1a]/10 hover:border-[#f5a623]/20 rounded-2xl transition-all group"
              >
                <div>
                  <p className="font-bold text-[#1a4a1a] text-sm">Preview Shop Site</p>
                  <p className="text-[10px] text-gray-400">Go to public ordering menu page</p>
                </div>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-[#f5a623] transition-colors" />
              </Link>
            </div>
          </div>

          <QRCodeCard />
        </div>
      </div>
    </div>
  );
}

function QRCodeCard() {
  const [qrUrl, setQrUrl] = useState('');
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hk-kitchen.vercel.app';

  useEffect(() => {
    async function generate() {
      try {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(siteUrl, { width: 200, margin: 1, color: { dark: '#1a4a1a', light: '#ffffff' } });
        setQrUrl(url);
      } catch {}
    }
    generate();
  }, [siteUrl]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#1a4a1a]/5 shadow-sm space-y-4">
      <h3 className="font-bold text-[#1a4a1a] text-lg border-b border-gray-100 pb-3 flex items-center gap-2">
        <QrCode size={18} className="text-[#f5a623]" />
        <span>Menu QR Code</span>
      </h3>
      <div className="text-center">
        {qrUrl ? (
          <>
            <img src={qrUrl} alt="Menu QR Code" className="w-44 h-44 mx-auto border border-gray-200 p-2 rounded-2xl bg-white" />
            <p className="text-[10px] text-gray-400 mt-2 font-medium">Scan to open the HK Kitchen menu</p>
            <a
              href={siteUrl}
              target="_blank"
              className="text-xs text-[#1a4a1a] hover:underline font-bold block mt-1"
            >
              {siteUrl.replace('https://', '')}
            </a>
          </>
        ) : (
          <div className="flex items-center justify-center h-44 text-gray-400">
            <Loader2 className="animate-spin" size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
