import React, { useEffect, useState, useCallback } from 'react';
import { Check, X, DollarSign, Users, Loader2, ShieldAlert, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BriefRow {
  id: string;
  title: string;
  tender_title: string | null;
  job_kind: string;
  company: string;
  budget_type: string;
  budget_amount: number;
  budget_from: number | null;
  budget_to: number | null;
  currency: string;
  proposals_count: number;
  category: string | null;
  service_type: string | null;
  nda_required: boolean;
  admin_status: string;
  admin_rejection_reason: string | null;
  created_at: string;
  customer_id: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_review: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  live: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-gray-100 text-gray-500' },
};

const REJECTION_REASONS = [
  'Spam or duplicate listing',
  'Prohibited category or content',
  'Insufficient / unrealistic detail',
  'Suspected fraud',
  'Other',
];

function formatBudget(b: BriefRow): string {
  const symbol = b.currency === 'GBP' || !b.currency ? '£' : b.currency;
  if (b.budget_from && b.budget_to) return `${symbol}${b.budget_from.toLocaleString()}–${symbol}${b.budget_to.toLocaleString()}`;
  if (b.budget_amount) return `${symbol}${b.budget_amount.toLocaleString()}${b.budget_type === 'hourly' ? '/hr' : ''}`;
  return '—';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const AdminBriefs: React.FC = () => {
  const [briefs, setBriefs] = useState<BriefRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('id, title, tender_title, job_kind, budget_type, budget_amount, budget_from, budget_to, currency, proposals_count, category, service_type, nda_required, admin_status, admin_rejection_reason, created_at, customer_id')
      .order('created_at', { ascending: false });
    const rows = data || [];
    const customerIds = Array.from(new Set(rows.map(r => r.customer_id)));
    const { data: customers } = customerIds.length
      ? await supabase.from('customers').select('id, company_name').in('id', customerIds)
      : { data: [] as any[] };
    const custMap = new Map((customers ?? []).map((c: any) => [c.id, c.company_name]));
    setBriefs(rows.map((r: any) => ({ ...r, company: custMap.get(r.customer_id) ?? 'Buyer' })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? briefs : briefs.filter(b => b.admin_status === filter);

  const auditAndNotify = async (adminId: string, actionType: string, brief: BriefRow, reason: string, notifyTitle: string, notifyMessage: string) => {
    await supabase.from('admin_audit_log').insert({
      admin_id: adminId, action_type: actionType, target_type: 'job', target_id: brief.id, reason,
    });
    await supabase.from('notifications').insert({
      user_id: brief.customer_id, type: 'system', title: notifyTitle, message: notifyMessage, link_url: '/customer/dashboard',
    });
  };

  const approve = async (brief: BriefRow) => {
    setBusyId(brief.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('jobs').update({ admin_status: 'live', admin_rejection_reason: null }).eq('id', brief.id);
      if (error) throw error;
      if (user) await auditAndNotify(user.id, 'brief_approve', brief, '',
        'Your listing is live', `"${brief.job_kind === 'tender' ? brief.tender_title : brief.title}" has been approved and is now visible on the Job Board.`);
      setBriefs(bs => bs.map(b => b.id === brief.id ? { ...b, admin_status: 'live', admin_rejection_reason: null } : b));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (brief: BriefRow) => {
    if (!rejectionReason) return;
    setBusyId(brief.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('jobs').update({ admin_status: 'rejected', admin_rejection_reason: rejectionReason }).eq('id', brief.id);
      if (error) throw error;
      if (user) await auditAndNotify(user.id, 'brief_reject', brief, rejectionReason,
        'Your listing was not approved', `"${brief.job_kind === 'tender' ? brief.tender_title : brief.title}" was rejected: ${rejectionReason}`);
      setBriefs(bs => bs.map(b => b.id === brief.id ? { ...b, admin_status: 'rejected', admin_rejection_reason: rejectionReason } : b));
      setRejectingId(null);
      setRejectionReason('');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Brief & Tender Review</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {['all', 'pending_review', 'live', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-white shadow-sm text-[#0B2D59]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {f === 'all' ? `All (${briefs.length})` : `${STATUS_MAP[f].label} (${briefs.filter(b => b.admin_status === f).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Brief</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Company</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Budget</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Proposals</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No briefs in this view.</td></tr>
            )}
            {filtered.map(brief => {
              const s = STATUS_MAP[brief.admin_status] ?? STATUS_MAP.pending_review;
              const displayTitle = brief.job_kind === 'tender' ? (brief.tender_title || brief.title) : brief.title;
              return (
                <React.Fragment key={brief.id}>
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#0B2D59] flex items-center gap-1.5">
                        {displayTitle}
                        {brief.nda_required && (
                          <span title="NDA required"><ShieldAlert className="h-3.5 w-3.5 text-amber-500" /></span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {brief.category && <span className="text-xs bg-blue-50 text-[#0070F3] px-2 py-0.5 rounded-full">{brief.category}</span>}
                        <span className="text-xs text-gray-400 capitalize">{brief.job_kind} · {fmtDate(brief.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{brief.company}</td>
                    <td className="px-5 py-4 text-gray-600 font-medium flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-gray-400" />{formatBudget(brief)}</td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-gray-600"><Users className="h-3.5 w-3.5" />{brief.proposals_count}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => approve(brief)}
                          disabled={busyId === brief.id || brief.admin_status === 'live'}
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-40"
                          title="Approve"
                        ><Check className="h-3.5 w-3.5" /></button>
                        <button
                          onClick={() => { setRejectingId(brief.id); setRejectionReason(''); }}
                          disabled={busyId === brief.id || brief.admin_status === 'rejected'}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-40"
                          title="Reject"
                        ><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                  {rejectingId === brief.id && (
                    <tr>
                      <td colSpan={6} className="px-5 pb-4">
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                          <p className="text-sm font-semibold text-red-700 mb-2">Select rejection reason:</p>
                          <select
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            className="w-full max-w-sm px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-3"
                          >
                            <option value="">— choose a reason —</option>
                            {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => reject(brief)}
                              disabled={!rejectionReason || busyId === brief.id}
                              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-40"
                            >
                              {busyId === brief.id ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                            <button
                              onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {brief.admin_status === 'rejected' && brief.admin_rejection_reason && (
                    <tr>
                      <td colSpan={6} className="px-5 pb-3">
                        <div className="bg-gray-50 text-gray-600 text-xs px-3 py-2 rounded-lg flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          Rejected: {brief.admin_rejection_reason}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBriefs;
