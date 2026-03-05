'use client';

import React from 'react';
import Field from '@/components/ui/Field';
import SliderField from '@/components/ui/SliderField';
import { fmt$ } from '@/lib/costs';

interface Step3EngTimeProps {
  engineerCount: number;
  avgMonthlyCost: number;
  currentCodingPct: number;
  targetCodingPct: number;
  onChange: (field: string, value: number) => void;
}

const inputClass =
  'border border-[#E1EAF2] rounded-lg px-3 py-2 w-full focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2] outline-none text-sm text-slate-800 transition-colors';

export default function Step3EngTime({
  engineerCount,
  avgMonthlyCost,
  currentCodingPct,
  targetCodingPct,
  onChange,
}: Step3EngTimeProps) {
  const totalTeamCost = engineerCount * avgMonthlyCost;
  const currentNonCoding = 1 - currentCodingPct;
  const targetNonCoding = 1 - targetCodingPct;
  const wastedPct = currentNonCoding - targetNonCoding;
  const monthlySavings = totalTeamCost * wastedPct;
  const annualSavings = monthlySavings * 12;

  const currentCodingHrs = (currentCodingPct * 8).toFixed(1);
  const targetCodingHrs = (targetCodingPct * 8).toFixed(1);
  const currentPmHrs = ((1 - currentCodingPct) * 8).toFixed(1);
  const targetPmHrs = ((1 - targetCodingPct) * 8).toFixed(1);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Eng Time Allocation</h3>
        <p className="text-sm text-slate-500 mt-1">
          Model time spent coding vs. planning/managing/coordinating.
        </p>
      </div>

      {/* Engineer Count */}
      <Field label="Engineers">
        <input
          type="number"
          min={1}
          value={engineerCount || ''}
          onChange={(e) => onChange('engEngineerCount', Number(e.target.value))}
          placeholder="53"
          className={`${inputClass} tabular-nums`}
        />
      </Field>

      {/* Avg Monthly Cost */}
      <Field label="Avg Monthly Cost per Engineer ($)">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
            $
          </span>
          <input
            type="number"
            min={0}
            step={500}
            value={avgMonthlyCost || ''}
            onChange={(e) => onChange('engAvgMonthlyCost', Number(e.target.value))}
            placeholder="15000"
            className={`${inputClass} pl-7 tabular-nums`}
          />
        </div>
      </Field>

      {/* Current Coding % */}
      <SliderField
        label="Current Time in Code (Baseline)"
        value={Math.round(currentCodingPct * 100)}
        min={10}
        max={90}
        step={5}
        onChange={(v) => onChange('engCurrentCodingPct', v / 100)}
        format={(v) => `${v}%`}
      />

      {/* Target Coding % */}
      <SliderField
        label="Target Time in Code"
        value={Math.round(targetCodingPct * 100)}
        min={Math.round(currentCodingPct * 100) + 5}
        max={95}
        step={5}
        onChange={(v) => onChange('engTargetCodingPct', v / 100)}
        format={(v) => `${v}%`}
      />

      {/* Live Preview */}
      <div className="bg-cyan-50 rounded-xl p-4 flex flex-col gap-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-700">
          Time Allocation Preview
        </h4>

        {/* Before/After bars */}
        <div className="flex flex-col gap-2">
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-cyan-600 font-medium">Today ({Math.round(currentCodingPct * 100)}% code)</span>
              <span className="text-slate-400">{currentCodingHrs}h code / {currentPmHrs}h PM per day</span>
            </div>
            <div className="h-3 rounded-full bg-slate-200 overflow-hidden flex">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${currentCodingPct * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-cyan-600 font-medium">Target ({Math.round(targetCodingPct * 100)}% code)</span>
              <span className="text-slate-400">{targetCodingHrs}h code / {targetPmHrs}h PM per day</span>
            </div>
            <div className="h-3 rounded-full bg-slate-200 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${targetCodingPct * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Savings */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-cyan-200">
          <div className="flex flex-col">
            <span className="text-[11px] text-cyan-600 font-medium">
              Team cost/mo
            </span>
            <span className="text-base font-bold text-cyan-800 tabular-nums">
              {fmt$(totalTeamCost)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-emerald-600 font-medium">
              Monthly savings
            </span>
            <span className="text-base font-bold text-emerald-800 tabular-nums">
              {fmt$(monthlySavings)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-emerald-600 font-medium">
              Annual savings
            </span>
            <span className="text-base font-bold text-emerald-800 tabular-nums">
              {fmt$(annualSavings)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
