import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/** Real TOTP enrollment via Supabase Auth's native MFA API — replaces the old
 *  toggle that just flipped profiles.two_factor_enabled with client-generated
 *  Math.random() "backup codes" and no actual secret or verification step. */
export default function TwoFactorSetup({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startEnroll = async () => {
    setError(null);
    setBusy(true);
    try {
      const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (err) throw err;
      setFactorId(data.id);
      setQrSvg(data.totp.qr_code);
      setSecret(data.totp.secret);
      setEnrolling(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start enrollment');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnroll = async () => {
    if (!factorId) return;
    setError(null);
    setBusy(true);
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.trim() });
      if (vErr) throw vErr;
      setEnrolling(false);
      setFactorId(null);
      setQrSvg(null);
      setSecret(null);
      setCode('');
      onChange(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code — try again');
    } finally {
      setBusy(false);
    }
  };

  const cancelEnroll = async () => {
    if (factorId) await supabase.auth.mfa.unenroll({ factorId });
    setEnrolling(false);
    setFactorId(null);
    setQrSvg(null);
    setSecret(null);
    setCode('');
    setError(null);
  };

  const disable = async () => {
    setError(null);
    setBusy(true);
    try {
      const { data, error: listErr } = await supabase.auth.mfa.listFactors();
      if (listErr) throw listErr;
      const totp = data.totp[0];
      if (totp) {
        const { error: unErr } = await supabase.auth.mfa.unenroll({ factorId: totp.id });
        if (unErr) throw unErr;
      }
      onChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not disable 2FA');
    } finally {
      setBusy(false);
    }
  };

  if (enrolling) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3 space-y-3">
        <p className="text-sm text-gray-700">Scan this QR code with your authenticator app (Google Authenticator, 1Password, Authy…), then enter the 6-digit code it shows.</p>
        {qrSvg && <div className="bg-white p-2 rounded-lg inline-block" dangerouslySetInnerHTML={{ __html: qrSvg }} />}
        {secret && <p className="text-xs text-gray-500 font-mono break-all">Can't scan? Enter this key manually: {secret}</p>}
        <div className="flex gap-2">
          <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000"
            className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono tracking-widest" />
          <button onClick={confirmEnroll} disabled={busy || code.length !== 6} className="px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            {busy ? 'Verifying…' : 'Verify & enable'}
          </button>
          <button onClick={cancelEnroll} className="px-3 py-2 text-sm text-gray-500">Cancel</button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">2FA Status</span>
        <button onClick={enabled ? disable : startEnroll} disabled={busy}
          className={`relative inline-flex h-6 w-11 items-center rounded-full disabled:opacity-50 ${enabled ? 'bg-[#0070F3]' : 'bg-gray-200'}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      {enabled && <p className="text-xs text-green-600 flex items-center gap-1 mt-2"><CheckCircle className="h-3.5 w-3.5" /> Two-factor authentication is enabled.</p>}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
