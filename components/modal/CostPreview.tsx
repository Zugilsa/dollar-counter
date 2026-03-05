'use client';

import React from 'react';
import { DecisionType, SecondOrder, Decision } from '@/lib/types';
import { calcCosts, fmtM } from '@/lib/costs';

interface CostPreviewProps {
  monthlyCost: number;
  type: DecisionType;
  secondOrder: SecondOrder;
}

export default function CostPreview({
  monthlyCost,
  type,
  secondOrder,
}: CostPreviewProps) {
  // Build a temporary Decision object to use calcCosts
  const tempDecision: Decision = {
    id: '__preview__',
    type,
    title: '',
    monthlyCost,
    startDate: new Date().toISOString().split('T')[0],
    secondOrder,
    reclaim: { enabled: false, targetDate: '', resolvedDate: null },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const costs = calcCosts(tempDecision);

  // Don't render if there's nothing to show
  if (costs.totalMonthly <= 0) return null;

  const layers = [
    { label: 'Direct', value: costs.direct, color: '#1DA1F2' },
    { label: 'Opportunity', value: costs.opp, color: '#2BAE66' },
    { label: 'Cascade', value: costs.cascade, color: '#F0A500' },
  ].filter((l) => l.value > 0);

  // Calculate proportions for the bar
  const total = costs.totalMonthly;

  return (
    <div className="border-t border-[#E1EAF2] pt-4 mt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Cost Preview
        </span>
        <span className="text-sm font-bold text-slate-800 tabular-nums">
          Total: {fmtM(total)}
        </span>
      </div>

      {/* Stacked bar */}
      {layers.length > 1 && (
        <div className="flex h-2 rounded-full overflow-hidden mb-2">
          {layers.map((layer) => (
            <div
              key={layer.label}
              className="transition-all duration-300"
              style={{
                width: `${(layer.value / total) * 100}%`,
                backgroundColor: layer.color,
              }}
            />
          ))}
        </div>
      )}

      {/* Layer breakdown */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {layers.map((layer) => (
          <div key={layer.label} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: layer.color }}
            />
            <span className="text-[11px] text-slate-500">
              {layer.label}
            </span>
            <span className="text-[11px] font-semibold text-slate-700 tabular-nums">
              {fmtM(layer.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
