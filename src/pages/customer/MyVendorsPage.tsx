import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, RefreshCw, MessageSquare, ExternalLink, X, CheckCircle2 } from 'lucide-react';

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
  business_type: 'agency' | 'msp' | 'independent';
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

// ─── Mock data ────────────────────────────────────────────────────────────────

const MY_VENDORS: Vendor[] = [
  {
    id: 'v1',
    company_name: 'TechForge Solutions',
    business_type: 'agency',
    country: 'Poland',
    rating: 4.8,
    reviews: 23,
    last_engagement: 'Payment Gateway Rebuild',
    last_engagement_status: 'active',
    last_engagement_value: 32000,
    engagement_count: 2,
    available: true,
    rehire_eligible: true,
    termination_reason: null,
    employees: [
      { name: 'Aleksei Nowak', title: 'Senior Full-Stack Developer', available: true },
      {
        name: 'Karolina Wiśniewska',
        title: 'Lead DevOps Engineer',
        available: false,
        note: 'On another engagement until Aug 2026',
      },
    ],
  },
  {
    id: 'v2',
    company_name: 'CloudNorth MSP',
    business_type: 'msp',
    country: 'UK',
    rating: 4.6,
    reviews: 11,
    last_engagement: 'Infrastructure Management',
    last_engagement_status: 'active',
    last_engagement_value: 21600,
    engagement_count: 1,
    available: true,
    rehire_eligible: true,
    termination_reason: null,
    employees: [],
  },
  {
    id: 'v3',
    company_name: 'DevStream Ltd',
    business_type: 'agency',
    country: 'UK',
    rating: 4.3,
    reviews: 7,
    last_engagement: 'E-commerce Platform Redesign',
    last_engagement_status: 'completed',
    last_engagement_value: 18500,
    engagement_count: 1,
    available: true,
    rehire_eligible: true,
    termination_reason: null,
    employees: [],
  },
];

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

function typePill(type: string) {
  const label =
    type === 'agency' ? 'IT Agency' : type === 'msp' ? 'MSP' : 'Independent';
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
      navigate(`/sow-wizard?vendor=${encodeURIComponent(vendor.company_name)}`);
    } else {
      navigate(
        `/sow-wizard?vendor=${encodeURIComponent(vendor.company_name)}&template=previous`
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
            <span className="text-xs text-gray-400">{vendor.country}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium text-gray-700">{vendor.rating}</span>
            <span className="text-xs text-gray-400">({vendor.reviews} reviews)</span>
          </div>
        </div>
      </div>

      {/* Row 2: Engagement info */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-gray-600">
        <span className="font-medium text-gray-800">{vendor.last_engagement}</span>
        {statusBadge(vendor.last_engagement_status)}
        <span className="text-gray-400">·</span>
        <span>£{vendor.last_engagement_value.toLocaleString()}</span>
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
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [rehireVendor, setRehireVendor] = useState<Vendor | null>(null);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'invited', label: 'Invited' },
  ];

  const filtered =
    activeTab === 'all'
      ? MY_VENDORS
      : MY_VENDORS.filter((v) => v.last_engagement_status === activeTab);

  // Vendors with completed engagements within 30 days (mock: DevStream)
  const rehirePromptVendors = MY_VENDORS.filter(
    (v) => v.last_engagement_status === 'completed' && v.rehire_eligible
  );

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
        {filtered.length === 0 ? (
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
              Search Vendors
            </button>
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
