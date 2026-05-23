import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, ShieldCheck, AlertCircle, FileText, CreditCard, Clock, ArrowRight } from 'lucide-react';

/* No hardcoded GMV data — will be loaded from the database */
const gmvData: { month: string; gmv: number }[] = [];

const KPIS = [
  { label: 'Total GMV This Month', value: '—', icon: TrendingUp, color: 'text-[#0070F3]', bg: 'bg-blue-50', change: '' },
  { label: 'Total GMV All Time', value: '—', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50', change: '' },
  { label: 'Active Engagements', value: '—', icon: FileText, color: 'text-green-600', bg: 'bg-green-50', change: '' },
  { label: 'Verified Vendors', value: '—', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50', change: '' },
  { label: 'Active Buyers', value: '—', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', change: '' },
  { label: 'Open Disputes', value: '—', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', change: '' },
  { label: 'Pending Verifications', value: '—', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', change: '' },
  { label: 'Pending Brief Reviews', value: '—', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50', change: '' },
];

/* No hardcoded actions — will be loaded from the database */
const ACTIONS: { id: string; type: string; priority: string; title: string; detail: string; href: string; label: string }[] = [];

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-600',
};

const AdminDashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPIS.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide leading-tight">{kpi.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{kpi.change}</div>
            </div>
          );
        })}
      </div>

      {/* GMV Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="text-sm font-semibold text-gray-800 mb-4">GMV by Month (£)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={gmvData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(v: number) => [`£${v.toLocaleString()}`, 'GMV']} />
            <Bar dataKey="gmv" fill="#0070F3" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Priority Action Queue */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Priority Action Queue</h2>
        </div>
        <ul className="divide-y divide-gray-50">
          {ACTIONS.map(action => (
            <li key={action.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${PRIORITY_COLORS[action.priority]}`}>
                {action.priority}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{action.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{action.detail}</div>
              </div>
              <Link
                to={action.href}
                className="flex items-center gap-1 text-xs font-semibold text-[#0070F3] hover:underline flex-shrink-0"
              >
                {action.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;
