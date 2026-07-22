import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, X, Loader2, Star, MapPin, MessageSquare, Check, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { logEvent, notify, hasCompanyProfile, isBuyerBlacklisted } from '../lib/workflows';
import { normalizeFeatureRows, FeatureRow } from '../lib/packageFeatures';
import CompanyProfileGateModal from '../components/ui/CompanyProfileGateModal';

interface PackageRow {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: string;
  vat_treatment: 'inclusive' | 'exclusive' | 'not_applicable' | null;
  featureRows: FeatureRow[];
  vendor?: {
    company_name: string;
    business_type: string | null;
    is_verified: boolean;
    logo_url: string | null;
    rating: number | null;
    review_count: number | null;
    city: string | null;
    country: string | null;
  };
}

const CATEGORIES = ['All', 'Software Development', 'Managed IT', 'Cybersecurity', 'Cloud & Infrastructure', 'DevOps', 'QA & Testing'];

const AVATAR_COLOURS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500'];

function VendorLogo({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="h-14 w-14 rounded-xl object-cover border border-gray-100 flex-shrink-0 bg-white"
      />
    );
  }
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const colour = AVATAR_COLOURS[(name.charCodeAt(0) || 0) % AVATAR_COLOURS.length];
  return (
    <div className={`h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${colour}`}>
      {initials}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </span>
  );
}

function vatSuffix(vat: PackageRow['vat_treatment']) {
  if (vat === 'inclusive') return 'inc. VAT';
  if (vat === 'exclusive') return '+ VAT';
  return null;
}

function FeatureValueCell({ value }: { value: FeatureRow['value'] }) {
  if (value === true) return <Check className="h-4 w-4 text-green-500 flex-shrink-0" />;
  if (value === false) return <Minus className="h-4 w-4 text-gray-300 flex-shrink-0" />;
  return <span className="text-sm text-gray-500 text-right">{value}</span>;
}

const PackagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<PackageRow | null>(null);
  const [showProfileGate, setShowProfileGate] = useState(false);
  const [blacklistError, setBlacklistError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from('vendor_packages')
        .select('id, vendor_id, name, description, price, billing_period, vat_treatment, features, vendors(company_name, business_type, is_verified, logo_url, rating, review_count, city, country)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      const rows: PackageRow[] = (data ?? [])
        .map((p: any) => ({
          ...p,
          featureRows: normalizeFeatureRows(p.features),
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
    if (!(await hasCompanyProfile(user.id))) {
      setConfirming(null);
      setShowProfileGate(true);
      return;
    }
    if (await isBuyerBlacklisted(user.id)) {
      setBlacklistError('This account is blacklisted and cannot purchase packages. Contact support@collabov.com.');
      return;
    }
    await logEvent('package_purchase_started', user.id, 'buyer', 'package', pkg.id, { price: pkg.price });
    // The SOW wizard is auto-populated from the package: title, deliverables,
    // single milestone at the package price, duration.
    navigate(
      `/sow-wizard?package=${pkg.id}&vendor=${encodeURIComponent(pkg.vendor?.company_name ?? '')}` +
      `&vendorId=${pkg.vendor_id}&type=${pkg.vendor?.business_type ?? 'agency'}` +
      `&budget=${pkg.price}&project=${encodeURIComponent(pkg.name)}`
    );
  };

  // Reuses the same direct-message mechanism as the vendor profile's
  // "Book a Discovery Call" flow: insert into `messages`, notify the vendor,
  // then land the buyer on the shared /messages inbox where the thread lives.
  const getInTouch = async (pkg: PackageRow) => {
    if (!user) { navigate('/signin'); return; }
    try {
      await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: pkg.vendor_id,
        content: `Hi, I'm interested in your "${pkg.name}" package. Could you tell me more?`,
        thread_type: 'pre_engagement',
      });
      await notify(pkg.vendor_id, 'message', 'New message',
        `A buyer is interested in your "${pkg.name}" package.`, '/messages');
    } catch (e) {
      console.error('Could not start conversation:', e);
    }
    navigate('/messages');
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filtered.map(pkg => (
                <div key={pkg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Left half — vendor */}
                    <div className="p-6 flex flex-col gap-3 md:border-r md:border-b-0 border-b border-gray-100">
                      <Link to={`/vendor/profile/${pkg.vendor_id}`} className="flex items-center gap-3">
                        <VendorLogo name={pkg.vendor?.company_name ?? pkg.name} url={pkg.vendor?.logo_url} />
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{pkg.name}</h3>
                          <div className="text-xs text-gray-400 truncate">by {pkg.vendor?.company_name ?? 'Vendor'}</div>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1.5">
                        <Stars rating={pkg.vendor?.rating ?? 0} />
                        <span className="text-xs text-gray-500">
                          {(pkg.vendor?.rating ?? 0).toFixed(1)} ({pkg.vendor?.review_count ?? 0})
                        </span>
                      </div>

                      {(pkg.vendor?.city || pkg.vendor?.country) && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          {[pkg.vendor?.city, pkg.vendor?.country].filter(Boolean).join(', ')}
                        </div>
                      )}

                      {pkg.vendor?.is_verified && (
                        <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 font-medium px-2.5 py-1 rounded-full w-fit">
                          <ShieldCheck className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}

                      <button
                        onClick={() => getInTouch(pkg)}
                        className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-[#0070F3] text-[#0070F3] text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors w-fit"
                      >
                        <MessageSquare className="h-4 w-4" /> Get in Touch
                      </button>
                    </div>

                    {/* Right half — price + features */}
                    <div className="p-6 flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Starting at</div>
                          <div className="text-2xl font-bold text-[#0070F3]">
                            £{Number(pkg.price).toLocaleString('en-GB')}
                            <span className="text-sm font-normal text-gray-400 ml-1">{pkg.billing_period === 'monthly' ? '/month' : 'fixed'}</span>
                            {vatSuffix(pkg.vat_treatment) && (
                              <span className="text-sm font-normal text-gray-400 ml-1">{vatSuffix(pkg.vat_treatment)}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirming(pkg)}
                          className="flex-shrink-0 px-4 py-2.5 bg-accent-500 text-white text-sm font-semibold rounded-lg hover:bg-accent-600 transition-colors"
                        >
                          View Package
                        </button>
                      </div>

                      <div className="flex-1">
                        {pkg.featureRows.slice(0, 5).map((row, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                            <span className="text-sm text-gray-600">{row.label}</span>
                            <FeatureValueCell value={row.value} />
                          </div>
                        ))}
                      </div>
                    </div>
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
              {blacklistError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {blacklistError}
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-900">{confirming.name}</div>
                <div className="text-sm text-gray-500">by {confirming.vendor?.company_name}</div>
              </div>
              <div className="text-2xl font-bold text-[#0070F3]">
                £{Number(confirming.price).toLocaleString('en-GB')}
                <span className="text-sm font-normal text-gray-400 ml-1">{confirming.billing_period === 'monthly' ? '/month' : 'fixed'}</span>
                {vatSuffix(confirming.vat_treatment) && (
                  <span className="text-sm font-normal text-gray-400 ml-1">{vatSuffix(confirming.vat_treatment)}</span>
                )}
              </div>
              <div className="space-y-1">
                {confirming.featureRows.map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-600">{row.label}</span>
                    <FeatureValueCell value={row.value} />
                  </div>
                ))}
              </div>
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
      {showProfileGate && <CompanyProfileGateModal action="purchase a package" onClose={() => setShowProfileGate(false)} />}
    </div>
  );
};

export default PackagesPage;
