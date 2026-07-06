import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard, Plus, FileText, Bot, Bookmark,
  FolderOpen, FileCheck, CreditCard, MessageSquare,
  AlertTriangle, HelpCircle, Search,
  Bell, Settings, LogOut, ChevronDown, User, Globe,
  Edit, CheckCircle,
  Sparkles, ShieldAlert, Scale, Brain, Lock, Info,
  UserPlus
} from 'lucide-react';
import { sweepProposalExpiry, sweepRehirePrompts, sweepPendingEngagementFollowups } from '../../lib/workflows';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Shared card sub-components ───────────────────────────────────────────────

interface CardFooterProps {
  expandTo: string;
}
const CardFooter: React.FC<CardFooterProps> = ({ expandTo }) => (
  <div className="border-t border-gray-100 pt-4 mt-5 flex items-center justify-between">
    <Link to={expandTo} className="text-[10px] font-bold tracking-[0.15em] text-[#0070F3] uppercase">
      Expand Module
    </Link>
    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Synced 2m ago</span>
  </div>
);

const V2Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
    <Lock className="h-8 w-8 text-gray-300 mx-auto mb-3" />
    <p className="text-sm text-gray-400">Coming in V2</p>
    <p className="text-xs text-gray-300 mt-1">{label}</p>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-sm text-gray-400 py-4 text-center">{text}</p>
);

// ─── Module 1 — FIND WITH AI ──────────────────────────────────────────────────

const BUSINESS_TYPE_LABEL: Record<string, string> = { msp: 'MSP', agency: 'IT Agency', staffaug: 'Staff Aug' };

interface RecentlyViewedVendor { id: string; name: string; type: string; }
const FindWithAIModule: React.FC<{ recentlyViewed: RecentlyViewedVendor[] }> = ({ recentlyViewed }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-5 w-5 text-blue-300" />
        </div>
        <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Find with AI</span>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe what you need — AI will match vendors"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) navigate(`/results?q=${encodeURIComponent(query)}`);
          }}
        />
        <button
          onClick={() => { if (query.trim()) navigate(`/results?q=${encodeURIComponent(query)}`); }}
          className="bg-[#0070F3] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 hover:bg-blue-700 transition-colors"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>

      {/* Recently viewed */}
      <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400 mb-3">Recently Viewed</p>
      {recentlyViewed.length === 0 ? (
        <div className="flex-1"><EmptyState text="Vendor profiles you view will show up here." /></div>
      ) : (
        <div className="space-y-2 flex-1">
          {recentlyViewed.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#0B2D59] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                {getInitials(v.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{v.name}</p>
                <p className="text-xs text-gray-400">{v.type}</p>
              </div>
              <Link to={`/vendor/profile/${v.id}`} className="text-xs text-[#0070F3] font-medium whitespace-nowrap">
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}

      <CardFooter expandTo="/results" />
    </div>
  );
};

// ─── Module 2 — WORKSPACE ─────────────────────────────────────────────────────

