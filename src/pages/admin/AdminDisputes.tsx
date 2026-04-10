import React, { useState } from 'react';
import { AlertCircle, Check, X, MessageSquare, Clock } from 'lucide-react';

const DISPUTES = [
  { id: '1', buyer: 'FinEdge Capital', vendor: 'DevForge Agency', project: 'Cloud Migration Phase 1', amount: '£8,200', opened: '1 day ago', status: 'open', priority: 'high', reason: 'Buyer claims milestone was not delivered to spec. Vendor disputes and claims all deliverables were met.' },
  { id: '2', buyer: 'GreenPath Logistics', vendor: 'TechPro Solutions', project: 'React Native App MVP', amount: '£6,500', opened: '4 days ago', status: 'under_review', priority: 'medium', reason: 'Delay in delivery — vendor requested additional time, buyer wants partial refund for missed deadline.' },
  { id: '3', buyer: 'Brightstone Solicitors', vendor: 'CloudBridge MSP', project: 'M365 Migration', amount: '£2,800', opened: '2 weeks ago', status: 'resolved', priority: 'low', reason: 'Billing discrepancy resolved. Vendor issued partial refund of £400.' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-red-100 text-red-700' },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700' },
};

const PRIORITY_MAP: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-600',
};

const AdminDisputes: React.FC = () => {
  const [disputes, setDisputes] = useState(DISPUTES);
  const [selected, setSelected] = useState<string | null>('1');
  const [resolution, setResolution] = useState('');

  const selectedDispute = disputes.find(d => d.id === selected);

  const resolve = (id: string) => {
    setDisputes(ds => ds.map(d => d.id === id ? { ...d, status: 'resolved' } : d));
    setResolution('');
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Disputes</h1>

      <div className="flex gap-5 h-[650px]">
        {/* List */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {disputes.filter(d => d.status !== 'resolved').length} open
          </div>
          {disputes.map(d => {
            const s = STATUS_MAP[d.status];
            return (
              <button
                key={d.id}
                onClick={() => { setSelected(d.id); setResolution(''); }}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected === d.id ? 'bg-blue-50 border-l-2 border-l-[#0070F3]' : ''}`}
              >
                <div className="font-semibold text-[#0B2D59] text-sm mb-0.5">{d.project}</div>
                <div className="text-xs text-gray-500">{d.buyer} vs {d.vendor}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_MAP[d.priority]}`}>{d.priority}</span>
                  <span className="text-xs text-gray-400">{d.opened}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        {selectedDispute ? (
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#0B2D59]">{selectedDispute.project}</h2>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {selectedDispute.buyer} (buyer) vs {selectedDispute.vendor} (vendor)
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_MAP[selectedDispute.status].color}`}>
                  {STATUS_MAP[selectedDispute.status].label}
                </span>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span>Amount in escrow: <strong className="text-[#0070F3]">{selectedDispute.amount}</strong></span>
                <span>Opened: <strong>{selectedDispute.opened}</strong></span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Dispute Reason</div>
                <p className="text-sm text-gray-700">{selectedDispute.reason}</p>
              </div>

              {selectedDispute.status !== 'resolved' && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Resolution Notes</label>
                  <textarea
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                    rows={4}
                    placeholder="Document the resolution decision and any actions taken..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolve(selectedDispute.id)}
                      className="flex items-center gap-1.5 py-2.5 px-4 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="h-4 w-4" /> Mark Resolved
                    </button>
                    <button className="flex items-center gap-1.5 py-2.5 px-4 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                      <MessageSquare className="h-4 w-4" /> Message Both Parties
                    </button>
                  </div>
                </div>
              )}

              {selectedDispute.status === 'resolved' && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">This dispute has been resolved.</span>
                </div>
              )}
            </div>
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
