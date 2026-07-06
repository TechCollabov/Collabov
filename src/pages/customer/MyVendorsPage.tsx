import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, RefreshCw, MessageSquare, ExternalLink, X, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  name: string;
  title: string;
  available: boolean;
  note?: string;
}

interface Vendor {
  id: string;
  company_name: string;
  business_type: 'agency' | 'msp' | 'staffaug';
  country: string;
  rating: number;
  reviews: number;
  last_engagement: string;
  last_engagement_status: 'active' | 'completed' | 'invited';
  last_engagement_value: number;
  engagement_count: number;
  available: boolean;
  rehire_eligible: boolean;
  termination_reason: string | null;
  employees: Employee[];
}

// ─── DB row types ─────────────────────────────────────────────────────────────

interface SavedVendorRow {
  id: string;
  vendor_id: string | null;
  contractor_id: string | null;
  vendors: {
    id: string;
    company_name: string | null;
    logo_url: string | null;
    rating: number | null;
    country: string | null;
    business_type: string | null;
  } | null;
}

interface EngagementRow {
  id: string;
  project_title: string | null;
  status: string | null;
  total_value: number | null;
  vendor_id: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function statusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Active
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Completed
        </span>
      );
    case 'invited':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          Invited
        </span>
      );
    default:
      return null;
  }
}

/** Maps the real engagements.status enum onto this page's 3-way filter. */
function mapEngagementStatus(status: string | null): 'active' | 'completed' | 'invited' {
  if (status === 'active') return 'active';
  if (status === 'closing' || status === 'closed' || status === 'terminated') return 'completed';
  return 'invited'; // pending_signature, pending_ir35
}

function typePill(type: string) {
  const label =
    type === 'agency' ? 'IT Agency' : type === 'msp' ? 'MSP' : 'Staff Aug';
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#0B2D59]/10 text-[#0B2D59]">
      {label}
    </span>
  );
}

// ─── Re-hire Modal ────────────────────────────────────────────────────────────

interface RehireModalProps {
  vendor: Vendor;
  onClose: () => void;
}

