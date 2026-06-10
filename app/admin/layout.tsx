'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, FileText, LayoutDashboard, LogOut, Loader2, Settings } from 'lucide-react';
import Cookies from 'js-cookie';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = Cookies.get('hk_admin_session');
    
    if (pathname !== '/admin/login' && session !== 'true') {
      router.push('/admin/login');
    } else {
      setAuthorized(true);
    }
    setLoading(false);
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 size={36} className="animate-spin text-[#1a4a1a]" />
        <p className="font-semibold text-sm">Authenticating admin session...</p>
      </div>
    );
  }

  // If we are on the login page, render the child component directly without any wrappers
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!authorized) {
    return null;
  }

  const handleLogout = () => {
    Cookies.remove('hk_admin_session');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin Navbar */}
      <nav className="bg-[#1a4a1a] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider text-white">HK KITCHEN</span>
              <span className="bg-[#f5a623] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-4">
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  pathname === '/admin'
                    ? 'bg-[#153b15] text-[#f5a623]'
                    : 'text-white/80 hover:bg-[#153b15] hover:text-white'
                }`}
              >
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              
              <Link
                href="/admin/menu"
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  pathname === '/admin/menu'
                    ? 'bg-[#153b15] text-[#f5a623]'
                    : 'text-white/80 hover:bg-[#153b15] hover:text-white'
                }`}
              >
                <ShoppingBag size={16} />
                <span className="hidden sm:inline">Menu</span>
              </Link>
              
              <Link
                href="/admin/orders"
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  pathname === '/admin/orders'
                    ? 'bg-[#153b15] text-[#f5a623]'
                    : 'text-white/80 hover:bg-[#153b15] hover:text-white'
                }`}
              >
                <FileText size={16} />
                <span className="hidden sm:inline">Orders</span>
              </Link>

              <Link
                href="/admin/settings"
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  pathname === '/admin/settings'
                    ? 'bg-[#153b15] text-[#f5a623]'
                    : 'text-white/80 hover:bg-[#153b15] hover:text-white'
                }`}
              >
                <Settings size={16} />
                <span className="hidden sm:inline">Settings</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all hover:bg-red-700 text-red-100 hover:text-white flex items-center gap-1.5"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Admin Panel Body */}
      <main className="flex-grow p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
