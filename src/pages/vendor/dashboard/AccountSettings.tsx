import React, { useState, useEffect } from 'react';
import {
  CheckCircle, Smartphone,
  BellRing, UserPlus, Send, Loader2, Calendar, CreditCard, User,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { isBusinessEmail, addDays, getPlatformSettings, NOTIFICATION_EVENTS } from '../../../lib/workflows';
import TwoFactorSetup from '../../../components/auth/TwoFactorSetup';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ElementType;
}

// Only the 5 tabs the vendor journey spec actually documents: Personal Account,
// Notification Preferences, Calendar Connections, BYOC, Stripe Connect. The
// previous version had 9 tabs; 4 were entirely static placeholder content
// (Business Identity, Payment & Billing, Legal & Compliance, Support,
// Platform Preferences) with no state binding at all - trimmed rather than
// built out, per the build plan's scoping decision.
const SECTIONS: SettingsSection[] = [
  { id: 'account', title: 'Personal Account', icon: User },
  { id: 'notifications', title: 'Notification Preferences', icon: BellRing },
  { id: 'calendar', title: 'Calendar Connections', icon: Calendar },
  { id: 'clients', title: 'Invite Clients (BYOC)', icon: UserPlus },
  { id: 'stripe', title: 'Stripe Connect', icon: CreditCard },
];

