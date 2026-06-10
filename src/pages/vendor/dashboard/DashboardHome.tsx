import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store, FolderOpen, DollarSign, Inbox, ShieldCheck,
  Brain, Lock, Lightbulb, User, CheckCircle2, Circle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const mockJobs = [
  { id: '1', title: 'Senior React Developer — 6-month contract', match: 'High', budget: '£3,200/month', posted: '2h ago', type: 'Job' },
  { id: '2', title: 'Cloud Infrastructure Assessment & Migration', match: 'Medium', budget: '£12,000–£18,000', posted: '5h ago', type: 'Tender' },
  { id: '3', title: 'DevOps Engineer — AWS/Kubernetes specialist', match: 'High', budget: '£4,100/month', posted: '1d ago', type: 'Job' },
];

const mockContracts = [
  { id: '1', buyer: 'Paytrace Financial', project: 'Payment Gateway Rebuild', progress: 60, milestone_due: '2026-06-20', overdue: false },
  { id: '2', buyer: 'CareSync Health', project: 'NHS Integration Platform', progress: 85, milestone_due: '2026-06-15', overdue: true },
];

const mockEnquiries = [
  { id: '1', buyer_type: 'Fintech scale-up', location: 'London', service: 'Software Development', budget: '£25,000–£40,000', received: '1h ago', payment_badge: 'green' },
  { id: '2', buyer_type: 'SaaS platform', location: 'Manchester', service: 'DevOps & Cloud', budget: '£8,000–£15,000', received: '3h ago', payment_badge: 'amber' },
  { id: '3', buyer_type: 'HealthTech company', location: 'Remote', service: 'Full-stack Development', budget: '£45,000+', received: '6h ago', payment_badge: 'green' },
];

const mockProfileTips = [
  'Your avg response time is 6hrs. Vendors responding in 2hrs win 40% more contracts.',
  'You have 3 unread enquiries — respond within 4 hours to improve your ranking.',
];

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
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <p className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">{title}</p>
      </div>

      {/* Body */}
      <div className="flex-1">{children}</div>

      {/* Footer */}
      <div className="border-t border-gray-100 pt-4 mt-5 flex items-center justify-between">
        <Link to={expandHref} className="text-xs font-bold tracking-[0.12em] uppercase text-[#0070F3] hover:underline">
          Expand Module
        </Link>
        <span className="text-[10px] text-gray-400">SYNCED 2M AGO</span>
      </div>
    </div>
  );
}

// ─── V2 Placeholder ────────────────────────────────────────────────────────────

function V2Placeholder({ label }: { label: string }) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center mt-4">
      <Lock className="h-6 w-6 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-400">Coming in V2</p>
      {label && <p className="text-xs text-gray-300 mt-1">{label}</p>}
    </div>
  );
}

// ─── Module 1: MARKETPLACE ─────────────────────────────────────────────────────

