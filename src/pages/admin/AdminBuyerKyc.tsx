import React, { useEffect, useState } from 'react';
import {
  FileCheck, FileText, ExternalLink, CheckCircle, AlertTriangle, Eye, Loader2, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

/* ─── Types ─────────────────────────────────────────────────────── */

type DocAdminStatus = 'valid' | 'invalid' | 'cannot_verify' | '';

interface BuyerKycDocument {
  id: string;
  buyer_id: string;
  document_type: string;
  document_url: string | null;
  verification_status: string;
  admin_notes: string | null;
  uploaded_at: string;
}

interface BuyerQueueItem {
  id: string;
  company_name: string | null;
  legal_entity_name: string | null;
  country: string | null;
  industry: string | null;
  buyer_kyc_documents: BuyerKycDocument[];
}

const DOC_LABELS: Record<string, string> = {
  company_registration: 'Company Registration Document',
  proof_of_id: 'Proof of ID (Director/Signatory)',
  proof_of_address: 'Proof of Business Address',
};

const DOC_ORDER = ['company_registration', 'proof_of_id', 'proof_of_address'];

const TABS = [
  { key: 'pending', label: 'Pending Review' },
  { key: 'all', label: 'All' },
];

/* ─── Toast ─────────────────────────────────────────────────────── */

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
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

/* ─── Main Component ────────────────────────────────────────────── */

const AdminBuyerKyc: React.FC = () => {
  const [buyers, setBuyers] = useState<BuyerQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [adminDocStatus, setAdminDocStatus] = useState<Record<string, DocAdminStatus>>({});
  const [docNotes, setDocNotes] = useState<Record<string, string>>({});
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchQueue() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('buyers')
          .select(`
            id, company_name, legal_entity_name, country, industry,
            buyer_kyc_documents (
              id, buyer_id, document_type, document_url, verification_status, admin_notes, uploaded_at
            )
          `)
          .not('buyer_kyc_documents', 'is', null);

        if (cancelled) return;
        if (error) throw error;
        const mapped: BuyerQueueItem[] = ((data || []) as any[])
          .map((b: any) => ({
            id: b.id,
            company_name: b.company_name,
            legal_entity_name: b.legal_entity_name,
            country: b.country,
            industry: b.industry,
            buyer_kyc_documents: (b.buyer_kyc_documents || []) as BuyerKycDocument[],
          }))
          .filter(b => b.buyer_kyc_documents.length > 0);
        setBuyers(mapped);

        const status: Record<string, DocAdminStatus> = {};
        const notes: Record<string, string> = {};
        mapped.forEach(b => b.buyer_kyc_documents.forEach(doc => {
          if (doc.verification_status && doc.verification_status !== 'submitted') {
            status[doc.id] = doc.verification_status as DocAdminStatus;
          }
          if (doc.admin_notes) notes[doc.id] = doc.admin_notes;
        }));
        setAdminDocStatus(status);
        setDocNotes(notes);
      } catch {
        setBuyers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchQueue();
    return () => { cancelled = true; };
  }, []);

  const selectedBuyer = buyers.find(b => b.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedBuyer) { setSignedUrls({}); return; }
    let cancelled = false;
    (async () => {
      const docs = selectedBuyer.buyer_kyc_documents;
      const urlEntries = await Promise.all(docs.map(async (d) => {
        if (!d.document_url) return null;
        const { data: signed } = await supabase.storage.from('buyer-documents').createSignedUrl(d.document_url, 3600);
        return signed?.signedUrl ? [d.id, signed.signedUrl] as const : null;
      }));
      if (cancelled) return;
      const map: Record<string, string> = {};
      urlEntries.forEach(e => { if (e) map[e[0]] = e[1]; });
      setSignedUrls(map);
    })();
    return () => { cancelled = true; };
  }, [selectedBuyer?.id]);

  const pendingDocCount = (b: BuyerQueueItem) =>
    b.buyer_kyc_documents.filter(d => d.verification_status === 'submitted').length;

  const filteredQueue = buyers.filter(b =>
    activeTab === 'pending' ? pendingDocCount(b) > 0 : true
  );

  const persistDocDecisions = async (buyerId: string) => {
    const docs = buyers.find(b => b.id === buyerId)?.buyer_kyc_documents || [];
    await Promise.all(docs.map(doc => {
      const status = adminDocStatus[doc.id];
      if (!status) return Promise.resolve();
      return supabase.from('buyer_kyc_documents').update({
        verification_status: status,
        admin_notes: docNotes[doc.id] || null,
      }).eq('id', doc.id);
    }));
  };

  const handleSave = async () => {
    if (!selectedBuyer) return;
    setSaving(true);
    try {
      await persistDocDecisions(selectedBuyer.id);
      setBuyers(prev => prev.map(b => {
        if (b.id !== selectedBuyer.id) return b;
        return {
          ...b,
          buyer_kyc_documents: b.buyer_kyc_documents.map(doc => ({
            ...doc,
            verification_status: adminDocStatus[doc.id] || doc.verification_status,
            admin_notes: docNotes[doc.id] ?? doc.admin_notes,
          })),
        };
      }));
      setToast('Saved.');
    } catch {
      setToast('Error saving decisions — please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const sortedDocs = (docs: BuyerKycDocument[]) =>
    [...docs].sort((a, b) => DOC_ORDER.indexOf(a.document_type) - DOC_ORDER.indexOf(b.document_type));

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Buyer KYC Review</h1>

      <div className="flex gap-0 flex-1 min-h-0 rounded-xl border border-gray-100 shadow-sm overflow-hidden bg-white">
        {/* ── Left Panel: Queue ── */}
        <div className="w-80 min-w-80 border-r border-gray-100 bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-[#0B2D59]">KYC Queue</span>
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {buyers.filter(b => pendingDocCount(b) > 0).length}
            </span>
          </div>

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

          <div className="flex-1 overflow-y-auto">
            {filteredQueue.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">
                {buyers.length === 0 ? 'No buyer KYC submissions yet.' : 'No buyers in this tab.'}
              </div>
            )}
            {filteredQueue.map(b => {
              const pending = pendingDocCount(b);
              const total = b.buyer_kyc_documents.length;
              return (
                <div
                  key={b.id}
                  className={`border-b border-gray-50 ${selectedId === b.id ? 'bg-blue-50 border-l-2 border-l-[#0070F3]' : ''}`}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-[#0B2D59] text-sm leading-tight">
                        {b.company_name || 'Unnamed company'}
                      </span>
                      {pending > 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                          {pending} pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                      {b.country && <span>{b.country}</span>}
                      <span>· {total} doc{total === 1 ? '' : 's'} uploaded</span>
                    </div>
                    <button
                      onClick={() => setSelectedId(b.id)}
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
        {!selectedBuyer ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a buyer to review</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* Section 1 — Company Summary */}
              <section>
                <h2 className="text-xl font-bold text-[#0B2D59] mb-1">
                  {selectedBuyer.company_name || 'Unnamed company'}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                  {selectedBuyer.legal_entity_name && <span>{selectedBuyer.legal_entity_name}</span>}
                  {selectedBuyer.country && <><span>·</span><span>{selectedBuyer.country}</span></>}
                  {selectedBuyer.industry && <><span>·</span><span>{selectedBuyer.industry}</span></>}
                </div>
              </section>

              {/* Section 2 — Documents */}
              <section>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Documents
                </h3>
                {selectedBuyer.buyer_kyc_documents.length === 0 ? (
                  <p className="text-sm text-gray-400">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {sortedDocs(selectedBuyer.buyer_kyc_documents).map(doc => {
                      const adminSt = adminDocStatus[doc.id] || '';
                      const label = DOC_LABELS[doc.document_type] || doc.document_type;
                      const isVerified = doc.verification_status === 'valid';
                      return (
                        <div key={doc.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isVerified
                                ? <CheckCircle className="h-4 w-4 text-green-500" />
                                : <AlertTriangle className="h-4 w-4 text-amber-400" />
                              }
                              <span className="text-sm font-medium text-gray-700">{label}</span>
                            </div>
                            {signedUrls[doc.id] ? (
                              <a
                                href={signedUrls[doc.id]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-[#0070F3] font-semibold hover:underline"
                              >
                                <Eye className="h-3.5 w-3.5" /> View Document <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-gray-300">No file</span>
                            )}
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

            </div>

            {/* Section 3 — Save Decisions (sticky bottom) */}
            <div className="bg-white border-t border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 py-2.5 px-4 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Decisions'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminBuyerKyc;
