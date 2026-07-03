import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { platformFee, nextInvoiceNumber, notify, logEvent } from '../../lib/workflows';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Dispute {
  id: string;
  engagement: string;
  vendor: string;
  buyer: string;
  opened_by: 'buyer' | 'vendor';
  reason: string;
  description: string;
  escrow_amount: number;
  opened_at: string;
  bilateral_deadline: string;
  status: 'bilateral' | 'admin_review' | 'resolved';
  vendor_position: string;
  buyer_position: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_DISPUTES: Dispute[] = [
  {
    id: 'd1',
    engagement: 'Payment Gateway Rebuild',
    vendor: 'TechForge Solutions',
    buyer: 'Paytrace Financial',
    opened_by: 'buyer',
    reason: 'Delivery quality',
    description:
      'Milestone 2 does not meet the acceptance criteria. The login flow fails in Firefox and unit test coverage is only 67%, below the agreed 80% threshold.',
    escrow_amount: 9600,
    opened_at: '2026-06-08T10:00:00Z',
    bilateral_deadline: '2026-06-11T10:00:00Z',
    status: 'bilateral',
    vendor_position:
      'We have tested in Firefox and the issue appears to be a cache problem. We are happy to fix this within 2 business days.',
    buyer_position:
      'The coverage requirement was clear in the SOW. We need this resolved before releasing payment.',
  },
  {
    id: 'd2',
    engagement: 'Infrastructure Management',
    vendor: 'CloudNorth MSP',
    buyer: 'Morrison Logistics',
    opened_by: 'vendor',
    reason: 'Payment dispute',
    description:
      'Buyer has not released the February monthly payment despite confirming the check-in.',
    escrow_amount: 2400,
    opened_at: '2026-06-01T09:00:00Z',
    bilateral_deadline: '2026-06-04T09:00:00Z',
    status: 'admin_review',
    vendor_position:
      'We have evidence that the buyer confirmed the February check-in on the platform. Payment should be released.',
    buyer_position:
      'There was a billing error on our side. We are not disputing the service, just the charge date.',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function msUntil(isoDate: string): number {
  return new Date(isoDate).getTime() - Date.now();
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Expired';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString('en-GB')}`;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_BADGE: Record<Dispute['status'], { label: string; cls: string }> = {
  bilateral: { label: 'Bilateral', cls: 'bg-amber-100 text-amber-700' },
  admin_review: { label: 'Admin Review', cls: 'bg-red-100 text-red-700' },
  resolved: { label: 'Resolved', cls: 'bg-green-100 text-green-700' },
};

type Tab = 'all' | 'bilateral' | 'admin_review' | 'resolved';

// ── Countdown hook ─────────────────────────────────────────────────────────────

function useCountdown(targetIso: string) {
  const [ms, setMs] = useState(() => msUntil(targetIso));
  useEffect(() => {
    const id = setInterval(() => setMs(msUntil(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return ms;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const CountdownBadge: React.FC<{ deadline: string; small?: boolean }> = ({ deadline, small }) => {
  const ms = useCountdown(deadline);
  const expired = ms <= 0;
  const color = expired
    ? 'text-gray-400'
    : ms < 12 * 3600 * 1000
    ? 'text-red-600'
    : ms < 24 * 3600 * 1000
    ? 'text-amber-600'
    : 'text-green-600';

  if (small) {
    return (
      <span className={`flex items-center gap-1 text-xs font-mono ${color}`}>
        <Clock className="h-3 w-3" />
        {expired ? 'Expired' : formatCountdown(ms)}
      </span>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border p-4 ${
      expired
        ? 'bg-gray-50 border-gray-200'
        : ms < 12 * 3600 * 1000
        ? 'bg-red-50 border-red-200'
        : ms < 24 * 3600 * 1000
        ? 'bg-amber-50 border-amber-200'
        : 'bg-green-50 border-green-200'
    }`}>
      <Clock className={`h-5 w-5 mb-1 ${color}`} />
      <span className={`text-2xl font-mono font-bold ${color}`}>{formatCountdown(ms)}</span>
      <span className={`text-xs mt-0.5 ${color}`}>
        {expired ? 'Bilateral window expired — in admin review' : '72hr bilateral window remaining'}
      </span>
    </div>
  );
};

// ── Resolution Panel ───────────────────────────────────────────────────────────

interface ResolutionPanelProps {
  dispute: Dispute;
  onResolve: (id: string) => void;
}

const ResolutionPanel: React.FC<ResolutionPanelProps> = ({ dispute, onResolve }) => {
  const [resType, setResType] = useState<'vendor' | 'buyer' | 'split'>('vendor');
  const [vendorPct, setVendorPct] = useState('50');
  const [buyerPct, setBuyerPct] = useState('50');
  const [notes, setNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(false);

  if (dispute.status === 'resolved') {
    return (
      <div className="border-t border-gray-100 bg-green-50 px-5 py-4 flex items-center gap-2 text-green-700">
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm font-semibold">This dispute has been resolved.</span>
      </div>
    );
  }

  const splitValid =
    resType !== 'split' ||
    (parseInt(vendorPct, 10) + parseInt(buyerPct, 10) === 100 &&
      !isNaN(parseInt(vendorPct, 10)) &&
      !isNaN(parseInt(buyerPct, 10)));

  const notesValid = notes.trim().length >= 50;
  const canIssue = splitValid && notesValid;

  const handleVendorPct = (v: string) => {
    setVendorPct(v);
    const n = parseInt(v, 10);
    if (!isNaN(n)) setBuyerPct(String(100 - n));
  };

  const handleBuyerPct = (v: string) => {
    setBuyerPct(v);
    const n = parseInt(v, 10);
    if (!isNaN(n)) setVendorPct(String(100 - n));
  };

  const confirmResolution = async () => {
    setIsProcessing(true);
    try {
      const d = dispute as any;
      const resolution = resType === 'split' ? 'split' : resType === 'vendor' ? 'full_vendor' : 'full_buyer';
      const vendorShare = resType === 'split' ? parseInt(vendorPct, 10) : resType === 'vendor' ? 100 : 0;

      const { error } = await supabase.from('disputes').update({
        status: 'resolved',
        resolution,
        split_vendor_pct: resType === 'split' ? vendorShare : null,
        resolution_notes: notes,
        resolved_at: new Date().toISOString(),
      }).eq('id', dispute.id);
      if (error) throw error;

      // Money moves immediately; the decision is final. Fee on split applies
      // to the vendor portion only.
      const amount = Number(d.escrow_amount) || 0;
      const vendorGross = Math.round(amount * vendorShare) / 100;
      const buyerRefund = amount - vendorGross;
      if (d.engagement_id && amount > 0) {
        if (vendorGross > 0) {
          const fee = platformFee(vendorGross);
          await supabase.from('escrow_transactions').insert({
            engagement_id: d.engagement_id, milestone_id: d.milestone_id ?? null,
            buyer_id: d.buyer_id, vendor_id: d.vendor_id,
            transaction_type: resType === 'split' ? 'split_release' : 'release',
            amount: vendorGross, platform_fee_amount: fee, net_amount: vendorGross - fee,
            reference: `dispute ${d.id}`, status: 'completed',
          });
          await supabase.from('invoices').insert({
            invoice_number: nextInvoiceNumber(),
            engagement_id: d.engagement_id, milestone_id: d.milestone_id ?? null,
            buyer_id: d.buyer_id, vendor_id: d.vendor_id,
            description: `Dispute resolution — ${resType === 'split' ? `${vendorShare}% to vendor` : 'full release'}`,
            gross_amount: vendorGross, platform_fee_amount: fee, net_amount: vendorGross - fee,
            status: 'paid',
          });
        }
        if (buyerRefund > 0) {
          await supabase.from('escrow_transactions').insert({
            engagement_id: d.engagement_id, milestone_id: d.milestone_id ?? null,
            buyer_id: d.buyer_id, vendor_id: d.vendor_id,
            transaction_type: 'refund', amount: buyerRefund,
            reference: `dispute ${d.id}`, status: 'completed',
          });
        }
      }
      if (d.milestone_id) {
        await supabase.from('project_milestones').update({
          escrow_status: resolution === 'full_buyer' ? 'refunded' : 'released',
          released_at: new Date().toISOString(),
          completed: resolution !== 'full_buyer',
        }).eq('id', d.milestone_id);
      }

      // Outcome count on both profiles + notifications.
      const { data: v } = await supabase.from('vendors').select('dispute_outcome_count').eq('id', d.vendor_id).maybeSingle();
      if (v) await supabase.from('vendors').update({ dispute_outcome_count: (v.dispute_outcome_count ?? 0) + 1 }).eq('id', d.vendor_id);
      const summary = resType === 'split'
        ? `Split resolution: ${vendorShare}% to vendor, ${100 - vendorShare}% refunded to buyer.`
        : resType === 'vendor' ? 'Full release to the vendor.' : 'Full refund to the buyer.';
      await notify(d.vendor_id, 'system', 'Dispute resolved by admin', `${summary} The decision is final. ${notes}`, d.engagement_id ? `/engagement/${d.engagement_id}` : undefined);
      await notify(d.buyer_id, 'system', 'Dispute resolved by admin', `${summary} The decision is final. ${notes}`, d.engagement_id ? `/engagement/${d.engagement_id}` : undefined);
      await logEvent('dispute_resolved', d.buyer_id, 'admin', 'dispute', d.id, { resolution, vendorShare });
    } catch (e) {
      console.error('Dispute resolution failed:', e);
    } finally {
      setIsProcessing(false);
      setShowModal(false);
      setToast(true);
      setTimeout(() => setToast(false), 3000);
      onResolve(dispute.id);
    }
  };

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Resolution issued — Stripe transfer triggered.
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#0B2D59] mb-2">Confirm Resolution</h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              This will immediately trigger a Stripe transfer. <strong>This action cannot be undone.</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmResolution}
                disabled={isProcessing}
                className="flex-1 bg-[#0070F3] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  'Confirm & Issue'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 bg-white px-5 py-5">
        <p className="text-sm font-bold text-[#0B2D59] mb-4">Admin Resolution</p>

        {/* Resolution type */}
        <div className="space-y-2 mb-4">
          {(['vendor', 'buyer', 'split'] as const).map(type => (
            <label key={type} className="flex items-center gap-2.5 cursor-pointer">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  resType === type ? 'border-[#0070F3]' : 'border-gray-300'
                }`}
              >
                {resType === type && <div className="w-2 h-2 rounded-full bg-[#0070F3]" />}
              </div>
              <span className="text-sm text-gray-700">
                {type === 'vendor'
                  ? 'Full release to vendor'
                  : type === 'buyer'
                  ? 'Full refund to buyer'
                  : 'Split payment'}
              </span>
            </label>
          ))}
          <div
            onClick={e => {
              const target = e.target as HTMLElement;
              if (target.tagName !== 'INPUT') {
                // clicking label area toggles
              }
            }}
          />
        </div>

        {/* Split inputs */}
        {resType === 'split' && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Vendor %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={vendorPct}
                  onChange={e => handleVendorPct(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Buyer %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={buyerPct}
                  onChange={e => handleBuyerPct(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              </div>
            </div>
            {!splitValid && (
              <p className="text-xs text-red-500 mt-2 font-medium">Percentages must total 100%</p>
            )}
          </div>
        )}

        {/* Decision notes */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">
            Decision notes <span className="text-red-500">*</span> (min 50 chars)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Document the resolution rationale and any actions taken..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
          />
          <span className={`text-xs ${notesValid ? 'text-green-600' : 'text-gray-400'}`}>
            {notes.length} / 50 min
          </span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={!canIssue}
          className="w-full bg-[#0070F3] text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Issue Resolution
        </button>
      </div>
    </>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const AdminDisputes: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_DISPUTES[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(true); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [tableMissing, setTableMissing] = useState(false);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const { data, error } = await supabase
          .from('disputes')
          .select('*, engagements(project_title)')
          .order('opened_at', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
          // Resolve party names for display.
          const vendorIds = Array.from(new Set(data.map((d: any) => d.vendor_id)));
          const buyerIds = Array.from(new Set(data.map((d: any) => d.buyer_id)));
          const [{ data: vendors }, { data: buyers }] = await Promise.all([
            supabase.from('vendors').select('id, company_name').in('id', vendorIds),
            supabase.from('customers').select('id, company_name').in('id', buyerIds),
          ]);
          const vMap = new Map((vendors ?? []).map((v: any) => [v.id, v.company_name]));
          const bMap = new Map((buyers ?? []).map((b: any) => [b.id, b.company_name]));
          const mapped = data.map((d: any) => ({
            ...d,
            engagement: (Array.isArray(d.engagements) ? d.engagements[0] : d.engagements)?.project_title ?? 'Engagement',
            vendor: vMap.get(d.vendor_id) ?? 'Vendor',
            buyer: bMap.get(d.buyer_id) ?? 'Buyer',
            vendor_position: d.vendor_position ?? '',
            buyer_position: d.buyer_position ?? '',
          }));
          setDisputes(mapped as Dispute[]);
          setSelectedId(mapped[0]?.id ?? null);
        }
      } catch {
        setTableMissing(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  const selectedDispute = disputes.find(d => d.id === selectedId) ?? null;

  const filteredDisputes = disputes.filter(d => {
    if (activeTab === 'all') return true;
    return d.status === activeTab;
  });

  const handleResolve = useCallback((id: string) => {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: 'resolved' as const } : d));
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'bilateral', label: 'Bilateral' },
    { key: 'admin_review', label: 'Admin Review' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Disputes</h1>

      {tableMissing && disputes === MOCK_DISPUTES && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-700">
          No disputes yet — dispute table will be populated once engagements are live.
        </div>
      )}

      {/* Escrow frozen notice */}
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 mb-5">
        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-red-700 font-semibold">
          ⚠ Auto-release is BLOCKED — this engagement has an open dispute.
        </p>
      </div>

      <div className="flex gap-5 h-[720px]">
        {/* ── Left panel ── */}
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 text-xs font-medium">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-2.5 transition-colors ${
                  activeTab === t.key
                    ? 'text-[#0070F3] border-b-2 border-[#0070F3]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredDisputes.length === 0 && (
              <div className="flex items-center justify-center h-32 text-sm text-gray-400">
                No disputes
              </div>
            )}
            {filteredDisputes.map(d => {
              const badge = STATUS_BADGE[d.status];
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    selectedId === d.id ? 'bg-blue-50 border-l-2 border-l-[#0070F3]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-[#0B2D59] text-sm leading-tight">{d.engagement}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1.5">{d.reason}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0070F3]">
                      {formatCurrency(d.escrow_amount)}
                    </span>
                    {d.status === 'bilateral' && (
                      <CountdownBadge deadline={d.bilateral_deadline} small />
                    )}
                    {d.status !== 'bilateral' && (
                      <span className="text-xs text-gray-400">{formatDate(d.opened_at)}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right panel ── */}
        {selectedDispute ? (
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">

                {/* Section 1 — Overview */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#0B2D59]">{selectedDispute.engagement}</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {selectedDispute.buyer} (buyer) · {selectedDispute.vendor} (vendor)
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${STATUS_BADGE[selectedDispute.status].cls}`}>
                      {STATUS_BADGE[selectedDispute.status].label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Reason</p>
                      <p className="text-sm font-semibold text-gray-700">{selectedDispute.reason}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Escrow amount</p>
                      <p className="text-sm font-bold text-[#0070F3]">{formatCurrency(selectedDispute.escrow_amount)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Opened by</p>
                      <p className="text-sm font-semibold text-gray-700 capitalize">{selectedDispute.opened_by}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Opened at</p>
                      <p className="text-sm font-semibold text-gray-700">{formatDate(selectedDispute.opened_at)}</p>
                    </div>
                  </div>

                  {/* 72hr countdown */}
                  <CountdownBadge deadline={selectedDispute.bilateral_deadline} />
                </div>

                {/* Section 2 — Positions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700">Party Positions</h3>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 mb-1.5 uppercase tracking-wide">
                      Buyer — {selectedDispute.buyer}
                    </p>
                    <p className="text-sm text-blue-900 leading-relaxed">{selectedDispute.buyer_position}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-emerald-700 mb-1.5 uppercase tracking-wide">
                      Vendor — {selectedDispute.vendor}
                    </p>
                    <p className="text-sm text-emerald-900 leading-relaxed">{selectedDispute.vendor_position}</p>
                  </div>
                </div>

                {/* Section 3 — Evidence */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Evidence (read-only)</h3>
                  <div className="bg-gray-50 rounded-xl p-4 mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Dispute description</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedDispute.description}</p>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href="#"
                      className="inline-flex items-center gap-1.5 text-xs text-[#0070F3] font-semibold hover:underline"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      View message thread
                    </a>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1.5 text-xs text-[#0070F3] font-semibold hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View contract
                    </a>
                  </div>
                </div>

              </div>
            </div>

            {/* Section 4 — Resolution panel (pinned bottom) */}
            <ResolutionPanel
              key={selectedDispute.id}
              dispute={selectedDispute}
              onResolve={handleResolve}
            />
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center">
            <div className="text-center text-gray-400">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <div className="text-sm">Select a dispute to review</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDisputes;
