'use client';

import React, { useId } from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export default function Toggle({ label, checked, onChange }: ToggleProps) {
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-3">
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 cursor-pointer select-none"
      >
        {label}
      </label>

      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex items-center shrink-0 cursor-pointer
                   transition-colors duration-200 ease-in-out
                   rounded-full focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-[#1DA1F2] focus-visible:ring-offset-2"
        style={{
          width: 44,
          height: 24,
          backgroundColor: checked ? '#1DA1F2' : '#CBD5E1',
        }}
      >
        {/* Sliding circle */}
        <span
          aria-hidden="true"
          className="pointer-events-none inline-block rounded-full bg-white
                     shadow-sm ring-0 transition-transform duration-200 ease-in-out"
          style={{
            width: 18,
            height: 18,
            transform: checked ? 'translateX(23px)' : 'translateX(3px)',
          }}
        />
      </button>
    </div>
  );
}
