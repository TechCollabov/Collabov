import React, { useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    platformFeePercent: '5',
    autoReleaseDays: '7',
    minProjectValue: '500',
    invitationExpiryDays: '14',
    adminEmail: 'admin@collabov.com',
    maintenanceMode: false,
    vendorVerificationSla: '3',
  });

  const update = (key: string, value: string | boolean) => setSettings(s => ({ ...s, [key]: value }));

  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

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
              <p className="text-xs text-gray-400 mb-2">Percentage deducted from each milestone payment before vendor payout.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.platformFeePercent}
                  onChange={e => update('platformFeePercent', e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Release Days</label>
              <p className="text-xs text-gray-400 mb-2">Number of days after milestone delivery approval before funds are automatically released to vendor.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.autoReleaseDays}
                  onChange={e => update('autoReleaseDays', e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Project Value (£)</label>
              <p className="text-xs text-gray-400 mb-2">Minimum total contract value allowed on the platform.</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">£</span>
                <input
                  type="number"
                  min="0"
                  value={settings.minProjectValue}
                  onChange={e => update('minProjectValue', e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification SLA (working days)</label>
              <p className="text-xs text-gray-400 mb-2">Target number of working days to review and respond to a vendor verification application.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={settings.vendorVerificationSla}
                  onChange={e => update('vendorVerificationSla', e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
                <span className="text-sm text-gray-500">working days</span>
              </div>
            </div>
          </div>
        </div>

        {/* User & Platform */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Users & Platform</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Expiry (days)</label>
              <p className="text-xs text-gray-400 mb-2">How long a vendor or buyer invitation link remains active.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.invitationExpiryDays}
                  onChange={e => update('invitationExpiryDays', e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notification Email</label>
              <p className="text-xs text-gray-400 mb-2">Receives platform alerts, new verifications, and dispute notifications.</p>
              <input
                type="email"
                value={settings.adminEmail}
                onChange={e => update('adminEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className={`rounded-xl border shadow-sm p-6 ${settings.maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${settings.maintenanceMode ? 'text-red-500' : 'text-gray-400'}`} />
                <h2 className="text-base font-semibold text-gray-800">Maintenance Mode</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">When enabled, the public-facing site shows a maintenance page. Admin panel remains accessible.</p>
            </div>
            <button
              onClick={() => update('maintenanceMode', !settings.maintenanceMode)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 py-2.5 px-5 text-sm font-semibold rounded-xl transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-[#0070F3] text-white hover:bg-blue-700'}`}
        >
          <Save className="h-4 w-4" />
          {saved ? 'Settings Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