interface WorkspaceEngagement {
  id: string;
  project_title: string;
  vendorName: string;
  status: string;
  progress: number;
  nextDue: string | null;
  overdue: boolean;
}
interface WorkspaceModuleProps { activeCount: number; engagements: WorkspaceEngagement[]; }
const WorkspaceModule: React.FC<WorkspaceModuleProps> = ({ activeCount, engagements }) => {
  const hasOverdue = engagements.some((e) => e.overdue);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
          <FolderOpen className="h-5 w-5 text-teal-300" />
        </div>
        <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Workspace</span>
        {activeCount > 0 && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-auto">
            {activeCount} active
          </span>
        )}
      </div>

      {hasOverdue && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 mb-4">
          {engagements.filter((e) => e.overdue).length} milestone{engagements.filter((e) => e.overdue).length !== 1 ? 's' : ''} overdue — review required
        </div>
      )}

      {engagements.length === 0 ? (
        <div className="flex-1"><EmptyState text="No active engagements yet." /></div>
      ) : (
        <div className="space-y-4 flex-1">
          {engagements.map((eng) => (
            <Link key={eng.id} to={`/engagement/${eng.id}`} className="block border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#0B2D59] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {getInitials(eng.vendorName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{eng.project_title}</p>
                  <p className="text-xs text-gray-400">{eng.vendorName}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                  {eng.status}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                <div className="bg-[#0070F3] h-1.5 rounded-full" style={{ width: `${eng.progress}%` }} />
              </div>
              {eng.nextDue && (
                <p className={`text-xs ${eng.overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                  Milestone due: {eng.nextDue}{eng.overdue ? ' — OVERDUE' : ''}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      <CardFooter expandTo="/customer/my-vendors" />
    </div>
  );
};

// ─── Module 3 — MILESTONE PAYMENTS ───────────────────────────────────────────

interface MilestonePaymentsModuleProps {
  pendingEscrow: number;
  releasedMTD: number;
  awaitingReview: number;
  unfundedCount: number;
}
const MilestonePaymentsModule: React.FC<MilestonePaymentsModuleProps> = ({ pendingEscrow, releasedMTD, awaitingReview, unfundedCount }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
    <div className="flex items-center gap-3 mb-5">
      <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
        <CreditCard className="h-5 w-5 text-emerald-300" />
      </div>
      <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Escrow</span>
    </div>

    <div className="text-center mb-5">
      <p className="text-4xl font-black text-[#0B2D59]">£{pendingEscrow.toLocaleString()}</p>
      <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Pending in Escrow</p>
    </div>

    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-sm font-bold text-gray-900">£{releasedMTD.toLocaleString()}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Released MTD</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-sm font-bold text-gray-900">{awaitingReview}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Awaiting Review</p>
      </div>
    </div>

    {unfundedCount > 0 && (
      <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700 flex-1">
        {unfundedCount} unfunded milestone{unfundedCount !== 1 ? 's' : ''} — fund to begin work
      </div>
    )}

    <CardFooter expandTo="/customer/payments" />
  </div>
);

// ─── Module 4 — RISK DASHBOARD ────────────────────────────────────────────────

interface RiskDashboardModuleProps { activeCount: number; contractsSignedCount: number; pendingIR35Count: number; staffAugCount: number; }
const RiskDashboardModule: React.FC<RiskDashboardModuleProps> = ({ activeCount, contractsSignedCount, pendingIR35Count, staffAugCount }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
    <div className="flex items-center gap-3 mb-5">
      <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
        <ShieldAlert className="h-5 w-5 text-orange-300" />
      </div>
      <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Risk Dashboard</span>
    </div>

    <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-lg font-black text-[#0B2D59]">{activeCount}</p>
        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Active Engagements</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-lg font-black text-[#0B2D59]">{contractsSignedCount}</p>
        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Contracts Signed</p>
      </div>
      {staffAugCount === 0 ? (
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-400 leading-tight">No staff aug engagements</p>
        </div>
      ) : pendingIR35Count === 0 ? (
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <CheckCircle className="h-4 w-4 text-green-500 mx-auto mb-0.5" />
          <p className="text-[10px] text-green-700 leading-tight font-semibold">IR35 Compliant</p>
        </div>
      ) : (
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-amber-600">{pendingIR35Count}</p>
          <p className="text-[10px] text-amber-700 leading-tight font-semibold">IR35 Status Pending</p>
        </div>
      )}
    </div>

    <V2Placeholder label="Full Risk Score ML" />

    <CardFooter expandTo="/customer/governance" />
  </div>
);

// ─── Module 5 — GOVERNANCE ────────────────────────────────────────────────────

interface GovernanceContract { id: string; vendorName: string; status: string; }
interface GovernanceModuleProps { contracts: GovernanceContract[]; openDisputesCount: number; }
const GovernanceModule: React.FC<GovernanceModuleProps> = ({ contracts, openDisputesCount }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
    <div className="flex items-center gap-3 mb-5">
      <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
        <Scale className="h-5 w-5 text-purple-300" />
      </div>
      <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Governance</span>
    </div>

    {contracts.length === 0 ? (
      <div className="mb-4"><EmptyState text="No contracts yet." /></div>
    ) : (
      <div className="space-y-2 mb-4">
        {contracts.slice(0, 3).map((c) => (
          <div key={c.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
            <p className="text-sm font-medium text-gray-900">{c.vendorName}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    )}

    {openDisputesCount === 0 ? (
      <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 text-xs text-green-700 mb-4">
        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
        No open disputes
      </div>
    ) : (
      <Link to="/customer/governance" className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2 text-xs text-red-700 mb-4 hover:bg-red-100 transition-colors">
        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
        {openDisputesCount} open dispute{openDisputesCount !== 1 ? 's' : ''} — review required
      </Link>
    )}

    <V2Placeholder label="Access Control" />

    <CardFooter expandTo="/customer/governance" />
  </div>
);

// ─── Module 6 — INTELLIGENCE ──────────────────────────────────────────────────

interface Insight { text: string; type: 'info' | 'warning'; }
const IntelligenceModule: React.FC<{ insights: Insight[] }> = ({ insights }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
    <div className="flex items-center gap-3 mb-5">
      <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
        <Brain className="h-5 w-5 text-violet-300" />
      </div>
      <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Intelligence</span>
    </div>

    <div className="space-y-3 mb-4 flex-1">
      {insights.length === 0 ? (
        <EmptyState text="No suggestions right now — you're all caught up." />
      ) : insights.map((insight, i) => (
        <div
          key={i}
          className={`rounded-lg p-3 text-sm border flex items-start gap-2 ${
            insight.type === 'info'
              ? 'bg-blue-50 border-blue-100'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          {insight.type === 'info' ? (
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          )}
          <span className={insight.type === 'info' ? 'text-blue-800' : 'text-amber-800'}>
            {insight.text}
          </span>
        </div>
      ))}

      <V2Placeholder label="AI Intelligence Centre" />
    </div>
  </div>
);

// ─── Module 7 — MESSAGES (spans 2 cols) ───────────────────────────────────────

interface MessagePreview { id: string; name: string; subject: string; preview: string; time: string; unread: boolean; }
interface MessagesModuleProps { unreadMessages: number; previews: MessagePreview[]; }
const MessagesModule: React.FC<MessagesModuleProps> = ({ unreadMessages, previews }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col lg:col-span-2">
    <div className="flex items-center gap-3 mb-5">
      <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
        <MessageSquare className="h-5 w-5 text-cyan-300" />
      </div>
      <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Messages</span>
      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium ml-1">
        LIVE FEED
      </span>
      {unreadMessages > 0 && (
        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium ml-auto">
          {unreadMessages} unread
        </span>
      )}
    </div>

    {previews.length === 0 ? (
      <div className="flex-1"><EmptyState text="No messages yet. They'll show up here once a conversation starts." /></div>
    ) : (
      <div className="space-y-3 flex-1">
        {previews.map((msg) => (
          <Link key={msg.id} to="/messages" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-9 h-9 rounded-full bg-[#0070F3] text-white text-sm flex items-center justify-center font-bold flex-shrink-0">
              {getInitials(msg.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{msg.name}</p>
              {msg.subject && <p className="text-xs text-gray-400 mb-0.5">{msg.subject}</p>}
              <p className="text-xs text-gray-500 truncate max-w-[280px]">
                {msg.preview.length > 60 ? msg.preview.slice(0, 60) + '…' : msg.preview}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="text-[10px] text-gray-400">{msg.time}</span>
              {msg.unread && <div className="w-2 h-2 rounded-full bg-[#0070F3]" />}
            </div>
          </Link>
        ))}
      </div>
    )}

    <CardFooter expandTo="/messages" />
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(true);
  const [paymentAlert, setPaymentAlert] = useState<{ vendorName: string; projectTitle: string } | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedVendor[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [escrowStats, setEscrowStats] = useState({ pendingEscrow: 0, releasedMTD: 0, awaitingReview: 0, unfundedCount: 0 });
  const [workspace, setWorkspace] = useState<{ activeCount: number; engagements: WorkspaceEngagement[] }>({ activeCount: 0, engagements: [] });
  const [risk, setRisk] = useState({ activeCount: 0, contractsSignedCount: 0, pendingIR35Count: 0, staffAugCount: 0 });
  const [governance, setGovernance] = useState<{ contracts: GovernanceContract[]; openDisputesCount: number }>({ contracts: [], openDisputesCount: 0 });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [messagePreviews, setMessagePreviews] = useState<MessagePreview[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      // Lazy sweeps: proposal expiry, 30-day re-hire prompts, T+1 call follow-ups.
      sweepProposalExpiry({ customer_id: user!.id }).catch(() => {});
      sweepRehirePrompts(user!.id).catch(() => {});
      sweepPendingEngagementFollowups(user!.id).catch(() => {});

      const [engRes, contractRes, disputeRes, proposalRes, msgRes] = await Promise.all([
        supabase.from('engagements').select('id, project_title, vendor_id, status, engagement_type, ir35_status').eq('buyer_id', user!.id),
        supabase.from('contracts').select('id, vendor_id, status, signed_by_customer, signed_by_vendor').eq('customer_id', user!.id),
        supabase.from('disputes').select('id, status').eq('buyer_id', user!.id),
        supabase.from('proposals').select('id, workflow_state, submitted_at, enquiries(title), jobs(title)').eq('customer_id', user!.id).neq('workflow_state', 'draft'),
        supabase.from('messages').select('id, sender_id, recipient_id, content, is_read, created_at')
          .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`).order('created_at', { ascending: false }).limit(30),
      ]);

      const engs = engRes.data ?? [];
      const activeEngs = engs.filter(e => e.status === 'active');
      const engIds = engs.map(e => e.id);

      const vendorIds = Array.from(new Set(engs.map(e => e.vendor_id)));
      const vendorMap = new Map<string, string>();
      if (vendorIds.length) {
        const { data: vendors } = await supabase.from('vendors').select('id, company_name').in('id', vendorIds);
        (vendors ?? []).forEach(v => vendorMap.set(v.id, v.company_name));
      }

      let milestones: { engagement_id: string; amount: number; escrow_status: string; due_date: string | null; released_at: string | null }[] = [];
      if (engIds.length) {
        const { data } = await supabase.from('project_milestones').select('engagement_id, amount, escrow_status, due_date, released_at').in('engagement_id', engIds);
        milestones = data ?? [];
      }

      // Escrow module: pending in escrow, released this month, milestones awaiting review.
      const now = new Date();
      const pendingEscrow = milestones.filter(m => ['funded', 'in_progress', 'submitted', 'rejected'].includes(m.escrow_status)).reduce((s, m) => s + (m.amount ?? 0), 0);
      const releasedMTD = milestones.filter(m => m.escrow_status === 'released' && m.released_at &&
        new Date(m.released_at).getMonth() === now.getMonth() && new Date(m.released_at).getFullYear() === now.getFullYear())
        .reduce((s, m) => s + (m.amount ?? 0), 0);
      const awaitingReview = milestones.filter(m => m.escrow_status === 'submitted').length;
      const unfundedCount = milestones.filter(m => m.escrow_status === 'unfunded').length;
      setEscrowStats({ pendingEscrow, releasedMTD, awaitingReview, unfundedCount });

      // Payment alert: a real overdue-unfunded milestone (not a simulated card decline — money movement stays simulated).
      const overdueUnfunded = milestones.find(m => m.escrow_status === 'unfunded' && m.due_date && new Date(m.due_date) < now);
      if (overdueUnfunded) {
        const eng = engs.find(e => e.id === overdueUnfunded.engagement_id);
        setPaymentAlert(eng ? { vendorName: vendorMap.get(eng.vendor_id) ?? 'Vendor', projectTitle: eng.project_title ?? 'Engagement' } : null);
      } else {
        setPaymentAlert(null);
      }

      // Workspace module: top 2 active engagements with real progress/overdue.
      const workspaceEngs: WorkspaceEngagement[] = activeEngs.slice(0, 2).map(e => {
        const ms = milestones.filter(m => m.engagement_id === e.id);
        const released = ms.filter(m => m.escrow_status === 'released').length;
        const progress = ms.length > 0 ? Math.round((released / ms.length) * 100) : 0;
        const upcoming = ms.filter(m => m.due_date && !['released', 'refunded'].includes(m.escrow_status)).sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1))[0];
        const overdue = !!upcoming && new Date(upcoming.due_date!) < now;
        return {
          id: e.id, project_title: e.project_title ?? 'Engagement', vendorName: vendorMap.get(e.vendor_id) ?? 'Vendor',
          status: e.status, progress, nextDue: upcoming?.due_date ? new Date(upcoming.due_date).toLocaleDateString('en-GB') : null, overdue,
        };
      });
      setWorkspace({ activeCount: activeEngs.length, engagements: workspaceEngs });

      // Risk dashboard: real counts, no invented compliance-doc data.
      const contracts = contractRes.data ?? [];
      const contractsSignedCount = contracts.filter(c => c.signed_by_customer && c.signed_by_vendor).length;
      const staffAugEngs = engs.filter(e => e.engagement_type === 'staff_aug');
      const pendingIR35Count = staffAugEngs.filter(e => !e.ir35_status || e.ir35_status === 'pending').length;
      setRisk({ activeCount: activeEngs.length, contractsSignedCount, pendingIR35Count, staffAugCount: staffAugEngs.length });

      // Governance module: real contracts + open disputes.
      const govContracts: GovernanceContract[] = contracts.slice(0, 3).map(c => ({ id: c.id, vendorName: vendorMap.get(c.vendor_id) ?? 'Vendor', status: c.status }));
      const openDisputesCount = (disputeRes.data ?? []).filter(d => d.status !== 'resolved').length;
      setGovernance({ contracts: govContracts, openDisputesCount });

      // Intelligence module: rules-based tips shown only when the underlying condition is true.
      const proposalRows = (proposalRes.data ?? []) as { id: string; workflow_state: string | null; submitted_at: string; enquiries: { title: string } | null; jobs: { title: string } | null }[];
      const unreviewed = proposalRows.filter(p => !p.workflow_state);
      const newInsights: Insight[] = [];
      if (unreviewed.length > 0) {
        const latestTitle = unreviewed[0]?.jobs?.title ?? unreviewed[0]?.enquiries?.title ?? 'your request';
        newInsights.push({ text: `You have ${unreviewed.length} unreviewed proposal${unreviewed.length !== 1 ? 's' : ''} on "${latestTitle}"`, type: 'info' });
      }
      const overdueEngagement = workspaceEngs.find(e => e.overdue);
      if (overdueEngagement) {
        newInsights.push({ text: `Milestone overdue — ${overdueEngagement.vendorName} — ${overdueEngagement.project_title}`, type: 'warning' });
      }
      setInsights(newInsights);

      // Messages module: latest message per conversation, resolved to real profile names.
      const msgs = msgRes.data ?? [];
      setUnreadMessages(msgs.filter(m => m.recipient_id === user!.id && !m.is_read).length);
      const otherIds = Array.from(new Set(msgs.map(m => m.sender_id === user!.id ? m.recipient_id : m.sender_id)));
      const profileMap = new Map<string, string>();
      if (otherIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', otherIds);
        (profiles ?? []).forEach(p => profileMap.set(p.id, p.full_name ?? p.email ?? 'Unknown'));
      }
      const seen = new Set<string>();
      const previews: MessagePreview[] = [];
      for (const m of msgs) {
        const otherId = m.sender_id === user!.id ? m.recipient_id : m.sender_id;
        if (seen.has(otherId)) continue;
        seen.add(otherId);
        previews.push({
          id: m.id, name: profileMap.get(otherId) ?? 'Unknown', subject: '',
          preview: m.content, time: timeAgo(m.created_at), unread: !m.is_read && m.recipient_id === user!.id,
        });
        if (previews.length >= 2) break;
      }
      setMessagePreviews(previews);

      // Recently viewed vendors: last 3 distinct vendor profiles this buyer viewed (platform_event, event_type='profile_view').
      const { data: viewEvents } = await supabase
        .from('platform_event')
        .select('entity_id, timestamp')
        .eq('event_type', 'profile_view')
        .eq('entity_type', 'vendor')
        .eq('actor_id', user!.id)
        .order('timestamp', { ascending: false })
        .limit(20);
      const seenVendors = new Set<string>();
      const recentVendorIds: string[] = [];
      for (const ev of viewEvents ?? []) {
        if (seenVendors.has(ev.entity_id)) continue;
        seenVendors.add(ev.entity_id);
        recentVendorIds.push(ev.entity_id);
        if (recentVendorIds.length >= 3) break;
      }
      if (recentVendorIds.length) {
        const { data: viewedVendors } = await supabase.from('vendors').select('id, company_name, business_type').in('id', recentVendorIds);
        const viewedMap = new Map((viewedVendors ?? []).map(v => [v.id, v]));
        setRecentlyViewed(
          recentVendorIds
            .map(id => viewedMap.get(id))
            .filter((v): v is { id: string; company_name: string; business_type: string | null } => !!v)
            .map(v => ({ id: v.id, name: v.company_name, type: BUSINESS_TYPE_LABEL[v.business_type ?? ''] ?? 'Vendor' }))
        );
      } else {
        setRecentlyViewed([]);
      }
    }
    load();
  }, [user]);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  const navigationTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'post-job', label: 'Post a Job', icon: Plus },
    { id: 'create-tender', label: 'Create a Tender', icon: FileText },
    { id: 'ai-matchmaking', label: 'Find Vendors', icon: Bot },
    { id: 'saved-talent', label: 'Shortlisted', icon: Bookmark },
    { id: 'my-projects', label: 'My Projects', icon: FolderOpen },
    { id: 'contracts', label: 'Governance', icon: FileCheck },
    { id: 'invoices', label: 'Payments', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
    { id: 'invite-vendor', label: 'Invite a Vendor', icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Navigation Bar ──────────────────────────────────────────── */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-[#0070F3]" />
              <span className="text-xl font-bold text-[#0B2D59]">Collabov</span>
            </Link>

            {/* Center tabs */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationTabs.slice(0, 9).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'invite-vendor') navigate('/customer/byov');
                    else if (tab.id === 'post-job') navigate('/customer/post-job');
                    else if (tab.id === 'create-tender') navigate('/customer/post-job?type=tender');
                    else if (tab.id === 'contracts' || tab.id === 'disputes') navigate('/customer/governance');
                    else if (tab.id === 'invoices') navigate('/customer/payments');
                    else if (tab.id === 'settings') navigate('/customer/settings');
                    else setActiveTab(tab.id);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#0070F3] text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
              <div className="relative">
                <button className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  <span>More</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right: notifications + user */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h3 className="font-medium text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">New proposal received</p>
                        <p className="text-xs text-gray-500">TechForge Solutions submitted a proposal</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">Milestone overdue</p>
                        <p className="text-xs text-gray-500">CloudNorth MSP — Infrastructure Management</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0070F3] flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{profile?.full_name ?? user?.email}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <HelpCircle className="h-4 w-4" />
                      <span>Support</span>
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={() => { setShowUserDropdown(false); signOut(); navigate('/'); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile nav */}
          <div className="lg:hidden border-t border-gray-200 py-2">
            <div className="flex space-x-1 overflow-x-auto">
              {navigationTabs.slice(0, 4).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#0070F3] text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-[#0B2D59]">
              Good {getGreeting()}, {firstName}.
            </h1>
            <p className="text-xs font-semibold tracking-[0.25em] text-gray-400 mt-1 uppercase">
              Command Centre Summary · Custom Dashboard
            </p>
          </div>
          <button className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors mt-1">
            CLEAR LAYOUT
          </button>
        </div>

        {/* Payment failure alert — real overdue-unfunded milestone, not a simulated Stripe decline */}
        {paymentAlert && showPaymentAlert && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Milestone funding overdue for {paymentAlert.vendorName} — {paymentAlert.projectTitle}. Fund this milestone to keep the engagement active.
              </p>
              <div className="flex gap-3 mt-2">
                <Link to="/customer/payments" className="text-xs bg-red-600 text-white rounded-lg px-3 py-1.5 font-medium">Fund now</Link>
                <Link to="/contact" className="text-xs text-gray-500">Contact support</Link>
              </div>
            </div>
            <button onClick={() => setShowPaymentAlert(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </div>
        )}

        {/* 7-module grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FindWithAIModule recentlyViewed={recentlyViewed} />
          <WorkspaceModule activeCount={workspace.activeCount} engagements={workspace.engagements} />
          <MilestonePaymentsModule {...escrowStats} />
          <RiskDashboardModule {...risk} />
          <GovernanceModule contracts={governance.contracts} openDisputesCount={governance.openDisputesCount} />
          <IntelligenceModule insights={insights} />
          <MessagesModule unreadMessages={unreadMessages} previews={messagePreviews} />
        </div>
      </main>

      {/* ── AI Assistant bar (fixed bottom) ─────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-8 py-4 z-40 flex items-center gap-4">
        <div className="w-11 h-11 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
          <Bot className="h-5 w-5 text-gray-400" />
        </div>
        <input
          disabled
          placeholder="AI vendor matching coming soon in V2"
          className="flex-1 bg-gray-100 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
          title="AI matching available in V2"
        />
        <button disabled className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-semibold cursor-not-allowed">
          ASK AI
        </button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
