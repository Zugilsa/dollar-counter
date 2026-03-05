'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Decision } from '@/lib/types';
import { calcCosts, dayRate } from '@/lib/costs';
import { useLiveCounter } from '@/hooks/useLiveCounter';
import FlipDisplay from '@/components/flip/FlipDisplay';

interface TotalCounterProps {
  decisions: Decision[];
}

// ── Burn/Week: $250k fixed, resets every Friday 5pm ──────
const WEEKLY_BURN = 250_000;
const MS_PER_WEEK = 7 * 24 * 3600 * 1000;

function msSinceLastFriday5pm(): number {
  const now = new Date();
  const day = now.getDay(); // 0=Sun..6=Sat
  // Friday = 5. Calculate days since last Friday
  const daysSinceFri = (day + 2) % 7; // Fri=0, Sat=1, Sun=2, Mon=3...
  const lastFri = new Date(now);
  lastFri.setDate(now.getDate() - daysSinceFri);
  lastFri.setHours(17, 0, 0, 0); // 5pm
  let diff = now.getTime() - lastFri.getTime();
  if (diff < 0) diff += MS_PER_WEEK; // shouldn't happen but guard
  return diff;
}

function useBurnCounter(): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const ratePerMs = WEEKLY_BURN / MS_PER_WEEK;
  const offsetRef = useRef(msSinceLastFriday5pm());

  useEffect(() => {
    const sessionStart = performance.now();
    const tick = (now: number) => {
      const elapsed = now - sessionStart;
      setValue((offsetRef.current + elapsed) * ratePerMs);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ratePerMs]);

  return value;
}

// ── Elapsed session time ─────────────────────────────────
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

// ── Year-to-date helpers ─────────────────────────────────
function daysThisYear(startDate: string): number {
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  const effectiveStart = startDate > yearStart ? startDate : yearStart;
  const ms = new Date(today).getTime() - new Date(effectiveStart).getTime();
  return Math.max(0, ms / 86400000);
}

export default function TotalCounter({ decisions }: TotalCounterProps) {
  // Split monthly rates into cost vs savings
  const { costMonthly, savingsMonthly, costYTD, savingsYTD } = useMemo(() => {
    let costMonthly = 0;
    let savingsMonthly = 0;
    let costYTD = 0;
    let savingsYTD = 0;

    for (const d of decisions) {
      const costs = calcCosts(d);
      const days = daysThisYear(d.startDate);
      const dr = dayRate(costs.totalMonthly);

      if (costs.totalMonthly >= 0) {
        costMonthly += costs.totalMonthly;
        costYTD += days * dr;
      } else {
        savingsMonthly += costs.totalMonthly; // negative
        savingsYTD += days * dr; // negative
      }
    }

    return { costMonthly, savingsMonthly, costYTD, savingsYTD };
  }, [decisions]);

  const burnValue = useBurnCounter();
  const costLive = useLiveCounter(costMonthly);
  const savingsLive = useLiveCounter(savingsMonthly);
  const elapsed = useElapsedSeconds();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Burn / Week — fixed $250k, resets Fri 5pm */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Burn / Week
        </span>
        <FlipDisplay value={burnValue} size="sm" />
      </div>

      {/* Cost This Year + Savings This Year — side by side */}
      <div className="flex items-start gap-6 flex-wrap justify-center">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Cost This Year
          </span>
          <FlipDisplay value={costYTD + costLive} size="xl" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-500">
            Savings This Year
          </span>
          <FlipDisplay value={savingsYTD + savingsLive} size="xl" />
        </div>
      </div>

      {/* Time is Money — session elapsed */}
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
