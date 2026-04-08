import React, { useState } from 'react';
import { MessageSquare, Clock, Check, X, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';

const ENQUIRIES = [
  {
    id: '1',
    from: 'Sarah Mitchell',
    company: 'FinEdge Capital',
    companyType: 'Financial Services',
    subject: 'Cloud Infrastructure Modernisation',
    budget: '£40,000–£70,000',
    timeline: '4 months',
    received: '2 hours ago',
    status: 'new',
    message: 'Hi, we are looking for an experienced MSP or IT agency to migrate our on-premise infrastructure to AWS. The scope includes architecture, phased migration, DR setup, and documentation. Would love to understand your approach and availability.',
  },
  {
    id: '2',
    from: 'James Okafor',
    company: 'GreenPath Logistics',
    companyType: 'Logistics',
    subject: 'React Native Mobile App',
    budget: '£25,000–£45,000',
    timeline: '3 months',
    received: '1 day ago',
    status: 'new',
    message: 'We need a driver-facing mobile app built in React Native. Features include route optimisation, proof of delivery, and fleet integration. Are you available to start in May?',
  },
  {
    id: '3',
    from: 'Amanda Hughes',
    company: 'MedCore Health',
    companyType: 'Healthcare',
    subject: 'ISO 27001 Certification Support',
    budget: '£18,000–£30,000',
    timeline: '6 months',
    received: '3 days ago',
    status: 'responded',
    message: 'We require full ISO 27001 certification support including gap analysis, ISMS documentation, staff training, and pre-certification review.',
  },
  {
    id: '4',
    from: 'David Park',
    company: 'TradePoint Exchange',
    companyType: 'FinTech',
    subject: 'DevOps Team — Ongoing Retainer',
    budget: '£12,000/month',
    timeline: 'Ongoing',
    received: '1 week ago',
    status: 'declined',
    message: 'Looking for a dedicated DevOps team for Kubernetes management, CI/CD pipelines, and on-call rotation in a fintech environment.',
  },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  responded: { label: 'Responded', color: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', color: 'bg-gray-100 text-gray-500' },
};

const AI_DRAFT = `Thank you for reaching out regarding your project. Based on the brief you've shared, we believe this is a strong match with our team's expertise.

We have delivered similar engagements for clients in your sector and would be happy to schedule a discovery call to understand your requirements in more detail.

Could you share more about your current infrastructure setup and the key pain points you're looking to resolve? We'd like to propose a tailored approach.

Looking forward to speaking with you.`;

const Enquiries: React.FC = () => {
  const [selected, setSelected] = useState<string | null>('1');
  const [reply, setReply] = useState('');
  const [aiDrafted, setAiDrafted] = useState(false);

  const selectedEnquiry = ENQUIRIES.find(e => e.id === selected);

  const handleAiDraft = () => {
    setReply(AI_DRAFT);
    setAiDrafted(true);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2D59]">Enquiries</h1>
        <p className="text-sm text-gray-500 mt-1">Respond to inbound enquiries from potential clients</p>
      </div>

      <div className="flex gap-5 h-[680px]">
        {/* List */}
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-y-auto">
          {ENQUIRIES.map(enq => {
            const s = STATUS_MAP[enq.status];
            return (
              <button
                key={enq.id}
                onClick={() => { setSelected(enq.id); setReply(''); setAiDrafted(false); }}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected === enq.id ? 'bg-blue-50 border-l-2 border-l-[#0070F3]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-semibold text-[#0B2D59] text-sm truncate">{enq.from}</div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                </div>
                <div className="text-xs text-gray-500 mb-1">{enq.company} · {enq.companyType}</div>
                <div className="text-xs font-medium text-gray-700 truncate">{enq.subject}</div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <Clock className="h-3 w-3" />{enq.received}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {selectedEnquiry ? (
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-[#0B2D59] text-lg">{selectedEnquiry.subject}</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    from <span className="font-medium text-gray-700">{selectedEnquiry.from}</span> at {selectedEnquiry.company}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><X className="h-4 w-4" /></button>
                  <button className="p-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span>Budget: <strong className="text-gray-700">{selectedEnquiry.budget}</strong></span>
                <span>Timeline: <strong className="text-gray-700">{selectedEnquiry.timeline}</strong></span>
                <span>Received: <strong className="text-gray-700">{selectedEnquiry.received}</strong></span>
              </div>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed mb-6">
                {selectedEnquiry.message}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Your Reply</label>
                  <button
                    onClick={handleAiDraft}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#0070F3] border border-[#0070F3] px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> AI Draft
                  </button>
                </div>
                {aiDrafted && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">AI-generated draft — review before sending</div>
                )}
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={8}
                  placeholder="Type your reply..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
                />
                <div className="flex gap-2">
                  <button
                    disabled={!reply.trim()}
                    onClick={() => alert('Reply sent!')}
                    className="py-2.5 px-5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Send Reply
                  </button>
                  <button className="py-2.5 px-4 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50">
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center">
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
