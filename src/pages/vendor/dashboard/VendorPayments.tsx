import React, { useState } from 'react';
import { CreditCard, ArrowDownToLine, Clock, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

const MILESTONES = [
  { id: '1', project: 'Cloud Migration — FinEdge Capital', milestone: 'Discovery & Architecture', amount: '£4,200', dueDate: '10 Apr 2026', status: 'pending', client: 'FinEdge Capital' },
  { id: '2', project: 'React Native App — GreenPath', milestone: 'MVP Build (Sprint 1)', amount: '£6,500', dueDate: '18 Apr 2026', status: 'pending', client: 'GreenPath Logistics' },
  { id: '3', project: 'Cloud Migration — FinEdge Capital', milestone: 'Phase 1 Migration', amount: '£8,000', dueDate: '5 May 2026', status: 'upcoming', client: 'FinEdge Capital' },
  { id: '4', project: 'ISO 27001 — MedCore Health', milestone: 'Gap Analysis & ISMS Setup', amount: '£5,500', dueDate: '12 Mar 2026', status: 'released', client: 'MedCore Health' },
  { id: '5', project: 'ISO 27001 — MedCore Health', milestone: 'Internal Audit', amount: '£4,800', dueDate: '28 Feb 2026', status: 'released', client: 'MedCore Health' },
  { id: '6', project: 'M365 Migration — Brightstone', milestone: 'Migration Complete', amount: '£3,200', dueDate: '20 Jan 2026', status: 'released', client: 'Brightstone Solicitors' },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'In Escrow', color: 'bg-amber-50 text-amber-700', icon: <Clock className="h-3.5 w-3.5" /> },
  upcoming: { label: 'Upcoming', color: 'bg-blue-50 text-blue-600', icon: <Clock className="h-3.5 w-3.5" /> },
  released: { label: 'Paid Out', color: 'bg-green-50 text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
};

const VendorPayments: React.FC = () => {
  const [tab, setTab] = useState<'milestones' | 'payouts'>('milestones');
  const stripeConnected = false;

  const pending = MILESTONES.filter(m => m.status === 'pending');
  const released = MILESTONES.filter(m => m.status === 'released');
  const totalEscrow = pending.reduce((sum, m) => sum + parseFloat(m.amount.replace(/[£,]/g, '')), 0);
  const totalPaid = released.reduce((sum, m) => sum + parseFloat(m.amount.replace(/[£,]/g, '')), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2D59]">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">Track milestone payments and manage your Stripe Connect account</p>
      </div>

      {/* Stripe Connect banner */}
      {!stripeConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-amber-800 text-sm">Set up Stripe Connect to receive payouts</div>
            <div className="text-xs text-amber-700 mt-0.5">Connect your bank account to unlock milestone payments. Funds are held in escrow until milestones are approved.</div>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
            <ExternalLink className="h-4 w-4" /> Connect Stripe
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">In Escrow</div>
          <div className="text-2xl font-bold text-[#0B2D59]">£{totalEscrow.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">{pending.length} milestone{pending.length !== 1 ? 's' : ''} pending release</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Paid Out</div>
          <div className="text-2xl font-bold text-[#0B2D59]">£{totalPaid.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">{released.length} milestone{released.length !== 1 ? 's' : ''} completed</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Available Balance</div>
          <div className="text-2xl font-bold text-[#0B2D59]">£0</div>
          <div className="text-xs text-gray-400 mt-1">Connect Stripe to withdraw</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {(['milestones', 'payouts'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white shadow-sm text-[#0B2D59]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'milestones' ? 'Milestone Payments' : 'Payout History'}
          </button>
        ))}
      </div>

      {tab === 'milestones' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Project / Milestone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Due Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {MILESTONES.map(m => {
                const s = STATUS_MAP[m.status];
                return (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#0B2D59] text-sm">{m.milestone}</div>
                      <div className="text-xs text-gray-400">{m.project}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{m.client}</td>
                    <td className="px-5 py-4 font-semibold text-[#0070F3]">{m.amount}</td>
                    <td className="px-5 py-4 text-gray-500">{m.dueDate}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
                        {s.icon}{s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payouts' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <ArrowDownToLine className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <div className="font-semibold text-gray-600 mb-1">No payouts yet</div>
          <div className="text-sm text-gray-400">Payout history will appear here once milestones are released and funds are transferred to your bank account.</div>
        </div>
      )}
    </div>
  );
};

export default VendorPayments;
