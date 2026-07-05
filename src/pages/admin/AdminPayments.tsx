import React, { useEffect, useState, useCallback } from 'react';
import { CreditCard, ArrowDownToLine, CheckCircle, Clock, AlertCircle, Lock, X, TrendingUp, ShieldOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { releaseMilestone, formatGBP } from '../../lib/workflows';

interface EscrowRow {
  id: string;
  engagement_id: string;
  title: string;
  amount: number;
  escrow_status: string;
  auto_release_at: string | null;
  submitted_at: string | null;
  project_title: string;
  buyer: string;
  vendor: string;
  buyer_id: string;
  vendor_id: string;
}

interface ReputationRow {
  vendor_id: string;
  company_name: string;
  is_blacklisted: boolean;
  dispute_outcome_count: number;
  released_count: number;
  avgReleaseDays: number | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  in_dispute: { label: 'In Dispute', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  submitted: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700', icon: <Clock className="h-3.5 w-3.5" /> },
  funded: { label: 'Auto-Release Pending', color: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3.5 w-3.5" /> },
  released: { label: 'Released', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Manual escrow override requires a REAL password re-entry — this is a hard
 *  control around real money movement, not simulated like the rest of the
 *  platform's third-party integrations. */
function ReauthReleaseModal({ row, adminEmail, onClose, onReleased }: {
  row: EscrowRow; adminEmail: string; onClose: () => void; onReleased: (id: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!password) return;
    setBusy(true);
    setError('');
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: adminEmail, password });
      if (authErr) {
        setError('Incorrect password. Re-enter your admin password to confirm this release.');
        setBusy(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      await releaseMilestone(
        { id: row.engagement_id, buyer_id: row.buyer_id, vendor_id: row.vendor_id },
        { id: row.id, title: row.title, amount: row.amount },
        { reason: 'accepted' }
      );
      await supabase.from('admin_audit_log').insert({
        admin_id: user?.id ?? null,
        action_type: 'manual_escrow_release',
        target_type: 'project_milestone',
        target_id: row.id,
        reason: `Manual release of ${formatGBP(row.amount)} for "${row.title}"`,
      });
      onReleased(row.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Release failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-[#0B2D59] flex items-center gap-2"><Lock className="h-4 w-4" /> Confirm Manual Release</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Releasing <strong>{formatGBP(row.amount)}</strong> for "{row.title}" ahead of schedule. This immediately transfers
          escrow to the vendor and cannot be undone. Re-enter your admin password to confirm.
        </p>
        {error && <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-3">{error}</div>}
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Your admin password"
          autoFocus
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
        />
        <div className="flex gap-3">
          <button
            onClick={confirm}
            disabled={busy || !password}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Verifying...' : 'Confirm & Release'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const AdminPayments: React.FC = () => {
  const { profile } = useAuth();
  const [escrow, setEscrow] = useState<EscrowRow[]>([]);
  const [reputation, setReputation] = useState<ReputationRow[]>([]);
  const [feePct, setFeePct] = useState<number>(10);
  const [gmvAllTime, setGmvAllTime] = useState(0);
  const [gmvThisMonth, setGmvThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState<EscrowRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    const [{ data: settings }, { data: releases }, { data: milestones }, { data: releasedMilestones }] = await Promise.all([
      supabase.from('platform_settings').select('platform_fee_pct').eq('id', true).maybeSingle(),
      supabase.from('escrow_transactions').select('amount, created_at').eq('transaction_type', 'release'),
      supabase.from('project_milestones')
        .select('id, engagement_id, title, amount, escrow_status, auto_release_at, submitted_at')
        .in('escrow_status', ['funded', 'submitted', 'in_dispute'])
        .order('auto_release_at', { ascending: true }),
      supabase.from('project_milestones')
        .select('engagement_id, submitted_at, released_at')
        .eq('escrow_status', 'released')
        .not('submitted_at', 'is', null)
        .not('released_at', 'is', null),
    ]);

    if (settings?.platform_fee_pct != null) setFeePct(Number(settings.platform_fee_pct));
    const all = releases || [];
    setGmvAllTime(all.reduce((s, r) => s + Number(r.amount || 0), 0));
    setGmvThisMonth(all.filter(r => new Date(r.created_at) >= startOfMonth).reduce((s, r) => s + Number(r.amount || 0), 0));

    const engagementIds = Array.from(new Set([
      ...(milestones || []).map((m: any) => m.engagement_id),
      ...(releasedMilestones || []).map((m: any) => m.engagement_id),
    ].filter(Boolean)));
    const { data: engagements } = engagementIds.length
      ? await supabase.from('engagements').select('id, project_title, buyer_id, vendor_id').in('id', engagementIds)
      : { data: [] as any[] };
    const engMap = new Map((engagements ?? []).map((e: any) => [e.id, e]));

    const partyIds = Array.from(new Set((engagements ?? []).flatMap((e: any) => [e.buyer_id, e.vendor_id])));
    const [{ data: vendors }, { data: buyers }] = await Promise.all([
      supabase.from('vendors').select('id, company_name, is_blacklisted, dispute_outcome_count').in('id', partyIds),
      supabase.from('customers').select('id, company_name').in('id', partyIds),
    ]);
    const vMap = new Map((vendors ?? []).map((v: any) => [v.id, v]));
    const bMap = new Map((buyers ?? []).map((b: any) => [b.id, b]));

    setEscrow((milestones || []).map((m: any) => {
      const eng = engMap.get(m.engagement_id);
      return {
        id: m.id, engagement_id: m.engagement_id, title: m.title, amount: Number(m.amount) || 0,
        escrow_status: m.escrow_status, auto_release_at: m.auto_release_at, submitted_at: m.submitted_at,
        project_title: eng?.project_title ?? 'Engagement',
        buyer: bMap.get(eng?.buyer_id)?.company_name ?? 'Buyer',
        vendor: vMap.get(eng?.vendor_id)?.company_name ?? 'Vendor',
        buyer_id: eng?.buyer_id, vendor_id: eng?.vendor_id,
      };
    }));

    // Reputation: avg release delay + counts per vendor.
    const perVendor = new Map<string, { count: number; totalDays: number }>();
    (releasedMilestones || []).forEach((m: any) => {
      const eng = engMap.get(m.engagement_id);
      if (!eng?.vendor_id) return;
      const days = (new Date(m.released_at).getTime() - new Date(m.submitted_at).getTime()) / 86_400_000;
      const cur = perVendor.get(eng.vendor_id) ?? { count: 0, totalDays: 0 };
      perVendor.set(eng.vendor_id, { count: cur.count + 1, totalDays: cur.totalDays + days });
    });
    setReputation(Array.from(perVendor.entries()).map(([vendor_id, stats]) => {
      const v = vMap.get(vendor_id);
      return {
        vendor_id,
        company_name: v?.company_name ?? 'Vendor',
        is_blacklisted: !!v?.is_blacklisted,
        dispute_outcome_count: v?.dispute_outcome_count ?? 0,
        released_count: stats.count,
        avgReleaseDays: stats.count > 0 ? Math.round((stats.totalDays / stats.count) * 10) / 10 : null,
      };
    }).sort((a, b) => b.released_count - a.released_count));

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalInEscrow = escrow.reduce((s, e) => s + e.amount, 0);
  const GMV_SUMMARY = [
    { label: 'Total GMV All Time', value: formatGBP(gmvAllTime) },
    { label: 'GMV This Month', value: formatGBP(gmvThisMonth) },
    { label: 'Total in Escrow', value: formatGBP(totalInEscrow) },
    { label: `Platform Fee`, value: `${feePct}%` },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0070F3]" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Payments</h1>

      {/* GMV summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {GMV_SUMMARY.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-[#0B2D59]">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Escrow monitor */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Escrow Monitor</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Project / Milestone</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Buyer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Vendor</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Auto-release</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {escrow.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">Nothing currently held in escrow.</td></tr>
            )}
            {escrow.map(e => {
              const s = STATUS_MAP[e.escrow_status] ?? STATUS_MAP.funded;
              return (
                <tr key={e.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#0B2D59] text-sm">{e.title}</div>
                    <div className="text-xs text-gray-400">{e.project_title}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-sm">{e.buyer}</td>
                  <td className="px-5 py-4 text-gray-600 text-sm">{e.vendor}</td>
                  <td className="px-5 py-4 font-semibold text-[#0070F3]">{formatGBP(e.amount)}</td>
                  <td className="px-5 py-4 text-gray-500 text-sm">{fmtDate(e.auto_release_at)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
                      {s.icon}{s.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {e.escrow_status !== 'in_dispute' ? (
                      <button
                        onClick={() => setReleasing(e)}
                        className="flex items-center gap-1 text-xs font-semibold text-green-600 border border-green-200 px-2.5 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <ArrowDownToLine className="h-3.5 w-3.5" /> Release
                      </button>
                    ) : (
                      <span className="text-xs text-red-500 font-medium">Frozen</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vendor payment reputation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Vendor Payment Reputation</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Vendor</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Milestones Released</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Avg. Days to Release</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Dispute Outcomes</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reputation.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">No released milestones yet.</td></tr>
            )}
            {reputation.map(r => (
              <tr key={r.vendor_id} className="hover:bg-gray-50/50">
                <td className="px-5 py-4 font-medium text-[#0B2D59]">{r.company_name}</td>
                <td className="px-5 py-4 text-gray-600">{r.released_count}</td>
                <td className="px-5 py-4 text-gray-600">{r.avgReleaseDays != null ? `${r.avgReleaseDays}d` : '—'}</td>
                <td className="px-5 py-4 text-gray-600">{r.dispute_outcome_count}</td>
                <td className="px-5 py-4">
                  {r.is_blacklisted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                      <ShieldOff className="h-3.5 w-3.5" /> Blacklisted
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Good standing</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {releasing && (
        <ReauthReleaseModal
          row={releasing}
          adminEmail={profile?.email ?? ''}
          onClose={() => setReleasing(null)}
          onReleased={(id) => setEscrow(prev => prev.map(e => e.id === id ? { ...e, escrow_status: 'released' } : e).filter(e => e.id !== id))}
        />
      )}
    </div>
  );
};

export default AdminPayments;
