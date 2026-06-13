import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Clock, Check, X, MessageSquare, FileText, ExternalLink,
  CheckCircle, AlertTriangle, AlertCircle, Eye, Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

/* ─── Types ─────────────────────────────────────────────────────── */

type VendorDocument = {
  id: string;
  vendor_id: string;
  document_type: string;
  document_url: string;
  verified: boolean;
  uploaded_at: string;
};

type QueueItem = {
  id: string;
  company_name: string;
  business_type?: string;
  country?: string;
  created_at?: string;
  is_verified: boolean;
  contact_email?: string;
  tagline?: string;
  description?: string;
  monthly_rate?: number;
  vendor_documents?: VendorDocument[];
  // UI-only status field (derived)
  status: string;
};
type DocKey = 'companiesHouse' | 'addressProof' | 'vatCert';
type DocAdminStatus = 'valid' | 'invalid' | 'cannot_verify' | '';

const DOC_LABELS: Record<DocKey, string> = {
  companiesHouse: 'Companies House Registration Certificate',
  addressProof: 'Proof of Business Address',
  vatCert: 'VAT Registration Certificate',
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  submitted:          { label: 'Pending Review',      color: 'bg-amber-100 text-amber-700' },
  under_review:       { label: 'Under Review',        color: 'bg-blue-100 text-blue-700' },
  changes_requested:  { label: 'Changes Requested',   color: 'bg-orange-100 text-orange-700' },
  approved:           { label: 'Approved',             color: 'bg-green-100 text-green-700' },
  rejected:           { label: 'Rejected',             color: 'bg-red-100 text-red-700' },
};

const TABS = [
  { key: 'all',              label: 'All' },
  { key: 'submitted',        label: 'Pending' },
  { key: 'under_review',     label: 'Under Review' },
  { key: 'approved',         label: 'Approved' },
  { key: 'rejected',         label: 'Rejected' },
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
  doc: { name: string; url: string; status: string; notes: string };
  adminStatus: DocAdminStatus;
  onSave: (status: DocAdminStatus) => void;
  onClose: () => void;
}

