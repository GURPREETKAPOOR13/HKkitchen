'use client';

import React, { useEffect, useState } from 'react';
import { Save, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Settings as SettingsIcon } from 'lucide-react';

const SETTING_FIELDS = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', type: 'text', secret: false },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase Anon Key', type: 'text', secret: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role Key', type: 'text', secret: true },
  { key: 'NEXT_PUBLIC_RAZORPAY_KEY_ID', label: 'Razorpay Key ID', type: 'text', secret: false },
  { key: 'RAZORPAY_KEY_SECRET', label: 'Razorpay Key Secret', type: 'password', secret: true },
  { key: 'ADMIN_PASSWORD', label: 'Admin Password', type: 'password', secret: true },
  { key: 'NEXT_PUBLIC_WHATSAPP_NUMBER', label: 'WhatsApp Business Number', type: 'text', secret: false },
  { key: 'WHATSAPP_CLOUD_API_TOKEN', label: 'WhatsApp Cloud API Token', type: 'password', secret: true },
  { key: 'WHATSAPP_PHONE_NUMBER_ID', label: 'WhatsApp Phone Number ID', type: 'text', secret: false },
];

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
        <Loader2 size={36} className="animate-spin text-[#1a4a1a]" />
        <p className="font-semibold text-sm">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-[#1a4a1a]">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage API keys and configuration. Changes sync to the database and override environment variables at runtime.</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle size={18} className="shrink-0" />
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-2 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-[#1a4a1a]/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <SettingsIcon size={20} className="text-[#f5a623]" />
          <h2 className="text-lg font-bold text-[#1a4a1a]">API Keys & Configuration</h2>
        </div>

        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-xs text-blue-700 font-medium">
            💬 WhatsApp Cloud API (optional) — get a free token at{' '}
            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com</a>.
            Without it, order notifications will open via <code className="text-blue-800 bg-blue-100 px-1 rounded">wa.me</code> link (manual send).
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {SETTING_FIELDS.map(field => (
            <div key={field.key} className="p-5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <label className="text-sm font-bold text-[#1a4a1a] sm:w-56 shrink-0">{field.label}</label>
              <div className="relative flex-1 w-full">
                <input
                  type={field.secret && !visible[field.key] ? 'password' : 'text'}
                  value={settings[field.key] || ''}
                  onChange={e => update(field.key, e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-200 focus:border-[#1a4a1a] rounded-xl outline-none text-sm bg-white text-gray-800 font-mono"
                />
                {field.secret && (
                  <button
                    type="button"
                    onClick={() => toggleVisible(field.key)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {visible[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 sm:px-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#1a4a1a] hover:bg-[#153b15] disabled:bg-[#1a4a1a]/60 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all duration-300 active:scale-95"
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

      <p className="text-xs text-gray-400 text-center">
        Settings stored in the database override environment variables. Restart may be required for some changes to take full effect.
      </p>
    </div>
  );
}
