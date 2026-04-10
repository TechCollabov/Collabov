import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, MessageSquare, ArrowUpRight, Lightbulb } from 'lucide-react';

const profileViewsData = [
  { month: 'Oct', views: 42 },
  { month: 'Nov', views: 61 },
  { month: 'Dec', views: 55 },
  { month: 'Jan', views: 78 },
  { month: 'Feb', views: 93 },
  { month: 'Mar', views: 110 },
  { month: 'Apr', views: 87 },
];

const revenueData = [
  { month: 'Oct', revenue: 8400 },
  { month: 'Nov', revenue: 12200 },
  { month: 'Dec', revenue: 9800 },
  { month: 'Jan', revenue: 15600 },
  { month: 'Feb', revenue: 18300 },
  { month: 'Mar', revenue: 21000 },
  { month: 'Apr', revenue: 14700 },
];

const funnelData = [
  { stage: 'Profile Views', count: 110, pct: 100 },
  { stage: 'Enquiries', count: 22, pct: 20 },
  { stage: 'Proposals Sent', count: 11, pct: 10 },
  { stage: 'Contracts Won', count: 3, pct: 2.7 },
];

const TIPS = [
  'Add at least 2 case studies to increase enquiry rate by up to 40%',
  'Vendors who respond within 2 hours receive 3× more proposals',
  'Uploading your Companies House certificate increases trust score and search ranking',
  'Profile completeness is currently 72% — complete your tech stack section for better matching',
];

const VendorAnalytics: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2D59]">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Profile performance and revenue insights for the last 7 months</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Profile Views (30d)', value: '87', change: '+18%', icon: <Eye className="h-5 w-5 text-[#0070F3]" /> },
          { label: 'Enquiries (30d)', value: '6', change: '+2', icon: <MessageSquare className="h-5 w-5 text-[#0070F3]" /> },
          { label: 'Conversion Rate', value: '2.7%', change: 'Proposals → Won', icon: <TrendingUp className="h-5 w-5 text-[#0070F3]" /> },
          { label: 'Gross Revenue MTD', value: '£14,700', change: '+12% MoM', icon: <ArrowUpRight className="h-5 w-5 text-[#0070F3]" /> },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              {kpi.icon}
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{kpi.label}</span>
            </div>
            <div className="text-2xl font-bold text-[#0B2D59]">{kpi.value}</div>
            <div className="text-xs text-green-600 font-medium mt-0.5">{kpi.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Profile Views chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-[#0B2D59] mb-4">Profile Views</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={profileViewsData}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0070F3" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0070F3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Area type="monotone" dataKey="views" stroke="#0070F3" strokeWidth={2} fill="url(#viewsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-[#0B2D59] mb-4">Gross Revenue (£)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(v: number) => [`£${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#0070F3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <div className="text-sm font-semibold text-[#0B2D59]">Improvement Tips</div>
        </div>
        <ul className="space-y-2.5">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full bg-blue-50 text-[#0070F3] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VendorAnalytics;
