import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, BellRing, ShieldCheck, UserCircle, Plus, Trash2, Loader2, Download, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { NOTIFICATION_EVENTS, isBusinessEmail } from '../../lib/workflows';
import TwoFactorSetup from '../../components/auth/TwoFactorSetup';

type Tab = 'account' | 'team' | 'notifications' | 'privacy';

const INDUSTRIES = [
  'Technology', 'Financial Services', 'Healthcare', 'E-commerce', 'Manufacturing',
  'Professional Services', 'Media & Entertainment', 'Education', 'Government', 'Other',
];
const HEADCOUNT_BANDS = ['1–10', '11–50', '51–200', '201–1,000', '1,000+'];
const COUNTRIES = ['United Kingdom', 'Ireland', 'United States', 'Germany', 'France', 'Netherlands', 'Other'];

const ROLES = [
  { value: 'admin', label: 'Admin', desc: 'Full access — spend, sign, review, manage team' },
  { value: 'project_manager', label: 'Project Manager', desc: 'Review evidence, message vendors, raise change requests' },
  { value: 'finance', label: 'Finance', desc: 'Fund milestones, view invoices, manage payment methods' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access to engagements and governance' },
];

const CustomerSettings: React.FC = () => {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('account');
  const [loading, setLoading] = useState(true);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteError, setInviteError] = useState('');

  const [notifPrefs, setNotifPrefs] = useState<Record<string, 'realtime' | 'digest' | 'off'>>({});
  const [notifSaved, setNotifSaved] = useState(false);

  const [exportRequested, setExportRequested] = useState(false);

  const [companyProfile, setCompanyProfile] = useState({
    legal_entity_name: '', trading_name: '', industry: '', headcount_band: '', country: '', company_website: '',
  });
  const [companyProfileSaved, setCompanyProfileSaved] = useState(false);
  const [savingCompanyProfile, setSavingCompanyProfile] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: prof }, { data: team }, { data: prefsRow }, { data: customer }] = await Promise.all([
      supabase.from('profiles').select('two_factor_enabled').eq('id', user.id).maybeSingle(),
      supabase.from('customer_team_members').select('*').eq('customer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('notification_prefs').select('prefs').eq('user_id', user.id).maybeSingle(),
      supabase.from('customers').select('legal_entity_name, trading_name, industry, headcount_band, country, company_website').eq('id', user.id).maybeSingle(),
    ]);
    setTwoFactorEnabled(!!(prof as any)?.two_factor_enabled);
    setTeamMembers(team ?? []);
    const defaults: Record<string, 'realtime' | 'digest' | 'off'> = {};
    NOTIFICATION_EVENTS.forEach(e => { defaults[e.key] = 'realtime'; });
    setNotifPrefs({ ...defaults, ...(prefsRow?.prefs as any ?? {}) });
    if (customer) {
      setCompanyProfile({
        legal_entity_name: customer.legal_entity_name ?? '',
        trading_name: customer.trading_name ?? '',
        industry: customer.industry ?? '',
        headcount_band: customer.headcount_band ?? '',
        country: customer.country ?? '',
        company_website: customer.company_website ?? '',
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onTwoFactorChange = async (next: boolean) => {
    if (!user) return;
    setTwoFactorEnabled(next);
    await supabase.from('profiles').update({
      two_factor_enabled: next,
      two_factor_enabled_at: next ? new Date().toISOString() : null,
    }).eq('id', user.id);
  };

  const updateCompanyField = (key: keyof typeof companyProfile, value: string) => {
    setCompanyProfile(prev => ({ ...prev, [key]: value }));
    setCompanyProfileSaved(false);
  };

  const saveCompanyProfile = async () => {
    if (!user) return;
    setSavingCompanyProfile(true);
    await supabase.from('customers').update({
      legal_entity_name: companyProfile.legal_entity_name.trim() || null,
      trading_name: companyProfile.trading_name.trim() || null,
      industry: companyProfile.industry || null,
      headcount_band: companyProfile.headcount_band || null,
      country: companyProfile.country || null,
      company_website: companyProfile.company_website.trim() || null,
      company_name: companyProfile.trading_name.trim() || companyProfile.legal_entity_name.trim() || undefined,
    }).eq('id', user.id);
    setSavingCompanyProfile(false);
    setCompanyProfileSaved(true);
  };

  const changePassword = async () => {
    if (newPassword.length < 8) { setPasswordMsg('Password must be at least 8 characters.'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordMsg(error ? 'Could not update password.' : 'Password updated.');
    if (!error) setNewPassword('');
  };

  const inviteTeamMember = async () => {
    if (!user) return;
    setInviteError('');
    if (!inviteEmail.trim()) { setInviteError('Email is required.'); return; }
    if (!isBusinessEmail(inviteEmail)) { setInviteError('Please use a business email address.'); return; }
    const { data, error } = await supabase.from('customer_team_members').insert({
      customer_id: user.id, email: inviteEmail.trim(), role: inviteRole, status: 'invited',
    }).select().single();
    if (error) { setInviteError('Could not send the invite — check the email is unique.'); return; }
    setTeamMembers(prev => [data, ...prev]);
    setInviteEmail('');
  };

  const removeTeamMember = async (id: string) => {
    await supabase.from('customer_team_members').delete().eq('id', id);
    setTeamMembers(prev => prev.filter(m => m.id !== id));
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

  const requestDataExport = async () => {
    if (!user) return;
    await supabase.from('notifications').insert({
      user_id: user.id, type: 'system', title: 'Data export requested',
      message: 'Your full data export request was received. Under UK GDPR it will be delivered by email within 30 days.',
    });
    setExportRequested(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-8 w-8 text-[#0070F3] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/customer/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-[#0B2D59]">Settings</h1>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {([
            ['account', 'Account', UserCircle],
            ['team', 'Team', Users],
            ['notifications', 'Notifications', BellRing],
            ['privacy', 'Data & Privacy', ShieldCheck],
          ] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key ? 'bg-white text-[#0070F3] shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {tab === 'account' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="font-bold text-[#0B2D59] mb-3">Account</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input disabled value={profile?.full_name ?? ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input disabled value={profile?.email ?? user?.email ?? ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Company Profile</h3>
              <p className="text-xs text-gray-400 mb-3">Required before you can request proposals or fund milestones — used for contract and tax purposes.</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Legal Entity Name</label>
                  <input value={companyProfile.legal_entity_name} onChange={e => updateCompanyField('legal_entity_name', e.target.value)}
                    placeholder="e.g. Acme Technologies Ltd" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Trading Name <span className="text-gray-400 font-normal">(if different)</span></label>
                  <input value={companyProfile.trading_name} onChange={e => updateCompanyField('trading_name', e.target.value)}
                    placeholder="e.g. Acme Tech" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Industry</label>
                  <select value={companyProfile.industry} onChange={e => updateCompanyField('industry', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Company Size</label>
                  <select value={companyProfile.headcount_band} onChange={e => updateCompanyField('headcount_band', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select headcount</option>
                    {HEADCOUNT_BANDS.map(h => <option key={h} value={h}>{h} employees</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
                  <select value={companyProfile.country} onChange={e => updateCompanyField('country', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Company Website</label>
                  <input value={companyProfile.company_website} onChange={e => updateCompanyField('company_website', e.target.value)}
                    placeholder="https://" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <button onClick={saveCompanyProfile} disabled={savingCompanyProfile}
                className="px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg disabled:opacity-60">
                {savingCompanyProfile ? 'Saving...' : companyProfileSaved ? 'Saved ✓' : 'Save Company Profile'}
              </button>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Change Password</h3>
              <div className="flex gap-2">
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <button onClick={changePassword} className="px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg">Update</button>
              </div>
              {passwordMsg && <p className="text-xs text-gray-500 mt-1.5">{passwordMsg}</p>}
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Two-Factor Authentication</h3>
              <TwoFactorSetup enabled={twoFactorEnabled} onChange={onTwoFactorChange} />
            </div>
          </div>
        )}

        {tab === 'team' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#0B2D59] mb-1">Team Management</h2>
            <p className="text-xs text-gray-400 mb-4">Invite colleagues and control who can spend, sign and review.</p>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {inviteError && <p className="text-xs text-red-600 mb-2">{inviteError}</p>}
              <button onClick={inviteTeamMember} className="flex items-center gap-1.5 px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg">
                <Plus className="h-3.5 w-3.5" /> Invite
              </button>
            </div>

            <div className="space-y-2">
              {teamMembers.length === 0 && <p className="text-sm text-gray-400">No team members invited yet.</p>}
              {teamMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{m.email}</div>
                    <div className="text-xs text-gray-400 capitalize">{ROLES.find(r => r.value === m.role)?.label ?? m.role} · {m.status}</div>
                  </div>
                  <button onClick={() => removeTeamMember(m.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#0B2D59] mb-1">Notification Preferences</h2>
            <p className="text-xs text-gray-400 mb-4">Action-required items are always real-time and can't be switched to digest.</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
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
                          <input type="radio" name={`notif-${evt.key}`} disabled={evt.forced && opt !== 'realtime'}
                            checked={notifPrefs[evt.key] === opt} onChange={() => setNotifPref(evt.key, opt)}
                            className="accent-[#0070F3] disabled:opacity-30" />
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
        )}

        {tab === 'privacy' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#0B2D59] mb-1">Data & Privacy</h2>
            <p className="text-xs text-gray-400 mb-4">Request a full export of your data under UK GDPR — delivered by email within 30 days.</p>
            {exportRequested ? (
              <p className="text-sm text-green-600 flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Export requested — you'll receive it by email within 30 days.</p>
            ) : (
              <button onClick={requestDataExport} className="flex items-center gap-1.5 px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg">
                <Download className="h-3.5 w-3.5" /> Request Data Export
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSettings;
