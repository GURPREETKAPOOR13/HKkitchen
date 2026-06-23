'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Loader2, Smartphone, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface PhoneLoginProps {
  onClose?: () => void;
  onLogin: (phone: string) => void;
}

export function getStoredPhone(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hk_phone');
}

const STORAGE_KEY = 'hk_phone';

export default function PhoneLogin({ onClose, onLogin }: PhoneLoginProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  useEffect(() => {
    const stored = getStoredPhone();
    if (stored) onLogin(stored);
  }, []);

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
      localStorage.setItem(STORAGE_KEY, phone);
      onLogin(phone);
      if (onClose) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

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
        <h3 className="font-heading text-lg font-bold text-brand-700">
          {step === 'phone' ? 'Login with Phone' : 'Verify OTP'}
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          {step === 'phone'
            ? 'Enter your phone number to log in and earn loyalty stamps!'
            : `Enter the 4-digit OTP sent to ${phone}`}
        </p>
      </div>

      <div className="space-y-4">
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
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-bold text-brand-600 mb-1 uppercase tracking-wider">Your Name (optional)</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200/80 focus:border-brand-500 outline-none text-sm bg-white text-stone-800"
              />
            </div>
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
          We use OTP only to identify you for loyalty rewards. No spam.
        </p>
      </div>
    </div>
  );
}
