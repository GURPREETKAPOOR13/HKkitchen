'use client';

import React, { useEffect, useState } from 'react';
import { Star, Gift, Loader2, Award } from 'lucide-react';

interface LoyaltyData {
  enabled: boolean;
  stamps: number;
  starsRequired: number;
  freeItem: string;
  stampsUntilReward: number;
  canStampToday: boolean;
  rewardAvailable: boolean;
  lastStampDate: string | null;
}

interface LoyaltyCardProps {
  phone: string | null;
}

export default function LoyaltyCard({ phone }: LoyaltyCardProps) {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!phone) return;
    setLoading(true);
    fetch('/api/loyalty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [phone]);

  if (!phone || !data || !data.enabled) return null;

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-5 border border-stone-200/60 shadow-soft text-center">
        <Loader2 size={20} className="animate-spin text-brand-600 mx-auto" />
        <p className="text-xs text-stone-400 mt-2 font-medium">Loading stamp card...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 via-white to-brand-50 backdrop-blur-sm rounded-3xl p-5 border border-amber-200/60 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 p-1.5 rounded-xl">
            <Award size={16} className="text-white" />
          </div>
          <h3 className="font-heading font-bold text-brand-700 text-sm">Stamp Card</h3>
        </div>
        {data.rewardAvailable && (
          <span className="bg-green-100 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce-subtle">
            Reward Ready!
          </span>
        )}
      </div>

      {/* Stars */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {Array.from({ length: data.starsRequired }, (_, i) => {
          const filled = i < data.stamps;
          const isToday = filled && i === data.stamps - 1 && data.canStampToday === false;
          return (
            <div
              key={i}
              className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 border ${
                filled
                  ? 'bg-amber-500 border-amber-400 text-white shadow-sm scale-100'
                  : 'bg-white border-stone-200 text-stone-300'
              } ${isToday ? 'ring-2 ring-amber-300 ring-offset-1' : ''}`}
            >
              <Star size={filled ? 16 : 12} className={filled ? 'fill-white' : ''} />
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-stone-500 font-medium">
          {data.stamps} / {data.starsRequired} stamps
        </span>
        <span className="text-amber-600 font-bold">
          {data.stampsUntilReward === data.starsRequired ? '0' : data.stampsUntilReward} to go!
        </span>
      </div>

      {data.stampsUntilReward !== data.starsRequired && (
        <div className="w-full bg-stone-100 rounded-full h-1.5 mt-2 overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${(data.stamps / data.starsRequired) * 100}%` }}
          />
        </div>
      )}

      {/* Reward info */}
      {data.rewardAvailable && (
        <div className="bg-green-50/80 border border-green-200/80 p-3 rounded-2xl mt-3 flex items-center gap-2">
          <Gift size={16} className="text-green-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-green-700">Free {data.freeItem} earned!</p>
            <p className="text-[10px] text-green-600">Show this to the kitchen staff to claim your reward.</p>
          </div>
        </div>
      )}

      {!data.canStampToday && !data.rewardAvailable && (
        <p className="text-[10px] text-stone-400 mt-2 text-center">
          Come back tomorrow to earn your next stamp!
        </p>
      )}

      {data.canStampToday && !data.rewardAvailable && (
        <p className="text-[10px] text-stone-400 mt-2 text-center">
          Place an order today to earn a stamp!
        </p>
      )}
    </div>
  );
}
