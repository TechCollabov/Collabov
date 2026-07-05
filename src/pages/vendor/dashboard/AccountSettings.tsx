import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Phone, Lock, Globe, Building2, DollarSign,
  Shield, HelpCircle, Settings, Sun, Moon, LogOut,
  ChevronDown, Upload, AlertTriangle, CheckCircle,
  Smartphone, Bell, Languages, CreditCard, FileText,
  Users, Eye, EyeOff, Download, MessageSquare,
  BellRing, Palette, Clock, BookOpen, Calendar, Loader2, UserPlus, Send,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { isBusinessEmail, addDays, getPlatformSettings, NOTIFICATION_EVENTS } from '../../../lib/workflows';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ElementType;
}

const AccountSettings: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState('general');
  const [theme, setTheme] = useState('light');
  const [isPublic, setIsPublic] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [bookingMethod, setBookingMethod] = useState('manual');
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [calendlySaved, setCalendlySaved] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, 'realtime' | 'digest' | 'off'>>({});
  const [notifSaved, setNotifSaved] = useState(false);
  const [byocCompany, setByocCompany] = useState('');
  const [byocEmail, setByocEmail] = useState('');
  const [byocError, setByocError] = useState('');
  const [byocInvites, setByocInvites] = useState<any[]>([]);

  const sections: SettingsSection[] = [
    { id: 'general', title: 'General Settings', icon: Settings },
    { id: 'business', title: 'Business Identity', icon: Building2 },
    { id: 'payment', title: 'Payment & Billing', icon: DollarSign },
    { id: 'legal', title: 'Legal & Compliance', icon: FileText },
    { id: 'security', title: 'Security & Privacy', icon: Shield },
    { id: 'notifications', title: 'Notification Preferences', icon: BellRing },
    { id: 'clients', title: 'Invite Clients (BYOC)', icon: UserPlus },
    { id: 'support', title: 'Support & Help', icon: HelpCircle },
    { id: 'preferences', title: 'Platform Preferences', icon: Settings }
  ];

  // Load persisted calendar/2FA/notification/BYOC state.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: vendorRow }, { data: prefsRow }, { data: invites }] = await Promise.all([
        supabase.from('vendors').select('booking_method, calendly_url').eq('id', user.id).maybeSingle(),
        supabase.from('notification_prefs').select('prefs').eq('user_id', user.id).maybeSingle(),
        supabase.from('partner_invites').select('*').eq('inviter_id', user.id).eq('inviter_role', 'vendor').order('created_at', { ascending: false }),
      ]);
      if (vendorRow) {
        setBookingMethod(vendorRow.booking_method ?? 'manual');
        setCalendlyUrl(vendorRow.calendly_url ?? '');
      }
      const defaults: Record<string, 'realtime' | 'digest' | 'off'> = {};
      NOTIFICATION_EVENTS.forEach(e => { defaults[e.key] = e.forced ? 'realtime' : 'realtime'; });
      setNotifPrefs({ ...defaults, ...(prefsRow?.prefs as any ?? {}) });
      setByocInvites(invites ?? []);
      setCalendarLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    setTwoFactorEnabled(!!(profile as any)?.two_factor_enabled);
  }, [profile]);

  const connectGoogleCalendar = async () => {
    if (!user) return;
    // Simulated OAuth: recorded in-platform, no real Google account linked.
    await supabase.from('vendors').update({ booking_method: 'google' }).eq('id', user.id);
    setBookingMethod('google');
  };

  const disconnectCalendar = async () => {
    if (!user) return;
    await supabase.from('vendors').update({ booking_method: 'manual' }).eq('id', user.id);
    setBookingMethod('manual');
  };

  const saveCalendlyUrl = async () => {
    if (!user || !calendlyUrl) return;
    await supabase.from('vendors').update({ booking_method: 'calendly', calendly_url: calendlyUrl }).eq('id', user.id);
    setBookingMethod('calendly');
    setCalendlySaved(true);
  };

  const toggleTwoFactor = async () => {
    if (!user) return;
    const next = !twoFactorEnabled;
    if (next) {
      const codes = Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 8).toUpperCase());
      await supabase.from('profiles').update({
        two_factor_enabled: true,
        two_factor_backup_codes: codes,
        two_factor_enabled_at: new Date().toISOString(),
      }).eq('id', user.id);
      setBackupCodes(codes);
      setShowBackupCodes(true);
    } else {
      await supabase.from('profiles').update({
        two_factor_enabled: false,
        two_factor_backup_codes: null,
      }).eq('id', user.id);
    }
    setTwoFactorEnabled(next);
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

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Verify OTP logic here
    setShowOTPModal(false);
  };

  const handlePhoneUpdate = () => {
    setShowOTPModal(true);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Email Address</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="email"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Current email address"
                />
                <button className="btn-primary">Update Email</button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Mobile Number</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="tel"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter mobile number"
                />
                <button 
                  className="btn-primary"
                  onClick={handlePhoneUpdate}
                >
                  Verify Number
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Password</h3>
              <div className="space-y-4">
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Current password"
                />
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="New password"
                />
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Confirm new password"
                />
                <button className="btn-primary">Change Password</button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Language Preference</h3>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="form-checkbox" />
                  <span>Email Notifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="form-checkbox" />
                  <span>SMS Notifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="form-checkbox" />
                  <span>In-App Notifications</span>
                </label>
              </div>
            </div>

            {/* Calendar Connections */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#0B2D59] rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-widest uppercase text-gray-900">CALENDAR CONNECTIONS</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Connect your calendar so buyers can book discovery calls directly from your profile.</p>
                </div>
              </div>

              {/* Google Calendar */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#4285F4]">G</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Google Calendar</p>
                    <p className="text-xs text-gray-500">Allow buyers to book discovery calls via your Google Calendar</p>
                  </div>
                </div>
                {calendarLoading ? (
                  <Loader2 className="h-4 w-4 text-gray-300 animate-spin" />
                ) : bookingMethod === 'google' ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Connected</span>
                    <button onClick={disconnectCalendar} className="text-xs text-red-500 hover:text-red-600">Disconnect</button>
                  </div>
                ) : (
                  <button
                    onClick={connectGoogleCalendar}
                    className="px-4 py-2 bg-[#0070F3] text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                  >
                    Connect Google Calendar
                  </button>
                )}
              </div>

              {/* Calendly URL */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#006BFF]">Cal</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Calendly URL</p>
                    <p className="text-xs text-gray-500">Paste your Calendly booking link — buyers will see an embedded booking page</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={calendlyUrl}
                    onChange={e => { setCalendlyUrl(e.target.value); setCalendlySaved(false); }}
                    placeholder="https://calendly.com/yourname/discovery-call"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                  />
                  <button
                    onClick={saveCalendlyUrl}
                    className="px-4 py-2 bg-[#0070F3] text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    {calendlySaved && bookingMethod === 'calendly' ? 'Saved ✓' : 'Save'}
                  </button>
                </div>
                {calendlySaved && bookingMethod === 'calendly' && <p className="text-xs text-green-600 mt-1.5">Calendly URL saved. Buyers can now book directly from your profile.</p>}
                {bookingMethod === 'manual' && <p className="text-xs text-gray-400 mt-1.5">No calendar connected — buyers send a pre-filled message to book instead.</p>}
              </div>
            </div>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Display Name / Vendor Name</h3>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Company display name"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Profile Visibility</h3>
              <div className="flex items-center space-x-4">
                <button
                  className={`px-4 py-2 rounded-lg ${
                    isPublic ? 'bg-primary-600 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => setIsPublic(true)}
                >
                  Public
                </button>
                <button
                  className={`px-4 py-2 rounded-lg ${
                    !isPublic ? 'bg-primary-600 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => setIsPublic(false)}
                >
                  Private
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Verification Status</h3>
              <div className="bg-green-50 p-4 rounded-lg flex items-center space-x-2">
                <CheckCircle className="text-green-500" />
                <span>Verified Business Account</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Website & Social Media</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Globe className="text-gray-400" />
                  <input
                    type="url"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Website URL"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="text-gray-400" />
                  <input
                    type="url"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="LinkedIn URL"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Payout Method</h3>
              <div className="space-y-4">
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="bank">Bank Transfer</option>
                  <option value="stripe">Stripe</option>
                  <option value="wise">Wise</option>
                </select>
                <button className="btn-primary">Update Payout Method</button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Currency Preference</h3>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="usd">USD - US Dollar</option>
                <option value="eur">EUR - Euro</option>
                <option value="gbp">GBP - British Pound</option>
              </select>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Billing Address</h3>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
                placeholder="Enter billing address"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Tax Identification</h3>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Tax ID / VAT number"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Invoices & Earnings</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border flex justify-between items-center">
                  <div>
                    <p className="font-medium">March 2024</p>
                    <p className="text-sm text-gray-500">Invoice #2024-03</p>
                  </div>
                  <button className="flex items-center space-x-2 text-primary-600">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'legal':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Terms of Use</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Current Version: 2.1 (Accepted on March 15, 2024)
                </p>
                <button className="text-primary-600 mt-2">View Full Terms</button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Privacy Policy</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Last Updated: March 1, 2024
                </p>
                <button className="text-primary-600 mt-2">View Policy</button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Upload Documents</h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Drop files here or click to upload
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Required Documents:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• GST Registration</li>
                    <li>• Business License</li>
                    <li>• NDA Agreement</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">KYC Status</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-500" />
                  <span>KYC Verification Complete</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Verified on March 10, 2024
                </p>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>2FA Status</span>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                    onClick={toggleTwoFactor}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {twoFactorEnabled && showBackupCodes && backupCodes.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-2">Save your backup codes — shown once</p>
                    <div className="grid grid-cols-4 gap-2 font-mono text-xs text-amber-900">
                      {backupCodes.map(c => <span key={c} className="bg-white rounded px-2 py-1 text-center">{c}</span>)}
                    </div>
                    <button onClick={() => setShowBackupCodes(false)} className="text-xs text-amber-700 underline mt-2">I've saved these codes</button>
                  </div>
                )}
                {twoFactorEnabled && !showBackupCodes && (
                  <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Two-factor authentication is enabled.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Chrome - Windows</p>
                      <p className="text-sm text-gray-500">Last active: Just now</p>
                    </div>
                    <button className="text-red-600">End Session</button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Account Recovery</h3>
              <div className="space-y-4">
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Recovery email"
                />
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Recovery phone number"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Delete Account</h3>
              <div className="space-y-4">
                <button
                  className="text-red-600"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Request Account Deletion
                </button>
                {showDeleteConfirm && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-600 mb-4">
                      Are you sure you want to delete your account? This action cannot be undone.
                    </p>
                    <div className="flex space-x-4">
                      <button
                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
                        onClick={() => {
                          // Handle account deletion
                          setShowDeleteConfirm(false);
                        }}
                      >
                        Confirm Deletion
                      </button>
                      <button
                        className="bg-gray-200 px-4 py-2 rounded-lg"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-1">Notification Preferences</h3>
              <p className="text-sm text-gray-500 mb-4">
                Action-required items are always real-time and can't be switched to digest.
              </p>
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

      case 'clients':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-1">Invite Clients (BYOC)</h3>
              <p className="text-sm text-gray-500 mb-4">
                Already work with a client outside Collabov? Invite them so you can run the engagement through the platform.
              </p>
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Client company name"
                  value={byocCompany}
                  onChange={e => setByocCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
                <input
                  type="email"
                  placeholder="Contact business email"
                  value={byocEmail}
                  onChange={e => setByocEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
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

      case 'support':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Help Centre</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Getting Started</h4>
                  <ul className="text-sm space-y-2">
                    <li>
                      <a href="#" className="text-primary-600">Platform Overview</a>
                    </li>
                    <li>
                      <a href="#" className="text-primary-600">Account Setup Guide</a>
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Billing & Payments</h4>
                  <ul className="text-sm space-y-2">
                    <li>
                      <a href="#" className="text-primary-600">Payment Methods</a>
                    </li>
                    <li>
                      <a href="#" className="text-primary-600">Invoice Guide</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Submit a Ticket</h3>
              <form className="space-y-4">
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select Issue Category</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing Issue</option>
                  <option value="account">Account Issue</option>
                </select>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="Describe your issue"
                />
                <button type="submit" className="btn-primary">
                  Submit Ticket
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Live Chat</h3>
              <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">24/7 Support Chat</p>
                  <p className="text-sm text-gray-500">Average response time: 2 minutes</p>
                </div>
                <button className="btn-primary flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Start Chat</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Feedback</h3>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
                placeholder="Share your feedback or feature request"
              />
              <button className="btn-primary mt-4">Submit Feedback</button>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Default Landing Page</h3>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="dashboard">Dashboard</option>
                <option value="inbox">Inbox</option>
                <option value="projects">Project Tracker</option>
              </select>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Theme</h3>
              <div className="flex space-x-4">
                <button
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    theme === 'light' ? 'bg-primary-600 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                </button>
                <button
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-primary-600 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Auto-Logout Timer</h3>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
              </select>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Communication Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="form-checkbox" />
                  <span>Weekly Updates</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="form-checkbox" />
                  <span>Special Deals & Promotions</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="form-checkbox" />
                  <span>Industry Reports</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Platform Announcements</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Latest Updates</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    • New feature: AI-powered vendor matching
                  </p>
                  <p className="text-sm text-gray-600">
                    • Enhanced security measures implemented
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Saved Templates</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">Basic Package Template</p>
                    <p className="text-sm text-gray-500">Last modified: 2 days ago</p>
                  </div>
                  <button className="text-primary-600">Edit</button>
                </div>
              </div>
            </div>
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
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
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

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <motion.div 
            className="bg-white rounded-lg shadow-sm p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {renderSection()}
          </motion.div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Enter OTP</h3>
            <p className="text-gray-600 mb-4">
              We've sent a verification code to your mobile number
            </p>
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <input
                type="text"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter OTP"
                maxLength={6}
              />
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600"
                  onClick={() => setShowOTPModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;