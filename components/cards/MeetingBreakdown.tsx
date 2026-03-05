'use client';

import React from 'react';
import { MeetingSecondOrder } from '@/lib/types';
import { fmt$ } from '@/lib/costs';

interface MeetingBreakdownProps {
  so: MeetingSecondOrder;
}

export default function MeetingBreakdown({ so }: MeetingBreakdownProps) {
  const minutesSaved = so.originalMinutes - so.optimizedMinutes;
  const totalHourlyCost = so.attendees.reduce(
    (s, a) => s + a.hourlyCost * a.count,
    0
  );
  const savingsPerMeeting = (minutesSaved / 60) * totalHourlyCost;
  const weeklySavings = savingsPerMeeting * so.frequencyPerWeek;
  const monthlySavings = weeklySavings * 4.33;
  const annualSavings = monthlySavings * 12;

  const isEliminated = so.optimizedMinutes === 0;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Meeting Savings
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-600 tabular-nums">
            {so.originalMinutes} min →{' '}
            {isEliminated ? 'Eliminated' : `${so.optimizedMinutes} min`}
          </span>
          <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full">
            {so.frequencyPerWeek}×/wk
          </span>
        </div>
      </div>

      {/* Attendee chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {so.attendees.map((a) => (
          <span
            key={a.role}
            className="text-[11px] font-medium bg-white/70 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200"
          >
            {a.role}
            {a.count > 1 && ` ×${a.count}`}
          </span>
        ))}
      </div>

      {/* Savings grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-emerald-500 font-medium">
            Per meeting
          </span>
          <span className="text-sm font-bold text-emerald-800 tabular-nums">
            {fmt$(savingsPerMeeting)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-emerald-500 font-medium">
            Weekly
          </span>
          <span className="text-sm font-bold text-emerald-800 tabular-nums">
            {fmt$(weeklySavings)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-emerald-500 font-medium">
            Monthly
          </span>
          <span className="text-sm font-bold text-emerald-700 tabular-nums">
            {fmt$(monthlySavings)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-emerald-500 font-medium">
            Annual
          </span>
          <span className="text-sm font-bold text-emerald-700 tabular-nums">
            {fmt$(annualSavings)}
          </span>
        </div>
      </div>
    </div>
  );
}
