'use client';

import { useState, useEffect, useRef, CSSProperties } from 'react';

/* ──────────────────────────────────────────────────────────
   Color schemes
   ────────────────────────────────────────────────────────── */
export type ColorScheme = 'default' | 'green';

interface ColorTokens {
  bg: string;
  border: string;
  digitFg: string;
  glow: string;
  seam: string;
  punctColor: string;
  symbolColor: string;
}

const COLOR_SCHEMES: Record<ColorScheme, ColorTokens> = {
  default: {
    bg: '#0D1E2E',
    border: '#1C3448',
    digitFg: '#DDEEF8',
    glow: 'rgba(29,161,242,0.35)',
    seam: '#060E18',
    punctColor: '#5A8AAA',
    symbolColor: '#4A7090',
  },
  green: {
    bg: '#0D2E1E',
    border: '#1C4838',
    digitFg: '#D8F8E8',
    glow: 'rgba(43,174,102,0.35)',
    seam: '#060E18',
    punctColor: '#5AAA8A',
    symbolColor: '#4A9070',
  },
};

/* ──────────────────────────────────────────────────────────
   Size presets
   ────────────────────────────────────────────────────────── */
type Size = 'xl' | 'lg' | 'md' | 'sm';

interface SizeDef {
  w: number;
  h: number;
  fs: number;
  r: number;
}

const SIZES: Record<Size, SizeDef> = {
  xl: { w: 46, h: 68, fs: 44, r: 6 },
  lg: { w: 34, h: 50, fs: 32, r: 5 },
  md: { w: 24, h: 36, fs: 22, r: 4 },
  sm: { w: 17, h: 26, fs: 15, r: 3 },
};

/* ──────────────────────────────────────────────────────────
   Keyframes — injected once into <head>
   ────────────────────────────────────────────────────────── */
const KEYFRAMES_ID = '__flip-digit-keyframes__';

function ensureKeyframes(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;

  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes flipIn {
      0%   { transform: perspective(280px) rotateX(-80deg); opacity: 0.1; }
      100% { transform: perspective(280px) rotateX(0deg);   opacity: 1;   }
    }
  `;
  document.head.appendChild(style);
}

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */
interface FlipDigitProps {
  char: string;
  size?: Size;
  colorScheme?: ColorScheme;
}

export default function FlipDigit({ char, size = 'md', colorScheme = 'default' }: FlipDigitProps) {
  const [shown, setShown] = useState(char);
  const [animKey, setAnimKey] = useState(0);
  const prev = useRef(char);

  /* Inject keyframes once on mount */
  useEffect(ensureKeyframes, []);

  /* Trigger flip animation when char changes */
  useEffect(() => {
    if (char === prev.current) return;
    prev.current = char;
    setAnimKey((k) => k + 1);
    const t = setTimeout(() => setShown(char), 85);
    return () => clearTimeout(t);
  }, [char]);

  const D = SIZES[size];
  const tokens = COLOR_SCHEMES[colorScheme];

  /* Character classification */
  const isNum   = /^[0-9]$/.test(char);
  const isPunct = char === '.' || char === ',';

  /* Width adjustments for non-numeric characters */
  const cellWidth = isPunct
    ? D.w * 0.52
    : char === '$' || char === '-'
      ? D.w * 0.62
      : D.w;

  /* Whitespace → thin spacer */
  if (char === ' ') {
    return <div style={{ width: D.w * 0.28, flexShrink: 0 }} />;
  }

  /* ── Container ── */
  const containerStyle: CSSProperties = {
    position: 'relative',
    width: cellWidth,
    height: D.h,
    background: isNum ? tokens.bg : 'transparent',
    borderRadius: isNum ? D.r : 0,
    border: isNum ? `1px solid ${tokens.border}` : 'none',
    margin: '0 2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: isNum ? 'inset 0 2px 4px rgba(0,0,0,0.5)' : 'none',
  };

  /* ── Seam line (horizontal split at 50%) ── */
  const seamStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1.5,
    background: tokens.seam,
    zIndex: 5,
    pointerEvents: 'none',
  };

  /* ── Top half gradient for depth ── */
  const gradientStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '44%',
    background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 100%)',
    zIndex: 4,
    pointerEvents: 'none',
  };

  /* ── Digit text ── */
  const textColor = isNum
    ? tokens.digitFg
    : isPunct
      ? tokens.punctColor
      : tokens.symbolColor;

  const textStyle: CSSProperties = {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: D.fs,
    fontWeight: 600,
    color: textColor,
    lineHeight: 1,
    textShadow: isNum ? `0 0 12px ${tokens.glow}` : 'none',
    animation: animKey > 0 ? 'flipIn 110ms ease-out' : 'none',
    userSelect: 'none',
    zIndex: 6,
  };

  return (
    <div style={containerStyle}>
      {isNum && <div style={seamStyle} />}
      {isNum && <div style={gradientStyle} />}
      <span key={`flip-${animKey}`} style={textStyle}>
        {shown}
      </span>
    </div>
  );
}