function DocModal({ doc, adminStatus, onSave, onClose }: DocModalProps) {
  const [localStatus, setLocalStatus] = useState<DocAdminStatus>(adminStatus || '');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#0B2D59] text-base truncate pr-4">{doc.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview placeholder */}
        <div className="h-96 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 mb-5">
          <FileText className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">Document preview — {doc.name}</p>
          <p className="text-xs mt-1 text-gray-300">In production, this renders the signed S3 URL as an iframe PDF viewer.</p>
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

const AdminVerification: React.FC = () => {
  const [queueData, setQueueData] = useState(QUEUE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docModalDoc, setDocModalDoc] = useState<{ key: DocKey; doc: NonNullable<QueueItem['documents'][DocKey]> } | null>(null);
  const [adminDocStatus, setAdminDocStatus] = useState<Record<string, DocAdminStatus>>({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selectedVendor = queueData.find(v => v.id === selectedId) ?? null;

  const filteredQueue = queueData.filter(v =>
    activeTab === 'all' ? true : v.status === activeTab
  );

  // TODO: Replace with real Supabase update: supabase.from('vendors').update({ verification_status: 'approved' }).eq('id', vendor.id)
  const handleApprove = () => {
    if (!selectedVendor) return;
    setQueueData(q => q.map(v => v.id === selectedVendor.id ? { ...v, status: 'approved' } : v));
    setAdminNotes('');
    setToast('Vendor verified. Welcome email would be sent.');
  };

  // TODO: Replace with real Supabase update: supabase.from('vendors').update({ verification_status: 'changes_requested' }).eq('id', vendor.id)
  const handleRequestChanges = () => {
    if (!selectedVendor) return;
    setQueueData(q => q.map(v => v.id === selectedVendor.id ? { ...v, status: 'changes_requested' } : v));
    setAdminNotes('');
    setToast('Changes requested. Vendor notified.');
  };

  // TODO: Replace with real Supabase update: supabase.from('vendors').update({ verification_status: 'rejected' }).eq('id', vendor.id)
  const handleReject = () => {
    if (!selectedVendor || !rejectionReason) return;
    setQueueData(q => q.map(v => v.id === selectedVendor.id ? { ...v, status: 'rejected' } : v));
    setAdminNotes('');
    setRejectionReason('');
    setShowRejectConfirm(false);
    setToast('Vendor rejected.');
  };

  const handleDocSave = (key: DocKey, status: DocAdminStatus) => {
    if (!selectedVendor) return;
    setAdminDocStatus(prev => ({ ...prev, [`${selectedVendor.id}_${key}`] : status }));
  };

  const openDocModal = (key: DocKey, doc: NonNullable<QueueItem['documents'][DocKey]>) => {
    setDocModalDoc({ key, doc });
    setDocModalOpen(true);
  };

  const notesEmpty = adminNotes.trim() === '';

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Vendor Verification</h1>

      <div className="flex gap-0 flex-1 min-h-0 rounded-xl border border-gray-100 shadow-sm overflow-hidden bg-white">
        {/* ── Left Panel: Queue ── */}
        <div className="w-80 min-w-80 border-r border-gray-100 bg-white flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-[#0B2D59]">Verification Queue</span>
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {queueData.filter(v => v.status === 'submitted').length}
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
              <div className="p-6 text-center text-gray-400 text-sm">No vendors in this tab.</div>
            )}
            {filteredQueue.map(v => {
              const age = daysAgo(v.submitted_at);
              const timeColor = age > 7 ? 'text-red-500' : age > 3 ? 'text-amber-500' : 'text-gray-400';
              const s = STATUS_MAP[v.status] ?? STATUS_MAP['submitted'];
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
                      <span className="capitalize bg-gray-100 px-1.5 py-0.5 rounded">{v.business_type}</span>
                      <span>·</span>
                      <span>{v.country}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs mb-2 ${timeColor}`}>
                      <Clock className="h-3 w-3" /> {fmtDate(v.submitted_at)} ({age}d ago)
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
                  <span className="capitalize bg-gray-100 px-2 py-0.5 rounded font-medium">{selectedVendor.business_type}</span>
                  <span>·</span>
                  <span>{selectedVendor.country}</span>
                  <span>·</span>
                  <span>Submitted {fmtDate(selectedVendor.submitted_at)}</span>
                  <span>·</span>
                  <a href={`mailto:${selectedVendor.contact_email}`} className="text-[#0070F3] hover:underline flex items-center gap-1">
                    {selectedVendor.contact_email} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{selectedVendor.profile.tagline}</p>
                <p className="text-sm text-gray-600 mb-3">{selectedVendor.profile.description}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedVendor.profile.tech_stack.map(t => (
                    <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">{t}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">From <span className="font-semibold text-gray-700">£{selectedVendor.profile.monthly_rate_min.toLocaleString()}/month</span></p>
              </section>

              {/* Section 2 — Documents */}
              <section>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Documents
                </h3>
                <div className="space-y-3">
                  {(Object.keys(DOC_LABELS) as DocKey[]).map(key => {
                    const doc = selectedVendor.documents[key];
                    const adminSt = adminDocStatus[`${selectedVendor.id}_${key}`] || '';
                    return (
                      <div key={key} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {doc ? (
                              doc.status === 'valid'
                                ? <CheckCircle className="h-4 w-4 text-green-500" />
                                : <AlertTriangle className="h-4 w-4 text-amber-400" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-300" />
                            )}
                            <span className="text-sm font-medium text-gray-700">{DOC_LABELS[key]}</span>
                          </div>
                          {doc ? (
                            <button
                              onClick={() => openDocModal(key, doc)}
                              className="flex items-center gap-1 text-xs text-[#0070F3] font-semibold hover:underline"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Document
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Not uploaded</span>
                          )}
                        </div>
                        {doc && (
                          <>
                            <p className="text-xs text-gray-500 mb-3">{doc.name}</p>
                            {/* Admin radio */}
                            <div className="flex flex-wrap items-center gap-4 mb-2">
                              {(['valid', 'invalid', 'cannot_verify'] as DocAdminStatus[]).map(opt => (
                                <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-600">
                                  <input
                                    type="radio"
                                    name={`adminDoc_${selectedVendor.id}_${key}`}
                                    value={opt}
                                    checked={adminSt === opt}
                                    onChange={() => setAdminDocStatus(prev => ({ ...prev, [`${selectedVendor.id}_${key}`]: opt }))}
                                    className="accent-[#0070F3]"
                                  />
                                  {opt === 'cannot_verify' ? 'Cannot Verify' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                                </label>
                              ))}
                            </div>
                            {(adminSt === 'invalid' || adminSt === 'cannot_verify') && (
                              <textarea
                                rows={2}
                                placeholder="Notes on this document…"
                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
                              />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Section 3 — Referrals */}
              <section>
                <h3 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Referrals
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {selectedVendor.referrals.filter(r => r.confirmed).length} of {selectedVendor.referrals.length} referrals confirmed
                </p>
                <div className="space-y-3">
                  {selectedVendor.referrals.map((ref, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-[#0B2D59]">{ref.contact_name}</p>
                          <p className="text-xs text-gray-500">{ref.job_title} · {ref.company}</p>
                        </div>
                        {ref.confirmed ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle className="h-3.5 w-3.5" /> Confirmed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            <Clock className="h-3.5 w-3.5" /> Awaiting confirmation
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-2">
                        <div><span className="font-medium text-gray-700">Project</span><br />{ref.project}</div>
                        <div><span className="font-medium text-gray-700">Duration</span><br />{ref.duration}</div>
                        <div><span className="font-medium text-gray-700">Value Band</span><br />{ref.value_band}</div>
                      </div>
                      <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 italic">"{ref.outcome}"</p>
                    </div>
                  ))}
                </div>
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
                      disabled={!rejectionReason}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => { setShowRejectConfirm(false); setRejectionReason(''); }}
                      className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
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
                    disabled={notesEmpty}
                    className="flex items-center gap-1.5 py-2.5 px-4 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
                  >
                    <Check className="h-4 w-4" /> Verify
                  </button>
                  <button
                    onClick={handleRequestChanges}
                    disabled={notesEmpty}
                    className="flex items-center gap-1.5 py-2.5 px-4 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4" /> Request Changes
                  </button>
                  <button
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={notesEmpty}
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
          doc={docModalDoc.doc}
          adminStatus={adminDocStatus[`${selectedVendor?.id}_${docModalDoc.key}`] || ''}
          onSave={(status) => handleDocSave(docModalDoc.key, status)}
          onClose={() => { setDocModalOpen(false); setDocModalDoc(null); }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminVerification;
