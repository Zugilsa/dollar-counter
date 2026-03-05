'use client';

import React from 'react';
import { SprintSecondOrder } from '@/lib/types';
import { fmt$ } from '@/lib/costs';

interface SprintBreakdownProps {
  so: SprintSecondOrder;
}

export default function SprintBreakdown({ so }: SprintBreakdownProps) {
  const totalWeeks = so.delays.reduce((s, d) => s + d.weeksDelayed, 0);
  const totalMonthly = so.teamSize * so.avgSalary + so.expectedRevenue;
  const weeklyRate = totalMonthly / 4.33;

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
          Delay Log
        </h4>
        <span className="text-xs font-semibold text-indigo-600 tabular-nums">
          {totalWeeks}w total &middot; {fmt$(weeklyRate)}/wk
        </span>
      </div>

      {so.delays.length === 0 ? (
        <p className="text-xs text-indigo-400">No delay events logged.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {so.delays.map((delay, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-xs py-1.5 px-2 rounded bg-white/60"
            >
              <span className="text-indigo-500 font-medium tabular-nums shrink-0">
                {delay.date}
              </span>
              <span className="font-bold text-indigo-800 tabular-nums shrink-0">
                +{delay.weeksDelayed}w
              </span>
              <span className="text-slate-500 truncate flex-1">
                {delay.reason || '—'}
              </span>
              <span className="text-indigo-600 font-semibold tabular-nums shrink-0">
                {fmt$(delay.weeksDelayed * weeklyRate)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Target date info */}
      <div className="mt-3 pt-3 border-t border-indigo-200 flex items-center justify-between text-xs">
        <span className="text-indigo-600">
          Original target: <span className="font-semibold">{so.originalTargetDate}</span>
        </span>
        {so.deliveredDate && (
          <span className="text-emerald-600 font-semibold">
            Delivered: {so.deliveredDate}
          </span>
        )}
      </div>
    </div>
  );
}
