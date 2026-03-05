'use client';

import React from 'react';
import Field from '@/components/ui/Field';
import { fmt$ } from '@/lib/costs';
import { DelayEvent } from '@/lib/types';

interface Step3SprintProps {
  teamSize: number;
  avgSalary: number;
  expectedRevenue: number;
  originalTargetDate: string;
  delays: DelayEvent[];
  onChange: (field: string, value: unknown) => void;
}

const inputClass =
  'border border-[#E1EAF2] rounded-lg px-3 py-2 w-full focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2] outline-none text-sm text-slate-800 transition-colors';

export default function Step3Sprint({
  teamSize,
  avgSalary,
  expectedRevenue,
  originalTargetDate,
  delays,
  onChange,
}: Step3SprintProps) {
  const directMonthly = teamSize * avgSalary;
  const totalMonthly = directMonthly + expectedRevenue;
  const weeklyRate = totalMonthly / 4.33;
  const totalWeeks = delays.reduce((s, d) => s + d.weeksDelayed, 0);
  const accruedCost = totalWeeks * weeklyRate;

  const addDelay = () => {
    const newDelay: DelayEvent = {
      date: new Date().toISOString().split('T')[0],
      weeksDelayed: 1,
      reason: '',
    };
    onChange('sprintDelays', [...delays, newDelay]);
  };

  const updateDelay = (index: number, field: keyof DelayEvent, value: string | number) => {
    const updated = delays.map((d, i) =>
      i === index ? { ...d, [field]: value } : d
    );
    onChange('sprintDelays', updated);
  };

  const removeDelay = (index: number) => {
    onChange('sprintDelays', delays.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Sprint Delay Wizard</h3>
        <p className="text-sm text-slate-500 mt-1">
          Model the cost of delayed roadmap delivery including team and revenue impact.
        </p>
      </div>

      {/* Team Size */}
      <Field label="Team Size">
        <input
          type="number"
          min={1}
          max={50}
          value={teamSize || ''}
          onChange={(e) => onChange('sprintTeamSize', Number(e.target.value))}
          placeholder="5"
          className={`${inputClass} tabular-nums`}
        />
      </Field>

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
            onChange={(e) => onChange('sprintAvgSalary', Number(e.target.value))}
            placeholder="12000"
            className={`${inputClass} pl-7 tabular-nums`}
          />
        </div>
      </Field>

      {/* Expected Monthly Revenue Impact */}
      <Field label="Expected Monthly Revenue Impact" hint="GTM revenue delayed by not launching">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
            $
          </span>
          <input
            type="number"
            min={0}
            step={1000}
            value={expectedRevenue || ''}
            onChange={(e) => onChange('sprintExpectedRevenue', Number(e.target.value))}
            placeholder="50000"
            className={`${inputClass} pl-7 tabular-nums`}
          />
        </div>
      </Field>

      {/* Original Target Date */}
      <Field label="Original Target Date">
        <input
          type="date"
          value={originalTargetDate}
          onChange={(e) => onChange('sprintOriginalTargetDate', e.target.value)}
          className={inputClass}
        />
      </Field>

      {/* Delay Log */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Delay Log
          </span>
          <button
            type="button"
            onClick={addDelay}
            className="text-xs font-semibold text-[#1DA1F2] hover:text-[#0D8CE0] transition-colors"
          >
            + Add Delay
          </button>
        </div>

        {delays.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            No delays logged yet. Add delay events as they occur.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {delays.map((delay, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-3 rounded-lg border border-[#E1EAF2] bg-[#F8FAFC]"
              >
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={delay.date}
                    onChange={(e) => updateDelay(i, 'date', e.target.value)}
                    className={`${inputClass} text-xs`}
                  />
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={delay.weeksDelayed}
                    onChange={(e) =>
                      updateDelay(i, 'weeksDelayed', Number(e.target.value))
                    }
                    placeholder="Weeks"
                    className={`${inputClass} text-xs tabular-nums`}
                  />
                  <input
                    type="text"
                    value={delay.reason}
                    onChange={(e) => updateDelay(i, 'reason', e.target.value)}
                    placeholder="Reason"
                    className={`${inputClass} text-xs`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeDelay(i)}
                  className="text-slate-300 hover:text-red-500 transition-colors text-lg leading-none mt-1"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div className="bg-indigo-50 rounded-xl p-4 flex flex-col gap-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
          Sprint Cost Preview
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-indigo-600 font-medium">
              Team cost/mo
            </span>
            <span className="text-base font-bold text-indigo-800 tabular-nums">
              {fmt$(directMonthly)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-indigo-600 font-medium">
              Revenue delay/mo
            </span>
            <span className="text-base font-bold text-indigo-800 tabular-nums">
              {fmt$(expectedRevenue)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-indigo-600 font-medium">
              Total weeks delayed
            </span>
            <span className="text-base font-bold text-indigo-800 tabular-nums">
              {totalWeeks}w
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-indigo-600 font-medium">
              Accrued cost
            </span>
            <span className="text-base font-bold text-indigo-800 tabular-nums">
              {fmt$(accruedCost)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
