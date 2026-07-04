import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard, Plus, FileText, Bot, Bookmark,
  FolderOpen, FileCheck, CreditCard, MessageSquare,
  AlertTriangle, HelpCircle, Search,
  Bell, Settings, LogOut, ChevronDown, User, Globe,
  Edit, CheckCircle, ArrowRight,
  Sparkles, ShieldAlert, Scale, Brain, Lock, Info,
  TrendingUp, UserPlus
} from 'lucide-react';
import { sweepProposalExpiry, sweepRehirePrompts, sweepPendingEngagementFollowups } from '../../lib/workflows';

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockEngagements = [
  {
    id: '1',
    vendor: 'TechForge Solutions',
    project: 'Payment Gateway Rebuild',
    status: 'In Progress',
    progress: 60,
    milestone_due: '2026-06-20',
    milestone_due_overdue: false,
    escrow: 8500,
  },
  {
    id: '2',
    vendor: 'CloudNorth MSP',
    project: 'Infrastructure Management',
    status: 'Active',
    progress: 40,
    milestone_due: '2026-06-15',
    milestone_due_overdue: true,
    escrow: 1800,
  },
];

const mockContracts = [
  { id: '1', vendor: 'TechForge Solutions', type: 'IT Agency', status: 'Active', value: 32000 },
  { id: '2', vendor: 'CloudNorth MSP', type: 'MSP', status: 'Active', value: 21600 },
];

const mockInsights = [
  { text: 'You have 2 unreviewed proposals on "React Team Hire"', type: 'info' },
  { text: 'Milestone 2 — TechForge Solutions — 3 days overdue', type: 'warning' },
];

const mockMessages = [
  {
    id: '1',
    name: 'TechForge Solutions',
    engagement: 'Payment Gateway Rebuild',
    preview: 'Milestone 2 evidence has been submitted...',
    time: '2m ago',
    unread: true,
  },
  {
    id: '2',
    name: 'CloudNorth MSP',
    engagement: 'Infrastructure Management',
    preview: 'Monthly check-in is ready for your review',
    time: '1h ago',
    unread: false,
  },
];

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

// ─── Module 1 — FIND WITH AI ──────────────────────────────────────────────────

