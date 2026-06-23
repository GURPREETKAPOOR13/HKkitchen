'use client';

import React, { useEffect, useState } from 'react';
import { Save, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Settings as SettingsIcon, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface SettingsGroup {
  title: string;
  icon: string;
  fields: { key: string; label: string; placeholder?: string }[];
}

const SETTING_GROUPS: SettingsGroup[] = [
  {
    title: 'API Keys & Configuration',
    icon: '🔑',
    fields: [
      { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL' },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase Anon Key' },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role Key' },
      { key: 'NEXT_PUBLIC_RAZORPAY_KEY_ID', label: 'Razorpay Key ID' },
      { key: 'RAZORPAY_KEY_SECRET', label: 'Razorpay Key Secret' },
      { key: 'ADMIN_PASSWORD', label: 'Admin Password' },
      { key: 'NEXT_PUBLIC_WHATSAPP_NUMBER', label: 'WhatsApp Number' },
      { key: 'UPI_ID', label: 'UPI ID (for Scan & Pay QR)' },
    ],
  },
  {
    title: 'Delivery Settings',
    icon: '🚚',
    fields: [
      { key: 'DELIVERY_CHARGE', label: 'Delivery Charge (₹)', placeholder: '40' },
      { key: 'FREE_DELIVERY_MIN', label: 'Free Delivery Above (₹)', placeholder: '200' },
      { key: 'KITCHEN_LOCATION', label: 'Kitchen Location (drag pin on map)' },
      { key: 'DELIVERY_RADIUS_KM', label: 'Delivery Radius (km)', placeholder: '5' },
    ],
  },
  {
    title: 'Auth & Email Settings',
    icon: '🔐',
    fields: [
      { key: 'GMAIL_EMAIL', label: 'Gmail Email (for sending OTPs)' },
      { key: 'GMAIL_APP_PASSWORD', label: 'Gmail App Password' },
    ],
  },
  {
    title: 'Kitchen & Offers',
    icon: '🍳',
    fields: [
  { key: 'KITCHEN_OPEN', label: 'Kitchen Status' },
  { key: 'RUSH_HOURS', label: 'Rush Hours' },
      { key: 'TODAYS_OFFER', label: "Today's Offer / Announcement" },
      { key: 'LOYALTY_ENABLED', label: 'Loyalty Program (enable/disable)' },
      { key: 'LOYALTY_STARS', label: 'Stars Required for Free Item', placeholder: '6' },
      { key: 'LOYALTY_FREE_ITEM', label: 'Free Item Name (reward)' },
    ],
  },
];

const SECRET_KEYS = ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'RAZORPAY_KEY_SECRET', 'ADMIN_PASSWORD', 'GMAIL_APP_PASSWORD'];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setSettings(data);
    } catch {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to save');
      }
    } catch {
      setError('Network error - could not save settings');
    } finally {
      setSaving(false);
    }
  }

  function update(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function toggleVisible(key: string) {
    setVisible(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const MERIDIEMS = ['AM', 'PM'];

  function parseRushHours(): { startH: string; startM: string; startA: string; endH: string; endM: string; endA: string } {
    try {
      const slots = JSON.parse(settings.RUSH_HOURS || '[]');
      if (slots.length > 0) {
        const [startH, startM] = slots[0].start.split(':');
        const [endH, endM] = slots[0].end.split(':');
        const sH = String((Number(startH) % 12) || 12).padStart(2, '0');
        const eH = String((Number(endH) % 12) || 12).padStart(2, '0');
        return {
          startH: sH, startM, startA: Number(startH) >= 12 ? 'PM' : 'AM',
          endH: eH, endM, endA: Number(endH) >= 12 ? 'PM' : 'AM',
        };
      }
    } catch {}
    return { startH: '12', startM: '00', startA: 'PM', endH: '14', endM: '00', endA: 'PM' };
  }

  function buildRushJson(rh: ReturnType<typeof parseRushHours>) {
    function to24(h: string, a: string) {
      let hh = Number(h) % 12;
      if (a === 'PM') hh += 12;
      return String(hh).padStart(2, '0');
    }
    return JSON.stringify([{ start: `${to24(rh.startH, rh.startA)}:${rh.startM}`, end: `${to24(rh.endH, rh.endA)}:${rh.endM}` }]);
  }

  function updateRushField(field: string, value: string) {
    const rh = parseRushHours();
    const updated = { ...rh, [field]: value };
    update('RUSH_HOURS', buildRushJson(updated));
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
        <Loader2 size={36} className="animate-spin text-brand-600" />
        <p className="font-bold text-sm text-brand-700">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="bg-brand-600/10 p-3 rounded-2xl border border-brand-200/50">
          <SettingsIcon size={24} className="text-brand-600" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-brand-700">Settings</h1>
          <p className="text-stone-500 text-sm mt-0.5">Manage API keys and configuration. Changes sync to the database and override environment variables at runtime.</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50/90 backdrop-blur-sm border border-green-200/80 text-green-700 p-4 rounded-2xl flex items-center gap-2 text-sm shadow-soft">
          <CheckCircle size={18} className="shrink-0" />
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/80 text-red-700 p-4 rounded-2xl flex items-start gap-2 text-sm shadow-soft">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {SETTING_GROUPS.map((group, gi) => (
          <div key={gi} className="bg-white/90 backdrop-blur-sm rounded-3xl border border-stone-200/60 shadow-soft overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center gap-2">
              <span className="text-lg">{group.icon}</span>
              <h2 className="font-heading text-lg font-bold text-brand-700">{group.title}</h2>
            </div>

            <div className="divide-y divide-stone-100">
              {group.fields.map(field => {
                const isSecret = SECRET_KEYS.includes(field.key);
                return (
                  <div key={field.key} className="p-5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <label className="text-sm font-bold text-brand-700 sm:w-56 shrink-0">{field.label}</label>
                    <div className="relative flex-1 w-full">
                      {field.key === 'KITCHEN_LOCATION' ? (
                        <div className="w-full space-y-3">
                          <MapPicker
                            lat={Number(settings.KITCHEN_LAT) || 28.7041}
                            lng={Number(settings.KITCHEN_LNG) || 77.1025}
                            onLocationChange={(lat, lng) => {
                              update('KITCHEN_LAT', String(lat));
                              update('KITCHEN_LNG', String(lng));
                            }}
                          />
                          <div className="flex items-center gap-3 text-xs font-medium text-stone-500">
                            <MapPin size={14} className="text-brand-600" />
                            <span>Lat: {settings.KITCHEN_LAT || '28.7041'}</span>
                            <span className="text-stone-300">|</span>
                            <span>Lng: {settings.KITCHEN_LNG || '77.1025'}</span>
                          </div>
                        </div>
                      ) : field.key === 'KITCHEN_OPEN' || field.key === 'LOYALTY_ENABLED' ? (
                        <button
                          type="button"
                          onClick={() => update(field.key, settings[field.key] !== 'false' ? 'false' : 'true')}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                            settings[field.key] !== 'false' ? 'bg-green-500' : 'bg-red-400'
                          }`}
                        >
                          <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            settings[field.key] !== 'false' ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                          <span className={`absolute text-[9px] font-bold uppercase tracking-wider ${
                            settings[field.key] !== 'false' ? 'left-2 text-white' : 'right-2 text-white'
                          }`}>
                            {settings[field.key] !== 'false' ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      ) : field.key === 'RUSH_HOURS' ? (() => {
                        const rh = parseRushHours();
                        const TimeRow = ({ label, prefix }: { label: string; prefix: 'start' | 'end' }) => (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-xs font-semibold text-stone-500 w-12 shrink-0">{label}</span>
                            <select value={rh[`${prefix}H`]} onChange={e => updateRushField(`${prefix}H`, e.target.value)}
                              className="px-2 py-1.5 rounded-lg border border-stone-200/80 text-sm bg-white text-stone-800 outline-none focus:border-brand-500">
                              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <span className="text-stone-400">:</span>
                            <select value={rh[`${prefix}M`]} onChange={e => updateRushField(`${prefix}M`, e.target.value)}
                              className="px-2 py-1.5 rounded-lg border border-stone-200/80 text-sm bg-white text-stone-800 outline-none focus:border-brand-500">
                              {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select value={rh[`${prefix}A`]} onChange={e => updateRushField(`${prefix}A`, e.target.value)}
                              className="px-2 py-1.5 rounded-lg border border-stone-200/80 text-sm bg-white text-stone-800 outline-none focus:border-brand-500">
                              {MERIDIEMS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                        );
                        return (
                          <div className="space-y-2">
                            <TimeRow label="Start" prefix="start" />
                            <TimeRow label="End" prefix="end" />
                            <p className="text-[10px] text-stone-400">Orders placed during this window will show a rush-hour delay notice.</p>
                          </div>
                        );
                      })() : field.key === 'TODAYS_OFFER' ? (
                        <textarea
                          value={settings[field.key] || ''}
                          onChange={e => update(field.key, e.target.value)}
                          rows={3}
                          placeholder="Enter announcement text"
                          className="w-full px-3 py-2.5 border border-stone-200/80 focus:border-brand-500 rounded-2xl outline-none text-sm bg-white text-stone-800 transition-all"
                        />
                      ) : (
                        <input
                          type={isSecret && !visible[field.key] ? 'password' : 'text'}
                          value={settings[field.key] || ''}
                          onChange={e => update(field.key, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className="w-full px-3 py-2.5 pr-10 border border-stone-200/80 focus:border-brand-500 rounded-2xl outline-none text-sm bg-white text-stone-800 font-mono transition-all"
                        />
                      )}
                      {isSecret && (
                        <button
                          type="button"
                          onClick={() => toggleVisible(field.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 transition-colors"
                        >
                          {visible[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 hover:from-brand-800 hover:via-brand-700 hover:to-brand-800 disabled:from-stone-400 disabled:to-stone-400 text-white font-bold py-2.5 px-6 rounded-2xl shadow-md transition-all duration-300 active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-stone-400 text-center font-medium">
        Settings stored in the database override environment variables. Restart may be required for some changes to take full effect.
      </p>
    </div>
  );
}
