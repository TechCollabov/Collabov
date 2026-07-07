import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, ShieldCheck, AlertCircle, FileText, CreditCard, Clock, ArrowRight, Lock, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatGBP } from '../../lib/workflows';

interface Kpis {
  gmvThisMonth: number;
  gmvAllTime: number;
  activeEngagements: number;
  verifiedVendors: number;
  activeBuyers: number;
  openDisputes: number;
  pendingVerifications: number;
  pendingBriefs: number;
}

interface PriorityAction {
  id: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  href: string;
  label: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-600',
};

const monthKey = (d: Date) => d.toLocaleString('en-GB', { month: 'short', year: '2-digit' });

const AdminDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [gmvData, setGmvData] = useState<{ month: string; gmv: number }[]>([]);
  const [actions, setActions] = useState<PriorityAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const [
        { count: verifiedVendors },
        { count: pendingVerifications },
        { count: activeEngagements },
        { count: openDisputes },
        { count: pendingBriefs },
        { count: activeBuyers },
        { data: allReleases },
        { data: recentReleases },
        { data: adminReviewDisputes },
        { data: lockedAdmins },
        { data: pendingRestorations },
        { data: pendingBriefRows },
        { data: pendingBuyerRestorations },
        { count: pendingIR35 },
      ] = await Promise.all([
        supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('is_verified', false).is('rejected_at', null),
        supabase.from('engagements').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('disputes').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('admin_status', 'pending_review'),
        supabase.from('buyers').select('id', { count: 'exact', head: true }).gt('active_projects_count', 0),
        supabase.from('escrow_transactions').select('amount').eq('transaction_type', 'release'),
        supabase.from('escrow_transactions').select('amount, created_at').eq('transaction_type', 'release').gte('created_at', sixMonthsAgo.toISOString()),
        supabase.from('disputes').select('id, reason, engagement_id').eq('status', 'admin_review'),
        supabase.from('profiles').select('id, full_name').eq('user_type', 'admin').not('locked_at', 'is', null),
        supabase.from('vendors').select('id, company_name, restoration_approvals').eq('is_blacklisted', true),
        supabase.from('jobs').select('id, title, tender_title, job_kind').eq('admin_status', 'pending_review').limit(5),
        supabase.from('buyers').select('id, company_name, restoration_approvals').eq('is_blacklisted', true),
        supabase.from('engagements').select('id', { count: 'exact', head: true }).eq('ir35_status', 'pending').eq('status', 'pending_ir35'),
      ]);

      const gmvAllTime = (allReleases || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);

      const { data: thisMonthReleases } = await supabase
        .from('escrow_transactions')
        .select('amount')
        .eq('transaction_type', 'release')
        .gte('created_at', startOfMonth.toISOString());
      const gmvThisMonth = (thisMonthReleases || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);

      setKpis({
        gmvThisMonth,
        gmvAllTime,
        activeEngagements: activeEngagements || 0,
        verifiedVendors: verifiedVendors || 0,
        activeBuyers: activeBuyers || 0,
        openDisputes: openDisputes || 0,
        pendingVerifications: pendingVerifications || 0,
        pendingBriefs: pendingBriefs || 0,
      });

      const buckets = new Map<string, number>();
      for (let i = 0; i < 6; i++) {
        const d = new Date(sixMonthsAgo);
        d.setMonth(d.getMonth() + i);
        buckets.set(monthKey(d), 0);
      }
      (recentReleases || []).forEach((r: any) => {
        const key = monthKey(new Date(r.created_at));
        buckets.set(key, (buckets.get(key) || 0) + Number(r.amount || 0));
      });
      setGmvData(Array.from(buckets.entries()).map(([month, gmv]) => ({ month, gmv })));

      const queue: PriorityAction[] = [];
      if ((pendingVerifications || 0) > 0) {
        queue.push({
          id: 'pending-verifications',
          type: 'verification',
          priority: 'high',
          title: `${pendingVerifications} vendor verification${pendingVerifications === 1 ? '' : 's'} pending`,
          detail: 'New vendor applications awaiting document review',
          href: '/admin/verification',
          label: 'Review',
        });
      }
      (pendingBriefRows || []).forEach((j: any) => {
        queue.push({
          id: `brief-${j.id}`,
          type: 'brief',
          priority: 'medium',
          title: j.job_kind === 'tender' ? (j.tender_title || 'Tender submission') : (j.title || 'Job brief'),
          detail: `${j.job_kind === 'tender' ? 'Tender' : 'Job'} awaiting admin approval before going live`,
          href: '/admin/briefs',
          label: 'Review',
        });
      });
      (adminReviewDisputes || []).forEach((d: any) => {
        queue.push({
          id: `dispute-${d.id}`,
          type: 'dispute',
          priority: 'high',
          title: `Dispute escalated to admin — ${d.reason.replace(/_/g, ' ')}`,
          detail: 'Bilateral window expired without resolution',
          href: '/admin/disputes',
          label: 'Resolve',
        });
      });
      (lockedAdmins || []).forEach((a: any) => {
        queue.push({
          id: `locked-${a.id}`,
          type: 'lockout',
          // A locked admin can't unlock themselves or act on anything else in
          // this queue — that's a blocker on admin capacity, not routine review.
          priority: 'high',
          title: `${a.full_name}'s admin account is locked`,
          detail: '3 failed sign-in attempts — needs a second admin to unlock',
          href: '/admin/users',
          label: 'Unlock',
        });
      });
      (pendingRestorations || []).forEach((v: any) => {
        const approvals = Array.isArray(v.restoration_approvals) ? v.restoration_approvals.length : 0;
        if (approvals >= 1 && approvals < 2) {
          queue.push({
            id: `restore-vendor-${v.id}`,
            type: 'restoration',
            priority: 'low',
            title: `${v.company_name} restoration awaiting second approval`,
            detail: `${approvals}/2 admin approvals recorded`,
            href: '/admin/users',
            label: 'Approve',
          });
        }
      });
      (pendingBuyerRestorations || []).forEach((c: any) => {
        const approvals = Array.isArray(c.restoration_approvals) ? c.restoration_approvals.length : 0;
        if (approvals >= 1 && approvals < 2) {
          queue.push({
            id: `restore-buyer-${c.id}`,
            type: 'restoration',
            priority: 'low',
            title: `${c.company_name} restoration awaiting second approval`,
            detail: `${approvals}/2 admin approvals recorded`,
            href: '/admin/users',
            label: 'Approve',
          });
        }
      });
      if ((pendingIR35 || 0) > 0) {
        queue.push({
          id: 'pending-ir35',
          type: 'ir35',
          // Blocks the contract from going active and payments from starting.
          priority: 'high',
          title: `${pendingIR35} staff-aug engagement${pendingIR35 === 1 ? '' : 's'} awaiting IR35 determination`,
          detail: 'Contract stays inactive until an admin stamps inside/outside IR35',
          href: '/admin/verification',
          label: 'Stamp',
        });
      }

      const priorityRank = { high: 0, medium: 1, low: 2 };
      queue.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
      setActions(queue);
      setLoading(false);
    };

    load();
  }, []);

  const KPI_CARDS = kpis ? [
    { label: 'Total GMV This Month', value: formatGBP(kpis.gmvThisMonth), icon: TrendingUp, color: 'text-[#0070F3]', bg: 'bg-blue-50', href: '/admin/payments' },
    { label: 'Total GMV All Time', value: formatGBP(kpis.gmvAllTime), icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/payments' },
    { label: 'Active Engagements', value: String(kpis.activeEngagements), icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Verified Vendors', value: String(kpis.verifiedVendors), icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/verification' },
    { label: 'Active Buyers', value: String(kpis.activeBuyers), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/admin/users' },
    { label: 'Open Disputes', value: String(kpis.openDisputes), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', href: '/admin/disputes' },
    { label: 'Pending Verifications', value: String(kpis.pendingVerifications), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', href: '/admin/verification' },
    { label: 'Pending Brief Reviews', value: String(kpis.pendingBriefs), icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50', href: '/admin/briefs' },
  ] : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(loading ? Array.from({ length: 8 }) : KPI_CARDS).map((kpi: any, idx) => {
          const cardClasses = 'bg-white rounded-xl border border-gray-100 shadow-sm p-5';
          const content = kpi ? (
            <>
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide leading-tight">{kpi.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
            </>
          ) : (
            <div className="h-16 animate-pulse bg-gray-50 rounded-lg" />
          );

          if (kpi?.href) {
            return (
              <Link key={kpi.label} to={kpi.href} className={`${cardClasses} hover:border-gray-200 hover:shadow-md transition-shadow`}>
                {content}
              </Link>
            );
          }

          return (
            <div key={kpi?.label ?? idx} className={cardClasses}>
              {content}
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
        {actions.length === 0 && !loading && (
          <div className="px-5 py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-300" />
            Nothing needs your attention right now.
          </div>
        )}
        <ul className="divide-y divide-gray-50">
          {actions.map(action => (
            <li key={action.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${PRIORITY_COLORS[action.priority]}`}>
                {action.priority}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate flex items-center gap-1.5">
                  {action.type === 'lockout' && <Lock className="h-3.5 w-3.5 text-gray-400" />}
                  {action.title}
                </div>
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
