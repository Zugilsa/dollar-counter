'use client';

import { Decision, TYPES } from '@/lib/types';
import { calcCosts, daysApart, hourRate, dayRate, fmt$, isResolved } from '@/lib/costs';
import { useLiveCounter } from '@/hooks/useLiveCounter';
import FlipDisplay from '@/components/flip/FlipDisplay';
import CostLayers from './CostLayers';
import RevenueBreakdown from './RevenueBreakdown';
import TeamBreakdown from './TeamBreakdown';
import SprintBreakdown from './SprintBreakdown';
import MeetingBreakdown from './MeetingBreakdown';
import EngTimeBreakdown from './EngTimeBreakdown';
import DeliveryPanel from './DeliveryPanel';
import ReclaimPanel from './ReclaimPanel';

interface DecisionCardProps {
  decision: Decision;
  onDelete: (id: string) => void;
  onResolve: (id: string) => void;
  onDeliver?: (id: string) => void;
}

export default function DecisionCard({
  decision,
  onDelete,
  onResolve,
  onDeliver,
}: DecisionCardProps) {
  const costs = calcCosts(decision);
  const liveValue = useLiveCounter(costs.totalMonthly);
  const typeMeta = TYPES[decision.type];

  const today = new Date().toISOString().split('T')[0];
  const delayDays = Math.round(daysApart(decision.startDate, today));
  const monthsIn = delayDays / 30;
  const perHour = hourRate(costs.totalMonthly);
  const perDay = dayRate(costs.totalMonthly);

  const so = decision.secondOrder;
  const resolved = isResolved(decision);
  const isSavings = costs.totalMonthly < 0 || (resolved && costs.accrued < 0);

  return (
    <div
      className={`group bg-white border rounded-[14px] shadow-sm
        hover:shadow-md transition-shadow duration-200 overflow-hidden
        ${resolved ? 'border-emerald-200' : 'border-[#E1EAF2]'}`}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Type badge */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-base font-bold"
            style={{ backgroundColor: typeMeta.color }}
            title={typeMeta.label}
          >
            {typeMeta.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[10px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded"
                style={{
                  color: typeMeta.color,
                  backgroundColor: `${typeMeta.color}14`,
                }}
              >
                {typeMeta.label}
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-800 truncate">
              {decision.title}
            </h3>
            {decision.note && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                {decision.note}
              </p>
            )}
          </div>
        </div>

        {/* Delete button — always visible on mobile, hover-reveal on desktop */}
        <button
          onClick={() => onDelete(decision.id)}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
            text-slate-300 hover:text-red-500 hover:bg-red-50
            transition-colors duration-150 sm:opacity-0 sm:group-hover:opacity-100"
          title="Delete decision"
        >
          <span className="text-lg leading-none">&times;</span>
        </button>
      </div>

      {/* ── Cost Layers ────────────────────────────────────── */}
      <div className="px-5 pb-3">
        <CostLayers costs={costs} decision={decision} />
      </div>

      {/* ── Second Order Detail (conditional) ──────────────── */}
      {so?.type === 'revenue_role' && (
        <div className="px-5 pb-3">
          <RevenueBreakdown so={so} monthsIn={monthsIn} />
        </div>
      )}
      {so?.type === 'team_blocker' && (
        <div className="px-5 pb-3">
          <TeamBreakdown so={so} />
        </div>
      )}
      {so?.type === 'sprint_delay' && (
        <div className="px-5 pb-3">
          <SprintBreakdown so={so} />
        </div>
      )}
      {so?.type === 'meeting_waste' && (
        <div className="px-5 pb-3">
          <MeetingBreakdown so={so} />
        </div>
      )}
      {so?.type === 'eng_time' && (
        <div className="px-5 pb-3">
          <EngTimeBreakdown so={so} />
        </div>
      )}

      {/* ── Stats Row ──────────────────────────────────────── */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="font-medium text-slate-600">{delayDays}d</span>{' '}
            {isSavings ? 'tracked' : 'delayed'}
          </span>
          <span className="text-slate-200">&middot;</span>
          <span className="flex items-center gap-1">
            <span className={`font-medium ${isSavings ? 'text-emerald-600' : 'text-slate-600'}`}>{fmt$(perHour)}</span>
            /hr
          </span>
          <span className="text-slate-200">&middot;</span>
          <span className="flex items-center gap-1">
            <span className={`font-medium ${isSavings ? 'text-emerald-600' : 'text-slate-600'}`}>{fmt$(perDay)}</span>
            /day
          </span>
        </div>
      </div>

      {/* ── Live Session Counter ───────────────────────────── */}
      {!resolved && (
        <div className="mx-5 mb-3 rounded-lg bg-[#0D1F30] p-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
            This session
          </span>
          <FlipDisplay value={liveValue} size="sm" />
        </div>
      )}

      {/* ── Total Accrued / Booked ────────────────────────── */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
            {resolved ? 'Final cost (booked)' : 'Total accrued'}
          </span>
          <span
            className="text-lg font-bold"
            style={{ color: costs.accrued < 0 ? '#2BAE66' : '#E0504A' }}
          >
            {fmt$(costs.accrued)}
          </span>
        </div>
      </div>

      {/* ── Delivery Panel (sprint only) ────────────────────── */}
      {so?.type === 'sprint_delay' && onDeliver && (
        <div className="px-5 pb-3">
          <DeliveryPanel so={so} onDeliver={() => onDeliver(decision.id)} />
        </div>
      )}

      {/* ── Reclaim Panel ──────────────────────────────────── */}
      <div className="px-5 pb-4">
        <ReclaimPanel decision={decision} onResolve={onResolve} />
      </div>
    </div>
  );
}
