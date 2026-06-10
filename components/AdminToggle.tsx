'use client';

import React from 'react';

interface AdminToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function AdminToggle({
  checked,
  onChange,
  label,
  disabled = false,
}: AdminToggleProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
          disabled={disabled}
        />
        <div
          className={`w-10 h-6 rounded-full transition-colors duration-300 ${
            checked ? 'bg-[#1a4a1a]' : 'bg-gray-300'
          }`}
        ></div>
        <div
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${
            checked ? 'transform translate-x-4' : ''
          }`}
        ></div>
      </div>
      {label && <span className="text-sm font-semibold text-gray-700">{label}</span>}
    </label>
  );
}
