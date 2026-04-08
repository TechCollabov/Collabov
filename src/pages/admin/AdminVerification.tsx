import React, { useState } from 'react';
import { ShieldCheck, Clock, Check, X, MessageSquare, FileText, ExternalLink, ChevronRight } from 'lucide-react';

const QUEUE = [
  { id: '1', name: 'TechPro Solutions', type: 'IT Agency', country: 'Poland', submitted: '3 days ago', docs: { companiesHouse: true, vatCert: true, addressProof: false }, status: 'pending', email: 'admin@techpro.co.uk', website: 'techpro.co.uk' },
  { id: '2', name: 'NexGen IT', type: 'IT Agency', country: 'UK', submitted: '5 days ago', docs: { companiesHouse: true, vatCert: false, addressProof: false }, status: 'pending', email: 'hello@nexgenit.co.uk', website: 'nexgenit.co.uk' },
  { id: '3', name: 'CyberShield MSP', type: 'MSP', country: 'UK', submitted: '1 week ago', docs: { companiesHouse: true, vatCert: true, addressProof: true }, status: 'pending', email: 'ops@cybershield.co.uk', website: 'cybershield.co.uk' },
  { id: '4', name: 'DataFlow Labs', type: 'IT Agency', country: 'Romania', submitted: '2 weeks ago', docs: { companiesHouse: false, vatCert: false, addressProof: false }, status: 'changes_requested', email: 'team@dataflowlabs.io', website: 'dataflowlabs.io' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700' },
  changes_requested: { label: 'Changes Requested', color: 'bg-orange-100 text-orange-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

const AdminVerification: React.FC = () => {
  const [vendors, setVendors] = useState(QUEUE);
  const [selected, setSelected] = useState<string | null>('1');
  const [note, setNote] = useState('');

  const selectedVendor = vendors.find(v => v.id === selected);

  const updateStatus = (id: string, status: string) => {
    setVendors(vs => vs.map(v => v.id === id ? { ...v, status } : v));
    setNote('');
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Vendor Verification</h1>

      <div className="flex gap-5 h-[700px]">
        {/* Queue list */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {vendors.filter(v => v.status === 'pending' || v.status === 'changes_requested').length} pending
          </div>
          {vendors.map(v => {
            const s = STATUS_MAP[v.status];
            return (
              <button
                key={v.id}
                onClick={() => setSelected(v.id)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected === v.id ? 'bg-blue-50 border-l-2 border-l-[#0070F3]' : ''}`}
              >
                <div className="font-semibold text-[#0B2D59] text-sm mb-0.5">{v.name}</div>
                <div className="text-xs text-gray-500">{v.type} · {v.country}</div>
                <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                  <Clock className="h-3 w-3" /> {v.submitted}
                </div>
                <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Review panel */}
        {selectedVendor ? (
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#0B2D59]">{selectedVendor.name}</h2>
                  <div className="text-sm text-gray-500 mt-0.5">{selectedVendor.type} · {selectedVendor.country} · Submitted {selectedVendor.submitted}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <a href={`mailto:${selectedVendor.email}`} className="hover:text-[#0070F3]">{selectedVendor.email}</a>
                    <a href="#" className="flex items-center gap-0.5 hover:text-[#0070F3]">{selectedVendor.website} <ExternalLink className="h-3 w-3" /></a>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_MAP[selectedVendor.status].color}`}>
                  {STATUS_MAP[selectedVendor.status].label}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Documents */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> Submitted Documents</div>
                <div className="space-y-2">
                  {[
                    { key: 'companiesHouse', label: 'Companies House Registration Certificate', required: true },
                    { key: 'vatCert', label: 'VAT Registration Certificate', required: false },
                    { key: 'addressProof', label: 'Proof of Business Address', required: false },
                  ].map(doc => {
                    const uploaded = selectedVendor.docs[doc.key as keyof typeof selectedVendor.docs];
                    return (
                      <div key={doc.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="text-sm text-gray-700">{doc.label} {doc.required && <span className="text-red-400 text-xs">*required</span>}</div>
                        {uploaded ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><Check className="h-3.5 w-3.5" /> Uploaded</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-400"><X className="h-3.5 w-3.5" /> Missing</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Internal Note / Request Message</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={4}
                  placeholder="Add a note or request specific documents from the vendor..."
                  className="w-full mt-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => updateStatus(selectedVendor.id, 'approved')}
                  className="flex items-center gap-1.5 py-2.5 px-4 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="h-4 w-4" /> Approve Vendor
                </button>
                <button
                  onClick={() => updateStatus(selectedVendor.id, 'changes_requested')}
                  className="flex items-center gap-1.5 py-2.5 px-4 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" /> Request Changes
                </button>
                <button
                  onClick={() => updateStatus(selectedVendor.id, 'rejected')}
                  className="flex items-center gap-1.5 py-2.5 px-4 border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center">
            <div className="text-center text-gray-400">
              <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <div className="text-sm">Select a vendor to review</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerification;
