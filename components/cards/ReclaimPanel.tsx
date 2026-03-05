'use client';

import { Decision } from '@/lib/types';
import { useReclaimStatus } from '@/hooks/useReclaimStatus';
import { fmt$ } from '@/lib/costs';

interface ReclaimPanelProps {
  decision: Decision;
  onResolve: (id: string) => void;
}

export default function ReclaimPanel({ decision, onResolve }: ReclaimPanelProps) {
  const status = useReclaimStatus(decision);

  if (!status) return null;

  const isResolved =
    status.status === 'saved' ||
    status.status === 'late' ||
    status.status === 'on_time';

  const config = getStatusConfig(status);

  return (
    <div
      className={`rounded-lg p-4 ${config.bg} ${config.border} border ${
        config.pulse ? 'animate-pulse' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
          <p className={`text-sm font-medium ${config.text} truncate`}>
            {config.message}
          </p>
        </div>

        {!isResolved && (
          <button
            onClick={() => onResolve(decision.id)}
            className={`ml-3 flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold
              transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]
              ${config.buttonBg} ${config.buttonText}`}
          >
            Mark Resolved &rarr;
          </button>
        )}
      </div>

      {/* Progress bar for on_track */}
      {status.status === 'on_track' && (
        <div className="mt-3 h-1.5 rounded-full bg-emerald-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{
              width: `${Math.max(
                5,
                Math.min(100, 100 - (status.daysRemaining / 90) * 100)
              )}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

function getStatusConfig(status: NonNullable<ReturnType<typeof useReclaimStatus>>) {
  switch (status.status) {
    case 'on_track':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700',
        message: `${status.daysRemaining}d to target \u00B7 act today = ${fmt$(
          status.savings
        )} saved`,
        buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
        buttonText: 'text-white',
        pulse: false,
      };

    case 'at_risk':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        text: 'text-amber-700',
        message: `${status.daysRemaining}d remaining \u2014 act now`,
        buttonBg: 'bg-amber-600 hover:bg-amber-700',
        buttonText: 'text-white',
        pulse: false,
      };

    case 'overdue':
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        dot: 'bg-red-500',
        text: 'text-red-700',
        message: `${status.daysOverdue}d overdue \u00B7 ${fmt$(
          status.extra
        )} extra cost accruing`,
        buttonBg: 'bg-red-600 hover:bg-red-700',
        buttonText: 'text-white',
        pulse: true,
      };

    case 'saved':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700',
        message: `Resolved ${status.daysEarly}d early \u00B7 ${fmt$(
          status.delta
        )} reclaimed`,
        buttonBg: '',
        buttonText: '',
        pulse: false,
      };

    case 'late':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        dot: 'bg-red-500',
        text: 'text-red-700',
        message: `Resolved ${status.daysLate}d late \u00B7 ${fmt$(
          status.delta
        )} extra`,
        buttonBg: '',
        buttonText: '',
        pulse: false,
      };

    case 'on_time':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700',
        message: 'Resolved exactly on target',
        buttonBg: '',
        buttonText: '',
        pulse: false,
      };
  }
}
