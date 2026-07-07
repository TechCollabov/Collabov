import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronUp, ChevronDown, Download, ExternalLink, Loader2, Ban } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const BLACKLIST_EVENT_TYPES = [
  'vendor_blacklisted', 'vendor_blacklist_deferred', 'vendor_restored',
  'buyer_blacklisted', 'buyer_blacklist_deferred', 'buyer_restored',
];
const BLACKLIST_EVENT_LABEL: Record<string, string> = {
  vendor_blacklisted: 'Vendor blacklisted',
  vendor_blacklist_deferred: 'Vendor blacklist deferred (open dispute)',
  vendor_restored: 'Vendor restored',
  buyer_blacklisted: 'Buyer blacklisted',
  buyer_blacklist_deferred: 'Buyer blacklist deferred (open dispute)',
  buyer_restored: 'Buyer restored',
};

interface BlacklistLogRow {
  id: string;
  event_type: string;
  entity_name: string;
  reason: string | null;
  timestamp: string;
}

const AI_FEATURE_LABEL: Record<string, string> = {
  sow_milestones: 'SOW milestone suggestions',
  sow_obligations_summary: 'SOW obligations summary',
  case_study_keywords: 'Case study keyword extraction',
  proposal_draft: 'AI-drafted proposal approach',
  unspecified: 'Unlabeled',
};

interface AiUsageRow {
  feature: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

interface VendorRow {
  id: string;
  company_name: string;
  rating: number;
  projects_completed: number;
  is_verified: boolean;
  verified_at: string | null;
  dispute_outcome_count: number;
}

interface BuyerRow {
  id: string;
  company_name: string;
  onTimeRate: number;
  lateCount: number;
  disputeRatio: number;
  badge: 'green' | 'amber' | 'red';
}

interface FunnelStage {
  stage: string;
  count: number;
}

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
    <span className="text-amber-500 text-sm">
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
      <span className="text-gray-400 text-xs ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

function BadgeChip({ badge }: { badge: string }) {
  if (badge === 'green') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Reliable</span>;
  if (badge === 'amber') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Average</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Late payer</span>;
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

const monthKey = (d: Date) => d.toLocaleString('en-GB', { month: 'short', year: '2-digit' });

const AdminAnalytics: React.FC = () => {
  const [vendorSort, setVendorSort] = useState<{ key: keyof VendorRow; dir: SortDir }>({ key: 'projects_completed', dir: 'desc' });
  const [paySort, setPaySort] = useState<{ key: keyof BuyerRow; dir: SortDir }>({ key: 'onTimeRate', dir: 'desc' });
  const [stats, setStats] = useState({ totalVendors: 0, verifiedVendors: 0, totalContracts: 0, activeValue: 0, totalEnquiries: 0 });
  const [gmvMonthly, setGmvMonthly] = useState<{ month: string; gmv: number; fees: number }[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [buyers, setBuyers] = useState<BuyerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [blacklistLog, setBlacklistLog] = useState<BlacklistLogRow[]>([]);
  const [aiUsage, setAiUsage] = useState<AiUsageRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      vendorRes, verRes, contractRes, enquiryRes, vendorsRes,
      releasesRes, milestoneRes, buyersRes, disputesRes, searchEventsRes,
    ] = await Promise.all([
      supabase.from('vendors').select('id', { count: 'exact', head: true }),
      supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('contracts').select('id, total_value, status', { count: 'exact' }),
      supabase.from('enquiries').select('id', { count: 'exact', head: true }),
      supabase.from('vendors').select('id, company_name, rating, projects_completed, is_verified, verified_at, dispute_outcome_count').order('projects_completed', { ascending: false }).limit(10),
      supabase.from('escrow_transactions').select('amount, platform_fee_amount, created_at').eq('transaction_type', 'release').gte('created_at', sixMonthsAgo.toISOString()),
      supabase.from('project_milestones').select('engagement_id, escrow_status, due_date, funded_at').not('escrow_status', 'eq', 'unfunded'),
      supabase.from('buyers').select('id, company_name'),
      supabase.from('disputes').select('buyer_id'),
      supabase.from('platform_event').select('actor_id').eq('event_type', 'vendor_search'),
    ]);

    const activeValue = contractRes.data?.filter(c => c.status === 'active').reduce((s, c) => s + (c.total_value || 0), 0) || 0;
    setStats({
      totalVendors: vendorRes.count || 0,
      verifiedVendors: verRes.count || 0,
      totalContracts: contractRes.count || 0,
      activeValue,
      totalEnquiries: enquiryRes.count || 0,
    });
    setVendors(vendorsRes.data || []);

    // GMV + fees by month, last 6 months.
    const buckets = new Map<string, { gmv: number; fees: number }>();
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo); d.setMonth(d.getMonth() + i);
      buckets.set(monthKey(d), { gmv: 0, fees: 0 });
    }
    (releasesRes.data || []).forEach((r: any) => {
      const key = monthKey(new Date(r.created_at));
      const b = buckets.get(key) ?? { gmv: 0, fees: 0 };
      b.gmv += Number(r.amount || 0);
      b.fees += Number(r.platform_fee_amount || 0);
      buckets.set(key, b);
    });
    setGmvMonthly(Array.from(buckets.entries()).map(([month, v]) => ({ month, ...v })));

