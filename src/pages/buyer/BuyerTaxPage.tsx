import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Receipt } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getTaxFieldLabels } from '../../lib/taxFields';
import BuyerLayout from '../../components/buyer/BuyerLayout';

const BuyerTaxPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('');
  const [taxIdPrimary, setTaxIdPrimary] = useState('');
  const [taxIdSecondary, setTaxIdSecondary] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('buyers')
      .select('country, tax_id_primary, tax_id_secondary')
      .eq('id', user.id)
      .maybeSingle();
    if (data) {
      setCountry(data.country ?? '');
      setTaxIdPrimary(data.tax_id_primary ?? '');
      setTaxIdSecondary(data.tax_id_secondary ?? '');
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const { primaryLabel, secondaryLabel, showSecondary } = getTaxFieldLabels(country);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from('buyers')
      .update({
        tax_id_primary: taxIdPrimary.trim() || null,
        tax_id_secondary: taxIdSecondary.trim() || null,
      })
      .eq('id', user.id);
    setSaving(false);
    setSaved(true);
  };

  if (loading) {
    return (
      <BuyerLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-[#0070F3] animate-spin" />
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-black italic text-brand-primary">Tax</h1>
        <p className="text-xs font-semibold tracking-[0.25em] text-slate-400 mt-1 uppercase">
          Tax Identification Details
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
            <Receipt className="h-5 w-5 text-blue-300" />
          </div>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">Tax Details</span>
        </div>

        <p className="text-xs text-gray-400 mb-6">
          Used to generate correct invoices and contracts for your engagements. Fields are labelled based on your
          company's country{country ? ` (${country})` : ''}.
        </p>

        {!country && (
          <div className="mb-6 px-4 py-3 bg-amber-50 text-amber-700 text-sm rounded-xl">
            Your company country isn't set yet, so we're showing generic tax ID fields. Set your country in{' '}
            <span className="font-semibold">Settings</span> for country-specific labels.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{primaryLabel}</label>
            <input
              type="text"
              value={taxIdPrimary}
              onChange={(e) => { setTaxIdPrimary(e.target.value); setSaved(false); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
            />
          </div>
          {showSecondary && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{secondaryLabel}</label>
              <input
                type="text"
                value={taxIdSecondary}
                onChange={(e) => { setTaxIdSecondary(e.target.value); setSaved(false); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
              />
            </div>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </BuyerLayout>
  );
};

export default BuyerTaxPage;
