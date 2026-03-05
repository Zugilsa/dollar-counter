'use client';

import { RevenueSecondOrder } from '@/lib/types';
import { revenueProjection, rampPct, fmt$ } from '@/lib/costs';
import RampChart from './RampChart';

interface RevenueBreakdownProps {
  so: RevenueSecondOrder;
  monthsIn: number;
}

export default function RevenueBreakdown({ so, monthsIn }: RevenueBreakdownProps) {
  const proj = revenueProjection(so);
  const currentRamp = rampPct(monthsIn, so.rampQ);
  const monthlyAtRamp = proj.fullMonthly * currentRamp;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#2BAE66]" />
        <h4 className="text-[11px] font-semibold tracking-widest uppercase text-emerald-700">
          Revenue Impact Model
        </h4>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {/* Row 1: Quota x attainment */}
        <div className="flex items-center justify-between py-1.5 border-b border-emerald-200/60">
          <div className="text-sm text-slate-600">
            Quota{' '}
            <span className="text-slate-400">x</span>{' '}
            attainment{' '}
            <span className="text-emerald-600 font-medium">
              ({Math.round(so.attainRate * 100)}%)
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-800">
            {fmt$(proj.annualExpected)}/yr
          </div>
        </div>

        {/* Row 2: Current ramp */}
        <div className="flex items-center justify-between py-1.5 border-b border-emerald-200/60">
          <div className="text-sm text-slate-600">
            Current ramp{' '}
            <span className="text-emerald-600 font-medium">
              ({Math.round(currentRamp * 100)}%)
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-800">
            {fmt$(monthlyAtRamp)}/mo
          </div>
        </div>

        {/* Row 3: Year-1 projection */}
        <div className="flex items-center justify-between py-1.5">
          <div className="text-sm text-slate-600">
            Year-1 projection{' '}
            <span className="text-emerald-600 font-medium">
              ({so.rampQ}Q ramp)
            </span>
          </div>
          <div className="text-sm font-bold text-emerald-700">
            {fmt$(proj.year1)}
          </div>
        </div>
      </div>

      {/* Ramp Chart */}
      <RampChart
        rampQ={so.rampQ}
        monthsIn={monthsIn}
        attainRate={so.attainRate}
        quota={so.quota}
      />
    </div>
  );
}
