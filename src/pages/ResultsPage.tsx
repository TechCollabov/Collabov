import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Star, ShieldCheck, Bookmark, BookmarkCheck, X, Filter,
  ChevronDown, ChevronUp, ArrowRight, CheckSquare, Square, TrendingUp, UserCheck, Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/* ── Market Insight Data (default fallback; overridden by site_content) ── */
const DEFAULT_MARKET_INSIGHT_DATA: Record<string, { rate: string; demand: string; tip: string }> = {
  'msp': { rate: '£1,200–£3,500/month', demand: 'High demand — 847 active searches this month', tip: 'MSPs with SLA guarantees and sub-4hr response times receive 3× more enquiries.' },
  'agency': { rate: '£8,000–£45,000/project', demand: 'High demand — 1,203 active searches this month', tip: 'Agencies with case studies in your industry receive 4× higher proposal acceptance rates.' },
  'staffaug': { rate: '£2,800–£6,500/month per person', demand: 'Growing demand — 634 active searches this month', tip: 'Staff aug providers with 3+ verified referrals win contracts 60% faster.' },
  'software+development': { rate: '£350–£650/day or £8,500+ project', demand: 'Very high demand — 1,847 searches this month', tip: 'React and Node.js skills are most requested by UK SMEs right now.' },
  'cybersecurity': { rate: '£3,500–£15,000/engagement', demand: 'Growing demand — 421 searches this month', tip: 'Vendors with ISO 27001 certification convert enquiries at 2× the platform average.' },
  'managed+it': { rate: '£800–£2,400/month', demand: 'Steady demand — 398 searches this month', tip: 'Buyers in this category prioritise response time guarantees above price.' },
};

/* ── Types ── */
type VendorType = 'MSP' | 'Agency' | 'Staff Aug';
type Availability = 'available' | 'limited' | 'booked';

/** vendors.business_type is the lowercase enum ('msp' | 'agency' | 'staffaug')
 *  this page's filters/badges display under their existing MSP/Agency/Staff Aug labels. */
const BUSINESS_TYPE_LABEL: Record<string, VendorType> = {
  msp: 'MSP',
  agency: 'Agency',
  staffaug: 'Staff Aug',
};

interface Vendor {
  id: string;
  name: string;
  city: string;
  country: string;
  type: VendorType | null;
  verified: boolean;
  rating: number;
  reviewCount: number;
  engagements: number;
  responseTime: string;
  tagline: string;
  techStack: string[];
  monthlyRate: number;
  availability: Availability;
  availableFrom?: string;
  ir35: boolean;
  referrals: number;
  service_categories?: string[];
  tech_stack?: string[];
  industry_focus?: string[];
  match_score?: number;
}

/* ── Match scoring ──
 * Weights follow the spec's 100-point model: service 30 / tech 20 /
 * case-study-industry 25 (proxied by industry_focus until case studies
 * are real) / case-study-tech 15 / keyword 10. Case-study-tech is 0 for
 * every vendor today rather than a flat award, since case studies aren't
 * persisted anywhere yet (see the vendor "My Listing" build-out) — there's
 * no real tech overlap to score against. It'll start contributing once
 * that data exists, without needing this function to change. */
