import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Clock, Check, X, MessageSquare, FileText, ExternalLink,
  CheckCircle, AlertTriangle, Eye, Loader2, UserCheck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getPlatformSettings, IR35_QUESTIONS } from '../../lib/workflows';

/* ─── Types ─────────────────────────────────────────────────────── */

type VendorDocument = {
  id: string;
  vendor_id: string;
  document_type: string;
  document_url: string;
  verified: boolean;
  uploaded_at: string;
  verification_status?: string | null;
  admin_notes?: string | null;
};

type VendorReferral = {
  id: string;
  contact_name: string;
  job_title: string;
  company: string;
  work_email: string;
  project_vouched_for: string;
  confirmed: boolean;
  confirmed_at: string | null;
  would_recommend: boolean | null;
  written_statement: string | null;
};

type QueueItem = {
  id: string;
  company_name: string;
  business_type?: string;
  country?: string;
  created_at?: string;
  is_verified: boolean;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  contact_email?: string;
  tagline?: string;
  description?: string;
  monthly_rate?: number;
  referral_count?: number;
  vendor_documents?: VendorDocument[];
  // UI-only status field (derived from is_verified / rejected_at)
  status: string;
};
type DocAdminStatus = 'valid' | 'invalid' | 'cannot_verify' | '';

const DOC_LABELS: Record<string, string> = {
  companies_house: 'Companies House Registration Certificate',
  address_proof: 'Proof of Business Address',
  vat_certificate: 'VAT Registration Certificate',
  companiesHouse: 'Companies House Registration Certificate',
  addressProof: 'Proof of Business Address',
  vatCert: 'VAT Registration Certificate',
};

const EXPECTED_DOC_COUNT = 3; // companies_house, address_proof, vat_certificate

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  submitted:          { label: 'Pending Review',      color: 'bg-amber-100 text-amber-700' },
  under_review:       { label: 'Under Review',        color: 'bg-blue-100 text-blue-700' },
  changes_requested:  { label: 'Changes Requested',   color: 'bg-orange-100 text-orange-700' },
  approved:           { label: 'Approved',             color: 'bg-green-100 text-green-700' },
  rejected:           { label: 'Rejected',             color: 'bg-red-100 text-red-700' },
};

const TABS = [
  { key: 'all',                label: 'All' },
  { key: 'submitted',          label: 'Pending' },
  { key: 'changes_requested', label: 'Changes Requested' },
  { key: 'approved',           label: 'Approved' },
  { key: 'rejected',           label: 'Rejected' },
];

const REJECTION_REASONS = [
  'Incomplete documents',
  'Fake referrals',
  'Unverifiable company',
  'Policy violation',
  'Other',
];

/* ─── Helpers ───────────────────────────────────────────────────── */

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── Toast ─────────────────────────────────────────────────────── */

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#0B2D59] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
      {message}
      <button onClick={onClose} className="ml-2 text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
    </div>
  );
}

/* ─── Document Viewer Modal ─────────────────────────────────────── */

interface DocModalProps {
  doc: VendorDocument;
  adminStatus: DocAdminStatus;
  onSave: (status: DocAdminStatus) => void;
  onClose: () => void;
}

