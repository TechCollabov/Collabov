import React, { useState } from 'react';
import { Star, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_PROPOSALS = [
  {
    id: '1',
    vendor: 'TechForge Solutions',
    vendor_type: 'IT Agency',
    country: 'Poland',
    rating: 4.8,
    reviews: 23,
    referrals: 5,
    submitted_at: '2026-06-09T10:00:00Z',
    total: 28500,
    milestones: 3,
    approach_preview:
      'We propose a phased delivery approach starting with a 2-week discovery sprint to validate requirements...',
    approach_full:
      'We propose a phased delivery approach starting with a 2-week discovery sprint to validate requirements. This will be followed by three development phases, each ending with a client demo and sign-off. Our team of 3 senior engineers and 1 QA specialist will be dedicated to this project full-time. We have delivered 7 similar React platform builds over the past 2 years.',
    milestones_detail: [
      { name: 'Discovery & Architecture', amount: 5000, date: '2026-07-01' },
      { name: 'Core Platform Build', amount: 15000, date: '2026-08-15' },
      { name: 'Testing & Launch', amount: 8500, date: '2026-09-15' },
    ],
    status: 'new',
    triage: null,
    payment_badge: 'green',
    budget_ref: 30000,
  },
  {
    id: '2',
    vendor: 'DevStream Ltd',
    vendor_type: 'IT Agency',
    country: 'UK',
    rating: 4.5,
    reviews: 14,
    referrals: 3,
    submitted_at: '2026-06-09T14:00:00Z',
    total: 31000,
    milestones: 4,
    approach_preview:
      'Our team has delivered 3 similar projects in the fintech space. We will begin with architecture review...',
    approach_full:
      'Our team has delivered 3 similar projects in the fintech space. We will begin with architecture review and stakeholder interviews, followed by rapid prototyping of the core flows. Our delivery is milestone-based with clear acceptance criteria at each stage. We follow agile sprints with weekly demos and a dedicated Slack channel for day-to-day communication.',
    milestones_detail: [
      { name: 'Requirements & Design', amount: 6000, date: '2026-07-05' },
      { name: 'Sprint 1 — Core Features', amount: 10000, date: '2026-08-01' },
      { name: 'Sprint 2 — Integrations', amount: 10000, date: '2026-09-01' },
      { name: 'UAT & Go-Live', amount: 5000, date: '2026-09-30' },
    ],
    status: 'new',
    triage: null,
    payment_badge: 'green',
    budget_ref: 30000,
  },
  {
    id: '3',
    vendor: 'CodeBridge Ukraine',
    vendor_type: 'IT Agency',
    country: 'Ukraine',
    rating: 4.2,
    reviews: 8,
    referrals: 2,
    submitted_at: '2026-05-10T16:00:00Z', // old — triggers expiry warning
    total: 22000,
    milestones: 3,
    approach_preview:
      'Our agile team will deliver the project in 3 milestone phases with weekly progress updates...',
    approach_full:
      'Our agile team will deliver the project in 3 milestone phases with weekly progress updates and transparent Jira tracking. We have 5 React developers available immediately, and our project manager will be your single point of contact throughout. We pride ourselves on clear documentation and handover.',
    milestones_detail: [
      { name: 'Phase 1 — Foundation', amount: 7000, date: '2026-07-15' },
      { name: 'Phase 2 — Features', amount: 10000, date: '2026-08-30' },
      { name: 'Phase 3 — Launch', amount: 5000, date: '2026-09-20' },
    ],
    status: 'new',
    triage: null,
    payment_badge: 'amber',
    budget_ref: 30000,
  },
];

type Triage = 'keep' | 'maybe' | 'decline' | null;

interface Proposal {
  id: string;
  vendor: string;
  vendor_type: string;
  country: string;
  rating: number;
  reviews: number;
  referrals: number;
  submitted_at: string;
  total: number;
  milestones: number;
  approach_preview: string;
  approach_full: string;
  milestones_detail: { name: string; amount: number; date: string }[];
  status: string;
  triage: Triage;
  payment_badge: string;
  budget_ref: number;
}

const daysAgo = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date('2026-06-10');
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
};

