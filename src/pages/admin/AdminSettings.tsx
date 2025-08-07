import React from 'react';
import { Save } from 'lucide-react';

const AdminSettings: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      <div className="mt-6 bg-white shadow rounded-lg divide-y divide-gray-200">
        {/* General Settings */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                Site Name
              </label>
              <input
                type="text"
                id="siteName"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                defaultValue="Collabov"
              />
            </div>
            <div>
              <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700">
                Site Description
              </label>
              <textarea
                id="siteDescription"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                defaultValue="Revolutionizing B2B Outsourcing with Verified Global Talent"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                defaultValue="hello@collabov.com"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                defaultValue="+44 (0) 123 456 7890"
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                defaultValue="123 Tech Hub Street&#10;London, EC2A 4NS&#10;United Kingdom"
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Social Media Links</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
                LinkedIn
              </label>
              <input
                type="url"
                id="linkedin"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="https://linkedin.com/company/collabov"
              />
            </div>
            <div>
              <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                Twitter
              </label>
              <input
                type="url"
                id="twitter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="https://twitter.com/collabov"
              />
            </div>
            <div>
              <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
                Facebook
              </label>
              <input
                type="url"
                id="facebook"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="https://facebook.com/collabov"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-6">
          <button className="btn-primary flex items-center">
            <Save className="h-5 w-5 mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;