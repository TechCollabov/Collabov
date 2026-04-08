import React from 'react';
import { BarChart, Bar, AreaChart, Area, FunnelChart, Funnel, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { TrendingUp, Users, Globe, DollarSign } from 'lucide-react';

const revenueData = [
  { month: 'Oct', gmv: 82000 },
  { month: 'Nov', gmv: 97000 },
  { month: 'Dec', gmv: 74000 },
  { month: 'Jan', gmv: 115000 },
  { month: 'Feb', gmv: 138000 },
  { month: 'Mar', gmv: 162000 },
  { month: 'Apr', gmv: 94000 },
];

const signupData = [
  { month: 'Oct', buyers: 22, vendors: 8 },
  { month: 'Nov', buyers: 31, vendors: 12 },
  { month: 'Dec', buyers: 18, vendors: 6 },
  { month: 'Jan', buyers: 44, vendors: 18 },
  { month: 'Feb', buyers: 52, vendors: 21 },
  { month: 'Mar', buyers: 67, vendors: 29 },
  { month: 'Apr', buyers: 38, vendors: 14 },
];

const funnelData = [
  { name: 'Site Visitors', value: 12500, fill: '#dbeafe' },
  { name: 'Search / Browse', value: 4800, fill: '#bfdbfe' },
  { name: 'Vendor Profile Views', value: 1900, fill: '#93c5fd' },
  { name: 'RFP / Enquiry Sent', value: 310, fill: '#60a5fa' },
  { name: 'Contracts Signed', value: 38, fill: '#0070F3' },
];

const geoData = [
  { region: 'London', buyers: 98, vendors: 41 },
  { region: 'Manchester', buyers: 44, vendors: 18 },
  { region: 'Birmingham', buyers: 31, vendors: 12 },
  { region: 'Leeds', buyers: 27, vendors: 9 },
  { region: 'Edinburgh', buyers: 19, vendors: 7 },
  { region: 'Other UK', buyers: 90, vendors: 37 },
];

const KPIS = [
  { label: 'Monthly Active Users', value: '4,820', change: '+14% MoM', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Avg. Time on Site', value: '4m 38s', change: '+22s vs last month', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Top Traffic Source', value: 'Organic', change: '52% of sessions', icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Platform Fee Revenue', value: '£4,710', change: '5% of GMV', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const AdminAnalytics: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Platform Analytics</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPIS.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{kpi.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{kpi.change}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Revenue */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-gray-800 mb-4">GMV by Month (£)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0070F3" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0070F3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(v: number) => [`£${v.toLocaleString()}`, 'GMV']} />
              <Area type="monotone" dataKey="gmv" stroke="#0070F3" strokeWidth={2} fill="url(#gmvGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Signups */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-gray-800 mb-4">New Signups — Buyers vs Vendors</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={signupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Bar dataKey="buyers" fill="#0070F3" radius={[2, 2, 0, 0]} name="Buyers" />
              <Bar dataKey="vendors" fill="#60a5fa" radius={[2, 2, 0, 0]} name="Vendors" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Conversion funnel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-gray-800 mb-4">Conversion Funnel</div>
          <div className="space-y-3">
            {funnelData.map((f, i) => {
              const pct = Math.round((f.value / funnelData[0].value) * 100);
              return (
                <div key={f.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{f.name}</span>
                    <span className="font-semibold text-[#0B2D59]">{f.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-[#0070F3] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geographic breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-gray-800 mb-4">Geographic Breakdown (UK)</div>
          <div className="space-y-2">
            {geoData.map(g => (
              <div key={g.region} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{g.region}</span>
                <div className="flex gap-4 text-xs">
                  <span className="text-[#0070F3] font-medium">{g.buyers} buyers</span>
                  <span className="text-gray-400">{g.vendors} vendors</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
