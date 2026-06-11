import React, { useState } from 'react';
import { MessageSquare, Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import ProposalForm from './ProposalForm';

const MOCK_ENQUIRIES = [
  {
    id: '1',
    type: 'rfp',
    buyer_type: 'Fintech scale-up',
    buyer_location: 'London, UK',
    title: 'Senior React Developer — 6-month contract',
    description:
      'We need a senior React developer with TypeScript experience to join our team and build a customer-facing dashboard. Must have experience with financial data visualization.',
    budget_from: 3000,
    budget_to: 4000,
    timeline: '6 months',
    service_type: 'Staff Augmentation',
    received: '1h ago',
    status: 'new',
    payment_badge: 'green',
  },
  {
    id: '2',
    type: 'discovery',
    buyer_type: 'SaaS platform',
    buyer_location: 'Manchester, UK',
    title: 'Discovery: E-commerce Platform Architecture',
    description:
      'We need a technical specification for migrating our legacy PHP monolith to a modern microservices architecture. Need full scope definition and technology recommendations.',
    budget_from: 2000,
    budget_to: 4000,
    timeline: '3-4 weeks',
    service_type: 'Software Development',
    received: '3h ago',
    status: 'new',
    payment_badge: 'green',
  },
  {
    id: '3',
    type: 'interview',
    buyer_type: 'HealthTech company',
    buyer_location: 'Remote',
    title: 'Interview Request: Anna Kowalczyk — Frontend Developer',
    description: '',
    budget_from: 0,
    budget_to: 0,
    timeline: '3 months',
    service_type: 'Staff Augmentation',
    employee_name: 'Anna Kowalczyk',
    employee_title: 'Mid Frontend Developer',
    interview_type: 'Interview this candidate',
    format: 'Video',
    proposed_times: ['2026-06-15 10:00', '2026-06-16 14:00', '2026-06-17 11:00'],
    message:
      'We are looking for a React developer for a 3-month project. Would love to speak with Anna about her experience with Next.js.',
    received: '6h ago',
    status: 'new',
    payment_badge: 'amber',
  },
];

type Enquiry = typeof MOCK_ENQUIRIES[number] & { [key: string]: any };

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

const PAYMENT_LABEL: Record<string, string> = {
  green: 'Reliable payer',
  amber: 'Average payer',
  red: 'Late payer',
};

const Enquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(MOCK_ENQUIRIES);
  const [selected, setSelected] = useState<string>(MOCK_ENQUIRIES[0].id);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Discovery proposal state
  const [discApproach, setDiscApproach] = useState('');
  const [discSpec, setDiscSpec] = useState('');
  const [discFee, setDiscFee] = useState('');
  const [discDays, setDiscDays] = useState('');
  const [discSubmitted, setDiscSubmitted] = useState(false);

  // Interview state
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showAlternative, setShowAlternative] = useState(false);
  const [altTimes, setAltTimes] = useState(['', '', '']);
  const [interviewConfirmed, setInterviewConfirmed] = useState(false);

  const selectedEnquiry = enquiries.find(e => e.id === selected);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleDecline = (id: string) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'declined' } : e));
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
            onSubmit={(proposal) => {
              showToastMsg(proposal.draft ? 'Draft saved.' : 'Proposal sent to buyer.');
              setShowProposalForm(false);
            }}
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
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">Budget</div>
            <div className="font-bold text-[#0B2D59]">£{enq.budget_from.toLocaleString()}–£{enq.budget_to.toLocaleString()}/month</div>
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
            {PAYMENT_LABEL[enq.payment_badge]}
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
            onClick={() => handleDecline(enq.id)}
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
            <div className="text-xs text-gray-500 mb-1">Budget</div>
            <div className="font-bold text-[#0B2D59]">£{enq.budget_from.toLocaleString()}–£{enq.budget_to.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">Timeline</div>
            <div className="font-bold text-[#0B2D59]">{enq.timeline}</div>
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
              <label className="text-sm font-semibold text-gray-700 block mb-2">Proposed spec structure</label>
              <textarea
                value={discSpec}
                onChange={e => setDiscSpec(e.target.value)}
                rows={4}
                placeholder="List what the specification document will cover: 1. Current architecture assessment 2. ..."
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
              onClick={() => {
                if (discApproach.length >= 100 && discFee) setDiscSubmitted(true);
              }}
              disabled={discApproach.length < 100 || !discFee}
              className="w-full py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send Discovery Proposal
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInterviewDetail = (enq: Enquiry) => {
    const responseDeadline = '48 hours';

    return (
      <div className="p-6 overflow-y-auto flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl font-bold text-[#0B2D59]">Interview Request</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE.interview.color}`}>Interview</span>
        </div>

        {/* Response window */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 font-semibold">Respond within {responseDeadline}</span>
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

        {/* Buyer message */}
        <div className="bg-blue-50 rounded-xl p-4 mb-4">
          <div className="text-xs font-semibold text-blue-500 mb-1 uppercase tracking-wide">Message from buyer</div>
          <p className="text-sm text-gray-700">{enq.message}</p>
        </div>

        {/* Proposed times */}
        <div className="mb-6">
          <div className="text-sm font-semibold text-gray-700 mb-3">Proposed times</div>
          <div className="space-y-2">
            {enq.proposed_times.map((time: string) => (
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
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {!interviewConfirmed && !showAlternative && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (selectedTime) {
                  setInterviewConfirmed(true);
                  showToastMsg('Interview confirmed. Buyer notified.');
                } else {
                  showToastMsg('Please select a proposed time first.');
                }
              }}
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

        {interviewConfirmed && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-sm font-semibold text-green-700">Interview confirmed</div>
              <div className="text-xs text-green-600">{selectedTime} — Buyer has been notified.</div>
            </div>
          </div>
        )}

        {showAlternative && !interviewConfirmed && (
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">Propose alternative times</div>
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
                onClick={() => {
                  setShowAlternative(false);
                  showToastMsg('Alternative times sent to buyer.');
                }}
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
          {enquiries.map(enq => {
            const badge = TYPE_BADGE[enq.type];
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
                    <div className={`w-2 h-2 rounded-full ${PAYMENT_DOT[enq.payment_badge]}`} title={PAYMENT_LABEL[enq.payment_badge]} />
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
            {selectedEnquiry.type === 'rfp' && renderRFPDetail(selectedEnquiry)}
            {selectedEnquiry.type === 'discovery' && renderDiscoveryDetail(selectedEnquiry)}
            {selectedEnquiry.type === 'interview' && renderInterviewDetail(selectedEnquiry)}
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
