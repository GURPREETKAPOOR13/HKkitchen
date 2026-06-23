'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  ArrowLeft, ShoppingBag, Trash2, Plus, Minus, CreditCard, Loader2,
  AlertCircle, MapPin, Bike, Smartphone, IndianRupee,
  CheckCircle2, ExternalLink, Clock,
} from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'cash'>('razorpay');
  const [upiId, setUpiId] = useState('');
  const [upiQrDataUrl, setUpiQrDataUrl] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [upiConfirmLoading, setUpiConfirmLoading] = useState(false);
  const [cashLoading, setCashLoading] = useState(false);

  const [deliveryConfig, setDeliveryConfig] = useState({
    deliveryCharge: 40,
    freeDeliveryMin: 200,
    kitchenLat: 28.7041,
    kitchenLng: 77.1025,
    deliveryRadiusKm: 5,
  });
  const [userDistance, setUserDistance] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isRushHour, setIsRushHour] = useState(false);
  const [kitchenOpen, setKitchenOpen] = useState(true);

  const subtotal = cart.reduce((sum, item) => sum + item.price_min * item.quantity, 0);
  const deliveryCharge = orderType === 'delivery'
    ? (subtotal >= deliveryConfig.freeDeliveryMin ? 0 : deliveryConfig.deliveryCharge)
    : 0;
  const totalAmount = subtotal + deliveryCharge;
  const canPayCash = orderType === 'pickup';

  useEffect(() => {
    setCart(getCart());
    fetchUpiId();
    fetchDeliveryConfig();
  }, []);

  async function fetchUpiId() {
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.upi_id) setUpiId(data.upi_id);
      }
    } catch {}
  }

  async function fetchDeliveryConfig() {
    try {
      const res = await fetch('/api/delivery-config');
      if (res.ok) {
        const data = await res.json();
        setDeliveryConfig(data);
        setKitchenOpen(data.kitchenOpen);
        if (data.rushHours) {
          try {
            const slots: { start: string; end: string }[] = JSON.parse(data.rushHours);
            const now = new Date();
            const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const inRush = slots.some(s => hhmm >= s.start && hhmm < s.end);
            setIsRushHour(inRush);
          } catch {}
        }
      }
    } catch {}
  }

  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function detectLocation() {
    setLocationLoading(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const dist = haversineKm(lat, lng, deliveryConfig.kitchenLat, deliveryConfig.kitchenLng);
        setUserDistance(Math.round(dist * 10) / 10);
        setLocationLoading(false);
      },
      () => {
        setLocationError('Could not detect location. Please enter your address manually.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  useEffect(() => {
    if (paymentMethod === 'upi' && upiId && totalAmount > 0) {
      generateUpiQr(upiId, totalAmount);
    }
  }, [paymentMethod, upiId, totalAmount]);

  async function generateUpiQr(id: string, amount: number) {
    try {
      const QRCode = (await import('qrcode')).default;
      const upiUrl = `upi://pay?pa=${encodeURIComponent(id)}&pn=HK%20Kitchen&am=${amount}&cu=INR&tn=Order%20at%20HK%20Kitchen`;
      const url = await QRCode.toDataURL(upiUrl, { width: 280, margin: 2, color: { dark: '#1a4a1a', light: '#ffffff' } });
      setUpiQrDataUrl(url);
    } catch {}
  }

  const handleUpdateQty = (id: number, qty: number) => {
    const updated = updateQuantity(id, qty);
    setCart([...updated]);
  };

  const handleRemove = (id: number) => {
    const updated = removeFromCart(id);
    setCart([...updated]);
  };

  const openUpiApp = () => {
    if (!upiId) return;
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=HK%20Kitchen&am=${totalAmount}&cu=INR&tn=Order%20at%20HK%20Kitchen`;
    window.open(upiUrl, '_blank');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!kitchenOpen) {
      setErrorMsg('Kitchen is currently closed. Please try again later.');
      return;
    }
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

      const options = {
        key: rzpOrder.key_id,
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
          color: '#1a4a1a',
        },
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
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
            clearCart();

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

            const whatsappNumber = rzpOrder.whatsapp_number || '919818066376';
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`;

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

  const handleUpiConfirm = async () => {
    setErrorMsg('');

    if (!kitchenOpen) {
      setErrorMsg('Kitchen is currently closed. Please try again later.');
      return;
    }
    setUpiConfirmLoading(true);

    try {
      const res = await fetch('/api/confirm-upi-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          customer_address: orderType === 'delivery' ? address : 'Self Pickup',
          order_type: orderType,
          items: cart,
          total_amount: totalAmount,
          notes: notes,
          upi_ref: upiRef || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save order');
      }

      const order = await res.json();
      clearCart();

      const whatsappText = `Hello HK Kitchen! 
I have placed an order.
*Order No:* ${order.order_number}
*Name:* ${name}
*Phone:* ${phone}
*Type:* ${orderType.toUpperCase()}
*Items:*
${cart.map((i) => `- ${i.name} x ${i.quantity} (₹${i.price_min * i.quantity})`).join('\n')}
*Total Amount:* ₹${totalAmount} Paid via UPI
*Address:* ${orderType === 'delivery' ? address : 'Self Pickup'}
${notes ? `*Instructions:* ${notes}` : ''}`;

      const whatsappUrl = `https://wa.me/919818066376?text=${encodeURIComponent(whatsappText)}`;
      window.open(whatsappUrl, '_blank');
      router.push(`/order/${order.id}`);
    } catch (err: unknown) {
      console.error('UPI order error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to complete order. Please try again.');
      setUpiConfirmLoading(false);
    }
  };

  const handleCashOrder = async () => {
    setErrorMsg('');

    if (!kitchenOpen) {
      setErrorMsg('Kitchen is currently closed. Please try again later.');
      return;
    }
    setCashLoading(true);

    try {
      const res = await fetch('/api/confirm-cash-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          customer_address: 'Self Pickup',
          order_type: 'pickup',
          items: cart,
          total_amount: totalAmount,
          notes: notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to place order');
      }

      const order = await res.json();
      clearCart();

      const whatsappText = `Hello HK Kitchen! 
I have placed an order.
*Order No:* ${order.order_number}
*Name:* ${name}
*Phone:* ${phone}
*Type:* PICKUP
*Items:*
${cart.map((i) => `- ${i.name} x ${i.quantity} (₹${i.price_min * i.quantity})`).join('\n')}
*Total Amount:* ₹${totalAmount} (Cash on Pickup)
${notes ? `*Instructions:* ${notes}` : ''}`;

      const whatsappUrl = `https://wa.me/919818066376?text=${encodeURIComponent(whatsappText)}`;
      window.open(whatsappUrl, '_blank');
      router.push(`/order/${order.id}`);
    } catch (err: unknown) {
      console.error('Cash order error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
      setCashLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream-50 pb-24">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-stone-200/60 sticky top-0 z-20 shadow-soft">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-brand-700 hover:text-brand-600 transition-colors font-bold">
            <ArrowLeft size={18} className="stroke-[2.5]" />
            <span>Menu</span>
          </Link>
          <h1 className="font-heading text-xl font-bold text-brand-700">Checkout</h1>
          <div className="w-14" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {cart.length === 0 ? (
          <div className="text-center py-24 bg-white/80 backdrop-blur-sm rounded-3xl border border-stone-200/60 shadow-soft animate-fade-in">
            <div className="bg-cream-100 p-4 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-5 border border-stone-200">
              <ShoppingBag size={32} className="text-stone-400" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-brand-700 mb-2">Your cart is empty</h2>
            <p className="text-stone-500 text-sm mb-8 max-w-xs mx-auto">Add delicious homemade food from the menu to place an order.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-2xl shadow-md hover:bg-brand-700 transition-all duration-300 active:scale-[0.97]">
              <ShoppingBag size={16} />
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            {errorMsg && (
              <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/80 text-red-700 p-4 rounded-2xl flex items-start gap-2 text-sm shadow-soft">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                <p className="font-semibold">{errorMsg}</p>
              </div>
            )}

            {!kitchenOpen && (
              <div className="bg-amber-50/90 backdrop-blur-sm border-2 border-amber-300/80 text-amber-800 p-4 rounded-2xl flex items-start gap-2 text-sm shadow-soft">
                <Clock size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800">Kitchen is Currently Closed</p>
                  <p className="text-amber-700 mt-0.5">Orders cannot be placed right now. Please check back during operating hours.</p>
                </div>
              </div>
            )}

            {isRushHour && kitchenOpen && (
              <div className="bg-orange-50/90 backdrop-blur-sm border border-orange-200/80 text-orange-700 p-4 rounded-2xl flex items-start gap-2 text-sm shadow-soft">
                <Clock size={18} className="shrink-0 mt-0.5 text-orange-500" />
                <div>
                  <p className="font-bold text-orange-700">Rush Hours — Orders May Be Delayed</p>
                  <p className="text-orange-600 mt-0.5">We are experiencing high demand. Your order may take a bit longer than usual. Thank you for your patience!</p>
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-stone-200/60 shadow-soft">
              <h2 className="font-heading text-lg font-bold text-brand-700 mb-4 flex items-center gap-2 border-b border-stone-100 pb-4">
                <ShoppingBag size={18} className="text-amber-500" />
                <span>Your Selected Items</span>
                <span className="ml-auto text-xs font-body font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{cart.length} items</span>
              </h2>

              <div className="divide-y divide-stone-100">
                {cart.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-brand-700 text-sm md:text-base leading-tight">{item.name}</h3>
                      <p className="text-amber-500 font-bold text-sm mt-1 tabular-nums">₹{item.price_min * item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center bg-cream-100 rounded-xl border border-stone-200/80 overflow-hidden">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-brand-600 hover:text-white transition-colors text-stone-600"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} className="stroke-[2.5]" />
                        </button>
                        <span className="px-3 font-bold text-sm min-w-[20px] text-center text-brand-700 tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-brand-600 hover:text-white transition-colors text-stone-600"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} className="stroke-[2.5]" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-stone-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50/50 transition-all"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleCheckout} className="space-y-5">
              {/* Order Type Toggle */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-stone-200/60 shadow-soft">
                <h2 className="font-heading text-lg font-bold text-brand-700 mb-4 border-b border-stone-100 pb-4">Order Mode</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setOrderType('delivery'); if (paymentMethod === 'cash') setPaymentMethod('razorpay'); }}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      orderType === 'delivery'
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10'
                        : 'bg-cream-100 text-stone-600 border border-stone-200/80 hover:bg-white'
                    }`}
                  >
                    <Bike size={16} />
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      orderType === 'pickup'
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10'
                        : 'bg-cream-100 text-stone-600 border border-stone-200/80 hover:bg-white'
                    }`}
                  >
                    <MapPin size={16} />
                    Self Pickup
                  </button>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-stone-200/60 shadow-soft space-y-4">
                <h2 className="font-heading text-lg font-bold text-brand-700 border-b border-stone-100 pb-4">Customer Details</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-bold text-brand-600 mb-1.5 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                    <input id="fullName" type="text" required placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200/80 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm transition-all bg-white text-stone-800 placeholder:text-stone-400" />
                  </div>
                  <div>
                    <label htmlFor="phoneNum" className="block text-xs font-bold text-brand-600 mb-1.5 uppercase tracking-wider">Phone Number <span className="text-red-500">*</span></label>
                    <input id="phoneNum" type="tel" required placeholder="Enter 10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200/80 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm transition-all bg-white text-stone-800 placeholder:text-stone-400" />
                  </div>
                  {orderType === 'delivery' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-brand-600 mb-1 uppercase tracking-wider">Delivery Location</label>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={detectLocation}
                          disabled={locationLoading}
                          className="flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-bold py-2 px-3 rounded-xl text-xs transition-all disabled:opacity-50"
                        >
                          {locationLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                          {locationLoading ? 'Detecting...' : 'Use My Location'}
                        </button>
                        {userDistance !== null && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            userDistance <= deliveryConfig.deliveryRadiusKm
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            {userDistance <= deliveryConfig.deliveryRadiusKm
                              ? `✓ ${userDistance} km away (within delivery area)`
                              : `✗ ${userDistance} km away (outside ${deliveryConfig.deliveryRadiusKm} km radius)`}
                          </span>
                        )}
                      </div>

                      {userDistance !== null && userDistance > deliveryConfig.deliveryRadiusKm && (
                        <div className="bg-amber-50/90 backdrop-blur-sm border border-amber-200/80 text-amber-700 p-3 rounded-2xl flex items-start gap-2 text-xs shadow-soft">
                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                          <p className="font-semibold">Your location is outside our delivery radius. Please switch to Self Pickup or enter a different address within {deliveryConfig.deliveryRadiusKm} km.</p>
                        </div>
                      )}

                      <div>
                        <label htmlFor="delAddress" className="block text-xs font-bold text-brand-600 mb-1.5 uppercase tracking-wider">Delivery Address <span className="text-red-500">*</span></label>
                        <textarea id="delAddress" required placeholder="House no, Building, Street name, Area, Landmarks, Rohini, Delhi..." value={address} onChange={e => setAddress(e.target.value)} rows={3}
                          className="w-full px-4 py-3 rounded-2xl border border-stone-200/80 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm transition-all bg-white text-stone-800 placeholder:text-stone-400" />
                      </div>

                      {locationError && (
                        <p className="text-xs text-red-500 font-semibold">{locationError}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <label htmlFor="specNotes" className="block text-xs font-bold text-brand-600 mb-1.5 uppercase tracking-wider">Cooking / Delivery Instructions</label>
                    <textarea id="specNotes" placeholder="Less spicy, no onions, leave at the door..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200/80 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm transition-all bg-white text-stone-800 placeholder:text-stone-400" />
                  </div>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-stone-200/60 shadow-soft space-y-3">
                <h2 className="font-heading text-lg font-bold text-brand-700 border-b border-stone-100 pb-3">Receipt Summary</h2>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="font-bold text-stone-700 tabular-nums">₹{subtotal}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <Bike size={14} />
                      <span>Delivery Charge</span>
                      {subtotal >= deliveryConfig.freeDeliveryMin && (
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-green-200 ml-1">FREE</span>
                      )}
                    </div>
                    <span className={`font-bold tabular-nums ${deliveryCharge === 0 ? 'text-green-600' : 'text-brand-600'}`}>
                      {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                    </span>
                  </div>
                )}
                {orderType === 'delivery' && subtotal > 0 && subtotal < deliveryConfig.freeDeliveryMin && (
                  <div className="text-xs text-amber-600 font-semibold flex items-center gap-1 bg-amber-50/50 p-2 rounded-xl">
                    <span>🚚</span>
                    <span>Add ₹{deliveryConfig.freeDeliveryMin - subtotal} more for free delivery</span>
                  </div>
                )}
                <div className="border-t border-stone-100 pt-4 flex justify-between items-center">
                  <span className="font-bold text-brand-700">Total Amount</span>
                  <span className="font-heading text-xl font-bold text-amber-500 tabular-nums">₹{totalAmount}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-stone-200/60 shadow-soft">
                <h2 className="font-heading text-lg font-bold text-brand-700 mb-4 border-b border-stone-100 pb-3">Payment Method</h2>
                <div className={`grid gap-3 ${canPayCash && upiId ? 'grid-cols-3' : !canPayCash || !upiId ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      paymentMethod === 'razorpay'
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10 ring-2 ring-brand-300'
                        : 'bg-cream-100 text-stone-600 border border-stone-200/80 hover:bg-white'
                    }`}
                  >
                    <CreditCard size={16} />
                    <span>Pay Online</span>
                  </button>
                  {upiId && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                        paymentMethod === 'upi'
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10 ring-2 ring-brand-300'
                          : 'bg-cream-100 text-stone-600 border border-stone-200/80 hover:bg-white'
                      }`}
                    >
                      <Smartphone size={16} />
                      <span>Scan & Pay</span>
                    </button>
                  )}
                  {canPayCash && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                        paymentMethod === 'cash'
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10 ring-2 ring-brand-300'
                          : 'bg-cream-100 text-stone-600 border border-stone-200/80 hover:bg-white'
                      }`}
                    >
                      <IndianRupee size={16} />
                      <span>Cash</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Razorpay */}
              {paymentMethod === 'razorpay' && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 hover:from-brand-800 hover:via-brand-700 hover:to-brand-800 disabled:from-stone-400 disabled:to-stone-400 text-white font-bold py-4 px-6 rounded-2xl shadow-soft-lg transition-all duration-300 active:scale-[0.97] text-base"
                >
                  {loading ? (
                    <><Loader2 className="animate-spin" size={20} /><span>Processing Payment...</span></>
                  ) : (
                    <><CreditCard size={20} /><span>Pay ₹{totalAmount} with Razorpay</span></>
                  )}
                </button>
              )}

              {/* UPI */}
              {paymentMethod === 'upi' && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-stone-200/60 shadow-soft text-center space-y-5">
                  {upiQrDataUrl ? (
                    <>
                      <div className="inline-block bg-white p-3 rounded-2xl shadow-md border border-stone-200">
                        <img src={upiQrDataUrl} alt="UPI QR Code" className="w-52 h-52 mx-auto" />
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                        Scan this QR with any UPI app, or tap the button below to open your UPI app directly.
                      </p>
                      <button
                        type="button"
                        onClick={openUpiApp}
                        className="w-full flex items-center justify-center gap-2 bg-white border-2 border-brand-600 text-brand-700 font-bold py-3.5 px-6 rounded-2xl shadow-sm hover:bg-brand-50 transition-all duration-300 active:scale-[0.97]"
                      >
                        <ExternalLink size={18} />
                        <span>Open UPI App</span>
                      </button>
                      <div className="border-t border-stone-100 pt-4 space-y-3">
                        <input
                          type="text"
                          placeholder="UPI Ref. No. (optional)"
                          value={upiRef}
                          onChange={e => setUpiRef(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl border border-stone-200/80 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm bg-white text-stone-800 placeholder:text-stone-400 text-center"
                        />
                        <button
                          type="button"
                          onClick={handleUpiConfirm}
                          disabled={upiConfirmLoading}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 hover:from-brand-800 hover:via-brand-700 hover:to-brand-800 disabled:from-stone-400 disabled:to-stone-400 text-white font-bold py-4 px-6 rounded-2xl shadow-soft-lg transition-all duration-300 active:scale-[0.97]"
                        >
                          {upiConfirmLoading ? (
                            <><Loader2 className="animate-spin" size={20} /><span>Completing Order...</span></>
                          ) : (
                            <><CheckCircle2 size={20} /><span>I have paid — Complete Order</span></>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('razorpay')}
                          className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
                        >
                          Pay online instead
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-stone-400 gap-2">
                      <Loader2 className="animate-spin" size={24} />
                      <p className="text-sm">Loading QR code...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Cash on Pickup */}
              {paymentMethod === 'cash' && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-stone-200/60 shadow-soft text-center space-y-4">
                  <div className="bg-cream-100 p-4 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto border border-stone-200">
                    <IndianRupee size={36} className="text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-brand-700 mb-1">Cash on Pickup</h3>
                    <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                      Pay when you pick up your order from our kitchen. No online payment needed.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCashOrder}
                    disabled={cashLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 hover:from-brand-800 hover:via-brand-700 hover:to-brand-800 disabled:from-stone-400 disabled:to-stone-400 text-white font-bold py-4 px-6 rounded-2xl shadow-soft-lg transition-all duration-300 active:scale-[0.97]"
                  >
                    {cashLoading ? (
                      <><Loader2 className="animate-spin" size={20} /><span>Placing Order...</span></>
                    ) : (
                      <><ShoppingBag size={20} /><span>Place Order — ₹{totalAmount}</span></>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
