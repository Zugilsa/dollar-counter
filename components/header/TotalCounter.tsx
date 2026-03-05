'use client';

import React, { useMemo } from 'react';
import { Decision } from '@/lib/types';
import { calcCosts } from '@/lib/costs';
import { useLiveCounter } from '@/hooks/useLiveCounter';
import FlipDisplay from '@/components/flip/FlipDisplay';

interface TotalCounterProps {
  decisions: Decision[];
}

export default function TotalCounter({ decisions }: TotalCounterProps) {
  // Sum up all three layers of monthly cost across every decision
  const totalMonthlyCost = useMemo(() => {
    return decisions.reduce((sum, d) => {
      const costs = calcCosts(d);
      return sum + costs.totalMonthly;
    }, 0);
  }, [decisions]);

  // Live ticking value representing cost accrued since page was opened
  const liveValue = useLiveCounter(totalMonthlyCost);

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
        Cost This Session
      </span>
      <FlipDisplay value={liveValue} size="xl" />
    </div>
  );
}
