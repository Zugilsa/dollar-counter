'use client';

import { TeamSecondOrder } from '@/lib/types';
import { cascadeBreakdown, fmtM, fmt$ } from '@/lib/costs';

interface TeamBreakdownProps {
  so: TeamSecondOrder;
}

export default function TeamBreakdown({ so }: TeamBreakdownProps) {
  const cb = cascadeBreakdown(so);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#F0A500]" />
        <h4 className="text-[11px] font-semibold tracking-widest uppercase text-amber-700">
          Cascade Impact Model
        </h4>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {/* Row 1: Team drag */}
        <div className="flex items-center justify-between py-1.5 border-b border-amber-200/60">
          <div className="text-sm text-slate-600">
            Team drag{' '}
            <span className="text-amber-600 font-medium">
              ({so.teamSize} people x {fmt$(so.avgSalary)}/mo x{' '}
              {Math.round(so.dragPct * 100)}%)
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-800">
            {fmtM(cb.teamDrag)}
          </div>
        </div>

        {/* Row 2: Attrition risk */}
        <div className="flex items-center justify-between py-1.5 border-b border-amber-200/60">
          <div className="text-sm text-slate-600">
            Attrition risk{' '}
            <span className="text-amber-600 font-medium">
              ({Math.round(so.attrProb * 100)}% prob x {fmt$(so.replaceCost)} cost)
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-800">
            {fmtM(cb.attrRisk)}
          </div>
        </div>

        {/* Row 3: Total cascade */}
        <div className="flex items-center justify-between py-1.5">
          <div className="text-sm text-slate-600 font-medium">
            Total cascade
          </div>
          <div className="text-sm font-bold text-amber-700">
            {fmtM(cb.total)}
          </div>
        </div>
      </div>
    </div>
  );
}
