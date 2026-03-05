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

  // Filter layers based on decision type
  const visibleLayers = LAYERS.filter((layer) => {
    if (layer.key === 'opp') return isRevenue || isSprint;
    if (layer.key === 'cascade') return isTeamDrag;
    return true;
  });

  return (
    <div className="rounded-lg border border-[#E1EAF2] bg-[#F8FAFC] p-4">
      <div
        className="grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${visibleLayers.length}, 1fr) auto`,
        }}
      >
        {visibleLayers.map((layer, i) => {
          const value = costs[layer.key];
          return (
            <div
              key={layer.key}
              className={`px-4 py-3 ${
                i < visibleLayers.length - 1
                  ? 'border-r border-[#E1EAF2]'
                  : ''
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
                  {layer.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {layer.name}
              </p>
              <p className="text-lg font-bold mt-0.5" style={{ color: layer.color }}>
                {fmtM(value)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                {layer.desc}
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
        <div className="px-4 py-3 border-l-2 border-[#0D1F30] bg-[#0D1F30]/[0.03] rounded-r-lg min-w-[120px]">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#0D1F30]" />
            <span className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
              Total
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800">All Layers</p>
          <p className="text-lg font-bold mt-0.5 text-[#0D1F30]">
            {fmtM(costs.totalMonthly)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 leading-tight">
            Combined monthly burn
          </p>
        </div>
      </div>
    </div>
  );
}
