import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe, ChevronDown, Bell, MessageSquare, User, Settings, LogOut,
  Plus, FolderOpen, Search, FileCheck, Sparkles, Send,
  X, AlertTriangle, Info, ChevronRight, ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types shared with the Command Centre ─────────────────────────────────

export interface Insight { text: string; type: 'info' | 'warning'; }

/** A single nav-dropdown entry. `widgetId` marks it draggable onto the dashboard. */
export interface NavItem {
  id: string;
  label: string;
  to?: string;
  widgetId?: string;
}
export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// ─── Real route + widget map (see PR description for rationale) ──────────

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'find-hire',
    label: 'Find & Hire',
    items: [
      { id: 'find-vendors', label: 'Find Vendors', to: '/results' },
      { id: 'post-job', label: 'Post a Job', to: '/buyer/post-job' },
      { id: 'create-tender', label: 'Create a Tender', to: '/buyer/post-job?type=tender' },
      { id: 'compare-vendors', label: 'Compare Vendors', to: '/compare' },
      { id: 'browse-packages', label: 'Browse Packages', to: '/packages' },
      { id: 'invite-vendor', label: 'Invite a Vendor', to: '/buyer/byov' },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', to: '/buyer/dashboard' },
      { id: 'find-ai-widget', label: 'Find with AI', widgetId: 'find-ai' },
      { id: 'my-projects', label: 'My Projects', to: '/buyer/my-vendors' },
      { id: 'workspace-widget', label: 'Active Engagements', widgetId: 'workspace' },
      { id: 'shortlisted', label: 'Shortlisted', to: '/buyer/shortlist' },
      { id: 'proposals', label: 'Proposals', to: '/proposals' },
      { id: 'create-sow', label: 'Create SOW', to: '/sow-wizard' },
      { id: 'messages', label: 'Messages', to: '/messages' },
      { id: 'messages-widget', label: 'Messages Feed', widgetId: 'messages' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'payments', label: 'Payments & Escrow', to: '/buyer/payments' },
      { id: 'payments-widget', label: 'Escrow Snapshot', widgetId: 'payments' },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    items: [
      { id: 'governance-centre', label: 'Governance Centre', to: '/buyer/governance' },
      { id: 'governance-widget', label: 'Governance Snapshot', widgetId: 'governance' },
      { id: 'risk-widget', label: 'Risk Dashboard', widgetId: 'risk' },
      { id: 'ir35', label: 'IR35 Guidance', to: '/ir35-guidance' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    items: [
      { id: 'discovery-brief', label: 'Discovery Brief', to: '/discovery-brief' },
      { id: 'intelligence-widget', label: 'Intelligence Digest', widgetId: 'intelligence' },
    ],
  },
];

// ─── Drag helper ───────────────────────────────────────────────────────────

export function onWidgetDragStart(e: React.DragEvent, widgetId: string) {
  e.dataTransfer.setData('text/widget-id', widgetId);
  e.dataTransfer.effectAllowed = 'copy';
}

// ─── Icon sidebar ──────────────────────────────────────────────────────────

const SIDEBAR_ITEMS: { id: string; label: string; icon: React.ElementType; to: string }[] = [
  { id: 'my-projects', label: 'My Projects', icon: FolderOpen, to: '/buyer/my-vendors' },
  { id: 'find', label: 'Find with AI', icon: Search, to: '/results' },
  { id: 'sow', label: 'Create SOW', icon: FileCheck, to: '/sow-wizard' },
  { id: 'governance', label: 'Governance', icon: FileCheck, to: '/buyer/governance' },
];

const IconSidebar: React.FC = () => (
  <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-20 flex-col items-center bg-brand-primary py-6 gap-4">
    <Link
      to="/buyer/post-job"
      title="Post a Job"
      className="group relative w-12 h-12 rounded-2xl bg-white text-brand-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform mb-4"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
      <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
        Post a Job
      </span>
    </Link>
    {SIDEBAR_ITEMS.map((item) => {
      const Icon = item.icon;
      return (
        <Link
          key={item.id}
          to={item.to}
          title={item.label}
          className="group relative w-11 h-11 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Icon className="h-5 w-5" />
          <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">
            {item.label}
          </span>
        </Link>
      );
    })}
  </aside>
);

// ─── Top nav dropdown group ─────────────────────────────────────────────────

const NavDropdown: React.FC<{ group: NavGroup }> = ({ group }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-900 hover:text-brand-accent transition-colors py-2">
        {group.label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-3 z-50">
          {group.items.map((item) =>
            item.widgetId ? (
              <button
                key={item.id}
                draggable
                onDragStart={(e) => onWidgetDragStart(e, item.widgetId!)}
                onClick={() => item.to && setOpen(false)}
                title="Drag onto your dashboard to add this widget"
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-brand-bg cursor-grab active:cursor-grabbing"
              >
                <span>{item.label}</span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-brand-accent">Drag +</span>
              </button>
            ) : (
              <Link
                key={item.id}
                to={item.to!}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-bg hover:text-brand-primary"
              >
                {item.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
};

// ─── Header ──────────────────────────────────────────────────────────────

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [showUser, setShowUser] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
      <div className="flex items-center justify-between h-16 px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Globe className="h-7 w-7 text-brand-accent" />
          <span className="text-lg font-black italic tracking-tight text-brand-primary">Collabov</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_GROUPS.map((group) => (
            <NavDropdown key={group.id} group={group} />
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/buyer/dashboard" className="p-2 text-slate-400 hover:text-slate-700 relative">
            <Bell className="h-5 w-5" />
          </Link>
          <Link to="/messages" className="p-2 text-slate-400 hover:text-slate-700">
            <MessageSquare className="h-5 w-5" />
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowUser((v) => !v)}
              className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-brand-bg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </button>
            {showUser && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">{profile?.full_name ?? user?.email}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setShowUser(false); navigate('/buyer/settings'); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-brand-bg flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" /> Settings
                </button>
                <hr className="my-2" />
                <button
                  onClick={() => { setShowUser(false); signOut(); navigate('/'); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── Floating "Ask AI" bar (visual-only) ───────────────────────────────────

const FloatingAskAI: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = () => {
    if (query.trim()) navigate(`/results?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 items-center gap-3 bg-slate-900 text-white rounded-full shadow-2xl pl-5 pr-2 py-2 w-[min(90vw,640px)]">
      <Sparkles className="h-4 w-4 text-brand-accent shrink-0" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        placeholder="Ask AI to find vendors, draft a brief..."
        className="flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
      />
      <button
        onClick={submit}
        className="flex items-center gap-1.5 bg-white text-slate-900 text-xs font-bold uppercase tracking-wide rounded-full px-4 py-2 hover:bg-brand-accent hover:text-white transition-colors"
      >
        Ask AI <Send className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

// ─── Floating Intelligence Feed panel ──────────────────────────────────────

const FloatingIntelligencePanel: React.FC<{ insights: Insight[] }> = ({ insights }) => {
  const [open, setOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="hidden xl:block fixed top-24 right-6 z-30 w-80">
      <div className="bg-white border-2 border-slate-100 rounded-3xl shadow-xl overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 bg-brand-primary text-white"
        >
          <span className="text-xs font-bold uppercase tracking-widest">Intelligence Feed</span>
          <span className="flex items-center gap-2">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <X
              className="h-4 w-4 hover:text-red-300"
              onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            />
          </span>
        </button>
        {open && (
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {insights.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">You're all caught up — no active alerts.</p>
            ) : (
              insights.map((insight, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-3 text-sm border flex items-start gap-2 ${
                    insight.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {insight.type === 'info' ? (
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <span>{insight.text}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Layout shell ───────────────────────────────────────────────────────────

interface BuyerLayoutProps {
  children: React.ReactNode;
  insights?: Insight[];
}

const BuyerLayout: React.FC<BuyerLayoutProps> = ({ children, insights = [] }) => {
  return (
    <div className="min-h-screen bg-brand-bg">
      <IconSidebar />
      <div className="md:pl-20">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32">
          {children}
        </main>
      </div>
      <FloatingIntelligencePanel insights={insights} />
      <FloatingAskAI />
    </div>
  );
};

export default BuyerLayout;
