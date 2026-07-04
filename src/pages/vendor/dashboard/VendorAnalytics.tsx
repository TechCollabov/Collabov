import React, { useState, useEffect, useMemo } from 'react';
import { ComposedChart, Area, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Eye, MessageSquare, ArrowUpRight, Lightbulb, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

const DATE_RANGES = ['30d', '3m', '6m', '12m'] as const;
type DateRange = typeof DATE_RANGES[number];
const RANGE_DAYS: Record<DateRange, number> = { '30d': 30, '3m': 90, '6m': 180, '12m': 365 };

const SERVICE_COLORS = ['#0070F3', '#0E7C6A', '#7C3AED', '#F59E0B', '#EC4899'];

function monthKey(d: Date): string {
  return d.toLocaleDateString('en-GB', { month: 'short' });
}

function monthsBack(n: number): Date[] {
  const out: Date[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  return out;
}

const VendorAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>('6m');
  const [loading, setLoading] = useState(true);

  const [profileViews, setProfileViews] = useState(0);
  const [enquiriesCount, setEnquiriesCount] = useState(0);
  const [proposalsCount, setProposalsCount] = useState(0);
  const [contractsWon, setContractsWon] = useState(0);
  const [grossRevenueMTD, setGrossRevenueMTD] = useState(0);
  const [viewsSeries, setViewsSeries] = useState<{ month: string; views: number; enquiries: number }[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<Record<string, number | string>[]>([]);
  const [serviceKeys, setServiceKeys] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const days = RANGE_DAYS[dateRange];
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const monthCount = dateRange === '30d' ? 1 : dateRange === '3m' ? 3 : dateRange === '6m' ? 6 : 12;
      const months = monthsBack(monthCount);

      const [viewsRes, enqRes, propRes, engRes, invRes, vendorRes, caseStudyRes, reviewRes] = await Promise.all([
        supabase.from('platform_event').select('timestamp').eq('event_type', 'profile_view').eq('entity_type', 'vendor').eq('entity_id', user!.id).gte('timestamp', since),
        supabase.from('enquiries').select('created_at').eq('vendor_id', user!.id).gte('created_at', since),
        supabase.from('proposals').select('id, submitted_at, workflow_state').eq('vendor_id', user!.id).gte('submitted_at', since),
        supabase.from('engagements').select('id, created_at').eq('vendor_id', user!.id).gte('created_at', since),
        supabase.from('invoices').select('gross_amount, issued_at, engagement_id').eq('vendor_id', user!.id).gte('issued_at', since),
        supabase.from('vendors').select('response_time_hours, availability_status, is_verified').eq('id', user!.id).maybeSingle(),
        supabase.from('case_studies').select('id').eq('vendor_id', user!.id),
        supabase.from('reviews').select('id').eq('vendor_id', user!.id),
      ]);
      if (cancelled) return;

      const engagementIds = (invRes.data ?? []).map(i => i.engagement_id).filter(Boolean);
      const { data: sowRows } = engagementIds.length
        ? await supabase.from('sow_documents').select('engagement_id, service_type').in('engagement_id', engagementIds)
        : { data: [] as any[] };
      const serviceByEngagement = new Map((sowRows ?? []).map((s: any) => [s.engagement_id, s.service_type ?? 'Other']));

      setProfileViews((viewsRes.data ?? []).length);
      setEnquiriesCount((enqRes.data ?? []).length);
      const proposals = propRes.data ?? [];
      setProposalsCount(proposals.filter(p => p.workflow_state !== 'draft').length);
      setContractsWon((engRes.data ?? []).length);

      const now = new Date();
      const mtdInvoices = (invRes.data ?? []).filter(i => {
        const d = new Date(i.issued_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      setGrossRevenueMTD(mtdInvoices.reduce((s, i) => s + (i.gross_amount ?? 0), 0));

      // Monthly series: views + enquiries overlay.
      const vSeries = months.map(m => {
        const label = monthKey(m);
        const views = (viewsRes.data ?? []).filter(v => {
          const d = new Date(v.timestamp);
          return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
        }).length;
        const enq = (enqRes.data ?? []).filter(e => {
          const d = new Date(e.created_at);
          return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
        }).length;
        return { month: label, views, enquiries: enq };
      });
      setViewsSeries(vSeries);

      // Revenue by service per month.
      const services = new Set<string>();
      const revByMonth = months.map(m => {
        const row: Record<string, number | string> = { month: monthKey(m) };
        (invRes.data ?? []).forEach((inv: any) => {
          const d = new Date(inv.issued_at);
          if (d.getMonth() !== m.getMonth() || d.getFullYear() !== m.getFullYear()) return;
          const service = serviceByEngagement.get(inv.engagement_id) ?? 'Other';
          services.add(service);
          row[service] = (Number(row[service]) || 0) + (inv.gross_amount ?? 0);
        });
        return row;
      });
      setServiceKeys(Array.from(services));
      setRevenueSeries(revByMonth);

      // Rules-based tips — only shown when the underlying condition is true.
      const nextTips: string[] = [];
      if ((caseStudyRes.data ?? []).length === 0) {
        nextTips.push('Add a case study to your profile — vendors with case studies receive 3× more enquiries.');
      }
      if ((vendorRes.data?.response_time_hours ?? 99) > 8) {
        nextTips.push('Respond to enquiries within 4 hours to improve your conversion rate.');
      }
      if (vendorRes.data?.availability_status === 'engaged') {
        nextTips.push('Keep your availability calendar up to date to appear in more buyer searches.');
      }
      if ((reviewRes.data ?? []).length === 0) {
        nextTips.push('Request reviews from completed contracts to boost your trust score.');
      }
      if (!vendorRes.data?.is_verified) {
        nextTips.push('Complete verification to appear in search and start receiving enquiries.');
      }
      setTips(nextTips);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user, dateRange]);

  const conversionRate = proposalsCount > 0 ? Math.round((contractsWon / proposalsCount) * 100) : 0;

  const funnelData = useMemo(() => {
    const max = Math.max(profileViews, 1);
    return [
      { stage: 'Profile Views', count: profileViews, pct: 100 },
      { stage: 'Enquiries Received', count: enquiriesCount, pct: Math.min(100, Math.round((enquiriesCount / max) * 100)) },
      { stage: 'Proposals Sent', count: proposalsCount, pct: Math.min(100, Math.round((proposalsCount / max) * 100)) },
      { stage: 'Contracts Won', count: contractsWon, pct: Math.min(100, Math.round((contractsWon / max) * 100)) },
    ];
  }, [profileViews, enquiriesCount, proposalsCount, contractsWon]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 text-[#0070F3] animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2D59]">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Profile performance and revenue insights — all rules-based, no AI</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-shrink-0">
          {DATE_RANGES.map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                dateRange === range ? 'bg-white text-[#0B2D59] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: `Profile Views (${dateRange})`, value: String(profileViews), icon: <Eye className="h-5 w-5 text-[#0070F3]" /> },
          { label: `Enquiries (${dateRange})`, value: String(enquiriesCount), icon: <MessageSquare className="h-5 w-5 text-[#0070F3]" /> },
          { label: 'Conversion Rate', value: `${conversionRate}%`, sub: 'Contracts won / proposals sent', icon: <TrendingUp className="h-5 w-5 text-[#0070F3]" /> },
          { label: 'Gross Revenue MTD', value: `£${grossRevenueMTD.toLocaleString()}`, icon: <ArrowUpRight className="h-5 w-5 text-[#0070F3]" /> },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              {kpi.icon}
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{kpi.label}</span>
            </div>
            <div className="text-2xl font-bold text-[#0B2D59]">{kpi.value}</div>
            {kpi.sub && <div className="text-xs text-gray-400 mt-0.5">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Profile Views + Enquiries overlay */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-[#0B2D59] mb-4">Profile Views + Enquiries</div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={viewsSeries}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Area type="monotone" dataKey="views" name="Profile Views" stroke="#7C3AED" strokeWidth={2} fill="url(#viewsGrad)" />
              <Line type="monotone" dataKey="enquiries" name="Enquiries" stroke="#0070F3" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-[#0B2D59] mb-4">Gross Revenue by Service (£)</div>
          {revenueSeries.every(r => Object.keys(r).length <= 1) ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">No revenue yet in this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v: number, name: string) => [`£${v.toLocaleString()}`, name]} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {serviceKeys.map((key, i) => (
                  <Bar key={key} dataKey={key} stackId="rev" fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} name={key}
                    radius={i === serviceKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="text-sm font-semibold text-[#0B2D59] mb-4">Conversion Funnel</div>
        <div className="space-y-3">
          {funnelData.map(f => (
            <div key={f.stage}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">{f.stage}</span>
                <span className="font-semibold text-[#0B2D59]">{f.count}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-[#0070F3] transition-all" style={{ width: `${f.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvement tips */}
      {tips.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <div className="text-sm font-semibold text-[#0B2D59]">Improvement Tips</div>
          </div>
          <ul className="space-y-2.5">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-[#0070F3] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VendorAnalytics;
