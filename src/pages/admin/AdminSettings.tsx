import React, { useState, useEffect, useCallback } from 'react';
import { Save, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { refreshPlatformSettings } from '../../lib/workflows';

interface Settings {
  platform_fee_pct: string;
  auto_release_days: string;
  auto_release_warning_days: string;
  minimum_project_value: string;
  byov_invite_expiry_days: string;
  admin_alert_email: string;
  maintenance_mode: boolean;
  vendor_verification_sla_days: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors the input min/max shown in the form — enforced here too since
 *  these are plain buttons, not a <form>, so HTML5 constraint validation
 *  never actually runs on save. */
function validateSettings(s: Settings): string | null {
  const fee = Number(s.platform_fee_pct);
  if (!Number.isFinite(fee) || fee < 0 || fee > 30) return 'Platform Fee must be between 0 and 30%.';

  const releaseDays = Number(s.auto_release_days);
  if (!Number.isInteger(releaseDays) || releaseDays < 1 || releaseDays > 30) return 'Auto-Release Days must be a whole number between 1 and 30.';

  const warningDays = Number(s.auto_release_warning_days);
  if (!Number.isInteger(warningDays) || warningDays < 1 || warningDays > 30) return 'Auto-Release Warning must be a whole number between 1 and 30 days.';
  if (warningDays >= releaseDays) return 'Auto-Release Warning must be fewer days than Auto-Release Days, or it would never show before release.';

  const minValue = Number(s.minimum_project_value);
  if (!Number.isFinite(minValue) || minValue < 0) return 'Minimum Project Value cannot be negative.';

  const inviteDays = Number(s.byov_invite_expiry_days);
  if (!Number.isInteger(inviteDays) || inviteDays < 1 || inviteDays > 90) return 'BYOV/BYOC Invitation Expiry must be a whole number between 1 and 90 days.';

  const slaDays = Number(s.vendor_verification_sla_days);
  if (!Number.isInteger(slaDays) || slaDays < 1 || slaDays > 14) return 'Verification SLA must be a whole number between 1 and 14 days.';

  if (s.admin_alert_email.trim() && !EMAIL_RE.test(s.admin_alert_email.trim())) return 'Admin Notification Email is not a valid email address.';

  return null;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    platform_fee_pct: '10',
    auto_release_days: '7',
    auto_release_warning_days: '5',
    minimum_project_value: '500',
    byov_invite_expiry_days: '7',
    admin_alert_email: '',
    maintenance_mode: false,
    vendor_verification_sla_days: '2',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('platform_settings')
      .select('platform_fee_pct, auto_release_days, auto_release_warning_days, minimum_project_value, byov_invite_expiry_days, admin_alert_email, maintenance_mode, vendor_verification_sla_days')
      .eq('id', true)
      .maybeSingle();
    if (data) {
      setSettings({
        platform_fee_pct: String(data.platform_fee_pct),
        auto_release_days: String(data.auto_release_days),
        auto_release_warning_days: String(data.auto_release_warning_days),
        minimum_project_value: String(data.minimum_project_value),
        byov_invite_expiry_days: String(data.byov_invite_expiry_days),
        admin_alert_email: data.admin_alert_email ?? '',
        maintenance_mode: data.maintenance_mode,
        vendor_verification_sla_days: String(data.vendor_verification_sla_days),
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (key: keyof Settings, value: string | boolean) => setSettings(s => ({ ...s, [key]: value }));

  const handleSave = async () => {
    const validationError = validateSettings(settings);
    if (validationError) {
      setError(validationError);
      setSaved(false);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('platform_settings').update({
        platform_fee_pct: Number(settings.platform_fee_pct),
        auto_release_days: Number(settings.auto_release_days),
        auto_release_warning_days: Number(settings.auto_release_warning_days),
        minimum_project_value: Number(settings.minimum_project_value),
        byov_invite_expiry_days: Number(settings.byov_invite_expiry_days),
        admin_alert_email: settings.admin_alert_email || null,
        maintenance_mode: settings.maintenance_mode,
        vendor_verification_sla_days: Number(settings.vendor_verification_sla_days),
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      }).eq('id', true);
      await refreshPlatformSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Platform Settings</h1>

      <div className="space-y-5 max-w-2xl">

        {/* Payments */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Payments & Fees</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee (%)</label>
              <p className="text-xs text-gray-400 mb-2">Percentage deducted from each milestone payment before vendor payout. Applies to every new release immediately.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.platform_fee_pct}
                  onChange={e => update('platform_fee_pct', e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Release Days</label>
              <p className="text-xs text-gray-400 mb-2">Days after milestone submission before funds are automatically released. Applies to newly-submitted milestones.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.auto_release_days}
                  onChange={e => update('auto_release_days', e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Release Warning (days before)</label>
              <p className="text-xs text-gray-400 mb-2">How many days before the auto-release date the milestone review screen highlights it as urgent. Must be fewer than Auto-Release Days.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.auto_release_warning_days}
                  onChange={e => update('auto_release_warning_days', e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Project Value (£)</label>
              <p className="text-xs text-gray-400 mb-2">Minimum fixed-price budget allowed on a new job post or tender.</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">£</span>
                <input
                  type="number"
                  min="0"
                  value={settings.minimum_project_value}
                  onChange={e => update('minimum_project_value', e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Verification */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Vendor Verification</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification SLA (days)</label>
              <p className="text-xs text-gray-400 mb-2">Target days to review a vendor application. Drives the age-warning colours on the Verification Queue.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={settings.vendor_verification_sla_days}
                  onChange={e => update('vendor_verification_sla_days', e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
          </div>
        </div>

        {/* User & Platform */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Users & Platform</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BYOV/BYOC Invitation Expiry (days)</label>
              <p className="text-xs text-gray-400 mb-2">How long a buyer-invites-vendor or vendor-invites-client link remains active.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.byov_invite_expiry_days}
                  onChange={e => update('byov_invite_expiry_days', e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notification Email</label>
              <p className="text-xs text-gray-400 mb-2">Contact address for platform alerts, stored for reference by the operations team.</p>
              <input
                type="email"
                value={settings.admin_alert_email}
                onChange={e => update('admin_alert_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className={`rounded-xl border shadow-sm p-6 ${settings.maintenance_mode ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${settings.maintenance_mode ? 'text-red-500' : 'text-gray-400'}`} />
                <h2 className="text-base font-semibold text-gray-800">Maintenance Mode</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">When enabled, every public and buyer/vendor route shows a maintenance page. The admin panel stays accessible so you can turn it back off.</p>
            </div>
            <button
              onClick={() => update('maintenance_mode', !settings.maintenance_mode)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.maintenance_mode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Save */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 py-2.5 px-5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 ${saved ? 'bg-green-600 text-white' : 'bg-[#0070F3] text-white hover:bg-blue-700'}`}
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : saved ? 'Settings Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