const FindWithAIModule: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const recentlyViewed = [
    { name: 'TechForge Solutions', type: 'IT Agency' },
    { name: 'CloudNorth MSP', type: 'MSP' },
  ];
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
      <div className="space-y-2 flex-1">
        {recentlyViewed.map((v) => (
          <div key={v.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#0B2D59] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
              {getInitials(v.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{v.name}</p>
              <p className="text-xs text-gray-400">{v.type}</p>
            </div>
            <Link to={`/results?q=${encodeURIComponent(v.name)}`} className="text-xs text-[#0070F3] font-medium whitespace-nowrap">
              View Profile
            </Link>
          </div>
        ))}
      </div>

      <CardFooter expandTo="/results" />
    </div>
  );
};

// ─── Module 2 — WORKSPACE ─────────────────────────────────────────────────────

interface WorkspaceModuleProps { activeProjects: number; }
const WorkspaceModule: React.FC<WorkspaceModuleProps> = ({ activeProjects }) => {
  const hasOverdue = mockEngagements.some((e) => e.milestone_due_overdue);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
          <FolderOpen className="h-5 w-5 text-teal-300" />
        </div>
        <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Workspace</span>
        {activeProjects > 0 && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-auto">
            {activeProjects} active
          </span>
        )}
      </div>

      {hasOverdue && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 mb-4">
          1 milestone overdue — review required
        </div>
      )}

      <div className="space-y-4 flex-1">
        {mockEngagements.slice(0, 2).map((eng) => (
          <div key={eng.id} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#0B2D59] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                {getInitials(eng.vendor)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{eng.project}</p>
                <p className="text-xs text-gray-400">{eng.vendor}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                eng.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {eng.status}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
              <div className="bg-[#0070F3] h-1.5 rounded-full" style={{ width: `${eng.progress}%` }} />
            </div>
            <p className={`text-xs ${eng.milestone_due_overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
              Milestone due: {eng.milestone_due}{eng.milestone_due_overdue ? ' — OVERDUE' : ''}
            </p>
          </div>
        ))}

        <V2Placeholder label="Delivery Signals" />
      </div>

      <CardFooter expandTo="/customer/dashboard" />
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

    <CardFooter expandTo="/customer/dashboard" />
  </div>
);

// ─── Module 4 — RISK DASHBOARD ────────────────────────────────────────────────

const RiskDashboardModule: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
    <div className="flex items-center gap-3 mb-5">
      <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
        <ShieldAlert className="h-5 w-5 text-orange-300" />
      </div>
      <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Risk Dashboard</span>
    </div>

    <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-lg font-black text-[#0B2D59]">2</p>
        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Active Engagements</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-lg font-black text-[#0B2D59]">2</p>
        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Contracts Signed</p>
      </div>
      <div className="bg-green-50 rounded-xl p-3 text-center">
        <CheckCircle className="h-4 w-4 text-green-500 mx-auto mb-0.5" />
        <p className="text-[10px] text-green-700 leading-tight font-semibold">IR35 Compliant</p>
      </div>
    </div>

    <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 text-xs text-green-700 mb-4">
      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
      No compliance documents expiring
    </div>

    <V2Placeholder label="Full Risk Score ML" />

    <CardFooter expandTo="/customer/dashboard" />
  </div>
);

// ─── Module 5 — GOVERNANCE ────────────────────────────────────────────────────

const GovernanceModule: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
    <div className="flex items-center gap-3 mb-5">
      <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
        <Scale className="h-5 w-5 text-purple-300" />
      </div>
      <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Governance</span>
    </div>

    <div className="space-y-2 mb-4">
      {mockContracts.map((c) => (
        <div key={c.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
          <div>
            <p className="text-sm font-medium text-gray-900">{c.vendor}</p>
            <p className="text-xs text-gray-400">{c.type}</p>
          </div>
          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            {c.status}
          </span>
        </div>
      ))}
    </div>

    <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 text-xs text-green-700 mb-4">
      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
      No open disputes
    </div>

    <div className="flex gap-3 mb-4">
      <button className="flex items-center gap-1 text-xs text-[#0070F3] font-medium hover:underline">
        <FileText className="h-3.5 w-3.5" />
        IR35 SDS
      </button>
      <button className="flex items-center gap-1 text-xs text-[#0070F3] font-medium hover:underline">
        <FileText className="h-3.5 w-3.5" />
        GDPR DPA
      </button>
    </div>

    <V2Placeholder label="Access Control" />

    <CardFooter expandTo="/customer/dashboard" />
  </div>
);

// ─── Module 6 — INTELLIGENCE ──────────────────────────────────────────────────

const IntelligenceModule: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
    <div className="flex items-center gap-3 mb-5">
      <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
        <Brain className="h-5 w-5 text-violet-300" />
      </div>
      <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Intelligence</span>
    </div>

    <div className="space-y-3 mb-4 flex-1">
      {mockInsights.map((insight, i) => (
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

    <CardFooter expandTo="/customer/dashboard" />
  </div>
);

// ─── Module 7 — MESSAGES (spans 2 cols) ───────────────────────────────────────

interface MessagesModuleProps { unreadMessages: number; }
const MessagesModule: React.FC<MessagesModuleProps> = ({ unreadMessages }) => (
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

    <div className="space-y-3 flex-1">
      {mockMessages.map((msg) => (
        <div key={msg.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-[#0070F3] text-white text-sm flex items-center justify-center font-bold flex-shrink-0">
            {getInitials(msg.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{msg.name}</p>
            <p className="text-xs text-gray-400 mb-0.5">{msg.engagement}</p>
            <p className="text-xs text-gray-500 truncate max-w-[280px]">
              {msg.preview.length > 60 ? msg.preview.slice(0, 60) + '…' : msg.preview}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-gray-400">{msg.time}</span>
            {msg.unread && <div className="w-2 h-2 rounded-full bg-[#0070F3]" />}
          </div>
        </div>
      ))}
    </div>

    <CardFooter expandTo="/customer/dashboard" />
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [stats, setStats] = useState({ activeProjects: 0, pendingMilestones: 0, totalSpent: 0, unreadMessages: 0, openJobs: 0 });
  const [loadingStats, setLoadingStats] = useState(true); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [escrowStats, setEscrowStats] = useState({ pendingEscrow: 0, releasedMTD: 0, awaitingReview: 0, unfundedCount: 0 });

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        // Lazy sweeps: proposal expiry, 30-day re-hire prompts, T+1 call follow-ups.
        sweepProposalExpiry({ customer_id: user!.id }).catch(() => {});
        sweepRehirePrompts(user!.id).catch(() => {});
        sweepPendingEngagementFollowups(user!.id).catch(() => {});
        const [projRes, msgRes, jobRes, contractRes] = await Promise.all([
          supabase.from('projects').select('id, status').eq('customer_id', user!.id),
          supabase.from('messages').select('id').eq('recipient_id', user!.id).eq('is_read', false),
          supabase.from('jobs').select('id, status').eq('customer_id', user!.id).eq('status', 'open'),
          supabase.from('contracts').select('total_value').eq('customer_id', user!.id).eq('status', 'active'),
        ]);
        const active = projRes.data?.filter(p => p.status === 'in-progress').length || 0;
        const unread = msgRes.data?.length || 0;
        const openJobs = jobRes.data?.length || 0;
        const totalSpent = contractRes.data?.reduce((s, c) => s + (c.total_value || 0), 0) || 0;
        setStats({ activeProjects: active, pendingMilestones: 0, totalSpent, unreadMessages: unread, openJobs });

        // Escrow module: pending in escrow, released this month, milestones awaiting review.
        const projectIds = (projRes.data ?? []).map(p => p.id);
        if (projectIds.length > 0) {
          const { data: milestones } = await supabase
            .from('project_milestones')
            .select('amount, escrow_status, released_at')
            .in('project_id', projectIds);
          const now = new Date();
          const pendingEscrow = (milestones ?? [])
            .filter(m => ['funded', 'in_progress', 'submitted', 'rejected'].includes(m.escrow_status))
            .reduce((s, m) => s + (m.amount ?? 0), 0);
          const releasedMTD = (milestones ?? [])
            .filter(m => m.escrow_status === 'released' && m.released_at &&
              new Date(m.released_at).getMonth() === now.getMonth() && new Date(m.released_at).getFullYear() === now.getFullYear())
            .reduce((s, m) => s + (m.amount ?? 0), 0);
          const awaitingReview = (milestones ?? []).filter(m => m.escrow_status === 'submitted').length;
          const unfundedCount = (milestones ?? []).filter(m => m.escrow_status === 'unfunded').length;
          setEscrowStats({ pendingEscrow, releasedMTD, awaitingReview, unfundedCount });
        }
      } finally {
        setLoadingStats(false);
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

        {/* Payment failure alert */}
        {showPaymentAlert && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Payment failed for CloudNorth MSP engagement — Infrastructure Management. Update your payment method within 48 hours to keep this engagement active.
              </p>
              <div className="flex gap-3 mt-2">
                <button className="text-xs bg-red-600 text-white rounded-lg px-3 py-1.5 font-medium">Update card</button>
                <button className="text-xs text-gray-500">Contact support</button>
              </div>
            </div>
            <button onClick={() => setShowPaymentAlert(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </div>
        )}

        {/* 7-module grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FindWithAIModule />
          <WorkspaceModule activeProjects={stats.activeProjects} />
          <MilestonePaymentsModule {...escrowStats} />
          <RiskDashboardModule />
          <GovernanceModule />
          <IntelligenceModule />
          <MessagesModule unreadMessages={stats.unreadMessages} />
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
