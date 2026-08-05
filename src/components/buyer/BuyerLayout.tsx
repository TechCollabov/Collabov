import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe, ChevronDown, Bell, MessageSquare, User, Settings, LogOut,
  Plus, FolderOpen, Search, FileCheck, Sparkles, Send,
  X, AlertTriangle, Info, ChevronRight, ChevronUp,
  FileText, CreditCard, Star, CheckCircle, Loader2,
  Briefcase, UserPlus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// ─── Types shared with the Command Centre ─────────────────────────────────

export interface Insight { text: string; type: 'info' | 'warning'; }

/** A single nav-dropdown entry. `widgetId` marks it draggable onto the dashboard.
 *  `sectionHeader` renders a small labeled divider immediately above this item. */
export interface NavItem {
  id: string;
  label: string;
  subtitle?: string;
  to?: string;
  widgetId?: string;
  sectionHeader?: string;
}
export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// ─── Real route + widget map (see PR description for rationale) ──────────

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'discover',
    label: 'Discover',
    items: [
      { id: 'discover-msp', label: 'MSP', subtitle: 'Network, Security, Full IT Support', to: '/results?type=msp' },
      { id: 'discover-agency', label: 'Agencies', subtitle: 'Mobile, Web Services, IT Support', to: '/results?type=agency' },
      { id: 'discover-staffaug', label: 'Staff Augmentation', subtitle: 'Dedicated team for long term', to: '/results?type=staffaug' },
      { id: 'post-job', label: 'Post a Job', to: '/buyer/post-job', sectionHeader: 'Other' },
      { id: 'create-tender', label: 'Create a Tender', to: '/buyer/post-job?type=tender' },
      { id: 'browse-packages', label: 'Browse Packages', to: '/packages' },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'proposals', label: 'Proposals', subtitle: 'Requested, Unread, All', to: '/proposals' },
      { id: 'shortlisted', label: 'Shortlisted Vendors', to: '/buyer/shortlist' },
      { id: 'my-projects', label: 'My Projects', subtitle: 'Includes new and old projects', to: '/buyer/my-vendors' },
      { id: 'active-engagements', label: 'Active Engagements', to: '/buyer/my-vendors?tab=active' },
      { id: 'my-team', label: 'My Team', subtitle: 'Former & active team, rate & review', to: '/buyer/team' },
      { id: 'calendar', label: 'Calendar', to: '/buyer/calendar' },
      { id: 'create-sow', label: 'Create SOW', to: '/sow-wizard' },
      { id: 'add-existing', label: 'Add an Existing Project & Vendor', to: '/buyer/byov' },
      { id: 'dashboard', label: 'Dashboard', to: '/buyer/dashboard' },
      { id: 'messages', label: 'Messages', to: '/messages' },
      { id: 'compare-vendors', label: 'Compare Vendors', to: '/compare' },
      { id: 'find-ai-widget', label: 'Find with AI', widgetId: 'find-ai' },
      { id: 'workspace-widget', label: 'Active Engagements (Widget)', widgetId: 'workspace' },
      { id: 'messages-widget', label: 'Messages Feed (Widget)', widgetId: 'messages' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'escrow', label: 'Escrow', to: '/buyer/payments' },
      { id: 'billing', label: 'Billing', subtitle: 'Due bills, upcoming payments', to: '/buyer/billing' },
      { id: 'invoices', label: 'Invoices', subtitle: 'History', to: '/buyer/payments' },
      { id: 'tax', label: 'Tax', to: '/buyer/tax' },
      { id: 'payments-widget', label: 'Escrow Snapshot (Widget)', widgetId: 'payments' },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    items: [
      { id: 'governance-centre', label: 'Governance Centre', to: '/buyer/governance' },
      { id: 'contracts-sow', label: 'Contracts and SOW', to: '/buyer/governance?tab=contracts' },
      { id: 'gdpr', label: 'GDPR', to: '/buyer/governance?tab=gdpr' },
      { id: 'ir35-guidance', label: 'IR35 Guidance', to: '/ir35-guidance' },
      { id: 'ir35-status', label: 'IR35 Status', to: '/buyer/governance?tab=ir35' },
      { id: 'kyc', label: 'KYC Information', to: '/buyer/kyc' },
      { id: 'governance-widget', label: 'Governance Snapshot (Widget)', widgetId: 'governance' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    items: [
      { id: 'outsourcing-calculator', label: 'Outsourcing Calculator', to: '/ai-calculator' },
      { id: 'risk', label: 'Risk', to: '/buyer/risk' },
      { id: 'discovery-brief', label: 'Discovery Brief', to: '/discovery-brief' },
      { id: 'risk-widget', label: 'Risk Dashboard (Widget)', widgetId: 'risk' },
      { id: 'intelligence-widget', label: 'Intelligence Digest (Widget)', widgetId: 'intelligence' },
    ],
  },
  {
    id: 'help',
    label: 'Help & Support',
    items: [
      { id: 'dispute-management', label: 'Dispute Management', to: '/buyer/governance?tab=disputes' },
      { id: 'raise-issue', label: 'Raise an Issue', to: '/contact' },
      { id: 'talk-to-expert', label: 'Talk to an Expert', to: '/buyer/talk-to-expert' },
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

const InviteTeamModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from('buyer_team_invitations').insert({
      buyer_id: user.id,
      invited_name: name.trim(),
      invited_email: email.trim(),
      role,
    });
    setSaving(false);
    if (insertError) {
      setError('Could not send the invite. Please try again.');
      return;
    }
    setSent(true);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#0B2D59]">Invite Team Member</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Invite recorded for {email}. You can track and revoke it from My Team.</p>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-[#0070F3] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Colleague's name"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Colleague's email"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] bg-white"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-[#0070F3] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Sending...' : 'Send Invite'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const AddMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative mb-4" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Add"
        className="group relative w-12 h-12 rounded-2xl bg-white text-brand-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
      {open && (
        <div className="absolute top-0 left-full ml-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
          <Link
            to="/buyer/post-job"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-brand-bg"
          >
            <Briefcase className="h-4 w-4 text-slate-400" />
            <div>
              <div className="font-semibold">Post a Project</div>
              <div className="text-xs text-slate-400">New job or tender for vendors</div>
            </div>
          </Link>
          <button
            onClick={() => { setOpen(false); setShowInvite(true); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-brand-bg text-left"
          >
            <UserPlus className="h-4 w-4 text-slate-400" />
            <div>
              <div className="font-semibold">Invite Team Member</div>
              <div className="text-xs text-slate-400">Add a colleague to your account</div>
            </div>
          </button>
        </div>
      )}
      {showInvite && <InviteTeamModal onClose={() => setShowInvite(false)} />}
    </div>
  );
};

const IconSidebar: React.FC = () => (
  <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-20 flex-col items-center bg-brand-primary py-6 gap-4">
    <AddMenu />
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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openNow = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 250);
  }, [cancelClose]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  return (
    <div className="relative pb-2" onMouseEnter={openNow} onMouseLeave={scheduleClose}>
      <button className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-900 hover:text-brand-accent transition-colors py-2">
        {group.label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-100 py-3 z-50">
          {group.items.map((item) => (
            <React.Fragment key={item.id}>
              {item.sectionHeader && (
                <div className="mt-2 mb-1 px-4 pt-2 border-t border-gray-100 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {item.sectionHeader}
                </div>
              )}
              {item.widgetId ? (
                <button
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
                  to={item.to!}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-bg hover:text-brand-primary"
                >
                  <span className="block font-semibold">{item.label}</span>
                  {item.subtitle && <span className="block text-xs text-slate-400 mt-0.5">{item.subtitle}</span>}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Notification bell ──────────────────────────────────────────────────

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

const NOTIF_ICON_MAP: Record<string, React.ReactNode> = {
  enquiry: <MessageSquare className="h-4 w-4" />,
  new_proposal: <FileText className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  milestone: <CreditCard className="h-4 w-4" />,
  review: <Star className="h-4 w-4" />,
  contract: <FileText className="h-4 w-4" />,
  system: <Bell className="h-4 w-4" />,
};

const NOTIF_COLOR_MAP: Record<string, string> = {
  enquiry: 'bg-blue-100 text-blue-600',
  new_proposal: 'bg-blue-100 text-blue-600',
  message: 'bg-purple-100 text-purple-600',
  payment: 'bg-green-100 text-green-600',
  milestone: 'bg-green-100 text-green-600',
  review: 'bg-amber-100 text-amber-600',
  contract: 'bg-gray-100 text-gray-600',
  system: 'bg-gray-100 text-gray-600',
};

function notifTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`buyer-notifications-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!user) return;
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', user.id).eq('is_read', false);
  };

  const markRead = async (id: string) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 text-slate-400 hover:text-slate-700 relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#0070F3] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-[28rem] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-[#0070F3] font-medium hover:underline flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 text-blue-500 animate-spin" /></div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <div className="text-sm text-gray-400">No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => {
                const inner = (
                  <>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${NOTIF_COLOR_MAP[n.type] || 'bg-gray-100 text-gray-600'}`}>
                      {NOTIF_ICON_MAP[n.type] || <Bell className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${n.is_read ? 'text-gray-700' : 'text-[#0B2D59]'}`}>{n.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-2">{n.message}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{notifTimeAgo(n.created_at)}</div>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#0070F3] flex-shrink-0 mt-1.5" />}
                  </>
                );
                const className = `flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/30' : ''}`;
                return n.link_url ? (
                  <Link key={n.id} to={n.link_url} onClick={() => { markRead(n.id); setOpen(false); }} className={className}>{inner}</Link>
                ) : (
                  <div key={n.id} onClick={() => markRead(n.id)} className={className}>{inner}</div>
                );
              })
            )}
          </div>
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
          <NotificationBell />
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
