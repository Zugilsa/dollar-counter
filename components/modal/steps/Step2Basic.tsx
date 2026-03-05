'use client';

import React from 'react';
import Field from '@/components/ui/Field';
import { dayRate, hourRate, fmt$ } from '@/lib/costs';

interface Step2BasicProps {
  title: string;
  monthlyCost: number;
  startDate: string;
  note: string;
  onChange: (field: string, value: string | number) => void;
}

const inputClass =
  'border border-[#E1EAF2] rounded-lg px-3 py-2 w-full focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2] outline-none text-sm text-slate-800 transition-colors';

export default function Step2Basic({
  title,
  monthlyCost,
  startDate,
  note,
  onChange,
}: Step2BasicProps) {
  const daily = dayRate(monthlyCost);
  const hourly = hourRate(monthlyCost);
  const perMin = hourly / 60;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Basic Information</h3>
        <p className="text-sm text-slate-500 mt-1">
          Enter the core details for this decision.
        </p>
      </div>

      {/* Title */}
      <Field label="Title">
        <input
          type="text"
          value={title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="e.g. Delayed AE hire for West Coast"
          className={inputClass}
        />
      </Field>

      {/* Monthly Cost */}
      <Field label="Direct Monthly Cost">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
            $
          </span>
          <input
            type="number"
            min={0}
            step={100}
            value={monthlyCost || ''}
            onChange={(e) => onChange('monthlyCost', Number(e.target.value))}
            placeholder="0"
            className={`${inputClass} pl-7 tabular-nums`}
          />
        </div>
        {/* Live breakdown */}
        {monthlyCost > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="text-xs text-slate-500 tabular-nums bg-slate-50 rounded-md px-2 py-1">
              {fmt$(daily)}/day
            </span>
            <span className="text-xs text-slate-500 tabular-nums bg-slate-50 rounded-md px-2 py-1">
              {fmt$(hourly)}/hr
            </span>
            <span className="text-xs text-slate-500 tabular-nums bg-slate-50 rounded-md px-2 py-1">
              {fmt$(perMin)}/min
            </span>
          </div>
        )}
      </Field>

      {/* Start Date */}
      <Field label="Identified On">
        <input
          type="date"
          value={startDate}
          onChange={(e) => onChange('startDate', e.target.value)}
          className={inputClass}
        />
      </Field>

      {/* Note */}
      <Field label="Note" hint="Optional context or background">
        <textarea
          value={note}
          onChange={(e) => onChange('note', e.target.value)}
          placeholder="Why was this decision made? What's the context?"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </Field>
    </div>
  );
}
