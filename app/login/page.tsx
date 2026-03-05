'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

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
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0D1F30' }}
    >
      <div className="w-full max-w-sm">
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
