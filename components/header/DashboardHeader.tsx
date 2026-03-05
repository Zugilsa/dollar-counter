'use client';

import React, { useMemo } from 'react';
import { Decision } from '@/lib/types';
import { calcCosts, getReclaimStatus, fmt$ } from '@/lib/costs';
import TotalCounter from './TotalCounter';

interface DashboardHeaderProps {
  decisions: Decision[];
}

interface StatCardData {
  label: string;
  value: string;
  color: string;
}

export default function DashboardHeader({ decisions }: DashboardHeaderProps) {
  // Aggregate cost breakdown across all decisions
  const { totalAccrued, monthlyBurn, directSum, oppSum, cascadeSum, overdueCount } =
    useMemo(() => {
      let totalAccrued = 0;
      let monthlyBurn = 0;
      let directSum = 0;
      let oppSum = 0;
      let cascadeSum = 0;
      let overdueCount = 0;

      for (const d of decisions) {
        const costs = calcCosts(d);
        totalAccrued += costs.accrued;
        monthlyBurn += costs.totalMonthly;
        directSum += costs.direct;
        oppSum += costs.opp;
        cascadeSum += costs.cascade;

        const status = getReclaimStatus(d);
        if (status?.status === 'overdue') {
          overdueCount++;
        }
      }

      return { totalAccrued, monthlyBurn, directSum, oppSum, cascadeSum, overdueCount };
    }, [decisions]);

  const stats: StatCardData[] = [
    { label: 'Total Accrued', value: fmt$(totalAccrued), color: totalAccrued < 0 ? '#2BAE66' : '#1DA1F2' },
    { label: 'Monthly Burn', value: fmt$(monthlyBurn), color: '#94A3B8' },
    { label: 'Layer 1 Direct', value: fmt$(directSum), color: '#64748B' },
    { label: 'Layer 2 Opportunity', value: fmt$(oppSum), color: '#2BAE66' },
    { label: 'Layer 3 Cascade', value: fmt$(cascadeSum), color: '#F0A500' },
  ];

  return (
    <header
      className="w-full"
      style={{ backgroundColor: '#0D1F30' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Row 1: Title + live dot + overdue badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Dollar Counter
            </h1>
            {/* Live indicator dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
          </div>

          {/* Overdue badge */}
          {overdueCount > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold
                         text-white rounded-full"
              style={{ backgroundColor: '#E0504A' }}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              {overdueCount} overdue
            </span>
          )}
        </div>

        {/* Row 2: Live session counter */}
        <div className="flex justify-center mb-6">
          <TotalCounter decisions={decisions} />
        </div>

        {/* Row 3: Stat cards — horizontally scrollable on mobile */}
        <div className="w-full overflow-x-auto scrollbar-hide -mx-1">
          <div className="flex items-stretch gap-3 px-1 min-w-max">
            {stats.map(({ label, value, color }) => (
              <div
                key={label}
                className="flex flex-col justify-center px-4 py-3 min-w-[140px]
                           sm:min-w-[150px] flex-1"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {label}
                </span>
                <span
                  className="text-lg sm:text-xl font-bold tabular-nums"
                  style={{ color }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
