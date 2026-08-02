import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatGBP } from '../../lib/workflows';
import { AlertTriangle, Clock, CreditCard } from 'lucide-react';
import BuyerLayout from '../../components/buyer/BuyerLayout';

interface MilestoneRow {
  id: string;
  engagement_id: string;
  amount: number;
  escrow_status: string;
  due_date: string | null;
  vendorName: string;
  projectTitle: string;
}

const STATUS_LABEL: Record<string, string> = {
  unfunded: 'Unfunded',
  funded: 'Funded',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  released: 'Released',
  refunded: 'Refunded',
  rejected: 'Rejected',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
    {STATUS_LABEL[status] ?? status}
  </span>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-sm text-gray-400 py-6 text-center">{text}</p>
);

const BuyerBillingPage: React.FC = () => {
  const { user } = useAuth();
  const [dueNow, setDueNow] = useState<MilestoneRow[]>([]);
  const [upcoming, setUpcoming] = useState<MilestoneRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      const { data: engs } = await supabase
        .from('engagements')
        .select('id, project_title, vendor_id, status')
        .eq('buyer_id', user.id);

      const engagements = engs ?? [];
      const engIds = engagements.map((e) => e.id);

      const vendorIds = Array.from(new Set(engagements.map((e) => e.vendor_id)));
      const vendorMap = new Map<string, string>();
      if (vendorIds.length) {
        const { data: vendors } = await supabase.from('vendors').select('id, company_name').in('id', vendorIds);
        (vendors ?? []).forEach((v) => vendorMap.set(v.id, v.company_name));
      }

      let milestones: { id: string; engagement_id: string; amount: number; escrow_status: string; due_date: string | null; released_at: string | null }[] = [];
      if (engIds.length) {
        const { data } = await supabase
          .from('project_milestones')
          .select('id, engagement_id, amount, escrow_status, due_date, released_at')
          .in('engagement_id', engIds);
        milestones = data ?? [];
      }

      const now = new Date();
      const engMap = new Map(engagements.map((e) => [e.id, e]));

      const toRow = (m: (typeof milestones)[number]): MilestoneRow | null => {
        const eng = engMap.get(m.engagement_id);
        if (!eng) return null;
        return {
          id: m.id,
          engagement_id: m.engagement_id,
          amount: m.amount ?? 0,
          escrow_status: m.escrow_status,
          due_date: m.due_date,
          vendorName: vendorMap.get(eng.vendor_id) ?? 'Vendor',
          projectTitle: eng.project_title ?? 'Engagement',
        };
      };

      const due = milestones
        .filter((m) => m.escrow_status === 'unfunded' && (!m.due_date || new Date(m.due_date) <= now))
        .map(toRow)
        .filter((r): r is MilestoneRow => !!r)
        .sort((a, b) => {
          if (!a.due_date) return -1;
          if (!b.due_date) return 1;
          return a.due_date > b.due_date ? 1 : -1;
        });

      const upcomingRows = milestones
        .filter((m) => !['released', 'refunded'].includes(m.escrow_status) && m.due_date && new Date(m.due_date) > now)
        .map(toRow)
        .filter((r): r is MilestoneRow => !!r)
        .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1));

      setDueNow(due);
      setUpcoming(upcomingRows);
      setLoading(false);
    })();
  }, [user]);

  return (
    <BuyerLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-black italic text-brand-primary">Billing</h1>
        <p className="text-xs font-semibold tracking-[0.25em] text-slate-400 mt-1 uppercase">
          Due Bills &amp; Upcoming Payments
        </p>
      </div>

      {/* Due Now */}
      <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-8 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-300" />
          </div>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Due Now</span>
          {dueNow.length > 0 && (
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium ml-auto">
              {dueNow.length} action needed
            </span>
          )}
        </div>

        {!loading && dueNow.length === 0 ? (
          <EmptyState text="No overdue milestones." />
        ) : (
          <div className="space-y-3">
            {dueNow.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-3 border border-red-100 bg-red-50/40 rounded-xl p-4">
                <div className="w-9 h-9 rounded-full bg-[#0B2D59] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {row.vendorName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-semibold text-gray-900 truncate">{row.projectTitle}</p>
                  <p className="text-xs text-gray-400">{row.vendorName}</p>
                </div>
                <div className="text-sm font-bold text-[#0B2D59] whitespace-nowrap">{formatGBP(row.amount)}</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {row.due_date ? new Date(row.due_date).toLocaleDateString('en-GB') : 'No due date'}
                </div>
                <StatusBadge status={row.escrow_status} />
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Action Needed
                </span>
                <Link
                  to="/buyer/payments"
                  className="text-xs bg-[#0070F3] text-white rounded-lg px-3 py-1.5 font-semibold flex items-center gap-1 hover:bg-blue-700 transition-colors"
                >
                  <CreditCard className="h-3.5 w-3.5" /> Fund Now
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Payments */}
      <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-blue-300" />
          </div>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Upcoming Payments</span>
        </div>

        {!loading && upcoming.length === 0 ? (
          <EmptyState text="No upcoming payments scheduled." />
        ) : (
          <div className="space-y-3">
            {upcoming.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-3 border border-gray-100 rounded-xl p-4">
                <div className="w-9 h-9 rounded-full bg-[#0B2D59] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {row.vendorName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-semibold text-gray-900 truncate">{row.projectTitle}</p>
                  <p className="text-xs text-gray-400">{row.vendorName}</p>
                </div>
                <div className="text-sm font-bold text-[#0B2D59] whitespace-nowrap">{formatGBP(row.amount)}</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(row.due_date!).toLocaleDateString('en-GB')}
                </div>
                <StatusBadge status={row.escrow_status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerBillingPage;
