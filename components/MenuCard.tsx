'use client';

import React from 'react';
import { Plus, Minus, AlertTriangle } from 'lucide-react';

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

export default function MenuCard({
  item,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
}: MenuCardProps) {
  const { name, price_min, price_max, description, is_available } = item;

  return (
    <div
      className={`relative flex flex-col bg-white rounded-2xl border border-[#1a4a1a]/5 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
        !is_available ? 'opacity-65 filter grayscale-[30%]' : ''
      }`}
    >
      {/* Featured Badge */}
      {item.is_featured && is_available && (
        <span className="absolute top-2 left-2 bg-[#f5a623] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shadow-sm">
          ⭐ Featured
        </span>
      )}

      {/* Main Content */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-bold text-lg text-[#1a4a1a] line-clamp-2 leading-snug">
              {name}
            </h3>
            {/* Price tag */}
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[#f5a623] font-bold text-lg">
                ₹{price_min}
                {price_max && price_max > price_min && (
                  <span className="text-[#f5a623] text-sm font-semibold">
                    -{price_max}
                  </span>
                )}
              </span>
              {price_max && price_max > price_min && (
                <span className="text-[10px] text-gray-400 font-medium">
                  Range Price
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
          <div>
            {!is_available && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                <AlertTriangle size={12} />
                Unavailable
              </span>
            )}
            {is_available && (
              <span className="text-xs text-gray-500 font-medium">
                Freshly cooked
              </span>
            )}
          </div>

          {/* Action button */}
          <div className="shrink-0">
            {!is_available ? (
              <button
                disabled
                className="px-4 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold border border-gray-200 cursor-not-allowed"
              >
                Unavailable
              </button>
            ) : quantityInCart > 0 ? (
              <div className="flex items-center bg-[#1a4a1a] text-white rounded-lg shadow-sm border border-[#1a4a1a] overflow-hidden">
                <button
                  onClick={() => onUpdateQuantity(item.id, quantityInCart - 1)}
                  className="p-1.5 hover:bg-[#153b15] transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} className="stroke-[2.5]" />
                </button>
                <span className="px-3 font-semibold text-sm min-w-[20px] text-center">
                  {quantityInCart}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, quantityInCart + 1)}
                  className="p-1.5 hover:bg-[#153b15] transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(item)}
                className="px-4 py-1.5 bg-[#fdfbf7] text-[#1a4a1a] border border-[#1a4a1a]/30 hover:border-[#1a4a1a] hover:bg-[#1a4a1a] hover:text-white rounded-lg text-sm font-bold shadow-sm transition-all duration-300 transform active:scale-95 flex items-center gap-1"
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
