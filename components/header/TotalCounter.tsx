'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Decision } from '@/lib/types';
import { calcCosts } from '@/lib/costs';
import { useLiveCounter } from '@/hooks/useLiveCounter';
import FlipDisplay from '@/components/flip/FlipDisplay';

interface TotalCounterProps {
  decisions: Decision[];
}

function useElapsedSeconds(): number {
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = (now: number) => {
      setSeconds(Math.floor((now - startRef.current) / 1000));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return seconds;
}

function formatTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export default function TotalCounter({ decisions }: TotalCounterProps) {
  const totalMonthlyCost = useMemo(() => {
    return decisions.reduce((sum, d) => {
      const costs = calcCosts(d);
      return sum + costs.totalMonthly;
    }, 0);
  }, [decisions]);

  const weeklyBurn = totalMonthlyCost / 4.33;
  const liveValue = useLiveCounter(totalMonthlyCost);
  const elapsed = useElapsedSeconds();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Weekly burn */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Burn / Week
        </span>
        <FlipDisplay value={weeklyBurn} size="sm" />
      </div>

      {/* Main session counter */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          Cost This Session
        </span>
        <FlipDisplay value={liveValue} size="xl" />
      </div>

      {/* Live elapsed time */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Time is Money
        </span>
        <div
          className="inline-flex items-center tabular-nums text-sm font-semibold tracking-wider"
          style={{
            background: '#0D1F30',
            padding: '6px 14px',
            borderRadius: 7,
            border: '1px solid #1A3050',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
            color: '#5A8AAA',
          }}
        >
          {formatTime(elapsed)}
        </div>
      </div>
    </div>
  );
}
