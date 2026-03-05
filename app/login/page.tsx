'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

/* ── US Flag SVG (simplified 13 stripes + blue canton with stars) ── */
function USFlagSVG() {
  const stripeH = 200 / 13;
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%">
      {/* 13 stripes */}
      {Array.from({ length: 13 }, (_, i) => (
        <rect
          key={i}
          x="0"
          y={i * stripeH}
          width="300"
          height={stripeH}
          fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'}
        />
      ))}
      {/* Blue canton */}
      <rect x="0" y="0" width="120" height={stripeH * 7} fill="#3C3B6E" />
      {/* Stars — 5 rows of 6 + 4 rows of 5 (simplified grid) */}
      {[
        // Row 1: 6 stars
        ...[0,1,2,3,4,5].map(c => ({ cx: 10 + c * 20, cy: 8 })),
        // Row 2: 5 stars (offset)
        ...[0,1,2,3,4].map(c => ({ cx: 20 + c * 20, cy: 22 })),
        // Row 3: 6 stars
        ...[0,1,2,3,4,5].map(c => ({ cx: 10 + c * 20, cy: 36 })),
        // Row 4: 5 stars (offset)
        ...[0,1,2,3,4].map(c => ({ cx: 20 + c * 20, cy: 50 })),
        // Row 5: 6 stars
        ...[0,1,2,3,4,5].map(c => ({ cx: 10 + c * 20, cy: 64 })),
        // Row 6: 5 stars (offset)
        ...[0,1,2,3,4].map(c => ({ cx: 20 + c * 20, cy: 78 })),
        // Row 7: 6 stars
        ...[0,1,2,3,4,5].map(c => ({ cx: 10 + c * 20, cy: 92 })),
        // Row 8: 5 stars (offset)
        ...[0,1,2,3,4].map(c => ({ cx: 20 + c * 20, cy: 106 })),
        // Row 9: 6 stars (last row)
        ...[0,1,2,3,4,5].map(c => ({ cx: 10 + c * 20, cy: 100 })),
      ].slice(0, 50).map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r="3" fill="#FFFFFF" />
      ))}
      {/* Fold shadow on left edge */}
      <rect x="0" y="0" width="10" height="200" fill="rgba(0,0,0,0.2)" />
      {/* Fabric texture overlays */}
      <rect x="0" y="0" width="300" height="200" fill="rgba(0,0,0,0.05)" />
    </svg>
  );
}

/* ── Single flagpole with waving flag ── */
function Flagpole({ side, FlagContent }: { side: 'left' | 'right'; FlagContent: () => React.JSX.Element }) {
  const isLeft = side === 'left';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        [isLeft ? 'left' : 'right']: 'calc(50% - 280px)',
        width: 460,
        height: '90vh',
        pointerEvents: 'none',
        opacity: 0.3,
        zIndex: 0,
        transform: isLeft ? 'none' : 'scaleX(-1)',
      }}
    >
      {/* Pole */}
      <div
        style={{
          position: 'absolute',
          left: 28,
          bottom: 0,
          width: 8,
          height: '100%',
          background: 'linear-gradient(90deg, #667788 0%, #AABBCC 35%, #DDEEFF 50%, #AABBCC 65%, #667788 100%)',
          borderRadius: 4,
          boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
        }}
      />

      {/* Gold ball cap */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 0,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 32%, #FFE082, #FFC107, #B8860B)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      />

      {/* Flag — waving */}
      <div
        className="flag-sway"
        style={{
          position: 'absolute',
          left: 36,
          top: 38,
          width: 380,
          transformOrigin: 'left top',
        }}
      >
        <div
          className="flag-wave"
          style={{
            transformOrigin: 'left center',
            filter: 'drop-shadow(6px 6px 12px rgba(0,0,0,0.4))',
            width: 380,
            height: 253,
          }}
        >
          <FlagContent />
        </div>
      </div>

      {/* Pole base */}
      <div
        style={{
          position: 'absolute',
          left: 8,
          bottom: 0,
          width: 48,
          height: 20,
          background: 'linear-gradient(180deg, #556677, #334455)',
          borderRadius: '4px 4px 0 0',
        }}
      />
    </div>
  );
}

/* ── USD Flag (green with $) ── */
function USDFlagSVG() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%">
      <rect width="300" height="200" fill="#145A32" rx="3" />
      <rect x="0" y="0" width="300" height="40" fill="rgba(255,255,255,0.06)" rx="3" />
      <rect x="0" y="80" width="300" height="40" fill="rgba(255,255,255,0.04)" />
      <text
        x="150" y="140" textAnchor="middle"
        fill="rgba(255,255,255,0.85)" fontSize="140" fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
      >
        $
      </text>
      <rect x="0" y="0" width="12" height="200" fill="rgba(0,0,0,0.25)" rx="3" />
    </svg>
  );
}

function FlagBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes wave {
          0%   { transform: skewY(0deg)    scaleX(1);    }
          20%  { transform: skewY(-3deg)   scaleX(1.03); }
          40%  { transform: skewY(2deg)    scaleX(0.97); }
          60%  { transform: skewY(-2deg)   scaleX(1.02); }
          80%  { transform: skewY(1.5deg)  scaleX(0.99); }
          100% { transform: skewY(0deg)    scaleX(1);    }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-0.3deg); }
          50%      { transform: rotate(0.8deg); }
        }
        .flag-wave { animation: wave 3.5s ease-in-out infinite; }
        .flag-sway { animation: sway 5s ease-in-out infinite; }
      `}</style>

      <Flagpole side="left" FlagContent={USDFlagSVG} />
      <Flagpole side="right" FlagContent={USFlagSVG} />
    </>
  );
}

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError('Invalid password');
        setPassword('');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#0D1F30' }}
    >
      <FlagBackground />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Dollar Counter
          </h1>
          <p className="text-sm text-slate-400">
            Decision Cost Intelligence
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
        >
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            className="border border-[#E1EAF2] rounded-lg px-4 py-3 w-full
                       focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2]
                       outline-none text-sm text-slate-800 transition-colors bg-white"
          />

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className={`
              w-full py-3 rounded-xl text-sm font-semibold transition-all
              ${
                loading || !password
                  ? 'bg-[#E1EAF2] text-slate-400 cursor-not-allowed'
                  : 'bg-[#1DA1F2] text-white hover:bg-[#0D8CE0] hover:shadow-md active:scale-[0.98]'
              }
            `}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
