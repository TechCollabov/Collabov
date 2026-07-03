import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Clock, CheckCircle2, Calendar, Loader2 } from 'lucide-react';
import ProposalForm from './ProposalForm';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { addDays, notify, logEvent, paymentBadge, PAYMENT_BADGE_LABEL, PROPOSAL_EXPIRY_DAYS } from '../../../lib/workflows';

interface Enquiry {
  id: string;
  kind: 'rfp' | 'discovery' | 'interview';
  customer_id: string;
  title: string;
  description: string;
  budget_from: number;
  budget_to: number;
  timeline: string;
  service_type: string;
  buyer_type: string;
  buyer_location: string;
  received: string;
  status: string;
  payment_badge: 'green' | 'amber' | 'red';
  // interview extras
  employee_name?: string;
  employee_title?: string;
  interview_type?: string;
  format?: string;
  proposed_times?: string[];
  message?: string;
  raw?: any;
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  rfp: { label: 'RFP', color: 'bg-blue-100 text-blue-700' },
  discovery: { label: 'Discovery', color: 'bg-purple-100 text-purple-700' },
  interview: { label: 'Interview', color: 'bg-amber-100 text-amber-700' },
};

const PAYMENT_DOT: Record<string, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-400',
  red: 'bg-red-500',
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

