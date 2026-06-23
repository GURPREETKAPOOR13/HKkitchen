'use client';

import React from 'react';
import { Plus, Minus, AlertTriangle, Star } from 'lucide-react';

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  price_min: number;
  price_max?: number | null;
  description?: string | null;
  is_available: boolean;
  is_featured?: boolean;
}

interface MenuCardProps {
  item: MenuItem;
  quantityInCart: number;
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (id: number, qty: number) => void;
}

export default function MenuCard({ item, quantityInCart, onAddToCart, onUpdateQuantity }: MenuCardProps) {
  const { name, price_min, price_max, description, is_available } = item;

  return (
    <div
      className={`relative flex flex-col bg-white rounded-3xl border border-stone-200/60 shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden group ${
        !is_available ? 'opacity-60 grayscale-[30%]' : 'hover:-translate-y-0.5'
      }`}
    >
      <div className={`p-5 flex-grow flex flex-col justify-between ${item.is_featured && is_available ? 'pt-9' : ''}`}>
        {item.is_featured && is_available && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-amber-400 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full shadow-warm flex items-center gap-1">
            <Star size={10} className="fill-white" />
            <span>Chef&apos;s Special</span>
          </span>
        )}

        <div>
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h3 className="font-heading font-bold text-lg text-brand-700 line-clamp-2 leading-snug">{name}</h3>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-amber-500 font-bold text-lg tabular-nums">
                ₹{price_min}
                {price_max && price_max > price_min && <span className="text-amber-400 text-sm font-semibold">-{price_max}</span>}
              </span>
              {price_max && price_max > price_min && (
                <span className="text-[10px] text-stone-400 font-medium">Range Price</span>
              )}
            </div>
          </div>
          {description && (
            <p className="text-stone-500 text-sm line-clamp-3 mb-4 leading-relaxed">{description}</p>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between">
          <div>
            {!is_available ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                <AlertTriangle size={12} />
                Unavailable
              </span>
            ) : (
              <span className="text-xs text-stone-400 font-medium">Freshly cooked</span>
            )}
          </div>

          <div className="shrink-0">
            {!is_available ? (
              <button disabled className="px-4 py-1.5 rounded-xl bg-stone-100 text-stone-400 text-xs font-semibold border border-stone-200 cursor-not-allowed">
                Unavailable
              </button>
            ) : quantityInCart > 0 ? (
              <div className="flex items-center bg-brand-600 text-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => onUpdateQuantity(item.id, quantityInCart - 1)}
                  className="p-1.5 hover:bg-brand-700 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} className="stroke-[2.5]" />
                </button>
                <span className="px-3 font-semibold text-sm min-w-[20px] text-center tabular-nums">{quantityInCart}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, quantityInCart + 1)}
                  className="p-1.5 hover:bg-brand-700 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(item)}
                className="px-4 py-1.5 bg-cream-100 text-brand-700 border border-brand-200 hover:bg-brand-600 hover:text-white hover:border-brand-600 rounded-xl text-sm font-bold shadow-sm transition-all duration-300 active:scale-95 flex items-center gap-1"
              >
                <Plus size={14} className="stroke-[2.5]" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
