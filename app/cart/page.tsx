'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ArrowLeft, ShoppingBag, Trash2, Plus, Minus, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { getCart, updateQuantity, removeFromCart, clearCart, CartItem } from '@/lib/cart';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setCart(getCart());
  }, []);

  const handleUpdateQty = (id: number, qty: number) => {
    const updated = updateQuantity(id, qty);
    setCart([...updated]);
  };

  const handleRemove = (id: number) => {
    const updated = removeFromCart(id);
    setCart([...updated]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price_min * item.quantity, 0);
  const deliveryCharge = orderType === 'delivery' ? 40 : 0;
  const totalAmount = subtotal + deliveryCharge;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Please enter your phone number.');
      return;
    }

    if (orderType === 'delivery' && !address.trim()) {
      setErrorMsg('Please enter your delivery address.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Razorpay order on our backend
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to initiate payment.');
      }

      const rzpOrder = await res.json();

      // 2. Configure and open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'HK Kitchen',
        description: 'Homemade Goodness Order Payment',
        order_id: rzpOrder.id,
        prefill: {
          name: name,
          contact: phone,
        },
        theme: {
          color: '#1a4a1a', // Dark green theme
        },
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          // This executes on payment success
          try {
            setLoading(true);
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                customer_name: name,
                customer_phone: phone,
                customer_address: orderType === 'delivery' ? address : 'Self Pickup',
                order_type: orderType,
                items: cart,
                total_amount: totalAmount,
                notes: notes,
              }),
            });

            if (!verifyRes.ok) {
              const verifyError = await verifyRes.json();
              throw new Error(verifyError.message || 'Payment verification failed.');
            }

            const verifiedOrder = await verifyRes.json();

            // Clear local storage cart
            clearCart();

            // Open WhatsApp order message
            const whatsappText = `Hello HK Kitchen! 
I have placed an order.
*Order No:* ${verifiedOrder.order_number}
*Name:* ${name}
*Phone:* ${phone}
*Type:* ${orderType.toUpperCase()}
*Items:*
${cart.map((i) => `- ${i.name} x ${i.quantity} (₹${i.price_min * i.quantity})`).join('\n')}
*Total Amount:* ₹${totalAmount} Paid via Razorpay
*Address:* ${orderType === 'delivery' ? address : 'Self Pickup'}
${notes ? `*Instructions:* ${notes}` : ''}`;

            const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919818066376';
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`;

            // Attempt to open WhatsApp window, then redirect
            window.open(whatsappUrl, '_blank');
            router.push(`/order/${verifiedOrder.id}`);
          } catch (err: unknown) {
            console.error('Payment verification error:', err);
            setErrorMsg(err instanceof Error ? err.message : 'Payment succeeded, but we failed to register your order. Please contact support.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const RazorpayConstructor = (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay;
      const paymentObject = new RazorpayConstructor(options);
      paymentObject.open();
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fdfbf7] pb-16">
      {/* Load Razorpay SDK */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Header */}
      <div className="bg-white border-b border-[#1a4a1a]/10 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-[#1a4a1a] hover:opacity-85 transition-opacity font-semibold">
            <ArrowLeft size={18} className="stroke-[2.5]" />
            <span>Menu</span>
          </Link>
          <h1 className="text-xl font-bold text-[#1a4a1a]">Checkout</h1>
          <div className="w-14"></div> {/* Spacer for symmetry */}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#1a4a1a]/5 shadow-sm p-6">
            <div className="bg-[#fdfbf7] p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-[#1a4a1a]/10">
              <ShoppingBag size={24} className="text-[#1a4a1a]/60" />
            </div>
            <h2 className="text-xl font-bold text-[#1a4a1a] mb-2">Your cart is empty</h2>
            <p className="text-gray-500 text-sm mb-6">Add delicious homemade food from the menu to place an order.</p>
            <Link href="/" className="inline-flex items-center gap-1 bg-[#1a4a1a] text-white font-bold px-6 py-3 rounded-xl shadow-md hover:bg-[#153b15] transition-colors">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Error Notification */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-2 text-sm shadow-sm animate-pulse-subtle">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                <p className="font-semibold">{errorMsg}</p>
              </div>
            )}

            {/* Cart Items List */}
            <div className="bg-white rounded-3xl p-5 border border-[#1a4a1a]/5 shadow-sm">
              <h2 className="text-lg font-bold text-[#1a4a1a] mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <ShoppingBag size={18} className="text-[#f5a623]" />
                <span>Your Selected Items</span>
              </h2>

              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex-grow">
                      <h3 className="font-bold text-[#1a4a1a] text-sm md:text-base leading-tight">
                        {item.name}
                      </h3>
                      {item.price_max && item.price_max > item.price_min && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Range Price item (Calculated at base ₹{item.price_min})
                        </p>
                      )}
                      <p className="text-[#f5a623] font-bold text-sm mt-1">
                        ₹{item.price_min * item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Quantity Selector */}
                      <div className="flex items-center bg-[#fdfbf7] text-[#1a4a1a] rounded-lg border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-gray-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} className="stroke-[2.5]" />
                        </button>
                        <span className="px-2.5 font-bold text-xs min-w-[16px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-gray-100 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} className="stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkout Details Form */}
            <form onSubmit={handleCheckout} className="space-y-6">
              {/* Order Type Toggle */}
              <div className="bg-white rounded-3xl p-5 border border-[#1a4a1a]/5 shadow-sm">
                <h2 className="text-lg font-bold text-[#1a4a1a] mb-4 border-b border-gray-100 pb-3">
                  Order Mode
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                      orderType === 'delivery'
                        ? 'bg-[#1a4a1a] text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🚗 Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    className={`py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                      orderType === 'pickup'
                        ? 'bg-[#1a4a1a] text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🛍️ Self Pickup
                  </button>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-white rounded-3xl p-5 border border-[#1a4a1a]/5 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-[#1a4a1a] border-b border-gray-100 pb-3">
                  Customer & Address Info
                </h2>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-bold text-[#1a4a1a] mb-1.5 uppercase tracking-wide">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1a4a1a] focus:ring-1 focus:ring-[#1a4a1a] outline-none text-sm transition-colors bg-white text-gray-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="phoneNum" className="block text-xs font-bold text-[#1a4a1a] mb-1.5 uppercase tracking-wide">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="phoneNum"
                      type="tel"
                      required
                      placeholder="Enter 10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1a4a1a] focus:ring-1 focus:ring-[#1a4a1a] outline-none text-sm transition-colors bg-white text-gray-800"
                    />
                  </div>

                  {orderType === 'delivery' && (
                    <div className="animate-fade-in">
                      <label htmlFor="delAddress" className="block text-xs font-bold text-[#1a4a1a] mb-1.5 uppercase tracking-wide">
                        Delivery Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="delAddress"
                        required={orderType === 'delivery'}
                        placeholder="House no, Building, Street name, Area, Landmarks, Rohini, Delhi..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1a4a1a] focus:ring-1 focus:ring-[#1a4a1a] outline-none text-sm transition-colors bg-white text-gray-800"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="specNotes" className="block text-xs font-bold text-[#1a4a1a] mb-1.5 uppercase tracking-wide">
                      Cooking / Delivery Instructions
                    </label>
                    <textarea
                      id="specNotes"
                      placeholder="Less spicy, no onions, leave at the door..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1a4a1a] focus:ring-1 focus:ring-[#1a4a1a] outline-none text-sm transition-colors bg-white text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-white rounded-3xl p-5 border border-[#1a4a1a]/5 shadow-sm space-y-3">
                <h2 className="text-lg font-bold text-[#1a4a1a] border-b border-gray-100 pb-2">
                  Receipt Summary
                </h2>

                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">₹{subtotal}</span>
                </div>

                {orderType === 'delivery' && (
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Delivery Charge</span>
                    <span className="font-semibold text-[#1a4a1a]">₹{deliveryCharge}</span>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-base font-bold text-[#1a4a1a]">
                  <span>Total Amount</span>
                  <span className="text-xl text-[#f5a623]">₹{totalAmount}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#1a4a1a] hover:bg-[#153b15] disabled:bg-[#1a4a1a]/50 text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition-all duration-300 transform active:scale-95 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    <span>Pay ₹{totalAmount} with Razorpay</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