function DocModal({ doc, adminStatus, onSave, onClose }: DocModalProps) {
  const [localStatus, setLocalStatus] = useState<DocAdminStatus>(adminStatus || '');
  const label = DOC_LABELS[doc.document_type] || doc.document_type;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#0B2D59] text-base truncate pr-4">{label}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview placeholder */}
        <div className="h-96 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 mb-5">
          <FileText className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">Document preview — {label}</p>
          {doc.document_url ? (
            <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-xs mt-1 text-[#0070F3] hover:underline flex items-center gap-1">
              Open document <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <p className="text-xs mt-1 text-gray-300">In production, this renders the signed S3 URL as an iframe PDF viewer.</p>
          )}
        </div>

        {/* Admin status radio */}
        <div className="flex items-center gap-4 mb-5">
          {(['valid', 'invalid', 'cannot_verify'] as DocAdminStatus[]).map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 capitalize">
              <input
                type="radio"
                name="docStatus"
                value={opt}
                checked={localStatus === opt}
                onChange={() => setLocalStatus(opt)}
                className="accent-[#0070F3]"
              />
              {opt === 'cannot_verify' ? 'Cannot Verify' : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </label>
          ))}
        </div>

        <button
          onClick={() => { onSave(localStatus); onClose(); }}
          disabled={!localStatus}
          className="px-5 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */

// Which answer to each IR35_QUESTIONS index signals "inside IR35" risk.
// Equipment provision (index 3) is inverted: the worker NOT providing their
// own equipment is the risk signal, not the reverse.
const IR35_RISK_ANSWER: ('Yes' | 'No')[] = ['Yes', 'Yes', 'Yes', 'No', 'Yes', 'Yes'];

interface IR35QueueRow {
  id: string;
  project_title: string;
  buyer_id: string;
  vendor_id: string;
  working_location: string | null;
  created_at: string;
  ir35_answers: Record<string, string>;
  right_to_work_confirmed: boolean;
}

/** Staff-aug engagements signed by both parties wait here for the IR35 SDS
 *  stamp — the contract activates only after an admin stamps inside/outside.
 *  Shows the buyer's actual IR35 questionnaire answers and right-to-work
 *  confirmation from the SOW, rather than asking the admin to stamp blind. */
function IR35StampQueue() {
  const [rows, setRows] = useState<IR35QueueRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    interface EngRow {
      id: string; project_title: string; buyer_id: string; vendor_id: string;
      working_location: string | null; created_at: string; sow_id: string | null;
    }
    interface SowRow {
      id: string; ir35_answers: Record<string, string> | null; right_to_work_confirmed: boolean | null;
    }
    const { data } = await supabase
      .from('engagements')
      .select('id, project_title, buyer_id, vendor_id, working_location, status, created_at, sow_id')
      .eq('ir35_status', 'pending')
      .eq('status', 'pending_ir35')
      .order('created_at', { ascending: true });
    const engs = (data ?? []) as EngRow[];
    const sowIds = engs.map(e => e.sow_id).filter((id): id is string => !!id);
    const { data: sows } = sowIds.length
      ? await supabase.from('sow_documents').select('id, ir35_answers, right_to_work_confirmed').in('id', sowIds)
      : { data: [] as SowRow[] };
    const sowMap = new Map((sows as SowRow[] ?? []).map(s => [s.id, s]));
    setRows(engs.map(e => {
      const sow = e.sow_id ? sowMap.get(e.sow_id) : undefined;
      return {
        id: e.id, project_title: e.project_title, buyer_id: e.buyer_id, vendor_id: e.vendor_id,
        working_location: e.working_location, created_at: e.created_at,
        ir35_answers: sow?.ir35_answers ?? {},
        right_to_work_confirmed: !!sow?.right_to_work_confirmed,
      };
    }));
  };
  useEffect(() => { load(); }, []);

  const stamp = async (row: IR35QueueRow, determination: 'inside' | 'outside') => {
    setBusyId(row.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('engagements').update({
        ir35_status: determination,
        ir35_stamped_by: user?.id ?? null,
        ir35_stamped_at: new Date().toISOString(),
        status: 'active',
      }).eq('id', row.id);
      const { data: eng } = await supabase.from('engagements').select('contract_id').eq('id', row.id).single();
      if (eng?.contract_id) await supabase.from('contracts').update({ status: 'active' }).eq('id', eng.contract_id);
      for (const uid of [row.buyer_id, row.vendor_id]) {
        await supabase.from('notifications').insert({
          user_id: uid, type: 'contract', title: 'Contract active — IR35 stamped',
          message: `The IR35 status determination for "${row.project_title}" is stamped ${determination.toUpperCase()} IR35. The contract is now active.`,
          link_url: `/engagement/${row.id}`,
        });
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (rows.length === 0) return null;

  const requiresRightToWork = (row: IR35QueueRow) =>
    row.working_location === 'On-site at buyer premises in UK' || row.working_location === 'Hybrid';

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5 mb-6">
      <h2 className="text-sm font-bold text-[#0B2D59] mb-1">IR35 SDS Stamp Queue ({rows.length})</h2>
      <p className="text-xs text-gray-400 mb-3">Staff-aug contracts signed by both parties — review the buyer's IR35 indicators before stamping the status determination.</p>
      <div className="space-y-2">
        {rows.map(row => {
          const answerCount = Object.keys(row.ir35_answers).length;
          const riskCount = IR35_QUESTIONS.reduce((n, _, idx) => n + (row.ir35_answers[idx] === IR35_RISK_ANSWER[idx] ? 1 : 0), 0);
          const expanded = expandedId === row.id;
          return (
            <div key={row.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{row.project_title}</div>
                  <div className="text-xs text-gray-400">Working location: {row.working_location ?? 'unspecified'} · Signed {fmtDate(row.created_at)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {answerCount > 0 ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${riskCount >= 4 ? 'bg-red-100 text-red-700' : riskCount >= 2 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {riskCount}/{IR35_QUESTIONS.length} indicators suggest inside IR35
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">No IR35 answers on file</span>
                    )}
                    {requiresRightToWork(row) && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.right_to_work_confirmed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {row.right_to_work_confirmed ? 'Right to work confirmed' : 'Right to work NOT confirmed'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setExpandedId(expanded ? null : row.id)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
                    {expanded ? 'Hide answers' : 'View answers'}
                  </button>
                  <button disabled={busyId === row.id} onClick={() => stamp(row, 'outside')}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                    Stamp OUTSIDE IR35
                  </button>
                  <button disabled={busyId === row.id} onClick={() => stamp(row, 'inside')}
                    className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                    Stamp INSIDE IR35
                  </button>
                </div>
              </div>
              {expanded && (
                <div className="mt-3 pt-3 border-t border-gray-100 overflow-hidden rounded-lg border border-gray-100">
                  <table className="w-full text-xs">
                    <tbody>
                      {IR35_QUESTIONS.map((q, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-3 py-2 text-gray-600">{q}</td>
                          <td className={`px-3 py-2 font-semibold w-16 text-center ${row.ir35_answers[idx] === IR35_RISK_ANSWER[idx] ? 'text-amber-600' : 'text-green-600'}`}>
                            {row.ir35_answers[idx] || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function deriveStatus(v: { is_verified: boolean; rejected_at?: string | null; verification_status?: string | null }): string {
  if (v.is_verified) return 'approved';
  if (v.rejected_at) return 'rejected';
  if (v.verification_status === 'changes_requested') return 'changes_requested';
  return 'submitted';
}

const AdminVerification: React.FC = () => {
  const [vendors, setVendors] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docModalDoc, setDocModalDoc] = useState<VendorDocument | null>(null);
  const [adminDocStatus, setAdminDocStatus] = useState<Record<string, DocAdminStatus>>({});
  const [docNotes, setDocNotes] = useState<Record<string, string>>({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<VendorReferral[]>([]);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [referralStatus, setReferralStatus] = useState<Record<string, { confirmed: number; total: number }>>({});

  useEffect(() => {
    let cancelled = false;
    async function fetchQueue() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select(`
            id, company_name, tagline, description, country, city,
            contact_email, monthly_rate, is_verified, created_at,
            rejected_at, rejection_reason, verification_status, referral_count,
            vendor_documents (
              id, vendor_id, document_type, document_url, verified, uploaded_at,
              verification_status, admin_notes
            )
          `)
          .order('created_at', { ascending: true });

        if (cancelled) return;
        if (error) throw error;
        const mapped: QueueItem[] = ((data || []) as any[]).map((v: any) => ({
          id: v.id,
          company_name: v.company_name,
          country: v.country,
          created_at: v.created_at,
          is_verified: v.is_verified,
          rejected_at: v.rejected_at,
          rejection_reason: v.rejection_reason,
          contact_email: v.contact_email,
          tagline: v.tagline,
          description: v.description,
          monthly_rate: v.monthly_rate,
          referral_count: v.referral_count,
          vendor_documents: v.vendor_documents || [],
          status: deriveStatus(v),
        }));
        setVendors(mapped);

        const docStatus: Record<string, DocAdminStatus> = {};
        const notes: Record<string, string> = {};
        mapped.forEach(v => (v.vendor_documents || []).forEach(doc => {
          if (doc.verification_status && doc.verification_status !== 'pending') {
            docStatus[doc.id] = doc.verification_status as DocAdminStatus;
          }
          if (doc.admin_notes) notes[doc.id] = doc.admin_notes;
        }));
        setAdminDocStatus(docStatus);
        setDocNotes(notes);

        // Referral confirmation counts, for the queue-row summary — computed
        // from real vendor_referrals rows rather than the vendors.referral_count
        // trust-badge column, which nothing in the app keeps in sync.
        const vendorIds = mapped.map(v => v.id);
        if (vendorIds.length > 0) {
          const { data: allReferrals } = await supabase
            .from('vendor_referrals')
            .select('vendor_id, confirmed')
            .in('vendor_id', vendorIds);
          const statusMap: Record<string, { confirmed: number; total: number }> = {};
          (allReferrals ?? []).forEach((r: { vendor_id: string; confirmed: boolean }) => {
            const cur = statusMap[r.vendor_id] ?? { confirmed: 0, total: 0 };
            cur.total += 1;
            if (r.confirmed) cur.confirmed += 1;
            statusMap[r.vendor_id] = cur;
          });
          if (!cancelled) setReferralStatus(statusMap);
        }
      } catch {
        setVendors([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchQueue();
    return () => { cancelled = true; };
  }, []);

  const selectedVendor = vendors.find(v => v.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedVendor) { setReferrals([]); return; }
    let cancelled = false;
    supabase
      .from('vendor_referrals')
      .select('id, contact_name, job_title, company, work_email, project_vouched_for, confirmed, confirmed_at, would_recommend, written_statement')
      .eq('vendor_id', selectedVendor.id)
      .then(({ data }) => { if (!cancelled) setReferrals(data || []); });
    return () => { cancelled = true; };
  }, [selectedVendor?.id]);

  const filteredQueue = vendors.filter(v =>
    activeTab === 'all' ? true : v.status === activeTab
  );

  const persistDocDecisions = async (vendorId: string) => {
    const docs = vendors.find(v => v.id === vendorId)?.vendor_documents || [];
    await Promise.all(docs.map(doc => {
      const status = adminDocStatus[doc.id];
      if (!status) return Promise.resolve();
      return supabase.from('vendor_documents').update({
        verification_status: status,
        admin_notes: docNotes[doc.id] || null,
      }).eq('id', doc.id);
    }));
  };

  const notifyVendor = async (vendorId: string, title: string, message: string) => {
    await supabase.from('notifications').insert({
      user_id: vendorId, type: 'system', title, message, link_url: '/vendor/dashboard/account-settings',
    });
  };

  const auditLog = async (adminId: string, actionType: string, vendorId: string, reason: string) => {
    await supabase.from('admin_audit_log').insert({
      admin_id: adminId, action_type: actionType, target_type: 'vendor', target_id: vendorId, reason,
    });
  };

  const handleApprove = async () => {
    if (!selectedVendor) return;
    setDecisionBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('vendors')
        .update({ is_verified: true, verification_status: 'verified', rejected_at: null, rejection_reason: null })
        .eq('id', selectedVendor.id);
      if (error) throw error;
      await persistDocDecisions(selectedVendor.id);
      if (user) await auditLog(user.id, 'vendor_verify', selectedVendor.id, adminNotes);
      await notifyVendor(selectedVendor.id, 'Verification approved', 'Your company profile has been verified. You can now appear in search and receive proposals.');
      setVendors(q => q.map(v => v.id === selectedVendor.id ? { ...v, is_verified: true, rejected_at: null, rejection_reason: null, status: 'approved' } : v));
      setSelectedId(null);
      setAdminNotes('');
      setToast('Vendor verified successfully.');
    } catch {
      setToast('Error approving vendor — please try again.');
    } finally {
      setDecisionBusy(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedVendor || adminNotes.trim() === '') return;
    setDecisionBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('vendors')
        .update({ verification_status: 'changes_requested' })
        .eq('id', selectedVendor.id);
      if (error) throw error;
      await persistDocDecisions(selectedVendor.id);
      if (user) await auditLog(user.id, 'vendor_request_changes', selectedVendor.id, adminNotes);
      await notifyVendor(selectedVendor.id, 'Changes requested on your verification', adminNotes);
      setVendors(q => q.map(v => v.id === selectedVendor.id ? { ...v, status: 'changes_requested' } : v));
      setAdminNotes('');
      setToast('Changes requested. Vendor notified.');
    } catch {
      setToast('Error requesting changes — please try again.');
    } finally {
      setDecisionBusy(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVendor || !rejectionReason) return;
    setDecisionBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fullReason = adminNotes.trim() ? `${rejectionReason} — ${adminNotes.trim()}` : rejectionReason;
      const { error } = await supabase
        .from('vendors')
        .update({ is_verified: false, verification_status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: fullReason })
        .eq('id', selectedVendor.id);
      if (error) throw error;
      await persistDocDecisions(selectedVendor.id);
      if (user) await auditLog(user.id, 'vendor_reject', selectedVendor.id, fullReason);
      await notifyVendor(selectedVendor.id, 'Verification application rejected', fullReason);
      setVendors(q => q.map(v => v.id === selectedVendor.id ? { ...v, is_verified: false, rejected_at: new Date().toISOString(), rejection_reason: fullReason, status: 'rejected' } : v));
      setSelectedId(null);
      setAdminNotes('');
      setRejectionReason('');
      setShowRejectConfirm(false);
      setToast('Vendor rejected.');
    } catch {
      setToast('Error rejecting vendor — please try again.');
    } finally {
      setDecisionBusy(false);
    }
  };

  const handleDocSave = (docId: string, status: DocAdminStatus) => {
    setAdminDocStatus(prev => ({ ...prev, [docId]: status }));
  };

  const openDocModal = (doc: VendorDocument) => {
    setDocModalDoc(doc);
    setDocModalOpen(true);
  };

  const notesEmpty = adminNotes.trim() === '';
  const confirmedReferrals = referrals.filter(r => r.confirmed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Vendor Verification</h1>

      <IR35StampQueue />
      <p className="text-xs text-gray-400 mb-4 -mt-2">Vendor blacklist review has moved to <Link to="/admin/users" className="text-[#0070F3] underline">User Management</Link>.</p>

      <div className="flex gap-0 flex-1 min-h-0 rounded-xl border border-gray-100 shadow-sm overflow-hidden bg-white">
        {/* ── Left Panel: Queue ── */}
        <div className="w-80 min-w-80 border-r border-gray-100 bg-white flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-[#0B2D59]">Verification Queue</span>
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {vendors.filter(v => v.status === 'submitted').length}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto text-xs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-3 py-2 font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'text-[#0070F3] border-b-2 border-[#0070F3]'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto">
            {filteredQueue.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">
                {activeTab === 'submitted' ? 'Queue is empty — no pending vendors.' : 'No vendors in this tab.'}
              </div>
            )}
            {filteredQueue.map(v => {
              const dateStr = v.created_at || new Date().toISOString();
              const age = daysAgo(dateStr);
              const sla = getPlatformSettings().vendorVerificationSlaDays;
              const timeColor = age > sla ? 'text-red-500' : age > Math.max(1, sla - 2) ? 'text-amber-500' : 'text-gray-400';
              const s = STATUS_MAP[v.status] ?? STATUS_MAP['submitted'];
              const docCount = v.vendor_documents?.length ?? 0;
              const validDocCount = (v.vendor_documents ?? []).filter(d => adminDocStatus[d.id] === 'valid').length;
              const docColor = docCount === 0 ? 'bg-red-100 text-red-700' : docCount < EXPECTED_DOC_COUNT ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
              const ref = referralStatus[v.id];
              const refColor = !ref || ref.total === 0 ? 'bg-red-100 text-red-700' : ref.confirmed < ref.total ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
              return (
                <div
                  key={v.id}
                  className={`border-b border-gray-50 ${selectedId === v.id ? 'bg-blue-50 border-l-2 border-l-[#0070F3]' : ''}`}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-[#0B2D59] text-sm leading-tight">{v.company_name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                      {v.country && <span>{v.country}</span>}
                    </div>
                    <div className={`flex items-center gap-1 text-xs mb-1.5 ${timeColor}`}>
                      <Clock className="h-3 w-3" /> {fmtDate(dateStr)} ({age}d ago)
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${docColor}`} title={`${validDocCount} of ${docCount} uploaded documents marked valid`}>
                        Docs {docCount}/{EXPECTED_DOC_COUNT}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${refColor}`}>
                        Referrals {ref ? `${ref.confirmed}/${ref.total}` : '0/0'}
                      </span>
                    </div>
                    <button
                      onClick={() => { setSelectedId(v.id); setAdminNotes(''); setShowRejectConfirm(false); }}
                      className="text-xs font-semibold text-[#0070F3] hover:underline"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right Panel ── */}
        {!selectedVendor ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a vendor to review</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* Section 1 — Profile Summary */}
              <section>
                <div className="flex items-start justify-between mb-1">
                  <h2 className="text-xl font-bold text-[#0B2D59]">{selectedVendor.company_name}</h2>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${(STATUS_MAP[selectedVendor.status] ?? STATUS_MAP['submitted']).color}`}>
                    {(STATUS_MAP[selectedVendor.status] ?? STATUS_MAP['submitted']).label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mb-3">
                  {selectedVendor.country && <><span>{selectedVendor.country}</span><span>·</span></>}
                  <span>Submitted {fmtDate(selectedVendor.created_at || new Date().toISOString())}</span>
                  {selectedVendor.contact_email && (
                    <><span>·</span>
                    <a href={`mailto:${selectedVendor.contact_email}`} className="text-[#0070F3] hover:underline flex items-center gap-1">
                      {selectedVendor.contact_email} <ExternalLink className="h-3 w-3" />
                    </a></>
                  )}
                </div>
                {selectedVendor.tagline && <p className="text-sm font-semibold text-gray-800 mb-1">{selectedVendor.tagline}</p>}
                {selectedVendor.description && <p className="text-sm text-gray-600 mb-3">{selectedVendor.description}</p>}
                {selectedVendor.monthly_rate != null && (
                  <p className="text-xs text-gray-500">From <span className="font-semibold text-gray-700">£{selectedVendor.monthly_rate.toLocaleString()}/month</span></p>
                )}
              </section>

              {/* Section 2 — Documents */}
              <section>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Documents
                </h3>
                {(!selectedVendor.vendor_documents || selectedVendor.vendor_documents.length === 0) ? (
                  <p className="text-sm text-gray-400">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedVendor.vendor_documents.map(doc => {
                      const adminSt = adminDocStatus[doc.id] || '';
                      const label = DOC_LABELS[doc.document_type] || doc.document_type;
                      return (
                        <div key={doc.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {doc.verified
                                ? <CheckCircle className="h-4 w-4 text-green-500" />
                                : <AlertTriangle className="h-4 w-4 text-amber-400" />
                              }
                              <span className="text-sm font-medium text-gray-700">{label}</span>
                            </div>
                            <button
                              onClick={() => openDocModal(doc)}
                              className="flex items-center gap-1 text-xs text-[#0070F3] font-semibold hover:underline"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Document
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mb-2">
                            {(['valid', 'invalid', 'cannot_verify'] as DocAdminStatus[]).map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-600">
                                <input
                                  type="radio"
                                  name={`adminDoc_${doc.id}`}
                                  value={opt}
                                  checked={adminSt === opt}
                                  onChange={() => setAdminDocStatus(prev => ({ ...prev, [doc.id]: opt }))}
                                  className="accent-[#0070F3]"
                                />
                                {opt === 'cannot_verify' ? 'Cannot Verify' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                              </label>
                            ))}
                          </div>
                          {(adminSt === 'invalid' || adminSt === 'cannot_verify') && (
                            <textarea
                              rows={2}
                              value={docNotes[doc.id] || ''}
                              onChange={e => setDocNotes(prev => ({ ...prev, [doc.id]: e.target.value }))}
                              placeholder="Notes on this document…"
                              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Section 3 — Referrals */}
              <section>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> Reference Referrals
                  {referrals.length > 0 && (
                    <span className="text-xs font-normal text-gray-400">({confirmedReferrals}/{referrals.length} confirmed)</span>
                  )}
                </h3>
                {referrals.length === 0 ? (
                  <p className="text-sm text-gray-400">No reference contacts submitted.</p>
                ) : (
                  <div className="space-y-2">
                    {referrals.map(r => (
                      <div key={r.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-800">{r.contact_name} <span className="font-normal text-gray-400">· {r.job_title}, {r.company}</span></div>
                          <div className="text-xs text-gray-500 mt-0.5">Vouched for: {r.project_vouched_for}</div>
                          {r.written_statement && <p className="text-xs text-gray-500 mt-1 italic">"{r.written_statement}"</p>}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${r.confirmed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.confirmed ? 'Confirmed' : 'Awaiting confirmation'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </div>

            {/* Section 4 — Decision Panel (sticky bottom) */}
            <div className="bg-white border-t border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Admin Notes <span className="text-red-400 font-normal text-xs">(required)</span>
              </label>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Add internal notes before making a decision…"
                className="w-full mb-4 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
              />

              {/* Rejection reason */}
              {showRejectConfirm && (
                <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm font-semibold text-red-700 mb-2">Select rejection reason:</p>
                  <select
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-3"
                  >
                    <option value="">— choose a reason —</option>
                    {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      disabled={!rejectionReason || decisionBusy}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
                    >
                      {decisionBusy ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                    <button
                      onClick={() => { setShowRejectConfirm(false); setRejectionReason(''); }}
                      disabled={decisionBusy}
                      className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!showRejectConfirm && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleApprove}
                    disabled={notesEmpty || decisionBusy}
                    className="flex items-center gap-1.5 py-2.5 px-4 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
                  >
                    <Check className="h-4 w-4" /> {decisionBusy ? 'Saving...' : 'Verify'}
                  </button>
                  <button
                    onClick={handleRequestChanges}
                    disabled={notesEmpty || decisionBusy}
                    className="flex items-center gap-1.5 py-2.5 px-4 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4" /> {decisionBusy ? 'Saving...' : 'Request Changes'}
                  </button>
                  <button
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={notesEmpty || decisionBusy}
                    className="flex items-center gap-1.5 py-2.5 px-4 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {docModalOpen && docModalDoc && (
        <DocModal
          doc={docModalDoc}
          adminStatus={adminDocStatus[docModalDoc.id] || ''}
          onSave={(status) => handleDocSave(docModalDoc.id, status)}
          onClose={() => { setDocModalOpen(false); setDocModalDoc(null); }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminVerification;