    // Engagement funnel — starts from signed-in buyer searches (logged via
    // logEvent('vendor_search', ...) on ResultsPage). Anonymous top-of-funnel
    // traffic (homepage visits before signup) still isn't instrumented — that
    // needs session tracking this build doesn't have.
    const distinctSearchers = new Set((searchEventsRes.data || []).map((e: { actor_id: string }) => e.actor_id)).size;
    const contractsSigned = (contractRes.data || []).filter((c: any) => c.status !== 'pending').length;
    const milestones = milestoneRes.data || [];
    const milestonesFunded = milestones.length;
    const milestonesReleased = milestones.filter((m: any) => m.escrow_status === 'released').length;
    const contractsCompleted = (contractRes.data || []).filter((c: any) => c.status === 'completed').length;
    setFunnel([
      { stage: 'Buyers who searched', count: distinctSearchers },
      { stage: 'Enquiries submitted', count: enquiryRes.count || 0 },
      { stage: 'Contracts signed', count: contractsSigned },
      { stage: 'Milestones funded', count: milestonesFunded },
      { stage: 'Milestones released', count: milestonesReleased },
      { stage: 'Contracts completed', count: contractsCompleted },
    ]);

    // Buyer payment reputation: on-time = funded on/before the milestone's due date.
    const engagementIds = Array.from(new Set(milestones.map((m: any) => m.engagement_id).filter(Boolean)));
    const { data: engagements } = engagementIds.length
      ? await supabase.from('engagements').select('id, buyer_id').in('id', engagementIds)
      : { data: [] as any[] };
    const engToBuyer = new Map((engagements ?? []).map((e: any) => [e.id, e.buyer_id]));
    const disputeCountByBuyer = new Map<string, number>();
    (disputesRes.data || []).forEach((d: any) => disputeCountByBuyer.set(d.buyer_id, (disputeCountByBuyer.get(d.buyer_id) ?? 0) + 1));

    const perBuyer = new Map<string, { onTime: number; late: number; total: number }>();
    milestones.forEach((m: any) => {
      if (!m.funded_at || !m.due_date) return;
      const buyerId = engToBuyer.get(m.engagement_id);
      if (!buyerId) return;
      const cur = perBuyer.get(buyerId) ?? { onTime: 0, late: 0, total: 0 };
      const onTime = new Date(m.funded_at) <= new Date(m.due_date);
      cur.total += 1;
      if (onTime) cur.onTime += 1; else cur.late += 1;
      perBuyer.set(buyerId, cur);
    });
    const custMap = new Map((buyersRes.data ?? []).map((c: any) => [c.id, c.company_name]));
    setBuyers(Array.from(perBuyer.entries()).map(([buyerId, s]) => {
      const onTimeRate = s.total > 0 ? Math.round((s.onTime / s.total) * 100) : 100;
      const disputeRatio = s.total > 0 ? Math.round(((disputeCountByBuyer.get(buyerId) ?? 0) / s.total) * 100) : 0;
      const badge: BuyerRow['badge'] = onTimeRate >= 95 ? 'green' : onTimeRate >= 80 ? 'amber' : 'red';
      return { id: buyerId, company_name: custMap.get(buyerId) ?? 'Buyer', onTimeRate, lateCount: s.late, disputeRatio, badge };
    }));

