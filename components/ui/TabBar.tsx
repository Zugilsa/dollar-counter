'use client';

import React from 'react';
import { DecisionType, TYPES } from '@/lib/types';

interface TabBarProps {
  active: string;
  onChange: (t: string) => void;
  counts: Record<string, number>;
}

const allTypes = Object.keys(TYPES) as DecisionType[];

export default function TabBar({ active, onChange, counts }: TabBarProps) {
  const tabs: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    ...allTypes.map((t) => ({ key: t, label: TYPES[t].label })),
  ];

  return (
    <div className="w-full overflow-x-auto scrollbar-hide -mx-1">
      <div className="flex items-center gap-2 px-1 py-1 min-w-max">
        {tabs.map(({ key, label }) => {
          const isActive = active === key;
          const count = counts[key] ?? 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5
                text-sm font-medium whitespace-nowrap
                transition-all duration-150 ease-in-out
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[#1DA1F2] focus-visible:ring-offset-1
                ${
                  isActive
                    ? 'bg-[#1DA1F2] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-[#E1EAF2]'
                }
              `}
              style={{ borderRadius: 9 }}
            >
              <span>{label}</span>
              <span
                className={`
                  inline-flex items-center justify-center
                  min-w-[20px] h-5 px-1.5 text-xs font-semibold
                  rounded-full tabular-nums
                  ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }
                `}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
