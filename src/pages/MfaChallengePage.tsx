import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function MfaChallengePage() {
  const { user, needsMfaChallenge, verifyMfaCode, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/signin" replace />;
  if (!needsMfaChallenge) {
    const dest = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
    return <Navigate to={dest} replace />;
  }

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await verifyMfaCode(code.trim());
      const dest = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
      navigate(dest, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code — try again');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <h1 className="text-xl font-bold text-[#0B2D59] mb-2">Two-factor verification</h1>
        <p className="text-sm text-gray-500 mb-6">Enter the 6-digit code from your authenticator app.</p>
        <input
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={e => { if (e.key === 'Enter' && code.length === 6) submit(); }}
          placeholder="000000"
          className="w-full text-center text-2xl tracking-widest font-mono border border-gray-200 rounded-lg px-3 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
        />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button
          onClick={submit}
          disabled={busy || code.length !== 6}
          className="w-full py-3 bg-[#0070F3] text-white font-semibold rounded-xl disabled:opacity-50"
        >
          {busy ? 'Verifying…' : 'Verify'}
        </button>
        <button onClick={() => signOut()} className="w-full mt-3 text-xs text-gray-400 underline">
          Sign in as someone else
        </button>
      </div>
    </div>
  );
}
