import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ShieldAlert, AlertTriangle, CheckCircle, Lock, ScrollText, CreditCard, Scale } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import BuyerLayout from '../../components/buyer/BuyerLayout';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const V2Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
    <Lock className="h-8 w-8 text-gray-300 mx-auto mb-3" />
    <p className="text-sm text-gray-400">Coming soon</p>
    <p className="text-xs text-gray-300 mt-1">{label}</p>
  </div>
);

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}
const StatCard: React.FC<StatCardProps> = ({ icon, value, label, tone = 'default' }) => {
  const toneClasses: Record<string, string> = {
    default: 'bg-white border-slate-100',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
  };
  const valueClasses: Record<string, string> = {
    default: 'text-[#0B2D59]',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    success: 'text-green-600',
  };
  return (
    <div className={`rounded-2xl border-2 p-5 flex flex-col gap-3 ${toneClasses[tone]}`}>
      <div className="bg-[#0B2D59] rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-black ${valueClasses[tone]}`}>{value}</p>
        <p className="text-xs text-gray-400 leading-tight mt-0.5">{label}</p>
      </div>
    </div>
  );
};

// ─── Row types ────────────────────────────────────────────────────────────────

interface RiskRow {
  id: string;
  engagementId: string;
  projectTitle: string;
  vendorName: string;
  reason: string;
  kind: 'ir35' | 'dispute' | 'funding';
  linkTo: string;
}

const BuyerRiskPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [risk, setRisk] = useState({ activeCount: 0, contractsSignedCount: 0, pendingIR35Count: 0, staffAugCount: 0 });
  const [openDisputesCount, setOpenDisputesCount] = useState(0);
  const [unfundedCount, setUnfundedCount] = useState(0);
  const [rows, setRows] = useState<RiskRow[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      const [engRes, contractRes, disputeRes] = await Promise.all([
        supabase.from('engagements').select('id, project_title, vendor_id, status, engagement_type, ir35_status').eq('buyer_id', user.id),
        supabase.from('contracts').select('id, vendor_id, status, signed_by_buyer, signed_by_vendor').eq('buyer_id', user.id),
        supabase.from('disputes').select('id, status, engagement_id').eq('buyer_id', user.id),
      ]);

      const engs = engRes.data ?? [];
      const activeEngs = engs.filter((e) => e.status === 'active');
      const engIds = engs.map((e) => e.id);

      const vendorIds = Array.from(new Set(engs.map((e) => e.vendor_id)));
      const vendorMap = new Map<string, string>();
      if (vendorIds.length) {
        const { data: vendors } = await supabase.from('vendors').select('id, company_name').in('id', vendorIds);
        (vendors ?? []).forEach((v) => vendorMap.set(v.id, v.company_name));
      }

      let milestones: { engagement_id: string; escrow_status: string; due_date: string | null }[] = [];
      if (engIds.length) {
        const { data } = await supabase.from('project_milestones').select('engagement_id, escrow_status, due_date').in('engagement_id', engIds);
        milestones = data ?? [];
      }

      // Risk stats — same query shape as BuyerDashboard's RiskDashboardModule.
      const contracts = contractRes.data ?? [];
      const contractsSignedCount = contracts.filter((c) => c.signed_by_buyer && c.signed_by_vendor).length;
      const staffAugEngs = engs.filter((e) => e.engagement_type === 'staff_aug');
      const pendingIR35Count = staffAugEngs.filter((e) => !e.ir35_status || e.ir35_status === 'pending').length;
      setRisk({ activeCount: activeEngs.length, contractsSignedCount, pendingIR35Count, staffAugCount: staffAugEngs.length });

      const openDisputes = (disputeRes.data ?? []).filter((d) => d.status !== 'resolved');
      setOpenDisputesCount(openDisputes.length);

      const now = new Date();
      const overdueUnfunded = milestones.filter((m) => m.escrow_status === 'unfunded' && m.due_date && new Date(m.due_date) < now);
      setUnfundedCount(overdueUnfunded.length);

      // ─── Build the risk breakdown rows ───────────────────────────────────
      const riskRows: RiskRow[] = [];

      staffAugEngs
        .filter((e) => !e.ir35_status || e.ir35_status === 'pending')
        .forEach((e) => {
          riskRows.push({
            id: `ir35-${e.id}`,
            engagementId: e.id,
            projectTitle: e.project_title ?? 'Engagement',
            vendorName: vendorMap.get(e.vendor_id) ?? 'Vendor',
            reason: 'IR35 status pending',
            kind: 'ir35',
            linkTo: '/buyer/governance?tab=ir35',
          });
        });

      openDisputes.forEach((d) => {
        const eng = engs.find((e) => e.id === d.engagement_id);
        riskRows.push({
          id: `dispute-${d.id}`,
          engagementId: d.engagement_id ?? '',
          projectTitle: eng?.project_title ?? 'Engagement',
          vendorName: eng ? (vendorMap.get(eng.vendor_id) ?? 'Vendor') : 'Vendor',
          reason: 'Open dispute',
          kind: 'dispute',
          linkTo: '/buyer/governance?tab=disputes',
        });
      });

      const overdueByEngagement = new Map<string, number>();
      overdueUnfunded.forEach((m) => {
        overdueByEngagement.set(m.engagement_id, (overdueByEngagement.get(m.engagement_id) ?? 0) + 1);
      });
      overdueByEngagement.forEach((count, engagementId) => {
        const eng = engs.find((e) => e.id === engagementId);
        riskRows.push({
          id: `funding-${engagementId}`,
          engagementId,
          projectTitle: eng?.project_title ?? 'Engagement',
          vendorName: eng ? (vendorMap.get(eng.vendor_id) ?? 'Vendor') : 'Vendor',
          reason: `${count} overdue unfunded milestone${count !== 1 ? 's' : ''}`,
          kind: 'funding',
          linkTo: '/buyer/payments',
        });
      });

      setRows(riskRows);
      setLoading(false);
    })();
  }, [user]);

  const kindIcon = (kind: RiskRow['kind']) => {
    if (kind === 'ir35') return <Scale className="h-4 w-4 text-amber-500" />;
    if (kind === 'dispute') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <CreditCard className="h-4 w-4 text-amber-500" />;
  };

  return (
    <BuyerLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="h-5 w-5 text-orange-300" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0B2D59]">Risk Centre</h1>
            <p className="text-sm text-gray-400">A rollup of the compliance, dispute and funding signals across your engagements.</p>
          </div>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Shield className="h-5 w-5 text-teal-300" />} value={risk.activeCount} label="Active Engagements" />
          <StatCard icon={<ScrollText className="h-5 w-5 text-emerald-300" />} value={risk.contractsSignedCount} label="Contracts Signed" />
          <StatCard
            icon={<Scale className="h-5 w-5 text-amber-300" />}
            value={risk.staffAugCount === 0 ? '—' : risk.pendingIR35Count}
            label={risk.staffAugCount === 0 ? 'No Staff Aug Engagements' : risk.pendingIR35Count === 0 ? 'IR35 Compliant' : 'IR35 Status Pending'}
            tone={risk.staffAugCount === 0 ? 'default' : risk.pendingIR35Count === 0 ? 'success' : 'warning'}
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-red-300" />}
            value={openDisputesCount}
            label="Open Disputes"
            tone={openDisputesCount > 0 ? 'danger' : 'success'}
          />
          <StatCard
            icon={<CreditCard className="h-5 w-5 text-amber-300" />}
            value={unfundedCount}
            label="Overdue Unfunded Milestones"
            tone={unfundedCount > 0 ? 'warning' : 'success'}
          />
        </div>

        {/* Breakdown table */}
        <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Risk Signals by Engagement</span>
            {rows.length > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {rows.length} signal{rows.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 py-4 text-center">Loading risk signals…</p>
          ) : rows.length === 0 ? (
            <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              No active risk signals — all engagements are clear.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <Link
                  key={row.id}
                  to={row.linkTo}
                  className="flex items-center gap-3 border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {kindIcon(row.kind)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{row.projectTitle}</p>
                    <p className="text-xs text-gray-400">{row.vendorName}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 whitespace-nowrap">
                    {row.reason}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Predictive risk scoring placeholder */}
        <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="h-5 w-5 text-orange-300" />
            </div>
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Full Risk Score</span>
          </div>
          <V2Placeholder label="Coming soon: predictive risk scoring" />
        </div>
      </div>
    </BuyerLayout>
  );
};

export default BuyerRiskPage;
