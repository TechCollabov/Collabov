import React, { useState } from 'react';
import { CreditCard, ArrowDownToLine, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const ESCROW = [
  { id: '1', project: 'Cloud Migration — FinEdge Capital', buyer: 'FinEdge Capital', vendor: 'DevForge Agency', milestone: 'Phase 1 Migration', amount: '£8,200', heldSince: '5 days ago', releaseDate: '12 Apr 2026', status: 'dispute', autoRelease: false },
  { id: '2', project: 'React Native App — GreenPath', buyer: 'GreenPath Logistics', vendor: 'TechPro Solutions', milestone: 'MVP Build (Sprint 1)', amount: '£6,500', heldSince: '2 days ago', releaseDate: '18 Apr 2026', status: 'pending_approval', autoRelease: true },
  { id: '3', project: 'ISO 27001 — MedCore Health', buyer: 'MedCore Health', vendor: 'CyberShield MSP', milestone: 'Gap Analysis & ISMS Setup', amount: '£5,500', heldSince: '10 days ago', releaseDate: '10 Apr 2026', status: 'auto_release', autoRelease: true },
  { id: '4', project: 'M365 Migration — Brightstone', buyer: 'Brightstone Solicitors', vendor: 'CloudBridge MSP', milestone: 'Migration Complete', amount: '£3,200', heldSince: '3 weeks ago', releaseDate: '20 Mar 2026', status: 'released', autoRelease: false },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  dispute: { label: 'In Dispute', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  pending_approval: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700', icon: <Clock className="h-3.5 w-3.5" /> },
  auto_release: { label: 'Auto-Release Soon', color: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3.5 w-3.5" /> },
  released: { label: 'Released', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
};

const GMV_SUMMARY = [
  { label: 'Total GMV All Time', value: '£762,000' },
  { label: 'GMV This Month', value: '£94,200' },
  { label: 'Total in Escrow', value: '£23,400' },
  { label: 'Platform Fee (5%)', value: '£4,710' },
];

const AdminPayments: React.FC = () => {
  const [escrow, setEscrow] = useState(ESCROW);

  const releaseManual = (id: string) => setEscrow(es => es.map(e => e.id === id ? { ...e, status: 'released' } : e));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Payments</h1>

      {/* GMV summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {GMV_SUMMARY.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-[#0B2D59]">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Escrow monitor */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Escrow Monitor</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Project / Milestone</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Buyer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Vendor</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Release Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {escrow.map(e => {
              const s = STATUS_MAP[e.status];
              return (
                <tr key={e.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#0B2D59] text-sm">{e.milestone}</div>
                    <div className="text-xs text-gray-400">{e.project}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-sm">{e.buyer}</td>
                  <td className="px-5 py-4 text-gray-600 text-sm">{e.vendor}</td>
                  <td className="px-5 py-4 font-semibold text-[#0070F3]">{e.amount}</td>
                  <td className="px-5 py-4 text-gray-500 text-sm">{e.releaseDate}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
                      {s.icon}{s.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {e.status !== 'released' && e.status !== 'dispute' && (
                      <button
                        onClick={() => releaseManual(e.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-green-600 border border-green-200 px-2.5 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <ArrowDownToLine className="h-3.5 w-3.5" /> Release
                      </button>
                    )}
                    {e.status === 'dispute' && (
                      <span className="text-xs text-red-500 font-medium">Frozen</span>
                    )}
                    {e.status === 'released' && (
                      <span className="text-xs text-gray-400">Done</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPayments;