function MarketplaceModule() {
  const matchColor = (m: string) =>
    m === 'High' ? 'bg-green-100 text-green-700' :
    m === 'Medium' ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';

  return (
    <ModuleCard
      icon={<Store className="h-5 w-5 text-blue-300" />}
      title="Marketplace"
      expandHref="/vendor/dashboard/jobs"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          [3] new jobs match your profile
        </span>
      </div>
      <div className="space-y-3">
        {mockJobs.map(job => (
          <div key={job.id} className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${job.type === 'Job' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {job.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${matchColor(job.match)}`}>
                  {job.match} match
                </span>
                <span className="text-xs text-gray-500">{job.budget}</span>
                <span className="text-xs text-gray-400">{job.posted}</span>
                <Link to="/vendor/dashboard/jobs" className="text-xs text-[#0070F3] font-medium ml-auto">Apply</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}

// ─── Module 2: WORKSPACE ───────────────────────────────────────────────────────

function WorkspaceModule() {
  const overdueCount = mockContracts.filter(c => c.overdue).length;

  return (
    <ModuleCard
      icon={<FolderOpen className="h-5 w-5 text-teal-300" />}
      title="Workspace"
      expandHref="/vendor/dashboard/contracts"
    >
      {overdueCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 mb-4">
          {overdueCount} milestone{overdueCount > 1 ? 's' : ''} awaiting evidence submission
        </div>
      )}
      <div className="space-y-4 mb-4">
        {mockContracts.map(contract => (
          <div key={contract.id} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0B2D59] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-white font-bold">{initials(contract.buyer)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{contract.project}</p>
              <p className="text-xs text-gray-400 mb-1.5">{contract.buyer}</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-[#0070F3]"
                  style={{ width: `${contract.progress}%` }}
                />
              </div>
              <p className={`text-xs mt-1 ${contract.overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                Milestone due {contract.milestone_due}{contract.overdue ? ' — OVERDUE' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mb-2">3 of 5 team members available</p>
      <V2Placeholder label="Delivery Signals" />
    </ModuleCard>
  );
}

// ─── Module 3: REVENUE ─────────────────────────────────────────────────────────

function RevenueModule() {
  const stripeConnected = false; // mock

  return (
    <ModuleCard
      icon={<DollarSign className="h-5 w-5 text-emerald-300" />}
      title="Revenue"
      expandHref="/vendor/dashboard/payments"
    >
      <div className="mb-4">
        <p className="text-4xl font-black text-[#0B2D59]">£12,400</p>
        <p className="text-xs text-gray-400 uppercase mt-1 tracking-wide">Gross Revenue This Month</p>
      </div>
      <div className="mb-4 space-y-1">
        <p className="text-sm text-gray-700">£8,200 <span className="text-gray-400 text-xs">pending payouts</span></p>
        <p className="text-xs text-gray-500">Next payout: 15 Jun 2026</p>
      </div>
      {!stripeConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-center justify-between">
          <span>Connect your bank to receive payouts</span>
          <Link to="/vendor/dashboard/payments" className="text-[#0070F3] font-medium ml-2 whitespace-nowrap">
            Connect Stripe
          </Link>
        </div>
      )}
    </ModuleCard>
  );
}

// ─── Module 4: ENQUIRIES ───────────────────────────────────────────────────────

function EnquiriesModule() {
  const paymentLabel = (badge: string) =>
    badge === 'green' ? { label: 'Reliable payer', cls: 'bg-green-100 text-green-700' } :
    badge === 'amber' ? { label: 'Average payer', cls: 'bg-amber-100 text-amber-700' } :
    { label: 'Late payer', cls: 'bg-red-100 text-red-700' };

  return (
    <ModuleCard
      icon={<Inbox className="h-5 w-5 text-purple-300" />}
      title="Enquiries"
      expandHref="/vendor/dashboard/enquiries"
    >
      <div className="space-y-4 mb-4">
        {mockEnquiries.slice(0, 2).map(enq => {
          const badge = paymentLabel(enq.payment_badge);
          return (
            <div key={enq.id} className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="text-sm font-medium text-gray-900">{enq.buyer_type}</p>
                  <p className="text-xs text-gray-400">{enq.location} · {enq.service}</p>
                </div>
                <Link to="/vendor/dashboard/enquiries" className="text-xs text-[#0070F3] font-medium flex-shrink-0">
                  Respond
                </Link>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-700 font-medium">{enq.budget}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                  {badge.label}
                </span>
                <span className="text-[10px] text-gray-400 ml-auto">{enq.received}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500">3 enquiries this month · 1 proposal pending</p>
    </ModuleCard>
  );
}

// ─── Module 5: GOVERNANCE ──────────────────────────────────────────────────────

function GovernanceModule({ isVerified }: { isVerified: boolean }) {
  return (
    <ModuleCard
      icon={<ShieldCheck className="h-5 w-5 text-orange-300" />}
      title="Governance"
      expandHref="/vendor/dashboard/settings"
    >
      {/* Verification status */}
      <div className="mb-4">
        {isVerified ? (
          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" />
            Collabov Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verification Pending
          </span>
        )}
      </div>

      {/* Compliance docs */}
      <div className="space-y-2 mb-4">
        {[
          { doc: 'Companies House Certificate', expiry: 'Expires 30 Sep 2026', status: 'Valid' },
          { doc: 'Professional Indemnity Insurance', expiry: 'Expires 14 Jul 2026', status: 'Expiring' },
        ].map(item => (
          <div key={item.doc} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-xs font-medium text-gray-800">{item.doc}</p>
              <p className="text-[10px] text-gray-400">{item.expiry}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>

      {/* IR35 */}
      <p className="text-xs text-green-700 font-medium mb-2">
        2 active engagements — SDS stamped
      </p>

      <V2Placeholder label="Access Provisioning" />
    </ModuleCard>
  );
}

// ─── Module 6: INTELLIGENCE ────────────────────────────────────────────────────

function IntelligenceModule() {
  return (
    <ModuleCard
      icon={<Brain className="h-5 w-5 text-cyan-300" />}
      title="Intelligence"
      expandHref="/vendor/dashboard/analytics"
    >
      <div className="space-y-2 mb-4">
        {mockProfileTips.map((tip, i) => (
          <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
            <Lightbulb className="h-4 w-4 text-[#0070F3] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700">{tip}</p>
          </div>
        ))}
      </div>

      {/* Two small V2 locked cards */}
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
  const { profile } = useAuth();

  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set(['company_info', 'services']));
  const [submittedForVerification, setSubmittedForVerification] = useState(false);

  const checklistItems = [
    { id: 'company_info', label: 'Add company information', route: '/vendor/dashboard/listings' },
    { id: 'services', label: 'Add services and tech stack', route: '/vendor/dashboard/listings' },
    { id: 'case_study', label: 'Add at least one case study', route: '/vendor/dashboard/listings' },
    { id: 'referral', label: 'Submit at least one referral', route: '/vendor/dashboard/listings' },
    { id: 'documents', label: 'Upload verification documents', route: '/vendor/dashboard/listings' },
  ];

  const allComplete = checklistItems.every(item => completedItems.has(item.id));
  const completionPercent = Math.round((completedItems.size / checklistItems.length) * 100);

  const isVerified = profile?.verified ?? false;
  const companyName = profile?.full_name ?? 'Your Company';

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#0B2D59]">
            Good {getGreeting()}, {companyName}.
          </h1>
        </div>
        {isVerified ? (
          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" />
            Collabov Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verification Pending
          </span>
        )}
      </div>

      {/* Profile Completion Widget */}
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
            <div
              className="bg-[#0070F3] h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          <div className="space-y-2 mb-5">
            {checklistItems.map(item => {
              const done = completedItems.has(item.id);
              return (
                <Link key={item.id} to={item.route} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                  {done
                    ? <CheckCircle2 className="h-5 w-5 text-[#0E7C6A] flex-shrink-0" />
                    : <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                  }
                  <span className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-[#0070F3]'}`}>
                    {item.label}
                  </span>
                  {!done && <ArrowRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-[#0070F3]" />}
                </Link>
              );
            })}
          </div>

          {allComplete && (
            <button
              onClick={() => setSubmittedForVerification(true)}
              className="w-full bg-[#0070F3] text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition-colors"
            >
              Submit for Verification →
            </button>
          )}
        </div>
      )}

      {/* Submitted banner */}
      {submittedForVerification && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">Profile submitted for verification — we'll review within 2 business days.</p>
        </div>
      )}

      {/* 6 Module Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MarketplaceModule />
        <WorkspaceModule />
        <RevenueModule />
        <EnquiriesModule />
        <GovernanceModule isVerified={isVerified} />
        <IntelligenceModule />
      </div>
    </div>
  );
};

export default DashboardHome;
