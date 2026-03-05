'use client';

import { rampPct } from '@/lib/costs';

interface RampChartProps {
  rampQ: number;
  monthsIn: number;
  attainRate: number;
  quota: number;
}

const BAR_MAX_HEIGHT = 44;
const LABEL_HEIGHT = 16;
const TOTAL_HEIGHT = BAR_MAX_HEIGHT + LABEL_HEIGHT + 24; // bars + labels + legend

const COLORS = {
  foregone: '#E0504A',
  current: '#F0A500',
  future: '#C8E8F8',
} as const;

const X_LABELS = [
  { month: 1, label: 'M1' },
  { month: 3, label: 'M3' },
  { month: 6, label: 'M6' },
  { month: 9, label: 'M9' },
  { month: 12, label: 'M12' },
];

export default function RampChart({
  rampQ,
  monthsIn,
}: RampChartProps) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const barWidth = 100 / 12; // percentage per bar
  const gap = barWidth * 0.15; // gap between bars
  const effectiveBarWidth = barWidth - gap;

  // Current month index (clamped to 1-12 range)
  const currentMonth = Math.max(1, Math.min(12, Math.round(monthsIn)));

  return (
    <div className="w-full mt-3">
      <svg
        width="100%"
        height={TOTAL_HEIGHT}
        viewBox={`0 0 400 ${TOTAL_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        {/* Background baseline */}
        <line
          x1="0"
          y1={BAR_MAX_HEIGHT}
          x2="400"
          y2={BAR_MAX_HEIGHT}
          stroke="#E1EAF2"
          strokeWidth="1"
        />

        {/* Bars */}
        {months.map((m) => {
          const pct = rampPct(m - 1, rampQ);
          const barH = Math.max(2, pct * BAR_MAX_HEIGHT);
          const x = ((m - 1) / 12) * 400 + (gap / 12) * 400 * 0.5;
          const w = (effectiveBarWidth / 100) * 400;
          const y = BAR_MAX_HEIGHT - barH;

          let fill: string;
          let opacity: number;
          if (m < currentMonth) {
            fill = COLORS.foregone;
            opacity = 0.55;
          } else if (m === currentMonth) {
            fill = COLORS.current;
            opacity = 1;
          } else {
            fill = COLORS.future;
            opacity = 0.85;
          }

          return (
            <g key={m}>
              <rect
                x={x}
                y={y}
                width={w}
                height={barH}
                rx={2}
                fill={fill}
                opacity={opacity}
              />
              {/* Ramp % label on hover-visible basis — show on current bar */}
              {m === currentMonth && (
                <text
                  x={x + w / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="600"
                  fill={COLORS.current}
                >
                  {Math.round(pct * 100)}%
                </text>
              )}
            </g>
          );
        })}

        {/* Vertical dashed line at current month */}
        <line
          x1={((currentMonth - 0.5) / 12) * 400}
          y1={0}
          x2={((currentMonth - 0.5) / 12) * 400}
          y2={BAR_MAX_HEIGHT}
          stroke={COLORS.current}
          strokeWidth="1"
          strokeDasharray="3,2"
        />

        {/* X-axis labels */}
        {X_LABELS.map(({ month, label }) => {
          const x = ((month - 0.5) / 12) * 400;
          return (
            <text
              key={month}
              x={x}
              y={BAR_MAX_HEIGHT + 12}
              textAnchor="middle"
              fontSize="9"
              fill="#94A3B8"
              fontFamily="system-ui, sans-serif"
            >
              {label}
            </text>
          );
        })}

        {/* Legend row */}
        {[
          { color: COLORS.foregone, label: 'Foregone', opacity: 0.55 },
          { color: COLORS.current, label: 'Current', opacity: 1 },
          { color: COLORS.future, label: 'Remaining', opacity: 0.85 },
        ].map((item, i) => {
          const lx = 80 + i * 110;
          const ly = BAR_MAX_HEIGHT + LABEL_HEIGHT + 16;
          return (
            <g key={item.label}>
              <circle
                cx={lx}
                cy={ly}
                r={3.5}
                fill={item.color}
                opacity={item.opacity}
              />
              <text
                x={lx + 8}
                y={ly + 3}
                fontSize="9"
                fill="#94A3B8"
                fontFamily="system-ui, sans-serif"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