const timeAgo = (dateStr: string) => {
  const ago = daysAgo(dateStr);
  if (ago === 0) return 'Today';
  if (ago === 1) return 'Yesterday';
  return `${ago} days ago`;
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        className={`h-3 w-3 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
      />
    ))}
    <span className="text-xs text-gray-600 ml-1">{rating}</span>
  </span>
);

const ProposalTriagePage: React.FC = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS as Proposal[]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [compared, setCompared] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'keep' | 'maybe' | 'declined'>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ vendor: string; type: string; budget: number } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const setTriage = (id: string, triage: Triage) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, triage } : p));
    if (triage === 'decline') showToast('Proposal declined. Vendor will be notified.');
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCompare = (id: string) => {
    setCompared(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const keepProposals = proposals.filter(p => p.triage === 'keep');
  const maybeProposals = proposals.filter(p => p.triage === 'maybe');
  const declinedProposals = proposals.filter(p => p.triage === 'decline');

  const filteredProposals = proposals.filter(p => {
    if (activeTab === 'all') return true;
    if (activeTab === 'keep') return p.triage === 'keep';
    if (activeTab === 'maybe') return p.triage === 'maybe';
    if (activeTab === 'declined') return p.triage === 'decline';
    return true;
  });

  const getBorderColor = (triage: Triage) => {
    if (triage === 'keep') return 'border-green-200';
    if (triage === 'maybe') return 'border-amber-200';
    if (triage === 'decline') return 'border-red-200';
    return 'border-gray-200';
  };

  const getPaymentBadge = (badge: string) => {
    if (badge === 'green') return <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Reliable payer</span>;
    if (badge === 'amber') return <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Average payer</span>;
    return <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Late payer</span>;
  };

  const getBudgetVariance = (total: number, budgetRef: number) => {
    const diff = total - budgetRef;
    if (diff <= 0) return <span className="text-green-600 text-sm font-semibold">£{Math.abs(diff).toLocaleString()} under budget</span>;
    return <span className="text-red-600 text-sm font-semibold">£{diff.toLocaleString()} over budget</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-lg font-bold text-[#0B2D59] mb-2">Accept proposal?</h3>
            <p className="text-sm text-gray-600 mb-6">
              You're about to accept <strong>{confirmModal.vendor}</strong>'s proposal for{' '}
              <strong>£{confirmModal.budget.toLocaleString()}</strong>. This will proceed to SOW creation.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmModal(null);
                  navigate(`/sow-wizard?vendor=${encodeURIComponent(confirmModal.vendor)}&type=${encodeURIComponent(confirmModal.type)}&budget=${confirmModal.budget}`);
                }}
                className="flex-1 py-2.5 bg-[#0070F3] text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm"
              >
                Accept & create SOW
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0B2D59]">Proposal Inbox — React Platform Build</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">{proposals.length} proposals received</span>
            <span className="text-xs text-gray-400 italic">Ranking based on verification status — scores build with history.</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
          {[
            { key: 'all', label: `All (${proposals.length})` },
            { key: 'keep', label: `Keep (${keepProposals.length})` },
            { key: 'maybe', label: `Maybe (${maybeProposals.length})` },
            { key: 'declined', label: `Declined (${declinedProposals.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#0070F3] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Proposal cards */}
        <div>
          {filteredProposals.map(proposal => {
            const isExpanded = expanded.has(proposal.id);
            const isCompared = compared.has(proposal.id);
            const ago = daysAgo(proposal.submitted_at);
            const showExpiry = ago > 25;
            const daysLeft = 30 - ago;

            return (
              <div
                key={proposal.id}
                className={`bg-white rounded-2xl shadow-sm border-2 p-5 mb-4 transition-all ${getBorderColor(proposal.triage)}`}
              >
                {/* Expiry warning */}
                {showExpiry && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-amber-700 font-medium">
                    This proposal expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                  </div>
                )}

                {/* Row 1 */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="font-semibold text-[#0B2D59] text-base">{proposal.vendor}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{proposal.vendor_type}</span>
                  <span className="text-xs text-gray-500">{proposal.country}</span>
                  <StarRating rating={proposal.rating} />
                  <span className="text-xs text-gray-400">{proposal.reviews} reviews</span>
                  <span className="flex items-center gap-1 text-xs text-teal-600 font-semibold">
                    <UserCheck className="h-3.5 w-3.5" /> {proposal.referrals} referrals
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{timeAgo(proposal.submitted_at)}</span>
                </div>

                {/* Row 2 */}
                <div className="mb-3">{getPaymentBadge(proposal.payment_badge)}</div>

                {/* Row 3 */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-xl font-bold text-[#0070F3]">£{proposal.total.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">{proposal.milestones} milestones</span>
                  {getBudgetVariance(proposal.total, proposal.budget_ref)}
                </div>

                {/* Row 4 — approach preview */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    {isExpanded ? proposal.approach_full : proposal.approach_preview.slice(0, 150) + (proposal.approach_preview.length > 150 ? '...' : '')}
                  </p>
                  <button
                    onClick={() => toggleExpand(proposal.id)}
                    className="flex items-center gap-1 text-xs text-[#0070F3] font-semibold mt-1 hover:text-blue-700"
                  >
                    {isExpanded ? <><ChevronUp className="h-3 w-3" /> Hide full proposal</> : <><ChevronDown className="h-3 w-3" /> Read full proposal</>}
                  </button>
                </div>

                {/* Row 5 — expanded detail */}
                {isExpanded && (
                  <div className="mb-4 mt-2">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Milestones</div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 font-semibold">
                          <tr>
                            <th className="text-left px-3 py-2">Milestone</th>
                            <th className="text-left px-3 py-2">Amount</th>
                            <th className="text-left px-3 py-2">Target date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proposal.milestones_detail.map((m, i) => (
                            <tr key={i} className="border-t border-gray-50">
                              <td className="px-3 py-2">{m.name}</td>
                              <td className="px-3 py-2 font-semibold">£{m.amount.toLocaleString()}</td>
                              <td className="px-3 py-2 text-gray-500">{m.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Row 6 — triage actions */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setTriage(proposal.id, proposal.triage === 'keep' ? null : 'keep')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg border transition-colors ${
                      proposal.triage === 'keep'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-green-600 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    Keep
                  </button>
                  <button
                    onClick={() => setTriage(proposal.id, proposal.triage === 'maybe' ? null : 'maybe')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg border transition-colors ${
                      proposal.triage === 'maybe'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-amber-500 text-amber-600 hover:bg-amber-50'
                    }`}
                  >
                    Maybe
                  </button>
                  <button
                    onClick={() => setTriage(proposal.id, proposal.triage === 'decline' ? null : 'decline')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                      proposal.triage === 'decline'
                        ? 'bg-red-100 text-red-600 border border-red-200'
                        : 'text-red-500 hover:text-red-700'
                    }`}
                  >
                    Decline
                  </button>
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 ml-auto cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCompared}
                      onChange={() => toggleCompare(proposal.id)}
                      disabled={!isCompared && compared.size >= 4}
                      className="rounded"
                    />
                    Compare
                  </label>

                  {proposal.triage === 'keep' && (
                    <button
                      onClick={() => setConfirmModal({ vendor: proposal.vendor, type: proposal.vendor_type, budget: proposal.total })}
                      className="px-4 py-1.5 text-sm font-semibold bg-[#0070F3] text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Accept one → SOW
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom bar */}
      {keepProposals.length >= 2 && keepProposals.length <= 3 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0070F3] text-white px-6 py-4 z-40 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-sm font-semibold">
              {keepProposals.length} proposals in Keep →{' '}
              <button
                onClick={() => navigate('/compare')}
                className="underline hover:no-underline"
              >
                Compare selected
              </button>
            </div>
            <button
              onClick={() => {
                const first = keepProposals[0];
                setConfirmModal({ vendor: first.vendor, type: first.vendor_type, budget: first.total });
              }}
              className="bg-white text-[#0070F3] px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors"
            >
              Accept one to proceed to SOW
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalTriagePage;
