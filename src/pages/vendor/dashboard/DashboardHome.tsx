import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Store, FolderOpen, DollarSign, Inbox, ShieldCheck,
  Brain, Lock, Lightbulb, User, CheckCircle2, Circle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { sweepPendingEngagementFollowups, formatGBP } from '../../../lib/workflows';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const DOC_LABELS: Record<string, string> = {
  companies_house: 'Companies House Certificate',
  address_proof: 'Proof of Business Address',
  vat_certificate: 'VAT Registration Certificate',
};

// ─── Module Card shell ─────────────────────────────────────────────────────────

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  expandHref: string;
  children: React.ReactNode;
}

function ModuleCard({ icon, title, expandHref, children }: ModuleCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <p className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">{title}</p>
      </div>
      <div className="flex-1">{children}</div>
      <div className="border-t border-gray-100 pt-4 mt-5 flex items-center justify-between">
        <Link to={expandHref} className="text-xs font-bold tracking-[0.12em] uppercase text-[#0070F3] hover:underline">
          Expand Module
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 py-4 text-center">{text}</p>;
}

// ─── Module 1: MARKETPLACE ─────────────────────────────────────────────────────

function MarketplaceModule({ jobs }: { jobs: any[] }) {
  const matchColor = (m: string) =>
    m === 'High' ? 'bg-green-100 text-green-700' :
    m === 'Medium' ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';

  return (
    <ModuleCard icon={<Store className="h-5 w-5 text-blue-300" />} title="Marketplace" expandHref="/vendor/dashboard/jobs">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          [{jobs.length}] new job{jobs.length === 1 ? '' : 's'} match your profile
        </span>
      </div>
      {jobs.length === 0 ? (
        <EmptyState text="No open jobs match your profile yet. Check back soon or broaden your services in My Listing." />
      ) : (
        <div className="space-y-3">
          {jobs.map((job: any) => (
            <div key={job.id} className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                  <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${(job.type || 'Job') === 'Job' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {job.type || 'Job'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {job.match && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${matchColor(job.match)}`}>
                      {job.match} match
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{job.budget ? (typeof job.budget === 'number' ? `£${job.budget.toLocaleString()}` : job.budget) : ''}</span>
                  <span className="text-xs text-gray-400">{job.posted || (job.created_at ? new Date(job.created_at).toLocaleDateString('en-GB') : '')}</span>
                  <Link to="/vendor/dashboard/jobs" className="text-xs text-[#0070F3] font-medium ml-auto">Apply</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModuleCard>
  );
}

// ─── Module 2: WORKSPACE ───────────────────────────────────────────────────────

function WorkspaceModule({ engagements, benchAvailable, benchTotal, showBench }: {
  engagements: any[]; benchAvailable: number; benchTotal: number; showBench: boolean;
}) {
  const overdueCount = engagements.filter(e => e.overdue).length;

  return (
    <ModuleCard icon={<FolderOpen className="h-5 w-5 text-teal-300" />} title="Workspace" expandHref="/vendor/dashboard/contracts">
      {overdueCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 mb-4">
          {overdueCount} milestone{overdueCount > 1 ? 's' : ''} awaiting evidence submission
        </div>
      )}
      {engagements.length === 0 ? (
        <EmptyState text="No active engagements yet." />
      ) : (
        <div className="space-y-4 mb-4">
          {engagements.map(eng => (
            <Link key={eng.id} to={`/engagement/${eng.id}`} className="flex items-start gap-3 hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#0B2D59] flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-white font-bold">{initials(eng.buyerName)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{eng.project_title ?? 'Engagement'}</p>
                <p className="text-xs text-gray-400 mb-1.5">{eng.buyerName}</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-[#0070F3]" style={{ width: `${eng.progress}%` }} />
                </div>
                {eng.nextDue && (
                  <p className={`text-xs mt-1 ${eng.overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    Milestone due {eng.nextDue}{eng.overdue ? ' — OVERDUE' : ''}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      {showBench && (
        <p className="text-xs text-gray-500 mb-2">{benchAvailable} of {benchTotal} team members available</p>
      )}
    </ModuleCard>
  );
}

// ─── Module 3: REVENUE ─────────────────────────────────────────────────────────

function RevenueModule({ monthNet, pendingPayouts, lastPayout, stripeConnected }: {
  monthNet: number; pendingPayouts: number; lastPayout: { amount: number; date: string } | null; stripeConnected: boolean;
}) {
  return (
    <ModuleCard icon={<DollarSign className="h-5 w-5 text-emerald-300" />} title="Revenue" expandHref="/vendor/dashboard/payments">
      <div className="mb-4">
        <p className="text-4xl font-black text-[#0B2D59]">{formatGBP(monthNet)}</p>
        <p className="text-xs text-gray-400 uppercase mt-1 tracking-wide">Net Revenue This Month</p>
      </div>
      <div className="mb-4 space-y-1">
        <p className="text-sm text-gray-700">{formatGBP(pendingPayouts)} <span className="text-gray-400 text-xs">pending payouts</span></p>
        <p className="text-xs text-gray-500">{lastPayout ? `Last payout: ${formatGBP(lastPayout.amount)} on ${lastPayout.date}` : 'No payouts yet'}</p>
      </div>
      {!stripeConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-center justify-between">
          <span>Connect your bank to receive payouts</span>
          <Link to="/vendor/dashboard/payments" className="text-[#0070F3] font-medium ml-2 whitespace-nowrap">Connect Stripe</Link>
        </div>
      )}
    </ModuleCard>
  );
}

// ─── Module 4: ENQUIRIES ───────────────────────────────────────────────────────

function EnquiriesModule({ enquiries }: { enquiries: any[] }) {
  const pending = enquiries.filter(e => !e.responded_at).length;
  const paymentLabel = (badge: string) =>
    badge === 'green' ? { label: 'Reliable payer', cls: 'bg-green-100 text-green-700' } :
    badge === 'amber' ? { label: 'Average payer', cls: 'bg-amber-100 text-amber-700' } :
    { label: 'Late payer', cls: 'bg-red-100 text-red-700' };

  return (
    <ModuleCard icon={<Inbox className="h-5 w-5 text-purple-300" />} title="Enquiries" expandHref="/vendor/dashboard/enquiries">
      {enquiries.length === 0 ? (
        <EmptyState text="No enquiries yet. They'll show up here as buyers request proposals." />
      ) : (
        <div className="space-y-4 mb-4">
          {enquiries.slice(0, 2).map((enq: any) => {
            const badge = paymentLabel(enq.payment_badge || 'green');
            return (
              <div key={enq.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{enq.subject || enq.title || enq.profiles?.full_name || 'Enquiry'}</p>
                    <p className="text-xs text-gray-400">{enq.service_type || enq.status || ''}</p>
                  </div>
                  <Link to="/vendor/dashboard/enquiries" className="text-xs text-[#0070F3] font-medium flex-shrink-0">Respond</Link>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-700 font-medium">
                    {enq.budget_from || enq.budget_to ? `£${(enq.budget_from ?? 0).toLocaleString()}–£${(enq.budget_to ?? 0).toLocaleString()}` : ''}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{enq.created_at ? new Date(enq.created_at).toLocaleDateString('en-GB') : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-gray-500">{enquiries.length} enquir{enquiries.length === 1 ? 'y' : 'ies'} · {pending} awaiting response</p>
    </ModuleCard>
  );
}

// ─── Module 5: GOVERNANCE ──────────────────────────────────────────────────────

function GovernanceModule({ isVerified, docs, activeCount, stampedCount }: {
  isVerified: boolean; docs: Record<string, string>; activeCount: number; stampedCount: number;
}) {
  return (
    <ModuleCard icon={<ShieldCheck className="h-5 w-5 text-orange-300" />} title="Governance" expandHref="/vendor/dashboard/listings?step=6">
      <div className="mb-4">
        {isVerified ? (
          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" /> Collabov Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" /> Verification Pending
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {Object.entries(DOC_LABELS).map(([key, label]) => {
          const uploaded = !!docs[key];
          return (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <p className="text-xs font-medium text-gray-800">{label}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${uploaded ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {uploaded ? 'Uploaded' : 'Missing'}
              </span>
            </div>
          );
        })}
      </div>

      {activeCount > 0 && (
        <p className="text-xs text-gray-700 font-medium mb-2">
          {activeCount} active engagement{activeCount > 1 ? 's' : ''}{stampedCount > 0 ? ` — ${stampedCount} IR35 SDS stamped` : ''}
        </p>
      )}
    </ModuleCard>
  );
}

// ─── Module 6: INTELLIGENCE ────────────────────────────────────────────────────

function IntelligenceModule({ tips }: { tips: string[] }) {
  return (
    <ModuleCard icon={<Brain className="h-5 w-5 text-cyan-300" />} title="Intelligence" expandHref="/vendor/dashboard/analytics">
      <div className="space-y-2 mb-4">
        {tips.length === 0 ? (
          <EmptyState text="No suggestions right now — your profile is in good shape." />
        ) : tips.map((tip, i) => (
          <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
            <Lightbulb className="h-4 w-4 text-[#0070F3] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700">{tip}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {['Demand Signals', 'Pricing AI'].map(label => (
          <div key={label} className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
            <Lock className="h-5 w-5 text-gray-300 mx-auto mb-1.5" />
            <p className="text-[10px] text-gray-400 font-medium">{label}</p>
            <p className="text-[10px] text-gray-300">Coming in V2</p>
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const DashboardHome: React.FC = () => {
  const { profile, user } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [recentEnquiries, setRecentEnquiries] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [workspaceEngagements, setWorkspaceEngagements] = useState<any[]>([]);
  const [activeEngagementCount, setActiveEngagementCount] = useState(0);
  const [stampedCount, setStampedCount] = useState(0);
  const [bench, setBench] = useState({ available: 0, total: 0 });
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [caseStudyCount, setCaseStudyCount] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [revenue, setRevenue] = useState({ monthNet: 0, pendingPayouts: 0, lastPayout: null as { amount: number; date: string } | null });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    sweepPendingEngagementFollowups(user.id).catch(() => {});

    const [vendorRes, enquiryRes, jobRes, engRes, docsRes, csRes, refRes] = await Promise.all([
      supabase.from('vendors').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('enquiries').select('*, profiles(full_name)').eq('vendor_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('jobs').select('id, title, budget:budget_amount, status, created_at').eq('status', 'open').eq('admin_status', 'live').order('created_at', { ascending: false }).limit(5),
      supabase.from('engagements').select('id, project_title, buyer_id, status, ir35_status, engagement_type').eq('vendor_id', user.id),
      supabase.from('vendor_documents').select('document_type, document_url').eq('vendor_id', user.id),
      supabase.from('case_studies').select('id', { count: 'exact', head: true }).eq('vendor_id', user.id),
      supabase.from('vendor_referrals').select('id', { count: 'exact', head: true }).eq('vendor_id', user.id),
    ]);

    setVendor(vendorRes.data);
    setRecentEnquiries(enquiryRes.data || []);
    setRecentJobs(jobRes.data || []);
    setCaseStudyCount(csRes.count || 0);
    setReferralCount(refRes.count || 0);

    const docMap: Record<string, string> = {};
    (docsRes.data || []).forEach((d: any) => { docMap[d.document_type] = d.document_url; });
    setDocs(docMap);

    const engs = engRes.data || [];
    const activeEngs = engs.filter((e: any) => e.status === 'active');
    setActiveEngagementCount(activeEngs.length);
    setStampedCount(engs.filter((e: any) => e.ir35_status && e.ir35_status !== 'pending').length);

    if (vendorRes.data?.business_type === 'staffaug') {
      const { data: employees } = await supabase.from('vendor_employees').select('availability_status').eq('vendor_id', user.id);
      setBench({
        available: (employees || []).filter((e: any) => e.availability_status === 'available').length,
        total: (employees || []).length,
      });
    }

    const buyerIds = Array.from(new Set(activeEngs.map((e: any) => e.buyer_id)));
    const buyerMap = new Map<string, string>();
    if (buyerIds.length) {
      const { data: buyers } = await supabase.from('buyers').select('id, company_name').in('id', buyerIds);
      (buyers || []).forEach((b: any) => buyerMap.set(b.id, b.company_name));
    }

    const engIds = engs.map((e: any) => e.id);
    let milestones: any[] = [];
    let invoices: any[] = [];
    if (engIds.length) {
      const [msRes, invRes] = await Promise.all([
        supabase.from('project_milestones').select('*').in('engagement_id', engIds),
        supabase.from('invoices').select('*').in('engagement_id', engIds).order('issued_at', { ascending: false }),
      ]);
      milestones = msRes.data || [];
      invoices = invRes.data || [];
    }

    const today = new Date();
    const workspace = activeEngs.slice(0, 3).map((e: any) => {
      const ms = milestones.filter(m => m.engagement_id === e.id);
      const released = ms.filter(m => m.escrow_status === 'released').length;
      const progress = ms.length > 0 ? Math.round((released / ms.length) * 100) : 0;
      const upcoming = ms.filter(m => m.due_date && !['released', 'refunded'].includes(m.escrow_status)).sort((a, b) => (a.due_date > b.due_date ? 1 : -1))[0];
      const overdue = !!upcoming && new Date(upcoming.due_date) < today;
      return {
        id: e.id, project_title: e.project_title, buyerName: buyerMap.get(e.buyer_id) || 'Buyer',
        progress, nextDue: upcoming?.due_date ? new Date(upcoming.due_date).toLocaleDateString('en-GB') : null, overdue,
      };
    });
    setWorkspaceEngagements(workspace);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthNet = invoices.filter(i => i.issued_at && new Date(i.issued_at) >= monthStart).reduce((s, i) => s + (i.net_amount ?? 0), 0);
    const pendingPayouts = milestones.filter(m => m.escrow_status === 'submitted').reduce((s, m) => s + (m.amount ?? 0), 0);
    const lastPayout = invoices[0] ? { amount: invoices[0].net_amount ?? 0, date: new Date(invoices[0].issued_at).toLocaleDateString('en-GB') } : null;
    setRevenue({ monthNet, pendingPayouts, lastPayout });

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const isVerified = vendor?.is_verified ?? false;
  const companyName = vendor?.company_name ?? profile?.full_name ?? 'Your Company';

  const checklistItems = [
    { id: 'company_info', label: 'Add company information', route: '/vendor/dashboard/listings', done: !!vendor?.company_name && (vendor?.description?.length ?? 0) >= 100 },
    { id: 'services', label: 'Add services and tech stack', route: '/vendor/dashboard/listings', done: (vendor?.service_categories?.length ?? 0) > 0 },
    { id: 'case_study', label: 'Add at least one case study', route: '/vendor/dashboard/listings', done: caseStudyCount > 0 },
    { id: 'referral', label: 'Submit at least one referral', route: '/vendor/dashboard/listings', done: referralCount > 0 },
    { id: 'documents', label: 'Upload verification documents', route: '/vendor/dashboard/listings', done: !!docs['companies_house'] && !!docs['address_proof'] },
  ];
  const allComplete = checklistItems.every(item => item.done);
  const completionPercent = Math.round((checklistItems.filter(i => i.done).length / checklistItems.length) * 100);
  const submittedForVerification = vendor?.verification_status === 'submitted' || isVerified;

  const submitForVerification = async () => {
    if (!user) return;
    setSubmitting(true);
    await supabase.from('vendors').update({ verification_status: 'submitted' }).eq('id', user.id);
    setSubmitting(false);
    load();
  };

  // Rules-based nudges — only shown when the underlying condition is real and true.
  const tips: string[] = [];
  if (vendor?.response_time_hours && vendor.response_time_hours > 4) {
    tips.push(`Your avg response time is ${vendor.response_time_hours}hrs. Vendors responding within 2hrs win significantly more contracts.`);
  }
  const unrespondedCount = recentEnquiries.filter(e => !e.responded_at).length;
  if (unrespondedCount > 0) {
    tips.push(`You have ${unrespondedCount} enquir${unrespondedCount === 1 ? 'y' : 'ies'} awaiting a response — reply promptly to improve your ranking.`);
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#0B2D59]">Good {getGreeting()}, {companyName}.</h1>
        </div>
        {isVerified ? (
          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" /> Collabov Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" /> Verification Pending
          </span>
        )}
      </div>

      {completionPercent < 100 && !submittedForVerification && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0B2D59] rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-gray-900">PROFILE COMPLETION</p>
                <p className="text-xs text-gray-500 mt-0.5">{completionPercent}% complete — Complete your profile to go live</p>
              </div>
            </div>
            <span className="text-2xl font-black text-[#0070F3]">{completionPercent}%</span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
            <div className="bg-[#0070F3] h-2 rounded-full transition-all duration-500" style={{ width: `${completionPercent}%` }} />
          </div>

          <div className="space-y-2 mb-5">
            {checklistItems.map(item => (
              <Link key={item.id} to={item.route} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                {item.done ? <CheckCircle2 className="h-5 w-5 text-[#0E7C6A] flex-shrink-0" /> : <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />}
                <span className={`text-sm ${item.done ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-[#0070F3]'}`}>{item.label}</span>
                {!item.done && <ArrowRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-[#0070F3]" />}
              </Link>
            ))}
          </div>

          {allComplete && (
            <button onClick={submitForVerification} disabled={submitting}
              className="w-full bg-[#0070F3] text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit for Verification →'}
            </button>
          )}
        </div>
      )}

      {submittedForVerification && !isVerified && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">Profile submitted for verification — we'll review within 2 business days.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MarketplaceModule jobs={recentJobs} />
        <WorkspaceModule engagements={workspaceEngagements} benchAvailable={bench.available} benchTotal={bench.total} showBench={vendor?.business_type === 'staffaug'} />
        <RevenueModule monthNet={revenue.monthNet} pendingPayouts={revenue.pendingPayouts} lastPayout={revenue.lastPayout} stripeConnected={vendor?.stripe_connect_status === 'connected'} />
        <EnquiriesModule enquiries={recentEnquiries} />
        <GovernanceModule isVerified={isVerified} docs={docs} activeCount={activeEngagementCount} stampedCount={stampedCount} />
        <IntelligenceModule tips={tips} />
      </div>
    </div>
  );
};

export default DashboardHome;
