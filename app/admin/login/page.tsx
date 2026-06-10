'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import Cookies from 'js-cookie';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }

      // Set cookie for 1 day
      Cookies.set('hk_admin_session', 'true', { expires: 1, path: '/' });
      router.push('/admin');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#1a4a1a]/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#f5a623]/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-[#1a4a1a]/5 shadow-xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-[#1a4a1a]/10 p-3.5 rounded-2xl mb-4 border border-[#1a4a1a]/15 text-[#1a4a1a]">
            <Lock size={28} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-serif font-extrabold text-[#1a4a1a]">HK Kitchen Admin</h1>
          <p className="text-gray-500 text-sm mt-1.5">Enter password to access dashboard</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-2 text-sm mb-6 animate-pulse-subtle">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="adminPass" className="block text-xs font-bold text-[#1a4a1a] mb-2 uppercase tracking-wide">
              Admin Password
            </label>
            <input
              id="adminPass"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#1a4a1a] focus:ring-1 focus:ring-[#1a4a1a] outline-none text-sm transition-colors bg-white text-gray-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#1a4a1a] hover:bg-[#153b15] disabled:bg-[#1a4a1a]/50 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all duration-300 transform active:scale-95 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Access Admin Panel</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-[#1a4a1a] hover:underline font-bold">
            ← Back to Customer Menu
          </Link>
        </div>
      </div>
    </main>
  );
}
