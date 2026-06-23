'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Smartphone, X, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';

export interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatar_url: string;
}

interface PhoneLoginProps {
  onClose?: () => void;
  onLogin: (user: UserProfile) => void;
  initialUser?: UserProfile | null;
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('hk_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('hk_user');
}

export default function PhoneLogin({ onClose, onLogin, initialUser }: PhoneLoginProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [user, setUser] = useState<UserProfile | null>(initialUser || null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      onLogin(stored);
    }
  }, []);

  // If user is already authenticated but needs phone, show phone form
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const res = await fetch('/api/auth/user');
        if (res.ok) {
          const profile = await res.json();
          setUser(profile);
          if (profile.phone) {
            localStorage.setItem('hk_user', JSON.stringify(profile));
            onLogin(profile);
            if (onClose) onClose();
          }
        }
      }
    };
    if (!getStoredUser()) checkSession();
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearStoredUser();
    setUser(null);
    setStep('phone');
    window.location.reload();
  }, []);

  const handleSavePhone = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: name || user?.name || '' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save phone');
      }
      if (user) {
        const updated = { ...user, phone, name: name || user.name };
        localStorage.setItem('hk_user', JSON.stringify(updated));
        setUser(updated);
        onLogin(updated);
        if (onClose) onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send OTP');
      }
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setError('Please enter the OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Invalid OTP');
      }
      const profile: UserProfile = { id: '', email: null, phone, name, avatar_url: '' };
      localStorage.setItem('hk_user', JSON.stringify(profile));
      setUser(profile);
      onLogin(profile);
      if (onClose) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // If user has Google session but no phone, show phone collection form
  if (user && !user.phone) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-stone-200/60 shadow-soft-lg p-6 max-w-sm mx-auto">
        {onClose && (
          <button onClick={onClose} className="float-right text-stone-400 hover:text-stone-600 p-1">
            <X size={18} />
          </button>
        )}
        <div className="text-center mb-5">
          <div className="bg-brand-600/10 p-3 rounded-2xl w-fit mx-auto mb-3 border border-brand-200/50">
            <Smartphone size={24} className="text-brand-600" />
          </div>
          <h3 className="font-heading text-lg font-bold text-brand-700">Complete Your Profile</h3>
          <p className="text-xs text-stone-500 mt-1">
            Add your phone number to earn loyalty stamps on orders.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-600 mb-1 uppercase tracking-wider">Email</label>
            <p className="text-sm text-stone-600 bg-stone-50 px-4 py-2.5 rounded-2xl border border-stone-200/80">{user.email}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-600 mb-1 uppercase tracking-wider">Phone Number</label>
            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-bold text-sm">+91</span>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-stone-200/80 focus:border-brand-500 outline-none text-sm bg-white text-stone-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-600 mb-1 uppercase tracking-wider">Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-stone-200/80 focus:border-brand-500 outline-none text-sm bg-white text-stone-800"
            />
          </div>
          <button
            onClick={handleSavePhone}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-stone-400 text-white font-bold py-2.5 px-4 rounded-2xl transition-all text-sm active:scale-[0.97]"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2"
          >
            Logout & use different account
          </button>
          {error && (
            <div className="bg-red-50/90 border border-red-200/80 text-red-700 p-3 rounded-2xl flex items-start gap-2 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p className="font-semibold">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main login form (Google OAuth + Phone OTP fallback)
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-stone-200/60 shadow-soft-lg p-6 max-w-sm mx-auto">
      {onClose && (
        <button onClick={onClose} className="float-right text-stone-400 hover:text-stone-600 p-1">
          <X size={18} />
        </button>
      )}

      <div className="text-center mb-5">
        <div className="bg-brand-600/10 p-3 rounded-2xl w-fit mx-auto mb-3 border border-brand-200/50">
          <Mail size={24} className="text-brand-600" />
        </div>
        <h3 className="font-heading text-lg font-bold text-brand-700">Login</h3>
        <p className="text-xs text-stone-500 mt-1">
          Sign in with Google or use phone OTP to earn loyalty stamps!
        </p>
      </div>

      <div className="space-y-4">
        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-stone-50 border-2 border-stone-200/80 text-stone-700 font-bold py-2.5 px-4 rounded-2xl transition-all text-sm active:scale-[0.97] shadow-sm"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.359 L -10.684 60.359 L -6.824 60.359 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.359 L -10.684 57.359 C -11.764 58.129 -13.134 58.589 -14.754 58.589 C -17.884 58.589 -20.534 56.609 -21.484 53.869 L -25.464 53.869 L -25.464 56.959 C -23.494 60.999 -19.394 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.869 C -21.734 53.169 -21.864 52.429 -21.864 51.639 C -21.864 50.849 -21.724 50.109 -21.484 49.409 L -21.484 46.319 L -25.464 46.319 C -26.284 48.069 -26.754 49.969 -26.754 51.639 C -26.754 53.309 -26.284 55.209 -25.464 56.959 L -21.484 53.869 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.394 39.239 -23.494 41.479 -25.464 45.509 L -21.484 48.599 C -20.534 45.859 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-xs text-stone-400 font-medium">or use phone</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        {step === 'phone' ? (
          <>
            <div>
              <label className="block text-xs font-bold text-brand-600 mb-1 uppercase tracking-wider">Phone Number</label>
              <div className="flex items-center gap-2">
                <span className="text-stone-400 font-bold text-sm">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-stone-200/80 focus:border-brand-500 outline-none text-sm bg-white text-stone-800"
                />
              </div>
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-stone-400 text-white font-bold py-2.5 px-4 rounded-2xl transition-all text-sm active:scale-[0.97]"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-bold text-brand-600 mb-1 uppercase tracking-wider">OTP</label>
              <input
                type="text"
                maxLength={4}
                placeholder="1234"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200/80 focus:border-brand-500 outline-none text-sm bg-white text-stone-800 text-center text-lg font-bold tracking-[0.3em]"
              />
              <p className="text-[10px] text-stone-400 mt-1 text-center">Use OTP: 1234</p>
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-stone-400 text-white font-bold py-2.5 px-4 rounded-2xl transition-all text-sm active:scale-[0.97]"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="w-full text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2"
            >
              Change phone number
            </button>
          </>
        )}

        {error && (
          <div className="bg-red-50/90 border border-red-200/80 text-red-700 p-3 rounded-2xl flex items-start gap-2 text-xs">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <p className="text-[10px] text-stone-400 text-center">
          We use login only to identify you for loyalty rewards. No spam.
        </p>
      </div>
    </div>
  );
}
