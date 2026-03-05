'use client';

import React from 'react';
import { EngTimeSecondOrder } from '@/lib/types';
import { fmt$ } from '@/lib/costs';

interface EngTimeBreakdownProps {
  so: EngTimeSecondOrder;
}

export default function EngTimeBreakdown({ so }: EngTimeBreakdownProps) {
  const totalTeamCost = so.engineerCount * so.avgMonthlyCost;
  const currentNonCoding = 1 - so.currentCodingPct;
  const targetNonCoding = 1 - so.targetCodingPct;
  const wastedPct = currentNonCoding - targetNonCoding;
  const monthlySavings = totalTeamCost * wastedPct;
  const annualSavings = monthlySavings * 12;

  const currentPctDisplay = Math.round(so.currentCodingPct * 100);
  const targetPctDisplay = Math.round(so.targetCodingPct * 100);

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-700">
          Eng Time Allocation
        </h4>
        <span className="text-xs font-semibold text-cyan-600 tabular-nums">
          {so.engineerCount} engineers
        </span>
      </div>

      {/* Before/After bars */}
      <div className="flex flex-col gap-2 mb-3">
        <div>
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-cyan-600 font-medium">
              Today: {currentPctDisplay}% code / {100 - currentPctDisplay}% PM
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden flex">
            <div
              className="h-full bg-cyan-400 transition-all rounded-full"
              style={{ width: `${currentPctDisplay}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-emerald-600 font-medium">
              Target: {targetPctDisplay}% code / {100 - targetPctDisplay}% PM
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all rounded-full"
              style={{ width: `${targetPctDisplay}%` }}
            />
          </div>
        </div>
      </div>

      {/* Savings */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-200">
        <div className="flex flex-col">
          <span className="text-[10px] text-cyan-500 font-medium">
            Team cost/mo
          </span>
          <span className="text-sm font-bold text-cyan-800 tabular-nums">
            {fmt$(totalTeamCost)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-emerald-500 font-medium">
            Monthly savings
          </span>
          <span className="text-sm font-bold text-emerald-700 tabular-nums">
            {fmt$(monthlySavings)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-emerald-500 font-medium">
            Annual savings
          </span>
          <span className="text-sm font-bold text-emerald-700 tabular-nums">
            {fmt$(annualSavings)}
          </span>
        </div>
      </div>
    </div>
  );
}
