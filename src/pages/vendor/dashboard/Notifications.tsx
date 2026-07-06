import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, FileText, CreditCard, Star, CheckCircle, Bell, Loader2, Settings } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  enquiry: <MessageSquare className="h-4 w-4" />,
  new_proposal: <FileText className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  milestone: <CreditCard className="h-4 w-4" />,
  review: <Star className="h-4 w-4" />,
  contract: <FileText className="h-4 w-4" />,
  system: <Bell className="h-4 w-4" />,
};

const COLOR_MAP: Record<string, string> = {
  enquiry: 'bg-blue-100 text-blue-600',
  new_proposal: 'bg-blue-100 text-blue-600',
  message: 'bg-purple-100 text-purple-600',
  payment: 'bg-green-100 text-green-600',
  milestone: 'bg-green-100 text-green-600',
  review: 'bg-amber-100 text-amber-600',
  contract: 'bg-gray-100 text-gray-600',
  system: 'bg-gray-100 text-gray-600',
};

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

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0B2D59]">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-[#0070F3] text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Stay up to date with your activity</p>
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-[#0070F3] font-medium hover:underline flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Mark all read
            </button>
          )}
          <Link to="/vendor/dashboard/settings" className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
            <Settings className="h-4 w-4" /> Preferences
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-blue-500 animate-spin" /></div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <div className="font-semibold text-gray-500 mb-1">No notifications yet</div>
          <div className="text-sm text-gray-400">Enquiries, messages, payments and reviews will show up here.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const inner = (
              <>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${COLOR_MAP[n.type] || 'bg-gray-100 text-gray-600'}`}>
                  {ICON_MAP[n.type] || <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`text-sm font-semibold ${n.is_read ? 'text-gray-700' : 'text-[#0B2D59]'}`}>{n.title}</div>
                    <div className="text-xs text-gray-400 flex-shrink-0">{timeAgo(n.created_at)}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{n.message}</div>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#0070F3] flex-shrink-0 mt-2" />}
              </>
            );
            const className = `bg-white rounded-xl border shadow-sm p-4 flex gap-4 cursor-pointer hover:shadow-md transition-shadow ${n.is_read ? 'border-gray-100' : 'border-blue-100 bg-blue-50/30'}`;
            return n.link_url ? (
              <Link key={n.id} to={n.link_url} onClick={() => markRead(n.id)} className={className}>{inner}</Link>
            ) : (
              <div key={n.id} onClick={() => markRead(n.id)} className={className}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
