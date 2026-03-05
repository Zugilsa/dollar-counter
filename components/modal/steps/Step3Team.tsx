'use client';

import React from 'react';
import Field from '@/components/ui/Field';
import SliderField from '@/components/ui/SliderField';
import { fmt$ } from '@/lib/costs';

interface Step3TeamProps {
  teamSize: number;
  avgSalary: number;
  dragPct: number;
  attrProb: number;
  replaceCost: number;
  onChange: (field: string, value: number) => void;
}

const inputClass =
  'border border-[#E1EAF2] rounded-lg px-3 py-2 w-full focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2] outline-none text-sm text-slate-800 transition-colors';

export default function Step3Team({
  teamSize,
  avgSalary,
  dragPct,
  attrProb,
  replaceCost,
  onChange,
}: Step3TeamProps) {
  // Live calculations
  const teamDragMonthly = teamSize * avgSalary * dragPct;
  const attrRiskMonthly = (attrProb * replaceCost) / 12;
  const totalCascade = teamDragMonthly + attrRiskMonthly;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Team Drag Wizard</h3>
        <p className="text-sm text-slate-500 mt-1">
          Model the cascade effect of team friction and attrition risk.
        </p>
      </div>

      {/* Team Size */}
      <SliderField
        label="Team Size Affected"
        value={teamSize}
        min={1}
        max={20}
        step={1}
        onChange={(v) => onChange('teamSize', v)}
      />

      {/* Avg Monthly Salary */}
      <Field label="Avg Monthly Salary (Fully Loaded)">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
            $
          </span>
          <input
            type="number"
            min={0}
            step={500}
            value={avgSalary || ''}
            onChange={(e) => onChange('avgSalary', Number(e.target.value))}
            placeholder="12000"
            className={`${inputClass} pl-7 tabular-nums`}
          />
        </div>
      </Field>

      {/* Productivity Drag */}
      <SliderField
        label="Productivity Drag %"
        value={Math.round(dragPct * 100)}
        min={5}
        max={60}
        step={5}
        onChange={(v) => onChange('dragPct', v / 100)}
        format={(v) => `${v}%`}
      />

      {/* Attrition Probability */}
      <SliderField
        label="Attrition Probability 12mo"
        value={Math.round(attrProb * 100)}
        min={5}
        max={80}
        step={5}
        onChange={(v) => onChange('attrProb', v / 100)}
        format={(v) => `${v}%`}
      />

      {/* Replacement Cost */}
      <Field label="Replacement Cost Per Person">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
            $
          </span>
          <input
            type="number"
            min={0}
            step={5000}
            value={replaceCost || ''}
            onChange={(e) => onChange('replaceCost', Number(e.target.value))}
            placeholder="50000"
            className={`${inputClass} pl-7 tabular-nums`}
          />
        </div>
      </Field>

      {/* Live Preview */}
      <div className="bg-amber-50 rounded-xl p-4 flex flex-col gap-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700">
          Cascade Preview
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-amber-600 font-medium">
              Team drag/mo
            </span>
            <span className="text-base font-bold text-amber-800 tabular-nums">
              {fmt$(teamDragMonthly)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-amber-600 font-medium">
              Attrition risk/mo
            </span>
            <span className="text-base font-bold text-amber-800 tabular-nums">
              {fmt$(attrRiskMonthly)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-amber-600 font-medium">
              Total cascade/mo
            </span>
            <span className="text-base font-bold text-amber-800 tabular-nums">
              {fmt$(totalCascade)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
