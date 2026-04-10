import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, ShieldCheck, AlertCircle, FileText, CreditCard, Clock, ArrowRight } from 'lucide-react';

const gmvData = [
  { month: 'Oct', gmv: 82000 },
  { month: 'Nov', gmv: 97000 },
  { month: 'Dec', gmv: 74000 },
  { month: 'Jan', gmv: 115000 },
  { month: 'Feb', gmv: 138000 },
  { month: 'Mar', gmv: 162000 },
  { month: 'Apr', gmv: 94000 },
];

const KPIS = [
  { label: 'Total GMV This Month', value: '£94,200', icon: TrendingUp, color: 'text-[#0070F3]', bg: 'bg-blue-50', change: '+12% MoM' },
  { label: 'Total GMV All Time', value: '£762,000', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50', change: 'Since launch' },
  { label: 'Active Engagements', value: '38', icon: FileText, color: 'text-green-600', bg: 'bg-green-50', change: '+4 this week' },
  { label: 'Verified Vendors', value: '124', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50', change: '12 pending' },
  { label: 'Active Buyers', value: '309', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', change: '+18 this month' },
  { label: 'Open Disputes', value: '3', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', change: '1 urgent' },
  { label: 'Pending Verifications', value: '12', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', change: 'Avg 2.4 days' },
  { label: 'Pending Brief Reviews', value: '7', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50', change: '3 flagged' },
];

const ACTIONS = [
  { id: '1', type: 'verification', priority: 'high', title: 'Vendor verification pending — TechPro Solutions', detail: 'Submitted 3 days ago · Companies House cert uploaded', href: '/admin/verification', label: 'Review' },
  { id: '2', type: 'dispute', priority: 'high', title: 'Dispute opened — FinEdge Capital vs DevForge Agency', detail: 'Payment withheld · £8,200 in escrow · Opened 1 day ago', href: '/admin/disputes', label: 'Resolve' },
  { id: '3', type: 'brief', priority: 'medium', title: 'Tender brief flagged — "ISO 27001 Audit"', detail: 'Flagged for missing scope detail · 6 proposals waiting', href: '/admin/briefs', label: 'Review' },
  { id: '4', type: 'verification', priority: 'medium', title: 'Vendor verification pending — NexGen IT', detail: 'Submitted 5 days ago · Missing VAT certificate', href: '/admin/verification', label: 'Review' },
  { id: '5', type: 'payment', priority: 'low', title: 'Milestone release awaiting approval — GreenPath Logistics', detail: '£6,500 held · Client approved delivery · Auto-releases in 2 days', href: '/admin/payments', label: 'Approve' },
];

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
