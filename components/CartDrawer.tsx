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
        <div className="bg-[#1a4a1a] text-white px-5 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:bg-[#153b15] transition-all duration-300 flex items-center justify-between border border-[#f5a623]/25 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="relative bg-white/10 p-2 rounded-xl">
              <ShoppingBag size={20} className="text-[#f5a623]" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#f5a623] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1a4a1a]">
                {totalItems}
              </span>
            </div>
            <div>
              <p className="text-xs text-white/70 font-medium">Your Order</p>
              <p className="font-bold text-base">₹{totalPrice}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#f5a623] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[#e0921b] transition-colors">
            <span>View Cart</span>
            <ArrowRight size={16} className="stroke-[2.5]" />
          </div>
        </div>
      </Link>
    </div>
  );
}
