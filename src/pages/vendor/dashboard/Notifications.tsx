import React, { useState } from 'react';
import { Bell, MessageSquare, FileText, CreditCard, Star, CheckCircle } from 'lucide-react';

const NOTIFICATIONS = [
  { id: '1', type: 'enquiry', title: 'New enquiry received', body: 'Sarah Mitchell from FinEdge Capital sent you an enquiry about Cloud Infrastructure Modernisation.', time: '2 hours ago', read: false },
  { id: '2', type: 'message', title: 'New message', body: 'James Okafor replied to your proposal for the React Native App project.', time: '5 hours ago', read: false },
  { id: '3', type: 'payment', title: 'Milestone payment released', body: '£5,500 for "Gap Analysis & ISMS Setup" has been released and is on its way to your account.', time: '1 day ago', read: false },
  { id: '4', type: 'review', title: 'New review posted', body: 'MedCore Health left a 5-star review on your profile. "Excellent service and very professional team."', time: '2 days ago', read: true },
  { id: '5', type: 'contract', title: 'Contract signed', body: 'GreenPath Logistics has signed the contract for the React Native App project. Work can begin.', time: '3 days ago', read: true },
  { id: '6', type: 'enquiry', title: 'Enquiry status updated', body: 'Your proposal for "DevOps Team — Ongoing Retainer" has been marked as declined by the client.', time: '1 week ago', read: true },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  enquiry: <MessageSquare className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  review: <Star className="h-4 w-4" />,
  contract: <FileText className="h-4 w-4" />,
};

const COLOR_MAP: Record<string, string> = {
  enquiry: 'bg-blue-100 text-blue-600',
  message: 'bg-purple-100 text-purple-600',
  payment: 'bg-green-100 text-green-600',
  review: 'bg-amber-100 text-amber-600',
  contract: 'bg-gray-100 text-gray-600',
};

const TOGGLE_SETTINGS = [
  { key: 'enquiries', label: 'New Enquiries', desc: 'When a new client enquiry is received' },
  { key: 'messages', label: 'Messages', desc: 'When you receive a new message' },
  { key: 'payments', label: 'Payments', desc: 'When a milestone is paid or released' },
  { key: 'reviews', label: 'Reviews', desc: 'When a client leaves a review' },
  { key: 'contracts', label: 'Contracts', desc: 'When a contract is signed or updated' },
  { key: 'platform', label: 'Platform Updates', desc: 'Collabov product announcements' },
];

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [tab, setTab] = useState<'feed' | 'settings'>('feed');
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    enquiries: true, messages: true, payments: true, reviews: true, contracts: true, platform: false,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));

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
        {tab === 'feed' && unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-[#0070F3] font-medium hover:underline flex items-center gap-1">
            <CheckCircle className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['feed', 'settings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow-sm text-[#0B2D59]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'feed' ? 'Notification Feed' : 'Preferences'}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`bg-white rounded-xl border shadow-sm p-4 flex gap-4 cursor-pointer hover:shadow-md transition-shadow ${n.read ? 'border-gray-100' : 'border-blue-100 bg-blue-50/30'}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${COLOR_MAP[n.type]}`}>
                {ICON_MAP[n.type]}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className={`text-sm font-semibold ${n.read ? 'text-gray-700' : 'text-[#0B2D59]'}`}>{n.title}</div>
                  <div className="text-xs text-gray-400 flex-shrink-0">{n.time}</div>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">{n.body}</div>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-[#0070F3] flex-shrink-0 mt-2" />}
            </div>
          ))}
        </div>
      )}

      {tab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-xl">
          <h2 className="text-base font-semibold text-[#0B2D59] mb-4">Email & In-App Notifications</h2>
          <div className="space-y-4">
            {TOGGLE_SETTINGS.map(s => (
              <div key={s.key} className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">{s.label}</div>
                  <div className="text-xs text-gray-400">{s.desc}</div>
                </div>
                <button
                  onClick={() => setToggles(t => ({ ...t, [s.key]: !t[s.key] }))}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${toggles[s.key] ? 'bg-[#0070F3]' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${toggles[s.key] ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
