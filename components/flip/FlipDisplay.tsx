'use client';

import FlipDigit, { ColorScheme } from './FlipDigit';

/* ──────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────── */
type Size = 'xl' | 'lg' | 'md' | 'sm';

interface FlipDisplayProps {
  /** The numeric dollar value to display. Negative values render green with -$ prefix. */
  value: number;
  /** Size preset passed to each FlipDigit cell. */
  size?: Size;
  /** Optional string prepended before the formatted value (ignored — "$" is always used). */
  prefix?: string;
}

/* ──────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────── */

/**
 * Format a number into a dollar string with commas and 2 decimals.
 * Pads to at least "$X,XXX.XX" (8 chars) so the display width stays
 * stable even when the value is small.
 */
function formatDollar(value: number, prefix: string): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const raw = `${prefix}${formatted}`;

  // Minimum display: "$0,000.00" → 9 chars.  Pad the integer portion
  // with leading zeros (after the prefix and before the decimal) so
  // the counter never collapses in width when values are small.
  const MIN_DISPLAY = `${prefix}0,000.00`;
  if (raw.length < MIN_DISPLAY.length) {
    // Separate integer & decimal parts
    const [intPart, decPart] = formatted.split('.');
    // Strip existing commas from the integer to re-pad
    const digits = intPart.replace(/,/g, '');
    // We want at least 4 integer digits (to produce "X,XXX")
    const padded = digits.padStart(4, '0');
    // Re-insert commas: "0000" → "0,000"
    const withCommas = padded.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${prefix}${withCommas}.${decPart}`;
  }

  return raw;
}

/* ──────────────────────────────────────────────────────────
   Gap sizes per digit size — tighter for smaller cells
   ────────────────────────────────────────────────────────── */
const GAP: Record<Size, number> = {
  xl: 3,
  lg: 2,
  md: 1,
  sm: 1,
};

const PADDING: Record<Size, string> = {
  xl: '16px 22px',
  lg: '12px 18px',
  md: '10px 14px',
  sm: '8px 10px',
};

const RADIUS: Record<Size, number> = {
  xl: 10,
  lg: 9,
  md: 8,
  sm: 7,
};

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */
export default function FlipDisplay({
  value,
  size = 'md',
  prefix = '$',
}: FlipDisplayProps) {
  const isNegative = value < 0;
  const displayPrefix = isNegative ? `-${prefix}` : prefix;
  const display = formatDollar(value, displayPrefix);
  const scheme: ColorScheme = isNegative ? 'green' : 'default';

  const bgColor = isNegative ? '#0D2E1E' : '#0D1F30';
  const borderColor = isNegative ? '#1A5040' : '#1A3050';

  return (
    <div
      className="inline-flex items-center"
      style={{
        background: bgColor,
        padding: PADDING[size],
        borderRadius: RADIUS[size],
        border: `1px solid ${borderColor}`,
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
        gap: GAP[size],
      }}
    >
      {display.split('').map((char, i) => (
        <FlipDigit key={i} char={char} size={size} colorScheme={scheme} />
      ))}
    </div>
  );
}
