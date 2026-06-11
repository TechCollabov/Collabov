import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Send, UserPlus, Clock, RefreshCw } from 'lucide-react';

const BLOCKED_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'yahoo.co.uk', 'hotmail.co.uk'];

function isBusinessEmail(email: string): boolean {
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1].toLowerCase();
  return !BLOCKED_DOMAINS.includes(domain);
}

interface PendingInvitation {
  id: number;
  vendorName: string;
  contactEmail: string;
  invitedOn: string;
  status: string;
}

const mockPendingInvitations: PendingInvitation[] = [
  {
    id: 1,
    vendorName: 'Acme Tech Solutions',
    contactEmail: 'james@acmetech.io',
    invitedOn: '2026-06-03',
    status: 'Invitation sent',
  },
];

const BYOVPage: React.FC = () => {
  const [vendorCompany, setVendorCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedCompany, setSubmittedCompany] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!vendorCompany.trim()) newErrors.vendorCompany = 'Vendor company name is required.';
    if (!contactName.trim()) newErrors.contactName = 'Contact name is required.';
    if (!contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address.';
    } else if (!isBusinessEmail(contactEmail)) {
      newErrors.contactEmail = 'Please use a business email address (not Gmail, Yahoo, Hotmail, or Outlook).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Mock async submit
    setTimeout(() => {
      setSubmittedEmail(contactEmail);
      setSubmittedCompany(vendorCompany);
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  const handleReset = () => {
    setVendorCompany('');
    setContactName('');
    setContactEmail('');
    setNote('');
    setErrors({});
    setSubmitted(false);
    setSubmittedEmail('');
    setSubmittedCompany('');
  };

  const isFormValid =
    vendorCompany.trim() !== '' &&
    contactName.trim() !== '' &&
    contactEmail.trim() !== '' &&
    !loading;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Back link */}
        <Link
          to="/customer/dashboard"
          className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0B2D59]">Invite Your Existing Vendor</h1>
          <p className="text-gray-600 mt-2">
            Already working with an IT vendor? Invite them to join Collabov so you can manage your engagement through the platform.
          </p>
        </div>

        {/* 3-step callout */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <div className="flex flex-wrap gap-3 items-center justify-around text-sm font-medium text-blue-800">
            <span className="flex items-center space-x-1"><span className="bg-blue-200 text-blue-900 rounded-full px-2 py-0.5 text-xs font-bold">1</span><span>You invite them</span></span>
            <span className="text-blue-400">→</span>
            <span className="flex items-center space-x-1"><span className="bg-blue-200 text-blue-900 rounded-full px-2 py-0.5 text-xs font-bold">2</span><span>They sign up</span></span>
            <span className="text-blue-400">→</span>
            <span className="flex items-center space-x-1"><span className="bg-blue-200 text-blue-900 rounded-full px-2 py-0.5 text-xs font-bold">3</span><span>Admin verifies</span></span>
            <span className="text-blue-400">→</span>
            <span className="flex items-center space-x-1"><span className="bg-blue-200 text-blue-900 rounded-full px-2 py-0.5 text-xs font-bold">4</span><span>You're connected</span></span>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-10">
          {submitted ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Invitation sent to {submittedEmail}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                <strong>{submittedCompany}</strong> will receive an email with a signup link. Once they complete registration and are verified by Collabov admin, they will appear in your My Vendors section labelled as a <span className="font-semibold text-[#0070F3]">client-invited vendor</span>.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800 flex items-center space-x-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Invitation expires in 7 days.</span>
              </div>
              <button
                onClick={handleReset}
                className="inline-flex items-center space-x-2 text-[#0070F3] text-sm font-medium hover:underline mt-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Send another invitation</span>
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor company name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vendorCompany}
                  onChange={(e) => setVendorCompany(e.target.value)}
                  placeholder="e.g. Acme Tech Solutions"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] transition ${errors.vendorCompany ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.vendorCompany && <p className="text-red-500 text-xs mt-1">{errors.vendorCompany}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. James Miller"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] transition ${errors.contactName ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. james@acmetech.io"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] transition ${errors.contactEmail ? 'border-red-400' : 'border-gray-300'}`}
                />
                <p className="text-xs text-gray-500 mt-1">Must be a business email address (no Gmail, Yahoo, Hotmail, or Outlook).</p>
                {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note to vendor <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="We work with [Company] on our React platform. Joining Collabov will let us manage our contracts and payments through the platform."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!isFormValid}
                className="w-full bg-[#0070F3] text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Invitation</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Pending Invitations */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Pending Invitations</h2>
          {mockPendingInvitations.length === 0 ? (
            <p className="text-sm text-gray-500">No pending invitations.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="pb-3 pr-4">Vendor name</th>
                    <th className="pb-3 pr-4">Contact email</th>
                    <th className="pb-3 pr-4">Invited on</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockPendingInvitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 font-medium text-gray-900">{inv.vendorName}</td>
                      <td className="py-3 pr-4 text-gray-600">{inv.contactEmail}</td>
                      <td className="py-3 pr-4 text-gray-500">{inv.invitedOn}</td>
                      <td className="py-3 pr-4">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1">
                          <RefreshCw className="h-3 w-3" />
                          <span>Resend</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BYOVPage;