function RehireModal({ vendor, onClose }: RehireModalProps) {
  const navigate = useNavigate();
  const [option, setOption] = useState<'new' | 'template'>('new');

  function handleBegin() {
    if (option === 'new') {
      // New proposal request: opens the vendor profile with the RFP modal path.
      navigate(`/vendor/profile/${vendor.id}`);
    } else {
      // Re-use the previous SOW as a template: wizard pre-populated, new engagement record.
      navigate(
        `/sow-wizard?vendorId=${vendor.id}&vendor=${encodeURIComponent(vendor.company_name)}` +
        `&type=${vendor.business_type}` +
        `&budget=${vendor.last_engagement_value}&project=${encodeURIComponent(vendor.last_engagement)}`
      );
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-[#0B2D59] mb-1">
          Re-hire {vendor.company_name}
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Choose how you'd like to proceed.
        </p>

        {/* Options */}
        <div className="space-y-3 mb-5">
          <label
            className={`flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${
              option === 'new'
                ? 'border-[#0070F3] bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="rehire-option"
              value="new"
              checked={option === 'new'}
              onChange={() => setOption('new')}
              className="mt-0.5 accent-[#0070F3]"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">New proposal request</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Pre-fills the RFP form with {vendor.company_name} pre-selected.
              </p>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${
              option === 'template'
                ? 'border-[#0070F3] bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="rehire-option"
              value="template"
              checked={option === 'template'}
              onChange={() => setOption('template')}
              className="mt-0.5 accent-[#0070F3]"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Use previous SOW as template
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Opens the SOW Wizard pre-populated with your previous engagement details.
              </p>
            </div>
          </label>
        </div>

        {/* Previous engagement summary (template option) */}
        {option === 'template' && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-sm">
            <p className="font-medium text-gray-700 mb-0.5">Previous engagement</p>
            <p className="text-gray-500">{vendor.last_engagement}</p>
            <p className="text-gray-500">
              Value: £{vendor.last_engagement_value.toLocaleString()}
            </p>
          </div>
        )}

        {/* Staff aug availability note */}
        {vendor.employees.length > 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            Check employee availability above before re-hiring.
          </p>
        )}

        <button
          onClick={handleBegin}
          className="w-full bg-[#0070F3] text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-600 transition-colors"
        >
          Begin Re-hire
        </button>
      </div>
    </div>
  );
}

// ─── Vendor Card ──────────────────────────────────────────────────────────────

interface VendorCardProps {
  vendor: Vendor;
  onRehire: (vendor: Vendor) => void;
}

function VendorCard({ vendor, onRehire }: VendorCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
      {/* Row 1: Identity */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-[#0B2D59] text-white flex items-center justify-center font-bold text-sm shrink-0">
          {getInitials(vendor.company_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900">{vendor.company_name}</span>
            {typePill(vendor.business_type)}
            {vendor.country && <span className="text-xs text-gray-400">{vendor.country}</span>}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium text-gray-700">{vendor.rating.toFixed(1)}</span>
            {vendor.reviews > 0 && (
              <span className="text-xs text-gray-400">({vendor.reviews} reviews)</span>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Engagement info */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-gray-600">
        <span className="font-medium text-gray-800">{vendor.last_engagement}</span>
        {statusBadge(vendor.last_engagement_status)}
        {vendor.last_engagement_value > 0 && (
          <>
            <span className="text-gray-400">·</span>
            <span>£{vendor.last_engagement_value.toLocaleString()}</span>
          </>
        )}
        <span className="text-gray-400">·</span>
        <span>
          {vendor.engagement_count} engagement{vendor.engagement_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Row 3: Employee availability (staff aug) */}
      {vendor.employees.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Assigned staff
          </p>
          {vendor.employees.map((emp) => (
            <div key={emp.name} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                  emp.available ? 'bg-green-400' : 'bg-amber-400'
                }`}
              />
              <div>
                <span className="font-medium text-gray-800">{emp.name}</span>
                <span className="text-gray-500"> · {emp.title}</span>
                {!emp.available && emp.note && (
                  <p className="text-xs text-amber-600">{emp.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Row 4: Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onRehire(vendor)}
          className="bg-[#0070F3] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Start New Engagement
        </button>
        <Link
          to={`/sow-wizard?vendor=${encodeURIComponent(vendor.company_name)}&template=previous`}
          className="border border-[#0070F3] text-[#0070F3] rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          Use Previous SOW as Template
        </Link>
        <Link
          to="/messages"
          className="border border-gray-200 text-gray-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Send Message
        </Link>
        <Link
          to={`/vendor/profile/${vendor.id}`}
          className="text-sm text-[#0070F3] hover:underline flex items-center gap-1 ml-1"
        >
          View Profile
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'active' | 'completed' | 'invited';

export default function MyVendorsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [rehireVendor, setRehireVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchVendors() {
      setLoading(true);
      try {
        // 1. Fetch saved_vendors joined with vendors table
        const { data: savedData, error: savedError } = await supabase
          .from('saved_vendors')
          .select('id, vendor_id, contractor_id, vendors(id, company_name, logo_url, rating, country, business_type)')
          .eq('customer_id', user!.id);

        if (savedError) throw savedError;

        const saved = (savedData ?? []) as unknown as SavedVendorRow[];

        // Collect vendor IDs
        const vendorIds = saved
          .map((s) => s.vendor_id)
          .filter((id): id is string => !!id);

        // 2. Fetch engagements for this buyer with a vendor assigned (the canonical lifecycle table)
        const { data: engagementsData } = await supabase
          .from('engagements')
          .select('id, project_title, status, total_value, vendor_id')
          .eq('buyer_id', user!.id)
          .not('vendor_id', 'is', null)
          .order('created_at', { ascending: false });

        const engagements = (engagementsData ?? []) as EngagementRow[];

        // Build a map: vendor_id -> most recent engagement
        const engagementByVendor = new Map<string, EngagementRow>();
        for (const e of engagements) {
          if (e.vendor_id && !engagementByVendor.has(e.vendor_id)) {
            engagementByVendor.set(e.vendor_id, e);
          }
        }

        // Count engagements per vendor
        const engagementCount = new Map<string, number>();
        for (const e of engagements) {
          if (e.vendor_id) {
            engagementCount.set(e.vendor_id, (engagementCount.get(e.vendor_id) ?? 0) + 1);
          }
        }

        // Build Vendor objects from saved_vendors
        const built: Vendor[] = saved
          .filter((s) => s.vendors)
          .map((s) => {
            const v = s.vendors!;
            const vendorId = v.id;
            const engagement = engagementByVendor.get(vendorId);
            const engStatus = mapEngagementStatus(engagement?.status ?? null);

            return {
              id: vendorId,
              company_name: v.company_name ?? 'Unknown Vendor',
              business_type: (v.business_type as Vendor['business_type']) ?? 'agency',
              country: v.country ?? '',
              rating: v.rating ?? 0,
              reviews: 0,
              last_engagement: engagement?.project_title ?? 'No engagement yet',
              last_engagement_status: engStatus,
              last_engagement_value: engagement?.total_value ?? 0,
              engagement_count: engagementCount.get(vendorId) ?? 0,
              available: true,
              rehire_eligible: engStatus === 'completed',
              termination_reason: null,
              employees: [],
            };
          });

        // Also include vendors from engagements that aren't in saved_vendors
        const missingVendorIds = Array.from(
          new Set(engagements.filter((e) => e.vendor_id && !vendorIds.includes(e.vendor_id)).map((e) => e.vendor_id as string))
        );
        if (missingVendorIds.length > 0) {
          const { data: vendorsData } = await supabase
            .from('vendors')
            .select('id, company_name, logo_url, rating, country, business_type')
            .in('id', missingVendorIds);

          for (const vData of vendorsData ?? []) {
            const engagement = engagementByVendor.get(vData.id);
            const engStatus = mapEngagementStatus(engagement?.status ?? null);

            built.push({
              id: vData.id,
              company_name: vData.company_name ?? 'Unknown Vendor',
              business_type: (vData.business_type as Vendor['business_type']) ?? 'agency',
              country: vData.country ?? '',
              rating: vData.rating ?? 0,
              reviews: 0,
              last_engagement: engagement?.project_title ?? 'No engagement yet',
              last_engagement_status: engStatus,
              last_engagement_value: engagement?.total_value ?? 0,
              engagement_count: engagementCount.get(vData.id) ?? 1,
              available: true,
              rehire_eligible: engStatus === 'completed',
              termination_reason: null,
              employees: [],
            });
          }
        }

        setVendors(built);
      } catch (err) {
        console.error('MyVendorsPage fetch error:', err);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    }

    fetchVendors();
  }, [user]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'invited', label: 'Invited' },
  ];

  const filtered =
    activeTab === 'all'
      ? vendors
      : vendors.filter((v) => v.last_engagement_status === activeTab);

  const rehirePromptVendors = vendors.filter(
    (v) => v.last_engagement_status === 'completed' && v.rehire_eligible
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">
            Verified partners you've worked with on Collabov
          </p>
        </div>

        {/* 30-day re-hire prompts */}
        {rehirePromptVendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 flex items-center gap-3"
          >
            <RefreshCw className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 flex-1">
              <span className="font-medium">{vendor.company_name}</span> is available —
              re-hire them for your next project?
            </p>
            <button
              onClick={() => setRehireVendor(vendor)}
              className="text-sm font-semibold text-[#0070F3] hover:underline whitespace-nowrap"
            >
              Start Re-hire →
            </button>
          </div>
        ))}

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#0B2D59] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Vendor list */}
        {vendors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <CheckCircle2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">
              You haven't worked with any vendors yet.
            </p>
            <p className="text-sm text-gray-400 mb-5">
              Find your first verified partner.
            </p>
            <button
              onClick={() => navigate('/results')}
              className="bg-[#0070F3] text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Find Vendors
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 text-sm">No vendors in this category.</p>
          </div>
        ) : (
          filtered.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} onRehire={setRehireVendor} />
          ))
        )}
      </div>

      {/* Re-hire modal */}
      {rehireVendor && (
        <RehireModal vendor={rehireVendor} onClose={() => setRehireVendor(null)} />
      )}
    </div>
  );
}
