import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { notify, logEvent, hasCompanyProfile, isBuyerBlacklisted } from '../lib/workflows';
import CompanyProfileGateModal from '../components/ui/CompanyProfileGateModal';

const OUTPUT_OPTIONS = [
  { id: 'spec', label: 'Technical specification document' },
  { id: 'prototype', label: 'Prototype' },
  { id: 'feasibility', label: 'Feasibility report' },
  { id: 'all', label: 'All three' },
];

const DiscoveryBriefPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendorId = searchParams.get('vendor');
  const [vendorName, setVendorName] = useState('');
  const [vendorType, setVendorType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [outputs, setOutputs] = useState<Set<string>>(new Set());
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [showProfileGate, setShowProfileGate] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!vendorId) return;
    supabase
      .from('vendors')
      .select('company_name, business_type')
      .eq('id', vendorId)
      .single()
      .then(({ data }) => {
        if (data) {
          setVendorName(data.company_name);
          setVendorType(data.business_type ?? null);
        }
      });
  }, [vendorId]);

  const toggleOutput = (id: string) => {
    setOutputs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAgency = !vendorId || vendorType === 'agency';
  const canSubmit = isAgency && description.length >= 100 && outputs.size >= 1 && budget.trim() !== '' && !!vendorId && !sending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (!user) { navigate('/signin'); return; }
    setSending(true);
    setError('');
    try {
      if (!(await hasCompanyProfile(user.id))) {
        setShowProfileGate(true);
        setSending(false);
        return;
      }
      if (await isBuyerBlacklisted(user.id)) {
        setError('This account is blacklisted and cannot send new briefs. Contact support@collabov.com.');
        setSending(false);
        return;
      }
      const { data: enquiry, error: insErr } = await supabase.from('enquiries').insert({
        buyer_id: user.id,
        vendor_id: vendorId!,
        enquiry_type: 'discovery_brief',
        subject: 'Discovery brief',
        title: 'Discovery brief',
        message: description.trim(),
        expected_output: Array.from(outputs).join(', '),
        budget_from: Number(budget) || null,
        budget_to: Number(budget) || null,
        start_date: startDate || null,
        buyer_email: profile?.email ?? user.email ?? '',
        status: 'new',
      }).select().single();
      if (insErr) throw insErr;
      await notify(vendorId!, 'enquiry', 'New discovery brief',
        'A buyer sent you a discovery brief. Respond with a discovery proposal from your Enquiries inbox.',
        '/vendor/dashboard/enquiries');
      await logEvent('discovery_brief_sent', user.id, 'buyer', 'enquiry', enquiry.id, {});
      setSubmitted(true);
    } catch (err) {
      console.error('Discovery brief failed:', err);
      setError('Could not send the brief. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#0B2D59] mb-2">Discovery Brief Sent</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Discovery brief sent to <strong>{vendorName || 'the agency'}</strong>. Their discovery proposal will arrive in your Proposals inbox.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 text-sm text-[#0070F3] hover:text-blue-700 font-semibold"
          >
            Send another brief
          </button>
        </div>
      </div>
    );
  }

  if (showProfileGate) {
    return <CompanyProfileGateModal action="send a discovery brief" onClose={() => setShowProfileGate(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0B2D59] mb-2">Start with a Discovery</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Commission a technical specification from a verified IT agency.{' '}
            <span className="font-semibold text-gray-700">Typical cost: £1,500–£5,000.</span>{' '}
            Deliverable: full project specification.
          </p>
        </div>

        {/* Decision guide: when a discovery is the right call vs. requesting a proposal directly */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-8 text-sm text-blue-900">
          <p className="font-semibold mb-1.5">Is a discovery right for you?</p>
          <ul className="space-y-1 text-blue-800">
            <li>• <strong>Use a discovery</strong> if you know the problem but not yet how to build it — you'll get a spec, prototype, or feasibility report to scope the real project from.</li>
            <li>• <strong>Skip straight to Request a Proposal</strong> if you already have a clear spec or requirements — a discovery would just add cost and time.</li>
            <li>• Discoveries are only offered by IT agencies, since MSPs and staff augmentation vendors deliver against a spec rather than write one.</li>
          </ul>
        </div>

        {vendorId && !isAgency && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm text-red-800">
            {vendorName || 'This vendor'} is {vendorType === 'msp' ? 'an MSP' : vendorType === 'staffaug' ? 'a staff augmentation vendor' : 'not an IT agency'} — discovery
            engagements are only available from IT agencies.{' '}
            <Link to="/results?type=agency" className="font-semibold underline">Find an agency</Link> instead, or{' '}
            <Link to={`/vendor/profile/${vendorId}`} className="font-semibold underline">request a proposal directly</Link> from {vendorName || 'this vendor'}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Describe the project or problem you need scoped
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              placeholder="Explain what you're trying to build or solve. The more detail you provide, the more accurate the scoping will be."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none font-sans"
            />
            <div className={`text-xs mt-1 ${description.length < 100 ? 'text-red-500' : 'text-gray-400'}`}>
              {description.length} / 100 characters minimum
            </div>
          </div>

          {/* Output expected */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-3">
              Output expected <span className="font-normal text-gray-500">(select at least one)</span>
            </label>
            <div className="space-y-2">
              {OUTPUT_OPTIONS.map(opt => {
                const selected = outputs.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleOutput(opt.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left ${
                      selected
                        ? 'border-[#0070F3] bg-blue-50 text-[#0070F3]'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {selected ? (
                      <CheckSquare className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 flex-shrink-0 text-gray-300" />
                    )}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Budget for discovery (£)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">£</span>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="2500"
                min="0"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">Typical range: £1,500–£5,000</div>
          </div>

          {/* Start date */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Start date <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
            />
          </div>

          {/* Submit */}
          {!vendorId && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              Discovery briefs go to a specific project agency.{' '}
              <Link to="/results" className="font-semibold underline">Find an agency</Link> and start the
              discovery from their profile.
            </div>
          )}
          {vendorId && vendorName && (
            <p className="text-sm text-gray-500">
              Sending to <strong className="text-gray-700">{vendorName}</strong>
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 bg-[#0070F3] text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {sending ? 'Sending…' : 'Send Discovery Brief'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DiscoveryBriefPage;
