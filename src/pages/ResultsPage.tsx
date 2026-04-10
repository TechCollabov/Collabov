import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Star, ShieldCheck, Bookmark, BookmarkCheck, X, Filter,
  ChevronDown, ChevronUp, ArrowRight, CheckSquare, Square
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/* ── Types ── */
type VendorType = 'MSP' | 'Agency' | 'Dedicated Team' | 'Staff Aug';
type Availability = 'available' | 'limited' | 'booked';

interface Vendor {
  id: string;
  name: string;
  city: string;
  country: string;
  type: VendorType;
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
}

/* ── Mock data ── */
const MOCK_VENDORS: Vendor[] = [
  { id: '1', name: 'TechPro Solutions', city: 'Warsaw', country: 'Poland', type: 'Agency', verified: true, rating: 4.8, reviewCount: 47, engagements: 23, responseTime: '4 hrs', tagline: 'Full-stack React and Node.js agency specialising in fintech and SaaS platforms', techStack: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'TypeScript'], monthlyRate: 3200, availability: 'available', ir35: true },
  { id: '2', name: 'CloudBridge MSP', city: 'London', country: 'UK', type: 'MSP', verified: true, rating: 4.6, reviewCount: 31, engagements: 15, responseTime: '2 hrs', tagline: 'Enterprise-grade managed IT services for UK SMEs — 24/7 monitoring and support', techStack: ['Azure', 'Microsoft 365', 'Intune', 'Cisco', 'SentinelOne'], monthlyRate: 2800, availability: 'available', ir35: true },
  { id: '3', name: 'DevForge Agency', city: 'Bucharest', country: 'Romania', type: 'Agency', verified: true, rating: 4.9, reviewCount: 62, engagements: 38, responseTime: '6 hrs', tagline: 'Bespoke software development for e-commerce and marketplace platforms', techStack: ['Python', 'Django', 'React', 'AWS', 'Docker'], monthlyRate: 2400, availability: 'limited', availableFrom: 'May 2026', ir35: false },
  { id: '4', name: 'ScaleTeam UK', city: 'Manchester', country: 'UK', type: 'Dedicated Team', verified: true, rating: 4.7, reviewCount: 19, engagements: 11, responseTime: '3 hrs', tagline: 'Dedicated developers and QA engineers available on a monthly basis for product teams', techStack: ['Java', 'Spring Boot', 'Kubernetes', 'GCP', 'Terraform'], monthlyRate: 4500, availability: 'available', ir35: true },
  { id: '5', name: 'NexGen IT', city: 'Kraków', country: 'Poland', type: 'Staff Aug', verified: true, rating: 4.5, reviewCount: 28, engagements: 17, responseTime: '8 hrs', tagline: 'Staff augmentation for UK tech companies — vetted senior engineers on demand', techStack: ['.NET', 'Azure', 'TypeScript', 'Angular', 'SQL Server'], monthlyRate: 2600, availability: 'available', ir35: true },
  { id: '6', name: 'CyberShield MSP', city: 'Edinburgh', country: 'UK', type: 'MSP', verified: true, rating: 4.4, reviewCount: 12, engagements: 8, responseTime: '1 hr', tagline: 'Cybersecurity-focused MSP for financial services and healthcare organisations', techStack: ['CrowdStrike', 'Splunk', 'AWS', 'Palo Alto', 'ISO 27001'], monthlyRate: 3800, availability: 'limited', availableFrom: 'June 2026', ir35: true },
  { id: '7', name: 'FlowCode Labs', city: 'Kyiv', country: 'Ukraine', type: 'Agency', verified: false, rating: 0, reviewCount: 0, engagements: 0, responseTime: '12 hrs', tagline: 'Mobile-first development agency specialising in React Native and Flutter applications', techStack: ['React Native', 'Flutter', 'Firebase', 'Node.js', 'GraphQL'], monthlyRate: 1800, availability: 'available', ir35: false },
  { id: '8', name: 'DataPulse Analytics', city: 'Birmingham', country: 'UK', type: 'Agency', verified: true, rating: 4.3, reviewCount: 9, engagements: 5, responseTime: '5 hrs', tagline: 'Data engineering and analytics agency — pipelines, dashboards, and BI for growth companies', techStack: ['Python', 'dbt', 'Snowflake', 'Tableau', 'AWS'], monthlyRate: 4200, availability: 'booked', ir35: true },
];

