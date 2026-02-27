'use client';

import { useState, FormEvent } from 'react';

export default function GatePage() {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const from = new URLSearchParams(window.location.search).get('from') ?? '/';
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, from }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Incorrect passcode.');
        return;
      }

      window.location.href = data.redirectTo ?? '/';
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900">Murrayhill HOA Guideline Advisor</h1>
          <p className="text-sm text-gray-500 mt-1">Architectural Review &amp; Community Compliance</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Enter the community passcode to continue</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode"
                className="w-full px-3 py-2.5 pr-14 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPasscode((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 min-w-[44px] text-center"
                tabIndex={-1}
              >
                {showPasscode ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !passcode.trim()}
              className="w-full py-2.5 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Checking…' : 'Enter Portal'}
            </button>
          </form>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Contact your HOA board if you need the passcode.
        </p>
      </div>
    </div>
  );
}
