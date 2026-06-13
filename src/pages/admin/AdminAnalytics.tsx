import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronUp, ChevronDown, Download, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const gmvMonthly = [
  { month: 'Jan', gmv: 42000, fees: 2100 },
  { month: 'Feb', gmv: 58000, fees: 2900 },
  { month: 'Mar', gmv: 71000, fees: 3550 },
  { month: 'Apr', gmv: 89000, fees: 4450 },
  { month: 'May', gmv: 104000, fees: 5200 },
  { month: 'Jun', gmv: 127000, fees: 6350 },
];

const conversionFunnel = [
  { stage: 'Homepage visits', count: 8420, pct: 100 },
  { stage: 'Searches performed', count: 3180, pct: 38 },
  { stage: 'Profile views', count: 1240, pct: 15 },
  { stage: 'RFPs submitted', count: 187, pct: 2.2 },
  { stage: 'Contracts signed', count: 43, pct: 0.5 },
  { stage: 'Milestones completed', count: 89, pct: 1.1 },
  { stage: 'Contracts completed', count: 18, pct: 0.2 },
];

const vendorPerformance = [
  { company: 'TechForge Solutions', type: 'IT Agency', completed: 12, dispute_rate: '0%', avg_rating: 4.8, verified: '2024-01-15' },
  { company: 'CloudNorth MSP', type: 'MSP', completed: 8, dispute_rate: '0%', avg_rating: 4.6, verified: '2024-02-20' },
  { company: 'DevStream Ltd', type: 'IT Agency', completed: 6, dispute_rate: '4%', avg_rating: 4.3, verified: '2024-03-10' },
  { company: 'DataBridge Analytics', type: 'IT Agency', completed: 4, dispute_rate: '0%', avg_rating: 4.9, verified: '2024-04-05' },
  { company: 'StaffPro UK', type: 'Staff Aug', completed: 7, dispute_rate: '2%', avg_rating: 4.4, verified: '2024-04-18' },
];

const paymentReputation = [
  { company: 'Paytrace Financial', on_time_rate: 98, late_count: 0, failed_count: 0, dispute_ratio: '0%', badge: 'green' },
  { company: 'Morrison Logistics', on_time_rate: 87, late_count: 2, failed_count: 0, dispute_ratio: '2%', badge: 'amber' },
  { company: 'CareSync Health', on_time_rate: 100, late_count: 0, failed_count: 0, dispute_ratio: '0%', badge: 'green' },
  { company: 'ShopBridge Commerce', on_time_rate: 72, late_count: 4, failed_count: 1, dispute_ratio: '8%', badge: 'red' },
];

type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return active ? (
    dir === 'asc' ? <ChevronUp className="inline h-3.5 w-3.5 ml-0.5" /> : <ChevronDown className="inline h-3.5 w-3.5 ml-0.5" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-0.5 opacity-30" />
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
      <span className="text-slate-400 text-xs ml-1">{rating}</span>
    </span>
  );
}