const Enquiries: React.FC = () => {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Discovery proposal state
  const [discApproach, setDiscApproach] = useState('');
  const [discSpec, setDiscSpec] = useState('');
  const [discFee, setDiscFee] = useState('');
  const [discDays, setDiscDays] = useState('');
  const [discSubmitted, setDiscSubmitted] = useState(false);
  const [discSending, setDiscSending] = useState(false);

  // Interview state
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showAlternative, setShowAlternative] = useState(false);
  const [altTimes, setAltTimes] = useState(['', '', '']);
  const [interviewConfirmed, setInterviewConfirmed] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [enqRes, intRes] = await Promise.all([
      supabase
        .from('enquiries')
        .select('*, customers(company_name, country, industry, on_time_payment_rate)')
        .eq('vendor_id', user.id)
        .neq('status', 'declined')
        .order('created_at', { ascending: false }),
      supabase
        .from('interview_requests')
        .select('*, vendor_employees(name, role, job_title), customers:buyer_id(country, industry, on_time_payment_rate)')
        .eq('vendor_id', user.id)
        .in('status', ['requested', 'confirmed'])
        .order('created_at', { ascending: false }),
    ]);

    const rows: Enquiry[] = [];
    for (const e of enqRes.data ?? []) {
      const cust: any = e.customers;
      rows.push({
        id: e.id,
        kind: e.enquiry_type === 'discovery_brief' ? 'discovery' : 'rfp',
        customer_id: e.customer_id,
        title: e.title || e.subject,
        description: e.message,
        budget_from: e.budget_from ?? 0,
        budget_to: e.budget_to ?? 0,
        timeline: e.start_date && e.end_date ? `${e.start_date} → ${e.end_date}` : 'Flexible',
        service_type: e.service_type ?? 'Not specified',
        // Buyer is anonymised until a proposal is sent: type + location only.
        buyer_type: cust?.industry ? `${cust.industry} company` : 'Company',
        buyer_location: cust?.country ?? 'Unknown',
        received: timeAgo(e.created_at),
        status: e.status ?? 'new',
        payment_badge: paymentBadge(cust?.on_time_payment_rate ?? 100),
        raw: e,
      });
    }
    for (const i of intRes.data ?? []) {
      const emp: any = i.vendor_employees;
      const cust: any = i.customers;
      rows.push({
        id: i.id,
        kind: 'interview',
        customer_id: i.buyer_id,
        title: `Interview Request: ${emp?.name ?? 'Employee'}`,
        description: '',
        budget_from: 0,
        budget_to: 0,
        timeline: '',
        service_type: 'Staff Augmentation',
        buyer_type: cust?.industry ? `${cust.industry} company` : 'Company',
        buyer_location: cust?.country ?? 'Unknown',
        received: timeAgo(i.created_at),
        status: i.status,
        payment_badge: paymentBadge(cust?.on_time_payment_rate ?? 100),
        employee_name: emp?.name,
        employee_title: emp?.job_title ?? emp?.role ?? '',
        interview_type: i.interview_type === 'discovery_call' ? 'General discovery call' : 'Interview this candidate',
        format: i.format === 'in_person' ? 'In-person' : i.format === 'phone' ? 'Phone' : 'Video',
        proposed_times: Array.isArray(i.proposed_times) ? i.proposed_times.map(String) : [],
        raw: i,
      });
    }
    rows.sort((a, b) => (a.received > b.received ? 1 : -1));
    setEnquiries(rows);
    setSelected(prev => prev ?? rows[0]?.id ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const selectedEnquiry = enquiries.find(e => e.id === selected);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleDecline = async (enq: Enquiry) => {
    await supabase.from('enquiries').update({ status: 'declined' }).eq('id', enq.id);
    await notify(enq.customer_id, 'enquiry', 'Enquiry declined',
      `The vendor declined your request "${enq.title}". You can approach another vendor from search.`);
    setEnquiries(prev => prev.filter(e => e.id !== enq.id));
    showToastMsg('Enquiry declined.');
  };

  const handleSelect = (id: string) => {
    setSelected(id);
    setShowProposalForm(false);
    setDiscSubmitted(false);
    setInterviewConfirmed(false);
    setShowAlternative(false);
    setSelectedTime(null);
  };

  const submitProposal = async (enq: Enquiry, proposal: any) => {
    if (!user) return;
    const isDraft = !!proposal.draft;
    try {
      const milestonesJson = proposal.milestones
        .filter((m: any) => m.name.trim())
        .map((m: any) => ({
          name: m.name,
          description: m.description,
          amount: parseFloat(m.amount) || 0,
          due_date: m.target_date || null,
        }));
      const { data: created, error } = await supabase.from('proposals').insert({
        vendor_id: user.id,
        customer_id: enq.customer_id,
        enquiry_id: enq.id,
        proposal_kind: 'standard',
        proposal_content: proposal.approach,
        approach_summary: proposal.approach,
        proposed_team: proposal.team ? { description: proposal.team } : null,
        milestones: milestonesJson,
        assumptions: proposal.assumptions || null,
        exclusions: proposal.exclusions || null,
        proposed_budget: proposal.total || 0,
        proposed_timeline: milestonesJson.at(-1)?.due_date ?? 'See milestones',
        workflow_state: isDraft ? 'draft' : 'sent',
        expires_at: isDraft ? null : addDays(new Date(), PROPOSAL_EXPIRY_DAYS).toISOString(),
      }).select().single();
      if (error) throw error;

      if (!isDraft) {
        await supabase.from('enquiries').update({ status: 'responded', responded_at: new Date().toISOString() }).eq('id', enq.id);
        await notify(enq.customer_id, 'new_proposal', 'New proposal received',
          `A vendor responded to "${enq.title}". Review it in your Proposals inbox.`, '/proposals');
        await logEvent('proposal_submitted', user.id, 'vendor', 'proposal', created.id, { total: proposal.total });
      }
      showToastMsg(isDraft ? 'Draft saved to My Proposals.' : 'Proposal sent to buyer. 30-day expiry clock started.');
      setShowProposalForm(false);
      load();
    } catch (e) {
      console.error('Proposal submit failed:', e);
      showToastMsg('Could not send the proposal. Please try again.');
    }
  };

  const submitDiscoveryProposal = async (enq: Enquiry) => {
    if (!user || discApproach.length < 100 || !discFee) return;
    setDiscSending(true);
    try {
      const specItems = discSpec.split('\n').map(s => s.trim()).filter(Boolean);
      const { data: created, error } = await supabase.from('proposals').insert({
        vendor_id: user.id,
        customer_id: enq.customer_id,
        enquiry_id: enq.id,
        proposal_kind: 'discovery',
        proposal_content: discApproach,
        approach_summary: discApproach,
        spec_structure: specItems,
        discovery_fee: Number(discFee),
        timeline_days: Number(discDays) || null,
        proposed_budget: Number(discFee),
        proposed_timeline: `${discDays || '?'} working days`,
        workflow_state: 'sent',
        expires_at: addDays(new Date(), PROPOSAL_EXPIRY_DAYS).toISOString(),
      }).select().single();
      if (error) throw error;
      await supabase.from('enquiries').update({ status: 'responded', responded_at: new Date().toISOString() }).eq('id', enq.id);
      await notify(enq.customer_id, 'new_proposal', 'Discovery proposal received',
        'The agency responded to your discovery brief. Review the proposed spec structure and fee.', '/proposals');
      await logEvent('proposal_submitted', user.id, 'vendor', 'proposal', created.id, { kind: 'discovery' });
      setDiscSubmitted(true);
    } catch (e) {
      console.error('Discovery proposal failed:', e);
      showToastMsg('Could not send the discovery proposal.');
    } finally {
      setDiscSending(false);
    }
  };

  const confirmInterview = async (enq: Enquiry) => {
    if (!selectedTime) { showToastMsg('Please select a proposed time first.'); return; }
    await supabase.from('interview_requests').update({
      status: 'confirmed',
      confirmed_time: new Date(selectedTime).toISOString(),
    }).eq('id', enq.id);
    await notify(enq.customer_id, 'enquiry', 'Interview confirmed',
      `${enq.employee_name} is confirmed for ${new Date(selectedTime).toLocaleString('en-GB')}.`);
    setInterviewConfirmed(true);
    showToastMsg('Interview confirmed. Buyer notified.');
  };

  const sendAlternatives = async (enq: Enquiry) => {
    const times = altTimes.filter(Boolean);
    if (times.length === 0) { showToastMsg('Add at least one alternative time.'); return; }
    await supabase.from('interview_requests').update({
      alternative_times: times.map(t => new Date(t).toISOString()),
    }).eq('id', enq.id);
    await notify(enq.customer_id, 'enquiry', 'Alternative interview times proposed',
      `The vendor proposed ${times.length} alternative time(s) for the interview with ${enq.employee_name}. Pick one to confirm.`);
    setShowAlternative(false);
    showToastMsg('Alternative times sent to buyer.');
  };

  const renderRFPDetail = (enq: Enquiry) => {
    if (showProposalForm) {
      return (
        <div className="p-5 overflow-y-auto flex-1">
          <ProposalForm
            rfp={{
              title: enq.title,
              description: enq.description,
              budget_from: enq.budget_from,
              budget_to: enq.budget_to,
              service_type: enq.service_type,
              buyer_type: enq.buyer_type,
              buyer_location: enq.buyer_location,
            }}
            onSubmit={(proposal) => submitProposal(enq, proposal)}
            onCancel={() => setShowProposalForm(false)}
          />
        </div>
      );
    }

    return (
      <div className="p-6 overflow-y-auto flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl font-bold text-[#0B2D59]">RFP — {enq.title}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE.rfp.color}`}>RFP</span>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          <span className="font-medium text-gray-700">{enq.buyer_type}</span> — {enq.buyer_location}
          <span className="ml-2 text-xs text-gray-400">(full buyer name shown after you send a proposal)</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">Budget</div>
            <div className="font-bold text-[#0B2D59]">
              {enq.budget_from || enq.budget_to
                ? `£${enq.budget_from.toLocaleString()}–£${enq.budget_to.toLocaleString()}`
                : 'Not specified'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">Timeline</div>
            <div className="font-bold text-[#0B2D59]">{enq.timeline}</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Brief</div>
          <p className="text-sm text-gray-700 leading-relaxed">{enq.description}</p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-semibold text-gray-700">Payment Reliability:</span>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              enq.payment_badge === 'green'
                ? 'bg-green-100 text-green-700'
                : enq.payment_badge === 'amber'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {PAYMENT_BADGE_LABEL[enq.payment_badge]}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowProposalForm(true)}
            className="px-5 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Respond
          </button>
          <button
            onClick={() => handleDecline(enq)}
            className="px-5 py-2.5 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    );
  };

  const renderDiscoveryDetail = (enq: Enquiry) => {
    if (discSubmitted) {
      return (
        <div className="p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <div className="font-bold text-[#0B2D59] text-lg mb-1">Discovery proposal sent!</div>
            <div className="text-sm text-gray-500">The buyer will review and respond shortly.</div>
            <button
              onClick={() => setDiscSubmitted(false)}
              className="mt-4 text-sm text-[#0070F3] hover:text-blue-700 font-semibold"
            >
              Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 overflow-y-auto flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl font-bold text-[#0B2D59]">Discovery Brief — {enq.title}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE.discovery.color}`}>Discovery</span>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          <span className="font-medium text-gray-700">{enq.buyer_type}</span> — {enq.buyer_location}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">Proposed budget</div>
            <div className="font-bold text-[#0B2D59]">
              {enq.budget_from ? `£${enq.budget_from.toLocaleString()}` : 'Open'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">Expected output</div>
            <div className="font-bold text-[#0B2D59]">{enq.raw?.expected_output ?? 'Specification'}</div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-4 mb-6">
          <div className="text-xs font-semibold text-purple-500 mb-2 uppercase tracking-wide">Discovery Brief</div>
          <p className="text-sm text-gray-700 leading-relaxed">{enq.description}</p>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-semibold text-[#0B2D59] mb-4">Respond with Discovery Proposal</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Approach summary</label>
              <textarea
                value={discApproach}
                onChange={e => setDiscApproach(e.target.value)}
                rows={4}
                placeholder="Describe your discovery approach..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
              />
              {discApproach.length > 0 && discApproach.length < 100 && (
                <div className="text-xs text-red-500 mt-1">{discApproach.length} / 100 minimum</div>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Proposed spec structure <span className="font-normal text-gray-400">(one item per line, min 3)</span>
              </label>
              <textarea
                value={discSpec}
                onChange={e => setDiscSpec(e.target.value)}
                rows={4}
                placeholder={'Current architecture assessment\nTarget architecture & tech recommendations\nMigration roadmap & cost model'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Discovery fee (£)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">£</span>
                  <input
                    type="number"
                    value={discFee}
                    onChange={e => setDiscFee(e.target.value)}
                    placeholder="2500"
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Timeline</label>
                <div className="relative">
                  <input
                    type="number"
                    value={discDays}
                    onChange={e => setDiscDays(e.target.value)}
                    placeholder="10"
                    className="w-full pr-24 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">working days</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => submitDiscoveryProposal(enq)}
              disabled={discApproach.length < 100 || !discFee || discSpec.split('\n').filter(s => s.trim()).length < 3 || discSending}
              className="w-full py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {discSending ? 'Sending…' : 'Send Discovery Proposal'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInterviewDetail = (enq: Enquiry) => {
    return (
      <div className="p-6 overflow-y-auto flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl font-bold text-[#0B2D59]">Interview Request</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE.interview.color}`}>Interview</span>
        </div>

        {/* Response window */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 font-semibold">
            Respond within 48 hours or the buyer is prompted to pick another employee
          </span>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          <span className="font-medium text-gray-700">{enq.buyer_type}</span> — {enq.buyer_location}
        </div>

        {/* Employee info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="font-semibold text-[#0B2D59] text-base mb-0.5">{enq.employee_name}</div>
          <div className="text-sm text-gray-500">{enq.employee_title}</div>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span className="font-medium text-gray-700">{enq.interview_type}</span>
            <span>·</span>
            <span>{enq.format} interview</span>
          </div>
        </div>

        {/* Proposed times */}
        <div className="mb-6">
          <div className="text-sm font-semibold text-gray-700 mb-3">Proposed times</div>
          <div className="space-y-2">
            {(enq.proposed_times ?? []).map((time: string) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left ${
                  selectedTime === time
                    ? 'border-[#0070F3] bg-blue-50 text-[#0070F3]'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Calendar className="h-4 w-4 flex-shrink-0" />
                {new Date(time).toLocaleString('en-GB')}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {!interviewConfirmed && !showAlternative && enq.status !== 'confirmed' && (
          <div className="flex gap-3">
            <button
              onClick={() => confirmInterview(enq)}
              className="flex-1 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Confirm availability
            </button>
            <button
              onClick={() => setShowAlternative(true)}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Propose alternative dates
            </button>
          </div>
        )}

        {(interviewConfirmed || enq.status === 'confirmed') && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-sm font-semibold text-green-700">Interview confirmed</div>
              <div className="text-xs text-green-600">
                {selectedTime ? new Date(selectedTime).toLocaleString('en-GB') : enq.raw?.confirmed_time ? new Date(enq.raw.confirmed_time).toLocaleString('en-GB') : ''} — Buyer has been notified.
              </div>
            </div>
          </div>
        )}

        {showAlternative && !interviewConfirmed && (
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">Propose alternative times (max 3)</div>
            <div className="space-y-2 mb-4">
              {altTimes.map((t, i) => (
                <input
                  key={i}
                  type="datetime-local"
                  value={t}
                  onChange={e => {
                    const next = [...altTimes];
                    next[i] = e.target.value;
                    setAltTimes(next);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => sendAlternatives(enq)}
                className="flex-1 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Send alternative times
              </button>
              <button
                onClick={() => setShowAlternative(false)}
                className="py-2.5 px-4 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2D59]">Enquiries</h1>
        <p className="text-sm text-gray-500 mt-1">Respond to inbound enquiries from potential clients</p>
      </div>

      <div className="flex gap-0 h-[720px] bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Left panel */}
        <div className="w-80 flex-shrink-0 border-r border-gray-100 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-[#0070F3] animate-spin" /></div>
          ) : enquiries.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              No enquiries yet. Buyers find you through search — keep your listing complete.
            </div>
          ) : enquiries.map(enq => {
            const badge = TYPE_BADGE[enq.kind];
            const isSelected = selected === enq.id;
            return (
              <button
                key={enq.id}
                onClick={() => handleSelect(enq.id)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-[#0070F3]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.color}`}>{badge.label}</span>
                  <div className="flex items-center gap-1.5">
                    {enq.status === 'new' && <div className="w-2 h-2 rounded-full bg-[#0070F3]" />}
                    <div className={`w-2 h-2 rounded-full ${PAYMENT_DOT[enq.payment_badge]}`} title={PAYMENT_BADGE_LABEL[enq.payment_badge]} />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900 truncate mb-1">{enq.title}</div>
                <div className="text-xs text-gray-500 truncate mb-1">{enq.buyer_type} · {enq.buyer_location}</div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" /> {enq.received}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right panel */}
        {selectedEnquiry ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedEnquiry.kind === 'rfp' && renderRFPDetail(selectedEnquiry)}
            {selectedEnquiry.kind === 'discovery' && renderDiscoveryDetail(selectedEnquiry)}
            {selectedEnquiry.kind === 'interview' && renderInterviewDetail(selectedEnquiry)}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <div className="text-sm">Select an enquiry to view</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Enquiries;
