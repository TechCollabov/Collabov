import React, { useState, useEffect, useCallback } from 'react';
import { Star, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { notify, logEvent, sweepProposalExpiry } from '../lib/workflows';

type Triage = 'keep' | 'maybe' | 'decline' | null;

interface Proposal {
  id: string;
  vendor: string;
  vendor_id: string;
  vendor_type: string;
  verified: boolean;
  vendor_business_type: string;
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
  job_title: string;
  proposal_kind: string;
  enquiry_id: string | null;
  job_id: string | null;
  accepted_at: string | null;
}

const daysAgo = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
};

const timeAgo = (dateStr: string) => {
  const ago = daysAgo(dateStr);
  if (ago === 0) return 'Today';
  if (ago === 1) return 'Yesterday';
  return `${ago} days ago`;
};

// Map workflow_state → triage UI state
function stateToTriage(state: string): Triage {
  if (state === 'keep') return 'keep';
  if (state === 'maybe') return 'maybe';
  if (state === 'declined') return 'decline';
  return null;
}

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
  const { user } = useAuth();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [compared, setCompared] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'keep' | 'maybe' | 'declined'>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ id: string; vendor: string; type: string; budget: number } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProposals = useCallback(async () => {
    if (!user) return;
    try {
      // Lazy "cron": expire anything past 30 days before showing the inbox.
      await sweepProposalExpiry({ buyer_id: user.id });

      // Vendor proposals sent to this buyer (direct RFP/discovery) plus any
      // proposals on this buyer's jobs.
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          id, proposal_content, approach_summary, proposed_budget, proposed_timeline,
          workflow_state, proposal_kind, submitted_at, accepted_at, milestones,
          enquiry_id, job_id, vendor_id, discovery_fee, spec_structure,
          vendors (id, company_name, business_type, rating, review_count, referral_count, is_verified, country),
          enquiries (title, budget_to),
          jobs (title, budget_amount)
        `)
        .eq('buyer_id', user.id)
        .neq('workflow_state', 'draft')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        setProposals([]);
        return;
      }

      const mapped: Proposal[] = (data as any[]).map((p: any) => {
        const vendor = Array.isArray(p.vendors) ? p.vendors[0] : p.vendors;
        const enquiry = Array.isArray(p.enquiries) ? p.enquiries[0] : p.enquiries;
        const job = Array.isArray(p.jobs) ? p.jobs[0] : p.jobs;

        const milestones_detail = (Array.isArray(p.milestones) ? p.milestones : []).map((m: any) => ({
          name: m.name,
          amount: Number(m.amount) || 0,
          date: m.due_date ?? '',
        }));
        const approach_full = p.approach_summary ?? p.proposal_content ?? '';

        const businessType = vendor?.business_type ?? 'agency';
        return {
          id: p.id,
          // Full vendor name is revealed to the buyer now that a proposal exists.
          vendor: vendor?.company_name ?? 'Vendor',
          vendor_id: p.vendor_id,
          vendor_type: vendor?.is_verified ? 'Verified Vendor' : 'Vendor',
          verified: !!vendor?.is_verified,
          vendor_business_type: businessType,
          country: vendor?.country ?? '',
          rating: vendor?.rating ?? 0,
          reviews: vendor?.review_count ?? 0,
          referrals: vendor?.referral_count ?? 0,
          submitted_at: p.submitted_at,
          total: p.proposed_budget ?? 0,
          milestones: milestones_detail.length || 1,
          approach_preview: approach_full.slice(0, 150),
          approach_full,
          milestones_detail,
          status: p.workflow_state,
          triage: stateToTriage(p.workflow_state),
          payment_badge: vendor?.is_verified ? 'green' : 'amber',
          budget_ref: enquiry?.budget_to ?? job?.budget_amount ?? 0,
          job_title: p.proposal_kind === 'discovery'
            ? `Discovery: ${enquiry?.title ?? ''}`
            : (enquiry?.title ?? job?.title ?? ''),
          proposal_kind: p.proposal_kind ?? 'standard',
          enquiry_id: p.enquiry_id,
          job_id: p.job_id,
          accepted_at: p.accepted_at,
        };
      });

      setProposals(mapped.filter(p => !['expired', 'unsuccessful', 'withdrawn'].includes(p.status)));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const setTriage = async (id: string, triage: Triage) => {
    // Optimistic update
    setProposals(prev => prev.map(p => p.id === id ? { ...p, triage } : p));

    const state = triage === 'keep' ? 'keep' : triage === 'maybe' ? 'maybe' : triage === 'decline' ? 'declined' : 'sent';
    const { error } = await supabase
      .from('proposals')
      .update({ workflow_state: state })
      .eq('id', id);

    if (error) {
      // Revert on failure
      await fetchProposals();
    } else if (triage === 'decline') {
      const p = proposals.find(x => x.id === id);
      if (p) {
        // Vendor is notified in-app immediately, per the journey spec.
        await notify(p.vendor_id, 'new_proposal', 'Proposal declined',
          `Your proposal for "${p.job_title || 'the request'}" was declined by the buyer.`);
      }
      showToast('Proposal declined. Vendor will be notified.');
    }
  };

  /** Accept one proposal: commit-to-negotiate. All other live proposals for the
   *  same request auto-decline with notification, then the SOW wizard opens. */
  const acceptProposal = async (id: string) => {
    const chosen = proposals.find(p => p.id === id);
    if (!chosen || !user) return;

    await supabase.from('proposals')
      .update({ workflow_state: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', id);
    await notify(chosen.vendor_id, 'new_proposal', 'Your proposal was accepted',
      'Your proposal was accepted — the buyer is now preparing the SOW. You will receive the contract to sign.',
      '/vendor/dashboard');
    await logEvent('proposal_accepted', user.id, 'buyer', 'proposal', id, { total: chosen.total });

    // Auto-archive competing proposals for the same enquiry/job.
    const rivals = proposals.filter(p =>
      p.id !== id &&
      ['sent', 'keep', 'maybe'].includes(p.status) &&
      ((chosen.enquiry_id && p.enquiry_id === chosen.enquiry_id) ||
       (chosen.job_id && p.job_id === chosen.job_id))
    );
    for (const rival of rivals) {
      await supabase.from('proposals').update({ workflow_state: 'unsuccessful' }).eq('id', rival.id);
      await notify(rival.vendor_id, 'new_proposal', 'Proposal not selected',
        `Your proposal for "${rival.job_title || 'the request'}" was not selected — the buyer chose another vendor.`);
    }

    navigate(
      `/sow-wizard?proposal=${id}&vendorId=${chosen.vendor_id}` +
      `&vendor=${encodeURIComponent(chosen.vendor)}&type=${chosen.vendor_business_type}` +
      `&budget=${chosen.total}&project=${encodeURIComponent(chosen.job_title)}` +
      (chosen.proposal_kind === 'discovery' ? '&discovery=1' : '')
    );
  };

  /** Vendor silent 7 days after acceptance, before signing: buyer may withdraw. */
  const withdrawAcceptance = async (p: Proposal) => {
    await supabase.from('proposals').update({ workflow_state: 'withdrawn' }).eq('id', p.id);
    // Non-response is logged permanently on the vendor profile.
    const { data: v } = await supabase.from('vendors').select('non_response_count').eq('id', p.vendor_id).single();
    await supabase.from('vendors').update({ non_response_count: (v?.non_response_count ?? 0) + 1 }).eq('id', p.vendor_id);
    await notify(p.vendor_id, 'new_proposal', 'Acceptance withdrawn',
      'The buyer withdrew acceptance after 7 days without a response. This non-response is logged on your profile.');
    await logEvent('proposal_withdrawn', user!.id, 'buyer', 'proposal', p.id, { reason: 'vendor_unresponsive' });
    showToast('Acceptance withdrawn. You can pick another proposal.');
    fetchProposals();
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

  const comparedVendorIds = Array.from(new Set(proposals.filter(p => compared.has(p.id)).map(p => p.vendor_id)));

  const filteredProposals = proposals
    .filter(p => {
      if (activeTab === 'all') return true;
      if (activeTab === 'keep') return p.triage === 'keep';
      if (activeTab === 'maybe') return p.triage === 'maybe';
      if (activeTab === 'declined') return p.triage === 'decline';
      return true;
    })
    // Verified vendors first, then by rating, then most recent — matches the
    // "Ranking based on verification status" note shown above the list.
    .sort((a, b) =>
      (Number(b.verified) - Number(a.verified)) ||
      (b.rating - a.rating) ||
      (new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    );

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
    if (!budgetRef) return null;
    const diff = total - budgetRef;
    if (diff <= 0) return <span className="text-green-600 text-sm font-semibold">£{Math.abs(diff).toLocaleString()} under budget</span>;
    return <span className="text-red-600 text-sm font-semibold">£{diff.toLocaleString()} over budget</span>;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

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
            <p className="text-xs text-gray-400 mb-4">
              All other proposals still in Keep or Maybe for this request will be automatically declined
              (their vendors are notified). This is commit-to-negotiate — not yet a signed contract.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const id = confirmModal.id;
                  setConfirmModal(null);
                  acceptProposal(id);
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
          <h1 className="text-2xl font-bold text-[#0B2D59]">Proposal Inbox</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">{proposals.length} proposals received</span>
            <span className="text-xs text-gray-400 italic">Ranked by verification status, then rating — most recent first within each tier.</span>
          </div>
        </div>

        {proposals.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-gray-400">No proposals yet</div>
        ) : (
          <>
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
                  onClick={() => setActiveTab(tab.key as 'all' | 'keep' | 'maybe' | 'declined')}
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

                    {/* Job title badge */}
                    {proposal.job_title && (
                      <div className="mb-2">
                        <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">{proposal.job_title}</span>
                      </div>
                    )}

                    {/* Row 1 */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="font-semibold text-[#0B2D59] text-base">{proposal.vendor}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{proposal.vendor_type}</span>
                      {proposal.country && <span className="text-xs text-gray-500">{proposal.country}</span>}
                      {proposal.rating > 0 && <StarRating rating={proposal.rating} />}
                      {proposal.reviews > 0 && <span className="text-xs text-gray-400">{proposal.reviews} reviews</span>}
                      {proposal.referrals > 0 && (
                        <span className="flex items-center gap-1 text-xs text-teal-600 font-semibold">
                          <UserCheck className="h-3.5 w-3.5" /> {proposal.referrals} referrals
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{timeAgo(proposal.submitted_at)}</span>
                    </div>

                    {/* Row 2 */}
                    <div className="mb-3">{getPaymentBadge(proposal.payment_badge)}</div>

                    {/* Row 3 */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-xl font-bold text-[#0070F3]">£{proposal.total.toLocaleString()}</span>
                      <span className="text-sm text-gray-500">{proposal.milestones} milestone{proposal.milestones !== 1 ? 's' : ''}</span>
                      {getBudgetVariance(proposal.total, proposal.budget_ref)}
                    </div>

                    {/* Row 4 — approach preview */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        {isExpanded ? proposal.approach_full : proposal.approach_preview.slice(0, 150) + (proposal.approach_preview.length > 150 ? '...' : '')}
                      </p>
                      {(proposal.approach_full.length > 150 || proposal.milestones_detail.length > 0) && (
                        <button
                          onClick={() => toggleExpand(proposal.id)}
                          className="flex items-center gap-1 text-xs text-[#0070F3] font-semibold mt-1 hover:text-blue-700"
                        >
                          {isExpanded ? <><ChevronUp className="h-3 w-3" /> Hide full proposal</> : <><ChevronDown className="h-3 w-3" /> Read full proposal</>}
                        </button>
                      )}
                    </div>

                    {/* Row 5 — expanded detail */}
                    {isExpanded && proposal.milestones_detail.length > 0 && (
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

                      {proposal.triage === 'keep' && proposal.status !== 'accepted' && (
                        <button
                          onClick={() => setConfirmModal({ id: proposal.id, vendor: proposal.vendor, type: proposal.vendor_type, budget: proposal.total })}
                          className="px-4 py-1.5 text-sm font-semibold bg-[#0070F3] text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Accept one → SOW
                        </button>
                      )}
                      {proposal.status === 'accepted' && (
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">Accepted — SOW in progress</span>
                          <button
                            onClick={() => navigate(`/sow-wizard?proposal=${proposal.id}&vendorId=${proposal.vendor_id}&vendor=${encodeURIComponent(proposal.vendor)}&type=${proposal.vendor_business_type}&budget=${proposal.total}&project=${encodeURIComponent(proposal.job_title)}`)}
                            className="px-3 py-1.5 text-xs font-semibold bg-[#0070F3] text-white rounded-lg hover:bg-blue-700"
                          >
                            Continue SOW
                          </button>
                          {proposal.accepted_at && daysAgo(proposal.accepted_at) >= 7 && (
                            <button
                              onClick={() => withdrawAcceptance(proposal)}
                              className="px-3 py-1.5 text-xs font-semibold border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                              title="The vendor has not responded for 7 days — you can withdraw and pick another vendor."
                            >
                              Withdraw (vendor unresponsive)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sticky bottom bar — shown when 2–3 proposals are kept */}
      {keepProposals.length >= 2 && keepProposals.length <= 3 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0070F3] text-white px-6 py-4 z-40 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-sm font-semibold">
              {keepProposals.length} proposals in Keep
              {comparedVendorIds.length >= 2 && (
                <>
                  {' '}→{' '}
                  <button
                    onClick={() => navigate(`/compare?ids=${comparedVendorIds.join(',')}`)}
                    className="underline hover:no-underline"
                  >
                    Compare {comparedVendorIds.length} selected
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => {
                const first = keepProposals[0];
                setConfirmModal({ id: first.id, vendor: first.vendor, type: first.vendor_type, budget: first.total });
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