const AccountSettings: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState('account');

  // Personal account
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountSaved, setAccountSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Calendar
  const [bookingMethod, setBookingMethod] = useState('manual');
  const [calDiyUrl, setCalDiyUrl] = useState('');
  const [calDiySaved, setCalDiySaved] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<Record<string, 'realtime' | 'digest' | 'off'>>({});
  const [notifSaved, setNotifSaved] = useState(false);

  // BYOC
  const [byocCompany, setByocCompany] = useState('');
  const [byocEmail, setByocEmail] = useState('');
  const [byocError, setByocError] = useState('');
  const [byocInvites, setByocInvites] = useState<any[]>([]);

  // Stripe Connect
  const [stripeStatus, setStripeStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [stripeLoading, setStripeLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: vendorRow }, { data: prefsRow }, { data: invites }] = await Promise.all([
        supabase.from('vendors').select('booking_method, cal_diy_url, contact_phone, stripe_connect_status').eq('id', user.id).maybeSingle(),
        supabase.from('notification_prefs').select('prefs').eq('user_id', user.id).maybeSingle(),
        supabase.from('partner_invites').select('*').eq('inviter_id', user.id).eq('inviter_role', 'vendor').order('created_at', { ascending: false }),
      ]);
      if (vendorRow) {
        setBookingMethod(vendorRow.booking_method ?? 'manual');
        setCalDiyUrl(vendorRow.cal_diy_url ?? '');
        setPhone(vendorRow.contact_phone ?? '');
        setStripeStatus(vendorRow.stripe_connect_status === 'connected' ? 'connected' : 'disconnected');
      }
      const defaults: Record<string, 'realtime' | 'digest' | 'off'> = {};
      NOTIFICATION_EVENTS.forEach(e => { defaults[e.key] = 'realtime'; });
      setNotifPrefs({ ...defaults, ...(prefsRow?.prefs as any ?? {}) });
      setByocInvites(invites ?? []);
      setCalendarLoading(false);
      setStripeLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setTwoFactorEnabled(!!(profile as any)?.two_factor_enabled);
  }, [profile]);

  const saveAccountDetails = async () => {
    if (!user) return;
    setAccountSaved(false);
    await Promise.all([
      supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id),
      supabase.from('vendors').update({ contact_phone: phone }).eq('id', user.id),
    ]);
    setAccountSaved(true);
  };

  const changePassword = async () => {
    if (newPassword.length < 10) { setPasswordMsg('Password must be at least 10 characters.'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordMsg(error ? 'Could not update password.' : 'Password updated.');
    if (!error) setNewPassword('');
  };

  const onTwoFactorChange = async (next: boolean) => {
    if (!user) return;
    setTwoFactorEnabled(next);
    await supabase.from('profiles').update({
      two_factor_enabled: next,
      two_factor_enabled_at: next ? new Date().toISOString() : null,
    }).eq('id', user.id);
  };

  const disconnectCalendar = async () => {
    if (!user) return;
    await supabase.from('vendors').update({ booking_method: 'manual' }).eq('id', user.id);
    setBookingMethod('manual');
  };

  const saveCalDiyUrl = async () => {
    if (!user || !calDiyUrl) return;
    await supabase.from('vendors').update({ booking_method: 'cal_diy', cal_diy_url: calDiyUrl }).eq('id', user.id);
    setBookingMethod('cal_diy');
    setCalDiySaved(true);
  };

  const setNotifPref = (key: string, value: 'realtime' | 'digest' | 'off') => {
    setNotifPrefs(prev => ({ ...prev, [key]: value }));
    setNotifSaved(false);
  };

  const saveNotifPrefs = async () => {
    if (!user) return;
    await supabase.from('notification_prefs').upsert({ user_id: user.id, prefs: notifPrefs, updated_at: new Date().toISOString() });
    setNotifSaved(true);
  };

  const sendByocInvite = async () => {
    if (!user) return;
    setByocError('');
    if (!byocCompany.trim() || !byocEmail.trim()) { setByocError('Company name and contact email are required.'); return; }
    if (!isBusinessEmail(byocEmail)) { setByocError('Please use a business email address.'); return; }
    const { data, error } = await supabase.from('partner_invites').insert({
      inviter_id: user.id,
      inviter_role: 'vendor',
      company_name: byocCompany.trim(),
      contact_email: byocEmail.trim(),
      status: 'pending',
      expires_at: addDays(new Date(), getPlatformSettings().byovInviteExpiryDays).toISOString(),
    }).select().single();
    if (error) { setByocError('Could not send the invitation. Please try again.'); return; }
    setByocInvites(prev => [data, ...prev]);
    setByocCompany('');
    setByocEmail('');
  };

  const connectStripe = async () => {
    if (!user) return;
    // Simulated Stripe Connect OAuth: recorded in-platform, no real Stripe account.
    await supabase.from('vendors').update({ stripe_connect_status: 'connected', stripe_connected_at: new Date().toISOString() }).eq('id', user.id);
    setStripeStatus('connected');
  };

  const disconnectStripe = async () => {
    if (!user) return;
    await supabase.from('vendors').update({ stripe_connect_status: 'disconnected' }).eq('id', user.id);
    setStripeStatus('disconnected');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Name</h3>
              <div className="flex items-center gap-3">
                <input type="text" value={fullName} onChange={e => { setFullName(e.target.value); setAccountSaved(false); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Email</h3>
              <input disabled value={user?.email ?? ''} className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
              <p className="text-xs text-gray-400 mt-1">Contact support to change your login email.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Phone Number</h3>
              <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setAccountSaved(false); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <button onClick={saveAccountDetails} className="px-4 py-2 bg-[#0070F3] text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              {accountSaved ? 'Saved ✓' : 'Save Changes'}
            </button>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-medium mb-4">Password</h3>
              <div className="space-y-3">
                <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordMsg(''); }}
                  placeholder="New password (min 10 characters)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <button onClick={changePassword} className="px-4 py-2 bg-[#0070F3] text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Change Password</button>
                {passwordMsg && <p className={`text-xs ${passwordMsg.includes('updated') ? 'text-green-600' : 'text-red-600'}`}>{passwordMsg}</p>}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Smartphone className="h-4 w-4 text-gray-400" /> Two-Factor Authentication</h3>
              <TwoFactorSetup enabled={twoFactorEnabled} onChange={onTwoFactorChange} />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-1">Notification Preferences</h3>
              <p className="text-sm text-gray-500 mb-4">Action-required items are always real-time and can't be switched to digest.</p>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-left px-4 py-2.5">Event</th>
                      <th className="text-center px-4 py-2.5">Real-time</th>
                      <th className="text-center px-4 py-2.5">Daily digest</th>
                      <th className="text-center px-4 py-2.5">Off</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {NOTIFICATION_EVENTS.map(evt => (
                      <tr key={evt.key}>
                        <td className="px-4 py-3 text-gray-700">
                          {evt.label}
                          {evt.forced && <span className="ml-2 text-xs text-amber-600 font-medium">Action required</span>}
                        </td>
                        {(['realtime', 'digest', 'off'] as const).map(opt => (
                          <td key={opt} className="text-center px-4 py-3">
                            <input
                              type="radio"
                              name={`notif-${evt.key}`}
                              disabled={evt.forced && opt !== 'realtime'}
                              checked={notifPrefs[evt.key] === opt}
                              onChange={() => setNotifPref(evt.key, opt)}
                              className="accent-[#0070F3] disabled:opacity-30"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={saveNotifPrefs} className="mt-4 px-4 py-2 bg-[#0070F3] text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                {notifSaved ? 'Saved ✓' : 'Save Preferences'}
              </button>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">Calendar Connections</h3>
              <p className="text-sm text-gray-500 mb-4">Connect Cal.diy so buyers can book discovery calls directly from your profile — a real embedded booking widget, not a pre-filled message.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-[#0070F3]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Cal.diy</p>
                  <p className="text-xs text-gray-500">Paste your Cal.diy public booking link — buyers see it embedded directly on your profile</p>
                </div>
              </div>
              {calendarLoading ? (
                <Loader2 className="h-4 w-4 text-gray-300 animate-spin" />
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="url" value={calDiyUrl} onChange={e => { setCalDiyUrl(e.target.value); setCalDiySaved(false); }}
                      placeholder="https://cal.diy/yourname/discovery-call"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                    />
                    <button onClick={saveCalDiyUrl} className="px-4 py-2 bg-[#0070F3] text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                      {calDiySaved && bookingMethod === 'cal_diy' ? 'Saved ✓' : 'Save'}
                    </button>
                  </div>
                  {bookingMethod === 'cal_diy' && calDiyUrl && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Connected — bookings sync back here automatically</span>
                      <button onClick={disconnectCalendar} className="text-xs text-red-500 hover:text-red-600">Disconnect</button>
                    </div>
                  )}
                  {bookingMethod === 'manual' && <p className="text-xs text-gray-400 mt-1.5">No calendar connected — buyers send a pre-filled message to book instead.</p>}
                </>
              )}
            </div>
          </div>
        );

      case 'clients':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-1">Invite Clients (BYOC)</h3>
              <p className="text-sm text-gray-500 mb-4">
                Already work with a client outside Collabov? Invite them so you can run the engagement through the platform.
              </p>
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                <input type="text" placeholder="Client company name" value={byocCompany} onChange={e => setByocCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
                <input type="email" placeholder="Contact business email" value={byocEmail} onChange={e => setByocEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
                {byocError && <p className="text-xs text-red-600">{byocError}</p>}
                <button onClick={sendByocInvite} className="flex items-center gap-2 px-4 py-2 bg-[#0070F3] text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                  <Send className="h-3.5 w-3.5" /> Send Invitation
                </button>
              </div>

              {byocInvites.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Pending Invitations</h4>
                  <div className="space-y-2">
                    {byocInvites.map(inv => {
                      const daysLeft = inv.expires_at ? Math.max(0, Math.ceil((new Date(inv.expires_at).getTime() - Date.now()) / 86400000)) : null;
                      return (
                        <div key={inv.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-2.5 text-sm">
                          <div>
                            <div className="font-medium text-gray-900">{inv.company_name}</div>
                            <div className="text-xs text-gray-500">{inv.contact_email}</div>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            inv.status === 'accepted' ? 'bg-green-100 text-green-700'
                            : inv.status === 'expired' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {inv.status === 'pending' ? `${daysLeft}d left` : inv.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'stripe':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">Stripe Connect</h3>
              <p className="text-sm text-gray-500 mb-4">Required before you can receive any payouts. If disconnected mid-engagement, payouts are held until reconnected.</p>
            </div>
            {stripeLoading ? (
              <Loader2 className="h-5 w-5 text-gray-300 animate-spin" />
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-[#635BFF]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Stripe</p>
                    <p className="text-xs text-gray-500">{stripeStatus === 'connected' ? 'Payouts are active.' : 'Not connected — payouts are held.'}</p>
                  </div>
                </div>
                {stripeStatus === 'connected' ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Connected</span>
                    <button onClick={disconnectStripe} className="text-xs text-red-500 hover:text-red-600">Disconnect</button>
                  </div>
                ) : (
                  <button onClick={connectStripe} className="px-4 py-2 bg-[#635BFF] text-white rounded-lg text-xs font-semibold hover:opacity-90">
                    Connect Stripe
                  </button>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Account Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeSection === section.id ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{section.title}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