function BadgeChip({ badge }: { badge: string }) {
  if (badge === 'green') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-900/40 text-green-400 border border-green-700/50">Reliable</span>;
  if (badge === 'amber') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/40 text-amber-400 border border-amber-700/50">Average</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-900/40 text-red-400 border border-red-700/50">Late payer</span>;
}

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(r => Object.values(r).join(','));
  const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const AdminAnalytics: React.FC = () => {
  const [vendorSort, setVendorSort] = useState<{ key: keyof typeof vendorPerformance[0]; dir: SortDir }>({ key: 'completed', dir: 'desc' });
  const [paySort, setPaySort] = useState<{ key: keyof typeof paymentReputation[0]; dir: SortDir }>({ key: 'on_time_rate', dir: 'desc' });
  const [stats, setStats] = useState({ totalVendors: 0, verifiedVendors: 0, totalContracts: 0, activeValue: 0, totalProposals: 0 });
  const [topVendors, setTopVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // eslint-disable-line @typescript-eslint/no-unused-vars

  useEffect(() => {
    async function load() {
      try {
        const [vendorRes, verRes, contractRes, proposalRes, topVRes] = await Promise.all([
          supabase.from('vendors').select('id', { count: 'exact', head: true }),
          supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('is_verified', true),
          supabase.from('contracts').select('id, total_value, status', { count: 'exact' }),
          supabase.from('proposals').select('id', { count: 'exact', head: true }),
          supabase.from('vendors').select('id, company_name, rating, review_count, projects_completed, total_revenue, is_verified').order('projects_completed', { ascending: false }).limit(10),
        ]);
        const activeValue = contractRes.data?.filter(c => c.status === 'active').reduce((s, c) => s + (c.total_value || 0), 0) || 0;
        setStats({ totalVendors: vendorRes.count || 0, verifiedVendors: verRes.count || 0, totalContracts: contractRes.count || 0, activeValue, totalProposals: proposalRes.count || 0 });
        setTopVendors(topVRes.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function sortVendor(key: keyof typeof vendorPerformance[0]) {
    setVendorSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
  }
  function sortPay(key: keyof typeof paymentReputation[0]) {
    setPaySort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
  }

  const sortedVendors = [...vendorPerformance].sort((a, b) => {
    const av = a[vendorSort.key];
    const bv = b[vendorSort.key];
    if (typeof av === 'number' && typeof bv === 'number') return vendorSort.dir === 'asc' ? av - bv : bv - av;
    return vendorSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const sortedPay = [...paymentReputation].sort((a, b) => {
    const av = a[paySort.key];
    const bv = b[paySort.key];
    if (typeof av === 'number' && typeof bv === 'number') return paySort.dir === 'asc' ? av - bv : bv - av;
    return paySort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-white">Platform Analytics</h1>

      {/* 1. GMV Dashboard */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">GMV Dashboard</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0B2D59] rounded-xl p-5 flex flex-col gap-1">
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Active Contract Value</span>
            <span className="text-4xl font-black text-white">£{stats.activeValue.toLocaleString()}</span>
            <span className="text-xs text-blue-300">Active contracts</span>
          </div>
          <div className="bg-slate-800 rounded-xl p-5 flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Vendors</span>
            <span className="text-4xl font-black text-white">{stats.totalVendors}</span>
            <span className="text-xs text-slate-500">{stats.verifiedVendors} verified</span>
          </div>
          <div className="bg-slate-800 rounded-xl p-5 flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Contracts</span>
            <span className="text-4xl font-black text-white">{stats.totalContracts}</span>
            <span className="text-xs text-slate-500">All time</span>
          </div>
          <div className="bg-slate-800 rounded-xl p-5 flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Proposals</span>
            <span className="text-4xl font-black text-white">{stats.totalProposals}</span>
            <span className="text-xs text-slate-500">All time</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">Last 6 Months — GMV &amp; Platform Fees (£)</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={gmvMonthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12, color: '#f1f5f9' }}
                formatter={(v: number, name: string) => [`£${v.toLocaleString()}`, name === 'gmv' ? 'GMV' : 'Fees']}
              />
              <Legend formatter={v => v === 'gmv' ? 'GMV' : 'Platform Fees'} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="gmv" stackId="a" fill="#0070F3" radius={[0, 0, 0, 0]} name="gmv" />
              <Bar dataKey="fees" stackId="a" fill="#0d9488" radius={[4, 4, 0, 0]} name="fees" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 2. Conversion Funnel */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Conversion Funnel — this month</h2>
        <div className="bg-slate-800 rounded-xl p-6 space-y-3">
          {conversionFunnel.map(row => (
            <div key={row.stage} className="flex items-center gap-3">
              <span className="text-sm text-slate-300 w-48 shrink-0">{row.stage}</span>
              <div className="flex-1 bg-slate-700 rounded-full h-8 overflow-hidden">
                <div
                  className="h-8 rounded-full bg-[#0070F3] transition-all"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-white w-16 text-right">{row.count.toLocaleString()}</span>
              <span className="text-xs text-slate-400 w-12 text-right">{row.pct}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Vendor Performance Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Vendor Performance</h2>
          <button
            onClick={() => exportCSV(vendorPerformance as unknown as Record<string, unknown>[], 'vendor-performance.csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 border border-slate-600 rounded-lg hover:border-slate-400 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 border-b border-slate-700">
              <tr>
                {[
                  { label: 'Company', key: 'company' },
                  { label: 'Type', key: 'type' },
                  { label: 'Completed', key: 'completed' },
                  { label: 'Dispute Rate', key: 'dispute_rate' },
                  { label: 'Avg Rating', key: 'avg_rating' },
                  { label: 'Verified Date', key: 'verified' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => sortVendor(col.key as keyof typeof vendorPerformance[0])}
                    className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer hover:text-white select-none"
                  >
                    {col.label}
                    <SortIcon active={vendorSort.key === col.key} dir={vendorSort.dir} />
                  </th>
                ))}
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {(topVendors.length > 0 ? topVendors : sortedVendors).map((v: any) => (
                <tr key={v.company || v.company_name} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-white">{v.company || v.company_name}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/40">{v.type || (v.is_verified ? 'Verified' : 'Unverified')}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">{v.completed ?? v.projects_completed ?? 0}</td>
                  <td className="px-5 py-3.5 text-slate-300">{v.dispute_rate ?? '—'}</td>
                  <td className="px-5 py-3.5"><StarRating rating={v.avg_rating ?? v.rating ?? 0} /></td>
                  <td className="px-5 py-3.5 text-slate-400">{v.verified ?? (v.is_verified ? 'Verified' : 'Pending')}</td>
                  <td className="px-5 py-3.5">
                    <a href="#" className="flex items-center gap-1 text-[#0070F3] hover:text-blue-300 text-xs font-medium">
                      View profile <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Payment Reputation Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Buyer Payment Reputation</h2>
          <button
            onClick={() => exportCSV(paymentReputation as unknown as Record<string, unknown>[], 'payment-reputation.csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 border border-slate-600 rounded-lg hover:border-slate-400 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 border-b border-slate-700">
              <tr>
                {[
                  { label: 'Buyer', key: 'company' },
                  { label: 'On-time Rate', key: 'on_time_rate' },
                  { label: 'Late Count', key: 'late_count' },
                  { label: 'Failed Count', key: 'failed_count' },
                  { label: 'Dispute Ratio', key: 'dispute_ratio' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => sortPay(col.key as keyof typeof paymentReputation[0])}
                    className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer hover:text-white select-none"
                  >
                    {col.label}
                    <SortIcon active={paySort.key === col.key} dir={paySort.dir} />
                  </th>
                ))}
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {sortedPay.map(p => (
                <tr key={p.company} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-white">{p.company}</td>
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold ${p.on_time_rate >= 95 ? 'text-green-400' : p.on_time_rate >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                      {p.on_time_rate}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">{p.late_count}</td>
                  <td className="px-5 py-3.5 text-slate-300">{p.failed_count}</td>
                  <td className="px-5 py-3.5 text-slate-300">{p.dispute_ratio}</td>
                  <td className="px-5 py-3.5"><BadgeChip badge={p.badge} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Phase 2 Placeholders */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Coming in Phase 2</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border-2 border-dashed border-slate-600 p-8 flex flex-col items-center justify-center gap-2 opacity-60">
            <span className="text-2xl">🗺️</span>
            <span className="text-sm font-semibold text-slate-400">Supply-demand heatmap — Phase 2</span>
            <span className="text-xs text-slate-500">Geographic demand vs vendor coverage overlay</span>
          </div>
          <div className="rounded-xl border-2 border-dashed border-slate-600 p-8 flex flex-col items-center justify-center gap-2 opacity-60">
            <span className="text-2xl">📍</span>
            <span className="text-sm font-semibold text-slate-400">Geographic activity breakdown — Phase 2</span>
            <span className="text-xs text-slate-500">Regional buyer and vendor activity by city/region</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminAnalytics;
