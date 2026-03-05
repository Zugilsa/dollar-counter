'use client';

import { useState, useEffect, useRef } from 'react';
import { msRate } from '@/lib/costs';

export function useLiveCounter(monthlyCost: number): number {
  const [value, setValue] = useState(0);
  const startRef = useRef(performance.now());
  const rafRef   = useRef<number>(0);
  const rateRef  = useRef(msRate(monthlyCost));

  // Update rate when monthlyCost changes without resetting the session start time
  useEffect(() => {
    rateRef.current = msRate(monthlyCost);
  }, [monthlyCost]);

  // RAF loop — runs once on mount, cleans up on unmount
  useEffect(() => {
    const tick = (now: number) => {
      setValue((now - startRef.current) * rateRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return value;
}
