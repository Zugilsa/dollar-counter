'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

/* ── CSS-only waving flag on a flagpole ──────────────────── */
function FlagBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      {/* Inject keyframes */}
      <style>{`
        @keyframes wave {
          0%   { transform: skewY(0deg)   scaleX(1);    }
          25%  { transform: skewY(-2deg)  scaleX(1.02); }
          50%  { transform: skewY(1deg)   scaleX(0.98); }
          75%  { transform: skewY(-1.5deg) scaleX(1.01); }
          100% { transform: skewY(0deg)   scaleX(1);    }
        }
        @keyframes ripple1 {
          0%, 100% { d: path("M0,0 Q60,8 120,0 Q180,-6 240,0 L240,160 L0,160 Z"); }
          50%      { d: path("M0,0 Q60,-6 120,0 Q180,8 240,0 L240,160 L0,160 Z"); }
        }
        @keyframes ripple2 {
          0%, 100% { d: path("M0,20 Q60,28 120,20 Q180,14 240,20 L240,160 L0,160 Z"); }
          50%      { d: path("M0,20 Q60,14 120,20 Q180,28 240,20 L240,160 L0,160 Z"); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(0deg); }
          50%      { transform: rotate(0.5deg); }
        }
      `}</style>

      {/* Flagpole + Flag container */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 400,
          height: '85vh',
          pointerEvents: 'none',
          opacity: 0.12,
          zIndex: 0,
        }}
      >
        {/* Pole */}
        <div
          style={{
            position: 'absolute',
            left: 40,
            bottom: 0,
            width: 6,
            height: '100%',
            background: 'linear-gradient(90deg, #8899AA 0%, #BBCCDD 40%, #8899AA 100%)',
            borderRadius: 3,
          }}
        />

        {/* Pole cap (ball) */}
        <div
          style={{
            position: 'absolute',
            left: 28,
            top: 0,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #CCDDEE, #8899AA)',
          }}
        />

        {/* Flag — waving */}
        <div
          style={{
            position: 'absolute',
            left: 46,
            top: 30,
            width: 320,
            transformOrigin: 'left center',
            animation: 'sway 6s ease-in-out infinite',
          }}
        >
          <svg
            viewBox="0 0 240 160"
            width="320"
            height="214"
            style={{
              animation: 'wave 4s ease-in-out infinite',
              transformOrigin: 'left center',
              filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.3))',
            }}
          >
            {/* Green background */}
            <rect width="240" height="160" fill="#1A5C3A" rx="2" />

            {/* Ripple stripes for fabric effect */}
            <path
              d="M0,0 Q60,8 120,0 Q180,-6 240,0 L240,160 L0,160 Z"
              fill="rgba(255,255,255,0.04)"
              style={{ animation: 'ripple1 3s ease-in-out infinite' }}
            />
            <path
              d="M0,20 Q60,28 120,20 Q180,14 240,20 L240,160 L0,160 Z"
              fill="rgba(0,0,0,0.03)"
              style={{ animation: 'ripple2 3.5s ease-in-out infinite' }}
            />

            {/* Large $ symbol */}
            <text
              x="120"
              y="105"
              textAnchor="middle"
              fill="rgba(255,255,255,0.8)"
              fontSize="100"
              fontWeight="bold"
              fontFamily="Inter, system-ui, sans-serif"
            >
              $
            </text>

            {/* Subtle fold shadow on left edge */}
            <rect x="0" y="0" width="8" height="160" fill="rgba(0,0,0,0.15)" />
          </svg>
        </div>
      </div>
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
      {/* Waving USD flag background */}
      <FlagBackground />

      {/* Login form — above the flag */}
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
          className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
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
                       outline-none text-sm text-slate-800 transition-colors"
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
