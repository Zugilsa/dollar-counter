'use client';

import React from 'react';

interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

export default function Field({ label, children, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-0">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-slate-400 mt-1">{hint}</p>
      )}
    </div>
  );
}
