import React, { useState } from 'react';
import { Check, Flag, X, Clock, DollarSign, Users } from 'lucide-react';

const BRIEFS = [
  { id: '1', title: 'Cloud Infrastructure Modernisation', company: 'FinEdge Capital', budget: '£40,000–£70,000', timeline: '4 months', proposals: 6, submitted: '2 days ago', status: 'pending', category: 'Cloud & Infrastructure', type: 'Tender' },
  { id: '2', title: 'React Native Mobile App (iOS & Android)', company: 'GreenPath Logistics', budget: '£25,000–£45,000', timeline: '3 months', proposals: 11, submitted: '4 days ago', status: 'approved', category: 'Software Development', type: 'Tender' },
  { id: '3', title: 'ISO 27001 Implementation', company: 'MedCore Health', budget: '£18,000–£30,000', timeline: '6 months', proposals: 4, submitted: '1 week ago', status: 'flagged', category: 'Cybersecurity', type: 'Tender', flagReason: 'Missing scope detail — not enough information for vendors to submit accurate proposals.' },
  { id: '4', title: 'Senior Full-Stack Developer Contract', company: 'PayFlow Technologies', budget: '£550–£650/day', timeline: '6 months', proposals: 14, submitted: '1 day ago', status: 'pending', category: 'Software Development', type: 'Job' },
  { id: '5', title: 'DevOps Team — Ongoing Retainer', company: 'TradePoint Exchange', budget: '£12,000/month', timeline: 'Ongoing', proposals: 3, submitted: '1 day ago', status: 'pending', category: 'DevOps', type: 'Tender' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  flagged: { label: 'Flagged', color: 'bg-red-100 text-red-700' },
  rejected: { label: 'Rejected', color: 'bg-gray-100 text-gray-500' },
};

const AdminBriefs: React.FC = () => {
  const [briefs, setBriefs] = useState(BRIEFS);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? briefs : briefs.filter(b => b.status === filter);

  const updateStatus = (id: string, status: string) => setBriefs(bs => bs.map(b => b.id === id ? { ...b, status } : b));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Brief & Tender Review</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {['all', 'pending', 'approved', 'flagged', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-white shadow-sm text-[#0B2D59]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {f === 'all' ? `All (${briefs.length})` : `${f} (${briefs.filter(b => b.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Brief</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Company</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Budget</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Proposals</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(brief => {
              const s = STATUS_MAP[brief.status];
              return (
                <React.Fragment key={brief.id}>
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#0B2D59]">{brief.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs bg-blue-50 text-[#0070F3] px-2 py-0.5 rounded-full">{brief.category}</span>
                        <span className="text-xs text-gray-400">{brief.type} · {brief.submitted}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{brief.company}</td>
                    <td className="px-5 py-4 text-gray-600 font-medium">{brief.budget}</td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-gray-600"><Users className="h-3.5 w-3.5" />{brief.proposals}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => updateStatus(brief.id, 'approved')}
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                          title="Approve"
                        ><Check className="h-3.5 w-3.5" /></button>
                        <button
                          onClick={() => updateStatus(brief.id, 'flagged')}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                          title="Flag"
                        ><Flag className="h-3.5 w-3.5" /></button>
                        <button
                          onClick={() => updateStatus(brief.id, 'rejected')}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                          title="Reject"
                        ><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                  {brief.flagReason && brief.status === 'flagged' && (
                    <tr>
                      <td colSpan={6} className="px-5 pb-3">
                        <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg flex items-start gap-2">
                          <Flag className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          {brief.flagReason}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBriefs;
