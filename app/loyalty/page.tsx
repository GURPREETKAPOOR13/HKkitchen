'use client';

import React, { useEffect, useState } from 'react';
import { getStoredPhone } from '@/components/PhoneLogin';
import LoyaltyCard from '@/components/LoyaltyCard';
import { Loader2, QrCode } from 'lucide-react';

export default function LoyaltyPage() {
  const [phone, setPhone] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const siteUrl = typeof window !== 'undefined' ? window.location.origin + '/?loyalty=1' : '';

  useEffect(() => {
    setPhone(getStoredPhone());
  }, []);

  useEffect(() => {
    if (!siteUrl) return;
    async function generate() {
      try {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(siteUrl, { width: 250, margin: 1, color: { dark: '#1a4a1a', light: '#fdfbf7' } });
        setQrUrl(url);
      } catch {}
    }
    generate();
  }, [siteUrl]);

  return (
    <main className="min-h-screen bg-cream-50 pb-16">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-brand-700">HK Kitchen</h1>
          <p className="text-stone-500 text-sm mt-1">Loyalty & Rewards</p>
        </div>

        {phone && <LoyaltyCard phone={phone} />}

        {/* QR Code Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-stone-200/60 shadow-soft text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <QrCode size={20} className="text-amber-500" />
            <h2 className="font-heading font-bold text-brand-700">Scan to Track Stamps</h2>
          </div>
          {qrUrl ? (
            <>
              <img src={qrUrl} alt="Loyalty QR Code" className="w-52 h-52 mx-auto border border-stone-200 p-2 rounded-2xl bg-white" />
              <p className="text-xs text-stone-500">Scan this QR code at the kitchen to open your stamp card.</p>
            </>
          ) : (
            <div className="flex justify-center py-12 text-stone-400">
              <Loader2 className="animate-spin" size={24} />
            </div>
          )}
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-6 rounded-2xl transition-all text-sm"
          >
            Browse Menu
          </a>
        </div>
      </div>
    </main>
  );
}
