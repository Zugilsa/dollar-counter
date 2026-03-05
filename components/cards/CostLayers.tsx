'use client';

import { CostBreakdown, Decision } from '@/lib/types';
import { fmtM } from '@/lib/costs';

interface CostLayersProps {
  costs: CostBreakdown;
  decision: Decision;
}

const LAYERS = [
  {
    key: 'direct' as const,
    label: 'Layer 1',
    name: 'Direct',
    desc: 'Base monthly cost of delay',
    color: '#64748B',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
  {
    key: 'opp' as const,
    label: 'Layer 2',
    name: 'Opportunity',
    desc: 'Lost revenue at current ramp',
    color: '#2BAE66',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    key: 'cascade' as const,
    label: 'Layer 3',
    name: 'Cascade',
    desc: 'Team drag + attrition risk',
    color: '#F0A500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
] as const;

export default function CostLayers({ costs, decision }: CostLayersProps) {
  const so = decision.secondOrder;
  const isRevenue = so?.type === 'revenue_role';
  const isTeamDrag = so?.type === 'team_blocker';
  const isSprint = so?.type === 'sprint_delay';
  const isMeeting = so?.type === 'meeting_waste';
  const isEngTime = so?.type === 'eng_time';

  // Filter layers based on decision type
  const visibleLayers = LAYERS.filter((layer) => {
    // Meeting waste and eng time only show direct (savings)
    if (isMeeting || isEngTime) return layer.key === 'direct';
    if (layer.key === 'opp') return isRevenue || isSprint;
    if (layer.key === 'cascade') return isTeamDrag;
    return true;
  });

  return (
    <div className="rounded-lg border border-[#E1EAF2] bg-[#F8FAFC] p-2 sm:p-4 overflow-x-auto">
      <div
        className="grid gap-0 min-w-[400px] sm:min-w-0"
        style={{
          gridTemplateColumns: `repeat(${visibleLayers.length}, 1fr) auto`,
        }}
      >
        {visibleLayers.map((layer, i) => {
          const value = costs[layer.key];
          const isNegative = value < 0;
          const displayColor = isNegative ? '#2BAE66' : layer.color;
          return (
            <div
              key={layer.key}
              className={`px-2 sm:px-4 py-3 ${
                i < visibleLayers.length - 1
                  ? 'border-r border-[#E1EAF2]'
                  : ''
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: displayColor }}
                />
                <span className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
                  {layer.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {isNegative ? 'Savings' : layer.name}
              </p>
              <p className="text-lg font-bold mt-0.5" style={{ color: displayColor }}>
                {fmtM(value)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                {isNegative ? 'Monthly savings (green)' : layer.desc}
              </p>
              {layer.key === 'opp' && isRevenue && so?.type === 'revenue_role' && (
                <p className="text-[10px] text-emerald-500 mt-1">
                  Ramp: {so.rampQ}Q schedule
                </p>
              )}
              {layer.key === 'opp' && isSprint && (
                <p className="text-[10px] text-emerald-500 mt-1">
                  Revenue Delay
                </p>
              )}
              {layer.key === 'cascade' && isTeamDrag && (
                <p className="text-[10px] text-amber-500 mt-1">
                  Team blocker effect
                </p>
              )}
            </div>
          );
        })}

        {/* Total column */}
        <div className={`px-4 py-3 border-l-2 rounded-r-lg min-w-[120px] ${
          costs.totalMonthly < 0
            ? 'border-emerald-500 bg-emerald-50/50'
            : 'border-[#0D1F30] bg-[#0D1F30]/[0.03]'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-2 h-2 rounded-full ${costs.totalMonthly < 0 ? 'bg-emerald-500' : 'bg-[#0D1F30]'}`} />
            <span className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
              Total
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {costs.totalMonthly < 0 ? 'Net Savings' : 'All Layers'}
          </p>
          <p className={`text-lg font-bold mt-0.5 ${costs.totalMonthly < 0 ? 'text-emerald-600' : 'text-[#0D1F30]'}`}>
            {fmtM(costs.totalMonthly)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 leading-tight">
            {costs.totalMonthly < 0 ? 'Monthly savings' : 'Combined monthly burn'}
          </p>
        </div>
      </div>
    </div>
  );
}