    // Trust & Safety log: real blacklist/restore events, resolved to company names.
    interface PlatformEventRow {
      event_id: string;
      event_type: string;
      entity_type: string;
      entity_id: string;
      payload: { reason?: string } | null;
      timestamp: string;
    }
    const { data: events } = await supabase
      .from('platform_event')
      .select('event_id, event_type, entity_type, entity_id, payload, timestamp')
      .in('event_type', BLACKLIST_EVENT_TYPES)
      .order('timestamp', { ascending: false })
      .limit(20);
    const eventRows = (events ?? []) as PlatformEventRow[];
    const vendorIds = eventRows.filter(e => e.entity_type === 'vendor').map(e => e.entity_id);
    const buyerIds = eventRows.filter(e => e.entity_type === 'buyer').map(e => e.entity_id);
    const [{ data: eventVendors }, { data: eventBuyers }] = await Promise.all([
      vendorIds.length ? supabase.from('vendors').select('id, company_name').in('id', vendorIds) : Promise.resolve({ data: [] as { id: string; company_name: string }[] }),
      buyerIds.length ? supabase.from('buyers').select('id, company_name').in('id', buyerIds) : Promise.resolve({ data: [] as { id: string; company_name: string }[] }),
    ]);
    const nameMap = new Map<string, string>([
      ...(eventVendors ?? []).map((v): [string, string] => [v.id, v.company_name]),
      ...(eventBuyers ?? []).map((c): [string, string] => [c.id, c.company_name]),
    ]);
    setBlacklistLog(eventRows.map(e => ({
      id: e.event_id,
      event_type: e.event_type,
      entity_name: nameMap.get(e.entity_id) ?? (e.entity_type === 'vendor' ? 'Vendor' : 'Buyer'),
      reason: e.payload?.reason ?? null,
      timestamp: e.timestamp,
    })));

    // AI usage & estimated cost, grouped by feature — real token counts and
    // per-model pricing logged by the anthropic-generate Edge Function.
    const { data: usageRows } = await supabase
      .from('ai_usage_log')
      .select('feature, input_tokens, output_tokens, estimated_cost_usd');
    const usageByFeature = new Map<string, AiUsageRow>();
    (usageRows ?? []).forEach((r: { feature: string; input_tokens: number; output_tokens: number; estimated_cost_usd: number }) => {
      const cur = usageByFeature.get(r.feature) ?? { feature: r.feature, calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };
      cur.calls += 1;
      cur.inputTokens += r.input_tokens;
      cur.outputTokens += r.output_tokens;
      cur.costUsd += Number(r.estimated_cost_usd);
      usageByFeature.set(r.feature, cur);
    });
    setAiUsage(Array.from(usageByFeature.values()).sort((a, b) => b.costUsd - a.costUsd));

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function sortVendor(key: keyof VendorRow) {
    setVendorSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
  }
  function sortPay(key: keyof BuyerRow) {
    setPaySort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
  }