function calculateMatchScore(vendor: { service_categories?: string[]; tech_stack?: string[]; industry_focus?: string[]; tagline?: string }, query: string, type: string): number {
  let score = 0;
  const q = (query + ' ' + type).toLowerCase();

  // Service category match (30 pts)
  const serviceKeywords: Record<string, string[]> = {
    'msp': ['managed', 'msp', 'infrastructure', 'support'],
    'agency': ['agency', 'development', 'software', 'build'],
    'staffaug': ['staff', 'augmentation', 'dedicated', 'team'],
    'software': ['software', 'development', 'react', 'node'],
    'cybersecurity': ['security', 'cyber', 'pentest'],
    'cloud': ['cloud', 'aws', 'azure', 'devops'],
    'qa': ['qa', 'testing', 'quality'],
  };
  const services = vendor.service_categories || [];
  const serviceMatch = services.some(s => {
    const sl = s.toLowerCase();
    return Object.entries(serviceKeywords).some(([k, v]) =>
      q.includes(k) && (sl.includes(k) || v.some(kw => sl.includes(kw)))
    );
  });
  if (serviceMatch) score += 30;
  else if (services.length > 0) score += 10; // partial

  // Tech stack match (20 pts)
  const techTerms = q.split(/[\s+,]+/).filter(t => t.length > 2);
  const stack = vendor.tech_stack || [];
  const techMatches = techTerms.filter(t => stack.some(s => s.toLowerCase().includes(t))).length;
  score += Math.min(20, techMatches * 5);

  // Industry match (25 pts) - using industry_focus as proxy for case study industry
  const industries = vendor.industry_focus || [];
  const industryMatch = industries.some(ind => q.includes(ind.toLowerCase()));
  if (industryMatch) score += 25;
  else score += 10;

  // Case study tech match (15 pts) — not scoreable until case studies are real; see note above.

  // Keyword match (10 pts) — query terms found in the vendor's tagline.
  const keywordTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const tagline = (vendor.tagline || '').toLowerCase();
  if (keywordTerms.length > 0 && keywordTerms.some(t => tagline.includes(t))) score += 10;

  return Math.min(100, score);
}

const TYPE_COLOURS: Record<VendorType, string> = {
  'MSP': 'bg-blue-100 text-blue-700',
  'Agency': 'bg-green-100 text-green-700',
  'Staff Aug': 'bg-amber-100 text-amber-700',
};

const AVAIL_CONFIG = {
  available: { dot: 'bg-green-500', label: 'Available now' },
  limited: { dot: 'bg-amber-400', label: 'Limited availability' },
  booked: { dot: 'bg-red-500', label: 'Fully booked' },
};

