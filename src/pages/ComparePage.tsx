import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CompareVendor {
  id: string;
  name: string;
  business_type: string | null;
  verified: boolean;
  rating: number;
  reviewCount: number;
  referrals: number;
  services: string;
  tech: string[];
  model: string;
  rateRange: string;
  teamSize: string;
  timezone: string;
  ir35: boolean;
  available: boolean;
  responseTime: string;
  engagements: number;
}

const ROWS = [
  { key: 'business_type_label', label: 'Vendor Type' },
  { key: 'services', label: 'Service Categories' },
  { key: 'tech', label: 'Tech Stack', isTags: true },
  { key: 'model', label: 'Engagement Model' },
  { key: 'rateRange', label: 'Monthly Rate Range' },
  { key: 'teamSize', label: 'Team Size' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'ir35', label: 'IR35 Compliant', isBool: true },
  { key: 'available', label: 'Available Now', isBool: true },
  { key: 'responseTime', label: 'Avg. Response Time' },
  { key: 'engagements', label: 'Engagements Completed' },
];

const TYPE_LABEL: Record<string, string> = { msp: 'MSP', agency: 'IT Agency', staffaug: 'Staff Aug' };
const TYPE_COLOURS: Record<string, string> = {
  msp: 'bg-blue-100 text-blue-700',
  agency: 'bg-green-100 text-green-700',
  staffaug: 'bg-amber-100 text-amber-700',
};

const ComparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 4);
  const [vendors, setVendors] = useState<CompareVendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (ids.length === 0) { setLoading(false); return; }
      const { data } = await supabase
        .from('vendors')
        .select('id, company_name, business_type, is_verified, rating, review_count, referral_count, service_categories, tech_stack, engagement_models, monthly_rate_min, monthly_rate_max, team_size_band, timezone, ir35_compliant, availability_status, response_time_hours, projects_completed')
        .in('id', ids);
      if (cancelled || !data) return;
      const byId = new Map(data.map((v: any) => [v.id, v]));
      const ordered = ids.map(id => byId.get(id)).filter(Boolean) as any[];
      setVendors(ordered.map(v => ({
        id: v.id,
        name: v.company_name,
        business_type: v.business_type,
        verified: v.is_verified,
        rating: v.rating ?? 0,
        reviewCount: v.review_count ?? 0,
        referrals: v.referral_count ?? 0,
        services: Array.isArray(v.service_categories) ? v.service_categories.join(', ') : '—',
        tech: Array.isArray(v.tech_stack) ? v.tech_stack.map(String) : [],
        model: Array.isArray(v.engagement_models) ? v.engagement_models.join(' / ') : '—',
        rateRange: v.monthly_rate_min || v.monthly_rate_max
          ? `£${(v.monthly_rate_min ?? 0).toLocaleString()}–£${(v.monthly_rate_max ?? 0).toLocaleString()}/mo`
          : 'Not published',
        teamSize: v.team_size_band ?? '—',
        timezone: v.timezone ?? '—',
        ir35: !!v.ir35_compliant,
        available: v.availability_status === 'available',
        responseTime: v.response_time_hours ? `${v.response_time_hours} hours` : '—',
        engagements: v.projects_completed ?? 0,
      })));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [ids.join(',')]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-8 w-8 text-[#0070F3] animate-spin" /></div>;
  }

  if (vendors.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">No vendors to compare</h1>
          <p className="text-gray-500 mb-6">Select at least 2 vendors from the results page to compare them.</p>
          <Link to="/results" className="inline-flex items-center gap-2 text-[#0070F3] font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Search Results
          </Link>
        </div>
      </div>
    );
  }

  const vendorIds = vendors.map(v => v.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div>
            <p className="text-sm font-semibold text-[#0B2D59]">Post a Job to these {vendors.length} vendors</p>
            <p className="text-xs text-gray-500 mt-0.5">Create a private job post visible only to selected vendors.</p>
          </div>
          <Link
            to={`/customer/post-job?private=true&vendors=${vendorIds.join(',')}`}
            className="px-4 py-2 bg-[#0070F3] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Post a Private Job →
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Link to="/results" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Back to results
          </Link>
          <h1 className="text-2xl font-bold text-[#0B2D59]">Compare Vendors</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-44 py-4 px-5 text-left text-sm font-semibold text-gray-400 bg-gray-50 border-b border-r border-gray-100">
                  Attribute
                </th>
                {vendors.map(v => (
                  <th key={v.id} className="py-5 px-5 border-b border-r last:border-r-0 border-gray-100 bg-white min-w-52">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-[#0070F3] font-bold text-sm flex-shrink-0">
                        {v.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-[#0B2D59] text-sm">{v.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {v.verified && <span className="flex items-center gap-0.5 text-xs text-[#0070F3]"><ShieldCheck className="h-3 w-3" /> Verified</span>}
                          {v.business_type && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOURS[v.business_type] || 'bg-gray-100 text-gray-600'}`}>
                              {TYPE_LABEL[v.business_type] ?? v.business_type}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <span>★ {v.rating.toFixed(1)}</span>
                          <span>({v.reviewCount})</span>
                        </div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ key, label, isTags, isBool }) => (
                <tr key={key} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-4 px-5 text-xs font-semibold text-gray-500 bg-gray-50 border-r border-gray-100 align-top">{label}</td>
                  {vendors.map(v => {
                    const value = key === 'business_type_label' ? (TYPE_LABEL[v.business_type ?? ''] ?? '—') : (v as any)[key];
                    return (
                      <td key={v.id} className="py-4 px-5 border-r last:border-r-0 border-gray-100 text-sm text-gray-700 align-top">
                        {isBool ? (
                          value
                            ? <span className="flex items-center gap-1 text-green-600 font-medium"><Check className="h-4 w-4" /> Yes</span>
                            : <span className="flex items-center gap-1 text-gray-400"><X className="h-4 w-4" /> No</span>
                        ) : isTags ? (
                          <div className="flex flex-wrap gap-1">
                            {(value as string[]).map((t: string) => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)}
                          </div>
                        ) : (
                          <span>{value}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Actions row */}
              <tr>
                <td className="py-5 px-5 bg-gray-50 border-r border-gray-100" />
                {vendors.map(v => (
                  <td key={v.id} className="py-5 px-5 border-r last:border-r-0 border-gray-100">
                    <div className="space-y-2">
                      <Link to={`/vendor/profile/${v.id}`} className="block w-full py-2 text-center bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        View Profile
                      </Link>
                      <Link to={`/vendor/profile/${v.id}`} className="block w-full py-2 text-center border border-[#0070F3] text-[#0070F3] text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                        Request Proposal
                      </Link>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;
