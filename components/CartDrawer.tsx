'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { CartItem } from '@/lib/cart';

interface CartDrawerProps {
  cart: CartItem[];
}

export default function CartDrawer({ cart }: CartDrawerProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price_min * item.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md animate-bounce-subtle">
      <Link href="/cart">
        <div className="bg-white/95 backdrop-blur-xl text-brand-700 px-5 py-4 rounded-3xl shadow-soft-lg hover:shadow-warm-lg transition-all duration-300 flex items-center justify-between border border-stone-200/80 group cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="relative bg-brand-600/10 p-2.5 rounded-xl group-hover:bg-brand-600/15 transition-colors">
              <ShoppingBag size={20} className="text-brand-600" />
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {totalItems}
              </span>
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Your Order</p>
              <p className="font-heading font-bold text-lg text-brand-700 tabular-nums">₹{totalPrice}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-brand-700 transition-colors group-hover:shadow-lg">
            <span>View Cart</span>
            <ArrowRight size={16} className="stroke-[2.5]" />
          </div>
        </div>
      </Link>
    </div>
  );
}