function initialsAvatar(name: string) {
  const words = name.split(' ');
  const initials = words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const colours = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500'];
  const colour = colours[name.charCodeAt(0) % colours.length];
  return { initials, colour };
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

/* ── Filter sidebar ── */
interface Filters {
  types: string[];
  services: string[];
  location: string;
  remoteOnly: boolean;
  rateMin: string;
  rateMax: string;
  teamSizes: string[];
  verifiedOnly: boolean;
  availableNow: boolean;
  ir35Only: boolean;
}

const DEFAULT_FILTERS: Filters = {
  types: [], services: [], location: '', remoteOnly: false,
  rateMin: '', rateMax: '', teamSizes: [], verifiedOnly: true, availableNow: false, ir35Only: false,
};

const SERVICE_CATS = [
  'Software Development', 'Managed IT', 'Staff Augmentation', 'Cybersecurity',
  'Cloud & Infrastructure', 'QA & Testing', 'DevOps', 'Data & Analytics', 'UI/UX Design', 'AI & Machine Learning',
];
const TEAM_SIZES = ['1–10 people', '11–50 people', '51–200 people', '200+ people'];
const VENDOR_TYPES: VendorType[] = ['MSP', 'Agency', 'Staff Aug'];

function AccordionGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-sm font-semibold text-gray-700">
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

/* ── Main component ── */
const ResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const query = searchParams.get('q') || '';
  const locationParam = searchParams.get('location') || '';
  const typeParam = searchParams.get('type') || '';

  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    types: typeParam && BUSINESS_TYPE_LABEL[typeParam.toLowerCase()] ? [BUSINESS_TYPE_LABEL[typeParam.toLowerCase()]] : [],
    location: locationParam,
  });
  const [sort, setSort] = useState('best');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [insightDismissed, setInsightDismissed] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [dbVendors, setDbVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [marketInsightData, setMarketInsightData] = useState(DEFAULT_MARKET_INSIGHT_DATA);

  useEffect(() => {
    supabase.from('site_content').select('value').eq('key', 'market_insight_table').maybeSingle()
      .then(({ data }) => {
        if (data?.value && Object.keys(data.value).length > 0) setMarketInsightData(data.value as typeof DEFAULT_MARKET_INSIGHT_DATA);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('saved_vendors').select('vendor_id').eq('customer_id', user.id).is('contractor_id', null)
      .then(({ data }) => setSaved((data ?? []).map((r: any) => r.vendor_id).filter(Boolean)));
  }, [user]);

  useEffect(() => {
    async function fetchVendors() {
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select(`
            id, company_name, tagline, city, country, rating, review_count,
            projects_completed, response_time, response_time_hours,
            hourly_rate, monthly_rate, monthly_rate_min, monthly_rate_max,
            employee_count, is_verified, business_type, tech_stack,
            service_categories, industry_focus, ir35_compliant, referral_count,
            availability_status, availability_from
          `)
          .eq('is_blacklisted', false)
          .order('rating', { ascending: false });

        if (error) throw error;

        const mapped: Vendor[] = (data || []).map((v: any) => {
          const techStack: string[] = Array.isArray(v.tech_stack) ? v.tech_stack.map(String) : [];
          const availability: Availability =
            v.availability_status === 'engaged' || v.availability_status === 'booked' ? 'booked'
            : v.availability_status === 'limited' ? 'limited'
            : 'available';
          return {
            id: v.id,
            name: v.company_name,
            city: v.city || '',
            country: v.country || 'UK',
            type: v.business_type ? BUSINESS_TYPE_LABEL[v.business_type] ?? null : null,
            verified: v.is_verified,
            rating: v.rating || 0,
            reviewCount: v.review_count || 0,
            engagements: v.projects_completed || 0,
            responseTime: v.response_time_hours ? `${v.response_time_hours}hrs` : (v.response_time || '24hrs'),
            tagline: v.tagline || '',
            techStack,
            monthlyRate: v.monthly_rate_min || v.monthly_rate || v.hourly_rate || 0,
            availability,
            availableFrom: v.availability_from ? new Date(v.availability_from).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : undefined,
            ir35: !!v.ir35_compliant,
            referrals: v.referral_count || 0,
            service_categories: Array.isArray(v.service_categories) ? v.service_categories.map(String) : [],
            tech_stack: techStack,
            industry_focus: Array.isArray(v.industry_focus) ? v.industry_focus.map(String) : [],
          };
        });

        setDbVendors(mapped);
      } catch {
        setDbVendors([]);
      } finally {
        setLoadingVendors(false);
      }
    }
    fetchVendors();
  }, []);

  /* Apply filters */
  const applyFilters = () => {
    const p = new URLSearchParams(searchParams);
    if (filters.types.length === 1) p.set('type', filters.types[0].toLowerCase().replace(' ', ''));
    else p.delete('type');
    if (filters.location) p.set('location', filters.location);
    else p.delete('location');
    setSearchParams(p);
  };

  const clearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setSearchParams({});
  };

  const toggleFilter = <K extends keyof Filters>(key: K, value: string) => {
    setFilters(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  /* Compute results */
  let results = dbVendors.map(v => ({
    ...v,
    match_score: calculateMatchScore(v, query, typeParam),
  })).filter(v => {
    if (filters.verifiedOnly && !v.verified) return false;
    if (filters.availableNow && v.availability !== 'available') return false;
    if (filters.ir35Only && !v.ir35) return false;
    if (filters.types.length > 0 && (!v.type || !filters.types.includes(v.type))) return false;
    if (filters.rateMin && v.monthlyRate < parseInt(filters.rateMin)) return false;
    if (filters.rateMax && v.monthlyRate > parseInt(filters.rateMax)) return false;
    if (query && !v.name.toLowerCase().includes(query.toLowerCase()) && !v.tagline.toLowerCase().includes(query.toLowerCase()) && !v.techStack.some(t => t.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  if (sort === 'best') results = [...results].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  else if (sort === 'rating') results = [...results].sort((a, b) => b.rating - a.rating);
  else if (sort === 'reviews') results = [...results].sort((a, b) => b.reviewCount - a.reviewCount);
  else if (sort === 'rate') results = [...results].sort((a, b) => a.monthlyRate - b.monthlyRate);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) return prev; // toast would go here
      return [...prev, id];
    });
  };

  const toggleSaved = async (id: string) => {
    const alreadySaved = saved.includes(id);
    setSaved(prev => alreadySaved ? prev.filter(x => x !== id) : [...prev, id]);
    if (!user) return;
    if (alreadySaved) {
      await supabase.from('saved_vendors').delete().eq('customer_id', user.id).eq('vendor_id', id).is('contractor_id', null);
    } else {
      await supabase.from('saved_vendors').insert({ customer_id: user.id, vendor_id: id });
    }
  };

  const FilterPanel = () => (
    <div className="space-y-0">
      {/* Toggles at top */}
      <div className="py-4 border-b border-gray-100 space-y-3">
        {[
          { key: 'verifiedOnly', label: 'Collabov Verified only' },
          { key: 'availableNow', label: 'Available now' },
          { key: 'ir35Only', label: 'IR35 Compliant' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-700">{label}</span>
            <div
              onClick={() => setFilters(prev => ({ ...prev, [key]: !prev[key as keyof Filters] }))}
              className={`relative w-9 h-5 rounded-full transition-colors ${filters[key as keyof Filters] ? 'bg-[#0070F3]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${filters[key as keyof Filters] ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </label>
        ))}
      </div>

      <AccordionGroup title="Vendor Type">
        <div className="space-y-2">
          {VENDOR_TYPES.map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.types.includes(t)} onChange={() => toggleFilter('types', t)} className="w-4 h-4 text-[#0070F3] rounded border-gray-300" />
              <span className="text-sm text-gray-600">{t}</span>
            </label>
          ))}
        </div>
      </AccordionGroup>

      <AccordionGroup title="Service Category">
        <div className="space-y-2">
          {SERVICE_CATS.map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.services.includes(s)} onChange={() => toggleFilter('services', s)} className="w-4 h-4 text-[#0070F3] rounded border-gray-300" />
              <span className="text-sm text-gray-600">{s}</span>
            </label>
          ))}
        </div>
      </AccordionGroup>

      <AccordionGroup title="Location">
        <input
          type="text" value={filters.location} onChange={e => setFilters(p => ({ ...p, location: e.target.value }))}
          placeholder="Country or city"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
        />
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input type="checkbox" checked={filters.remoteOnly} onChange={() => setFilters(p => ({ ...p, remoteOnly: !p.remoteOnly }))} className="w-4 h-4 text-[#0070F3] rounded border-gray-300" />
          <span className="text-sm text-gray-600">Remote-friendly</span>
        </label>
      </AccordionGroup>

      <AccordionGroup title="Monthly Rate">
        <div className="flex gap-2">
          <input type="number" value={filters.rateMin} onChange={e => setFilters(p => ({ ...p, rateMin: e.target.value }))}
            placeholder="From £" className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
          <input type="number" value={filters.rateMax} onChange={e => setFilters(p => ({ ...p, rateMax: e.target.value }))}
            placeholder="To £" className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
        </div>
      </AccordionGroup>

      <AccordionGroup title="Team Size">
        <div className="space-y-2">
          {TEAM_SIZES.map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.teamSizes.includes(s)} onChange={() => toggleFilter('teamSizes', s)} className="w-4 h-4 text-[#0070F3] rounded border-gray-300" />
              <span className="text-sm text-gray-600">{s}</span>
            </label>
          ))}
        </div>
      </AccordionGroup>

      <div className="pt-4 space-y-2">
        <button onClick={applyFilters} className="w-full py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
          Apply Filters
        </button>
        <button onClick={clearFilters} className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1">
          Clear All Filters
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-6">
        {/* Mobile filter button */}
        <div className="lg:hidden mb-4">
          <button onClick={() => setShowMobileFilters(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-20">
              <h3 className="font-bold text-[#0B2D59] mb-1">Filters</h3>
              <FilterPanel />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Market Insight Strip */}
            {!insightDismissed && (() => {
              const insightKey = typeParam
                ? typeParam.toLowerCase().replace(/\s+/g, '+')
                : query.toLowerCase().replace(/\s+/g, '+');
              const insight = marketInsightData[insightKey];
              return (
                <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100 rounded-xl p-5 mb-6 relative">
                  <button
                    onClick={() => setInsightDismissed(true)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {insight ? (
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pr-6">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-[#0070F3] flex-shrink-0" />
                          <span className="font-semibold text-[#0B2D59] text-sm">{insight.rate}</span>
                        </div>
                        <p className="text-sm text-blue-700 ml-7">{insight.demand}</p>
                        <p className="text-sm text-blue-700 ml-7">{results.length} verified vendor{results.length === 1 ? '' : 's'} match your search</p>
                      </div>
                      <p className="text-sm text-gray-600 italic lg:max-w-xs">{insight.tip}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pr-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-[#0070F3] flex-shrink-0" />
                        <span className="text-sm text-blue-700 font-medium">{results.length} verified vendor{results.length === 1 ? '' : 's'} match your search</span>
                      </div>
                      <p className="text-sm text-gray-600 italic">Market data not available for this specific query — filter by service category for benchmark rates.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Loading state */}
            {loadingVendors && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-[#0070F3]" size={32} />
              </div>
            )}

            {/* Results header */}
            {!loadingVendors && <div className="flex items-center justify-between mb-4">
              <h1 className="font-bold text-gray-900">
                <span className="text-[#0070F3]">{results.length}</span> verified vendors
                {query ? <span> for "<span className="italic">{query}</span>"</span> : ''}
                {locationParam ? <span> in {locationParam}</span> : ''}
              </h1>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Sort by</label>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]">
                  <option value="best">Best Match</option>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="rate">Lowest Rate</option>
                  <option value="recent">Recently Joined</option>
                </select>
              </div>
            </div>}

            {/* Cards grid */}
            {!loadingVendors && <>
            {results.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No verified vendors match your current filters.</h3>
                <p className="text-gray-500 mb-4">Try removing some filters or broadening your search.</p>
                <button onClick={clearFilters} className="text-[#0070F3] font-medium hover:underline text-sm">Clear all filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {results.map(vendor => {
                  const { initials, colour } = initialsAvatar(vendor.name);
                  const avail = AVAIL_CONFIG[vendor.availability];
                  const isSaved = saved.includes(vendor.id);
                  const isComparing = compareIds.includes(vendor.id);
                  const extraTech = vendor.techStack.length > 5 ? vendor.techStack.length - 5 : 0;

                  return (
                    <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                      {/* Row 1 — Identity */}
                      <div className="flex items-start gap-3">
                        <div className={`w-14 h-14 rounded-lg ${colour} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#0B2D59]">{vendor.name}</span>
                            {vendor.verified && (
                              <span className="flex items-center gap-1 text-xs text-[#0070F3] font-medium">
                                <ShieldCheck className="h-3.5 w-3.5" /> Verified
                              </span>
                            )}
                            {vendor.match_score !== undefined && vendor.match_score > 0 && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                vendor.match_score >= 70 ? 'bg-green-100 text-green-700' :
                                vendor.match_score >= 40 ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {vendor.match_score >= 70 ? 'Strong match' : vendor.match_score >= 40 ? 'Good match' : 'Partial match'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{vendor.city}, {vendor.country}</div>
                        </div>
                        {vendor.type && (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${TYPE_COLOURS[vendor.type]}`}>
                            {vendor.type}
                          </span>
                        )}
                      </div>

                      {/* Row 2 — Rating */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                        {vendor.reviewCount > 0 ? (
                          <>
                            <Stars rating={vendor.rating} />
                            <span className="font-bold text-gray-700">{vendor.rating}</span>
                            <span>({vendor.reviewCount} reviews)</span>
                            <span>·</span>
                            <span>{vendor.engagements} engagements</span>
                            <span>·</span>
                            <span>Responds within {vendor.responseTime}</span>
                          </>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">New on Collabov</span>
                        )}
                      </div>

                      {/* Row 3 — Referrals */}
                      {vendor.referrals > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-teal-700 font-medium">
                          <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                          {vendor.referrals} referrals verified
                        </div>
                      )}

                      {/* Row 4 — Tagline */}
                      <p className="text-sm text-gray-600 truncate">{vendor.tagline}</p>

                      {/* Row 5 — Tech stack */}
                      <div className="flex flex-wrap gap-1.5">
                        {vendor.techStack.slice(0, 5).map(t => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{t}</span>
                        ))}
                        {extraTech > 0 && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">+{extraTech} more</span>
                        )}
                      </div>

                      {/* Row 6 — Rate + availability */}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0B2D59]">From £{vendor.monthlyRate.toLocaleString()}/month</span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                          <span className={`w-2 h-2 rounded-full ${avail.dot}`} />
                          {vendor.availability === 'limited' && vendor.availableFrom
                            ? `Available from ${vendor.availableFrom}`
                            : avail.label}
                        </span>
                      </div>

                      {/* Row 7 — Actions */}
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                        <Link to={`/vendor/profile/${vendor.id}`} className="flex-1 py-2 text-center bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                          View Profile
                        </Link>
                        <button
                          onClick={() => user ? undefined : navigate(`/signin?returnUrl=/results`)}
                          className="flex-1 py-2 text-center border border-[#0070F3] text-[#0070F3] text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Request Proposal
                        </button>
                        <button onClick={() => toggleSaved(vendor.id)} className="p-2 text-gray-400 hover:text-[#0070F3] transition-colors">
                          {isSaved ? <BookmarkCheck className="h-5 w-5 text-[#0070F3]" /> : <Bookmark className="h-5 w-5" />}
                        </button>
                        <label className="flex items-center gap-1 cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                          <input type="checkbox" checked={isComparing} onChange={() => toggleCompare(vendor.id)} className="sr-only" />
                          {isComparing ? <CheckSquare className="h-4 w-4 text-[#0070F3]" /> : <Square className="h-4 w-4" />}
                          Compare
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {results.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Previous</button>
                {[1, 2, 3].map(p => (
                  <button key={p} className={`px-3 py-2 text-sm rounded-lg ${p === 1 ? 'bg-[#0070F3] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))}
                <button className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Next</button>
              </div>
            )}
            </>}
          </div>
        </div>
      </div>

      {/* Compare bar */}
      {compareIds.length >= 2 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg z-40 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {compareIds.map(id => {
              const v = dbVendors.find(x => x.id === id);
              if (!v) return null;
              const { initials, colour } = initialsAvatar(v.name);
              return (
                <div key={id} className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full ${colour} flex items-center justify-center text-white text-xs font-bold`}>{initials}</div>
                  <span className="text-sm font-medium text-gray-700 hidden md:block">{v.name}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4">
            <Link
              to={`/compare?ids=${compareIds.join(',')}`}
              className="px-5 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Compare ({compareIds.length}) Vendors
            </Link>
            <button onClick={() => setCompareIds([])} className="text-sm text-gray-400 hover:text-gray-600">Clear All</button>
          </div>
        </div>
      )}

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
