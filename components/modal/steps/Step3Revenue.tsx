'use client';

import React from 'react';
import Field from '@/components/ui/Field';
import SliderField from '@/components/ui/SliderField';
import RampChart from '@/components/cards/RampChart';
import { revenueProjection, fmt$ } from '@/lib/costs';
import { RevenueSecondOrder } from '@/lib/types';

interface Step3RevenueProps {
  quota: number;
  attainRate: number;
  rampQ: number;
  onChange: (field: string, value: number) => void;
}

const inputClass =
  'border border-[#E1EAF2] rounded-lg px-3 py-2 w-full focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2] outline-none text-sm text-slate-800 transition-colors';

export default function Step3Revenue({
  quota,
  attainRate,
  rampQ,
  onChange,
}: Step3RevenueProps) {
  // Build the second-order object for projection
  const so: RevenueSecondOrder = {
    type: 'revenue_role',
    quota,
    attainRate,
    rampQ,
  };

  const projection = revenueProjection(so);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Revenue Wizard</h3>
        <p className="text-sm text-slate-500 mt-1">
          Model the opportunity cost of this unfilled revenue role.
        </p>
      </div>

      {/* Annual Quota */}
      <Field label="Annual Quota ($)">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
            $
          </span>
          <input
            type="number"
            min={0}
            step={10000}
            value={quota || ''}
            onChange={(e) => onChange('quota', Number(e.target.value))}
            placeholder="500000"
            className={`${inputClass} pl-7 tabular-nums`}
          />
        </div>
      </Field>

      {/* Attainment Rate */}
      <SliderField
        label="Attainment Rate"
        value={Math.round(attainRate * 100)}
        min={40}
        max={100}
        step={5}
        onChange={(v) => onChange('attainRate', v / 100)}
        format={(v) => `${v}%`}
      />

      {/* Ramp Duration */}
      <SliderField
        label="Ramp Duration"
        value={rampQ}
        min={1}
        max={6}
        step={1}
        onChange={(v) => onChange('rampQ', v)}
        format={(v) => `${v}Q`}
      />

      {/* Live Preview */}
      <div className="bg-emerald-50 rounded-xl p-4 flex flex-col gap-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Revenue Preview
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-emerald-600 font-medium">
              Full attainment/yr
            </span>
            <span className="text-base font-bold text-emerald-800 tabular-nums">
              {fmt$(projection.annualExpected)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-emerald-600 font-medium">
              Monthly at full ramp
            </span>
            <span className="text-base font-bold text-emerald-800 tabular-nums">
              {fmt$(projection.fullMonthly)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-emerald-600 font-medium">
              Year-1 projected
            </span>
            <span className="text-base font-bold text-emerald-800 tabular-nums">
              {fmt$(projection.year1)}
            </span>
          </div>
        </div>

        {/* Ramp Chart preview */}
        <RampChart
          rampQ={rampQ}
          monthsIn={0}
          attainRate={attainRate}
          quota={quota}
        />
      </div>
    </div>
  );
}
