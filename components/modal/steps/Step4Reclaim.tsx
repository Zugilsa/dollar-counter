'use client';

import React from 'react';
import Field from '@/components/ui/Field';
import Toggle from '@/components/ui/Toggle';
import { dayRate, daysApart, fmt$ } from '@/lib/costs';

interface Step4ReclaimProps {
  enabled: boolean;
  targetDate: string;
  onChange: (field: string, value: string | boolean) => void;
  totalMonthly: number;
  startDate: string;
}

const inputClass =
  'border border-[#E1EAF2] rounded-lg px-3 py-2 w-full focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2] outline-none text-sm text-slate-800 transition-colors';

export default function Step4Reclaim({
  enabled,
  targetDate,
  onChange,
  totalMonthly,
  startDate,
}: Step4ReclaimProps) {
  const today = new Date().toISOString().split('T')[0];
  const dr = dayRate(totalMonthly);

  // Days until target resolution
  const daysLeft = targetDate ? daysApart(today, targetDate) : 0;

  // Savings if resolved today: days remaining * daily rate
  const savingsIfResolvedToday = daysLeft * dr;

  // Amount already burned since start date
  const daysSinceStart = startDate ? daysApart(startDate, today) : 0;
  const alreadyBurned = daysSinceStart * dr;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Reclaim Target</h3>
        <p className="text-sm text-slate-500 mt-1">
          Set a resolution deadline to track cost recovery.
        </p>
      </div>

      {/* Toggle */}
      <Toggle
        label="Enable RECLAIM tracking"
        checked={enabled}
        onChange={(v) => onChange('reclaimEnabled', v)}
      />

      {/* Reclaim fields (only shown when enabled) */}
      {enabled && (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Target Date */}
          <Field label="Target Resolution Date">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => onChange('reclaimTargetDate', e.target.value)}
              min={today}
              className={inputClass}
            />
          </Field>

          {/* Preview panel */}
          {targetDate && totalMonthly > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Reclaim Preview
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <span className="text-[11px] text-blue-600 font-medium">
                    Days left
                  </span>
                  <span className="text-base font-bold text-blue-800 tabular-nums">
                    {Math.round(daysLeft)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] text-blue-600 font-medium">
                    Savings if resolved today
                  </span>
                  <span className="text-base font-bold text-emerald-700 tabular-nums">
                    {fmt$(savingsIfResolvedToday)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] text-blue-600 font-medium">
                    Already burned
                  </span>
                  <span className="text-base font-bold text-red-600 tabular-nums">
                    {fmt$(alreadyBurned)}
                  </span>
                </div>
              </div>

              {/* Visual bar showing burn vs savings */}
              {(alreadyBurned + savingsIfResolvedToday) > 0 && (
                <div className="mt-1">
                  <div className="flex h-2 rounded-full overflow-hidden bg-slate-200">
                    <div
                      className="bg-red-400 transition-all duration-300"
                      style={{
                        width: `${
                          (alreadyBurned /
                            (alreadyBurned + savingsIfResolvedToday)) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className="bg-emerald-400 transition-all duration-300"
                      style={{
                        width: `${
                          (savingsIfResolvedToday /
                            (alreadyBurned + savingsIfResolvedToday)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-red-500">Burned</span>
                    <span className="text-[10px] text-emerald-500">Saveable</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
