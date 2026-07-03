import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, ShieldCheck, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { logEvent } from '../lib/workflows';

interface PackageRow {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: string;
  features: string[] | null;
  vendor?: {
    company_name: string;
    business_type: string | null;
    is_verified: boolean;
    logo_url: string | null;
  };
}

const CATEGORIES = ['All', 'Software Development', 'Managed IT', 'Cybersecurity', 'Cloud & Infrastructure', 'DevOps', 'QA & Testing'];

const PackagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<PackageRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from('vendor_packages')
        .select('id, vendor_id, name, description, price, billing_period, features, vendors(company_name, business_type, is_verified, logo_url)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      const rows: PackageRow[] = (data ?? [])
        .map((p: any) => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : [],
          vendor: Array.isArray(p.vendors) ? p.vendors[0] : p.vendors,
        }))
        // Packages exist for Managed IT and project agencies only — never staff aug.
        .filter((p: PackageRow) => p.vendor?.business_type !== 'staffaug');
      setPackages(rows);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = packages.filter(p =>
    (category === 'All' || (p.description ?? '').toLowerCase().includes(category.toLowerCase()) || p.name.toLowerCase().includes(category.toLowerCase())) &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || (p.vendor?.company_name ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  const purchase = async (pkg: PackageRow) => {
    if (!user) { navigate('/signin'); return; }
    await logEvent('package_purchase_started', user.id, 'buyer', 'package', pkg.id, { price: pkg.price });
    // The SOW wizard is auto-populated from the package: title, deliverables,
    // single milestone at the package price, duration.
    navigate(
      `/sow-wizard?package=${pkg.id}&vendor=${encodeURIComponent(pkg.vendor?.company_name ?? '')}` +
      `&vendorId=${pkg.vendor_id}&type=${pkg.vendor?.business_type ?? 'agency'}` +
      `&budget=${pkg.price}&project=${encodeURIComponent(pkg.name)}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-[#0B2D59] text-white py-14">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-3">Fixed-Price Packages</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">Pre-scoped service bundles from verified vendors. Clear deliverables, defined timelines, transparent pricing.</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search + filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search packages..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0070F3] text-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${category === c ? 'bg-[#0070F3] text-white border-[#0070F3]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-[#0070F3] animate-spin" /></div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(pkg => (
                <div key={pkg.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-blue-50 text-[#0070F3] font-semibold px-2.5 py-1 rounded-full w-fit">
                      {pkg.billing_period === 'monthly' ? 'Monthly' : 'Fixed scope'}
                    </span>
                    {pkg.vendor?.is_verified && (
                      <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-[#0B2D59] text-sm mb-1">{pkg.name}</h3>
                  <div className="text-xs text-gray-400 mb-3">by {pkg.vendor?.company_name ?? 'Vendor'}</div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-[#0070F3]">£{Number(pkg.price).toLocaleString('en-GB')}</span>
                    <span className="text-xs text-gray-400">{pkg.billing_period === 'monthly' ? '/month' : 'fixed'}</span>
                  </div>
                  <ul className="space-y-1.5 mb-4 flex-1">
                    {(pkg.features ?? []).slice(0, 4).map((i, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0070F3] flex-shrink-0" />{String(i)}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Link to={`/vendor/profile/${pkg.vendor_id}`} className="flex-1 flex items-center justify-center gap-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                      Vendor
                    </Link>
                    <button
                      onClick={() => setConfirming(pkg)}
                      className="flex-[2] flex items-center justify-center gap-1 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Purchase Package <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">No packages match your search.</div>
            )}
          </>
        )}
      </div>

      {/* Purchase confirmation modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0B2D59]">Confirm package</h2>
              <button onClick={() => setConfirming(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="font-semibold text-gray-900">{confirming.name}</div>
                <div className="text-sm text-gray-500">by {confirming.vendor?.company_name}</div>
              </div>
              <div className="text-2xl font-bold text-[#0070F3]">
                £{Number(confirming.price).toLocaleString('en-GB')}
                <span className="text-sm font-normal text-gray-400 ml-1">{confirming.billing_period === 'monthly' ? '/month' : 'fixed'}</span>
              </div>
              <ul className="space-y-1.5">
                {(confirming.features ?? []).map((i, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0070F3] flex-shrink-0" />{String(i)}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400">
                Next: the Statement of Work opens pre-populated from this package. You can edit it before anything
                is signed — no payment is taken until you fund the milestone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => purchase(confirming)}
                  className="flex-1 py-3 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue to SOW
                </button>
                <button onClick={() => setConfirming(null)} className="px-5 py-3 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