  const sortedVendors = [...vendors].sort((a, b) => {
    const av = a[vendorSort.key];
    const bv = b[vendorSort.key];
    if (typeof av === 'number' && typeof bv === 'number') return vendorSort.dir === 'asc' ? av - bv : bv - av;
    return vendorSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const sortedBuyers = [...buyers].sort((a, b) => {
    const av = a[paySort.key];
    const bv = b[paySort.key];
    if (typeof av === 'number' && typeof bv === 'number') return paySort.dir === 'asc' ? av - bv : bv - av;
    return paySort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const maxFunnelCount = funnel[0]?.count || 1;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0070F3]" size={32} /></div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Platform Analytics</h1>

      {/* 1. GMV Dashboard */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">GMV Dashboard</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-5 flex flex-col gap-1 border border-blue-100">
            <span className="text-xs font-semibold text-[#0070F3] uppercase tracking-wide">Active Contract Value</span>
            <span className="text-4xl font-black text-[#0B2D59]">£{stats.activeValue.toLocaleString()}</span>
            <span className="text-xs text-[#0070F3]">Active contracts</span>
          </div>
          <div className="bg-white rounded-xl p-5 flex flex-col gap-1 border border-gray-100 shadow-sm">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Vendors</span>
            <span className="text-4xl font-black text-gray-900">{stats.totalVendors}</span>
            <span className="text-xs text-gray-400">{stats.verifiedVendors} verified</span>
          </div>
          <div className="bg-white rounded-xl p-5 flex flex-col gap-1 border border-gray-100 shadow-sm">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Contracts</span>
            <span className="text-4xl font-black text-gray-900">{stats.totalContracts}</span>
            <span className="text-xs text-gray-400">All time</span>
          </div>
          <div className="bg-white rounded-xl p-5 flex flex-col gap-1 border border-gray-100 shadow-sm">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Enquiries</span>
            <span className="text-4xl font-black text-gray-900">{stats.totalEnquiries}</span>
            <span className="text-xs text-gray-400">All time</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-gray-800 mb-4">Last 6 Months — GMV &amp; Platform Fees (£)</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={gmvMonthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 12, color: '#111827' }}
                formatter={(v: number, name: string) => [`£${v.toLocaleString()}`, name === 'gmv' ? 'GMV' : 'Fees']}
              />
              <Legend formatter={v => v === 'gmv' ? 'GMV' : 'Platform Fees'} wrapperStyle={{ fontSize: 12, color: '#6b7280' }} />
              <Bar dataKey="gmv" stackId="a" fill="#0070F3" radius={[0, 0, 0, 0]} name="gmv" />
              <Bar dataKey="fees" stackId="a" fill="#0d9488" radius={[4, 4, 0, 0]} name="fees" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 2. Engagement Funnel */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Engagement Funnel — all time</h2>
        <p className="text-xs text-gray-400 mb-4">Starts from signed-in buyer searches — anonymous top-of-funnel traffic (homepage visits before signup) still isn't instrumented in this build.</p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
          {funnel.map(row => (
            <div key={row.stage} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-48 shrink-0">{row.stage}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                <div
                  className="h-8 rounded-full bg-[#0070F3] transition-all"
                  style={{ width: `${maxFunnelCount > 0 ? Math.max(2, (row.count / maxFunnelCount) * 100) : 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-16 text-right">{row.count.toLocaleString()}</span>
              <span className="text-xs text-gray-400 w-12 text-right">{maxFunnelCount > 0 ? Math.round((row.count / maxFunnelCount) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Vendor Performance Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Vendor Performance</h2>
          <button
            onClick={() => exportCSV(vendors as unknown as Record<string, unknown>[], 'vendor-performance.csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-900 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  { label: 'Company', key: 'company_name' },
                  { label: 'Completed', key: 'projects_completed' },
                  { label: 'Dispute Rate', key: 'dispute_outcome_count' },
                  { label: 'Avg Rating', key: 'rating' },
                  { label: 'Verified Date', key: 'verified_at' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => sortVendor(col.key as keyof VendorRow)}
                    className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 select-none"
                  >
                    {col.label}
                    <SortIcon active={vendorSort.key === col.key} dir={vendorSort.dir} />
                  </th>
                ))}
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedVendors.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">No vendors yet.</td></tr>
              )}
              {sortedVendors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{v.company_name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{v.projects_completed ?? 0}</td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {v.projects_completed > 0 ? `${Math.round((v.dispute_outcome_count / v.projects_completed) * 100)}%` : '—'}
                  </td>
                  <td className="px-5 py-3.5"><StarRating rating={v.rating ?? 0} /></td>
                  <td className="px-5 py-3.5 text-gray-500">{v.verified_at ? new Date(v.verified_at).toLocaleDateString('en-GB') : (v.is_verified ? 'Verified' : 'Pending')}</td>
                  <td className="px-5 py-3.5">
                    <Link to={`/vendor/profile/${v.id}`} className="flex items-center gap-1 text-[#0070F3] hover:text-blue-700 text-xs font-medium">
                      View profile <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Buyer Payment Reputation Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Buyer Payment Reputation</h2>
          <button
            onClick={() => exportCSV(buyers as unknown as Record<string, unknown>[], 'payment-reputation.csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-900 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  { label: 'Buyer', key: 'company_name' },
                  { label: 'On-time Rate', key: 'onTimeRate' },
                  { label: 'Late Count', key: 'lateCount' },
                  { label: 'Dispute Ratio', key: 'disputeRatio' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => sortPay(col.key as keyof BuyerRow)}
                    className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 select-none"
                  >
                    {col.label}
                    <SortIcon active={paySort.key === col.key} dir={paySort.dir} />
                  </th>
                ))}
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedBuyers.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No funded milestones with due dates yet.</td></tr>
              )}
              {sortedBuyers.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{b.company_name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold ${b.onTimeRate >= 95 ? 'text-green-600' : b.onTimeRate >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                      {b.onTimeRate}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{b.lateCount}</td>
                  <td className="px-5 py-3.5 text-gray-600">{b.disputeRatio}%</td>
                  <td className="px-5 py-3.5"><BadgeChip badge={b.badge} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Trust & Safety Log */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Ban className="h-4 w-4 text-red-500" />
          <h2 className="text-lg font-bold text-gray-900">Trust &amp; Safety Log</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">Blacklist and restoration actions from <Link to="/admin/users" className="text-[#0070F3] hover:underline">User Management</Link>, most recent first.</p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entity</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {blacklistLog.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">No blacklist activity yet.</td></tr>
              )}
              {blacklistLog.map(row => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-500">{new Date(row.timestamp).toLocaleDateString('en-GB')}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{row.entity_name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{BLACKLIST_EVENT_LABEL[row.event_type] ?? row.event_type}</td>
                  <td className="px-5 py-3.5 text-gray-600">{row.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5b. AI Usage & Cost */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">AI Usage &amp; Estimated Cost</h2>
        <p className="text-xs text-gray-400 mb-4">Every anthropic-generate call, by feature. Cost is estimated from Anthropic's published per-model token pricing.</p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Feature</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Calls</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Input tokens</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Output tokens</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Est. cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {aiUsage.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No AI calls logged yet.</td></tr>
              )}
              {aiUsage.map(row => (
                <tr key={row.feature} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{AI_FEATURE_LABEL[row.feature] ?? row.feature}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600">{row.calls.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600">{row.inputTokens.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600">{row.outputTokens.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600">${row.costUsd.toFixed(4)}</td>
                </tr>
              ))}
              {aiUsage.length > 0 && (
                <tr className="bg-gray-50/60 font-semibold">
                  <td className="px-5 py-3.5 text-gray-900">Total</td>
                  <td className="px-5 py-3.5 text-right text-gray-800">{aiUsage.reduce((s, r) => s + r.calls, 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right text-gray-800">{aiUsage.reduce((s, r) => s + r.inputTokens, 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right text-gray-800">{aiUsage.reduce((s, r) => s + r.outputTokens, 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right text-gray-800">${aiUsage.reduce((s, r) => s + r.costUsd, 0).toFixed(4)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Phase 2 Placeholders */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Coming in Phase 2</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center gap-2 opacity-70">
            <span className="text-2xl">🗺️</span>
            <span className="text-sm font-semibold text-gray-500">Supply-demand heatmap — Phase 2</span>
            <span className="text-xs text-gray-400">Geographic demand vs vendor coverage overlay</span>
          </div>
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center gap-2 opacity-70">
            <span className="text-2xl">📍</span>
            <span className="text-sm font-semibold text-gray-500">Geographic activity breakdown — Phase 2</span>
            <span className="text-xs text-gray-400">Regional buyer and vendor activity by city/region</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminAnalytics;