const TYPE_COLOURS: Record<VendorType, string> = {
  'MSP': 'bg-blue-100 text-blue-700',
  'Agency': 'bg-green-100 text-green-700',
  'Dedicated Team': 'bg-purple-100 text-purple-700',
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
const VENDOR_TYPES: VendorType[] = ['MSP', 'Agency', 'Dedicated Team', 'Staff Aug'];

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
    types: typeParam ? [typeParam.toUpperCase() as VendorType] : [],
    location: locationParam,
  });
  const [sort, setSort] = useState('best');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [insightDismissed, setInsightDismissed] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
  let results = MOCK_VENDORS.filter(v => {
    if (filters.verifiedOnly && !v.verified) return false;
    if (filters.availableNow && v.availability !== 'available') return false;
    if (filters.ir35Only && !v.ir35) return false;
    if (filters.types.length > 0 && !filters.types.some(t => v.type.toLowerCase().includes(t.toLowerCase()))) return false;
    if (filters.rateMin && v.monthlyRate < parseInt(filters.rateMin)) return false;
    if (filters.rateMax && v.monthlyRate > parseInt(filters.rateMax)) return false;
    if (query && !v.name.toLowerCase().includes(query.toLowerCase()) && !v.tagline.toLowerCase().includes(query.toLowerCase()) && !v.techStack.some(t => t.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  if (sort === 'rating') results = [...results].sort((a, b) => b.rating - a.rating);
  else if (sort === 'reviews') results = [...results].sort((a, b) => b.reviewCount - a.reviewCount);
  else if (sort === 'rate') results = [...results].sort((a, b) => a.monthlyRate - b.monthlyRate);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) return prev; // toast would go here
      return [...prev, id];
    });
  };

  const toggleSaved = (id: string) =>
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

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
            {!insightDismissed && (
              <div className="bg-[#EAF0FB] rounded-xl p-4 mb-4 relative">
                <button onClick={() => setInsightDismissed(true)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pr-6">
                  <div>
                    <div className="text-xs font-semibold text-blue-900">Avg. monthly rate</div>
                    <div className="text-sm text-blue-700 mt-0.5">£3,200–£4,800 {query ? `for ${query}` : ''}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-900">Demand this week</div>
                    <div className="text-sm text-blue-700 mt-0.5">High — 142 active buyers searching</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-900">Matching vendors</div>
                    <div className="text-sm text-blue-700 mt-0.5">{results.length} verified vendors match</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-900">Market insight</div>
                    <div className="text-sm text-blue-700 mt-0.5">Eastern European teams offer 38% cost saving vs UK onshore</div>
                  </div>
                </div>
              </div>
            )}

            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
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
            </div>

            {/* Cards grid */}
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
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{vendor.city}, {vendor.country}</div>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${TYPE_COLOURS[vendor.type]}`}>
                          {vendor.type}
                        </span>
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

                      {/* Row 3 — Tagline */}
                      <p className="text-sm text-gray-600 truncate">{vendor.tagline}</p>

                      {/* Row 4 — Tech stack */}
                      <div className="flex flex-wrap gap-1.5">
                        {vendor.techStack.slice(0, 5).map(t => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{t}</span>
                        ))}
                        {extraTech > 0 && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">+{extraTech} more</span>
                        )}
                      </div>

                      {/* Row 5 — Rate + availability */}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0B2D59]">From £{vendor.monthlyRate.toLocaleString()}/month</span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                          <span className={`w-2 h-2 rounded-full ${avail.dot}`} />
                          {vendor.availability === 'limited' && vendor.availableFrom
                            ? `Available from ${vendor.availableFrom}`
                            : avail.label}
                        </span>
                      </div>

                      {/* Row 6 — Actions */}
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
          </div>
        </div>
      </div>

      {/* Compare bar */}
      {compareIds.length >= 2 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg z-40 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {compareIds.map(id => {
              const v = MOCK_VENDORS.find(x => x.id === id);
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
