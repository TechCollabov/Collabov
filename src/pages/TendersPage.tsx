import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Clock, Building2, DollarSign, ChevronDown } from 'lucide-react';

const TENDERS = [
  {
    id: '1',
    title: 'Cloud Infrastructure Modernisation',
    company: 'FinEdge Capital',
    companyType: 'Financial Services',
    category: 'Cloud & Infrastructure',
    budget: '£40,000–£70,000',
    timeline: '4 months',
    deadline: '22 Apr 2026',
    description: 'We are seeking an experienced MSP or IT agency to migrate our on-premise infrastructure to AWS. The engagement covers architecture design, phased migration of 12 legacy services, disaster recovery setup, and handover documentation.',
    skills: ['AWS', 'Terraform', 'Linux', 'Docker'],
    proposals: 6,
    posted: '2 days ago',
  },
  {
    id: '2',
    title: 'React Native Mobile App (iOS & Android)',
    company: 'GreenPath Logistics',
    companyType: 'Logistics & Supply Chain',
    category: 'Software Development',
    budget: '£25,000–£45,000',
    timeline: '3 months',
    deadline: '30 Apr 2026',
    description: 'Build a driver-facing mobile app for real-time route optimisation, proof of delivery capture, and fleet management integration. The app must integrate with our existing REST API and support offline mode.',
    skills: ['React Native', 'TypeScript', 'REST API', 'iOS', 'Android'],
    proposals: 11,
    posted: '4 days ago',
  },
  {
    id: '3',
    title: 'ISO 27001 Implementation & Certification Support',
    company: 'MedCore Health',
    companyType: 'Healthcare',
    category: 'Cybersecurity',
    budget: '£18,000–£30,000',
    timeline: '6 months',
    deadline: '15 May 2026',
    description: 'We require a cybersecurity consultancy to guide us through full ISO 27001 certification. Scope includes gap analysis, ISMS documentation, staff training, internal audit, and pre-certification review.',
    skills: ['ISO 27001', 'GDPR', 'Risk Management', 'ISMS'],
    proposals: 4,
    posted: '1 week ago',
  },
  {
    id: '4',
    title: 'Microsoft 365 Tenant Migration & Managed Support',
    company: 'Brightstone Solicitors',
    companyType: 'Legal Services',
    category: 'Managed IT',
    budget: '£8,000–£15,000',
    timeline: '6 weeks',
    deadline: '5 May 2026',
    description: 'Migrate 80 users from Google Workspace to Microsoft 365 (Exchange Online, Teams, SharePoint). Ongoing managed IT support required post-migration at a monthly retainer.',
    skills: ['Microsoft 365', 'Azure AD', 'Exchange Online', 'SharePoint'],
    proposals: 9,
    posted: '3 days ago',
  },
  {
    id: '5',
    title: 'E-commerce Replatform — Shopify to Custom',
    company: 'LuxeHome Interiors',
    companyType: 'Retail & E-commerce',
    category: 'Software Development',
    budget: '£55,000–£90,000',
    timeline: '5 months',
    deadline: '10 May 2026',
    description: 'We outgrown Shopify and need a bespoke e-commerce platform built on Next.js with a headless CMS, Stripe payments, multi-warehouse inventory, and a B2B trade portal.',
    skills: ['Next.js', 'Stripe', 'Contentful', 'PostgreSQL', 'Node.js'],
    proposals: 7,
    posted: '5 days ago',
  },
  {
    id: '6',
    title: 'DevOps Transformation — Dedicated Team',
    company: 'TradePoint Exchange',
    companyType: 'Financial Technology',
    category: 'DevOps',
    budget: '£12,000/month',
    timeline: 'Ongoing',
    deadline: '1 May 2026',
    description: 'Looking for a dedicated DevOps team to own our CI/CD pipelines, Kubernetes cluster management, observability stack, and on-call rotation. Must have experience in high-availability fintech environments.',
    skills: ['Kubernetes', 'Terraform', 'GitHub Actions', 'Datadog', 'AWS'],
    proposals: 3,
    posted: '1 day ago',
  },
];

const CATEGORIES = ['All', 'Software Development', 'Managed IT', 'Cybersecurity', 'Cloud & Infrastructure', 'DevOps', 'QA & Testing'];
const BUDGETS = ['All', 'Under £10k', '£10k–£30k', '£30k–£60k', '£60k+'];

const TendersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [budget, setBudget] = useState('All');

  const filtered = TENDERS.filter(t =>
    (category === 'All' || t.category === category) &&
    (search === '' || t.title.toLowerCase().includes(search.toLowerCase()) || t.company.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-[#0B2D59] text-white py-14">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-3">Open Tenders</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">Browse live project briefs from UK businesses seeking verified IT vendors. Submit a proposal and win your next engagement.</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tenders..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0070F3] text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="appearance-none pl-3 pr-8 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0070F3] cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="appearance-none pl-3 pr-8 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0070F3] cursor-pointer"
              >
                {BUDGETS.map(b => <option key={b} value={b}>{b === 'All' ? 'All Budgets' : b}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-5">{filtered.length} tender{filtered.length !== 1 ? 's' : ''} found</div>

        {/* List */}
        <div className="space-y-4">
          {filtered.map(tender => (
            <div key={tender.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-50 text-[#0070F3] font-semibold px-2.5 py-1 rounded-full">{tender.category}</span>
                    <span className="text-xs text-gray-400">{tender.posted}</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#0B2D59] mb-1">{tender.title}</h2>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                    <Building2 className="h-4 w-4" />
                    <span>{tender.company}</span>
                    <span className="text-gray-300">·</span>
                    <span>{tender.companyType}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">{tender.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tender.skills.map(s => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="lg:w-52 flex flex-col gap-4 lg:text-right">
                  <div className="space-y-2">
                    <div className="flex lg:flex-col items-center lg:items-end gap-3 lg:gap-1">
                      <div className="flex items-center gap-1 text-[#0070F3] font-bold text-lg">
                        <DollarSign className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{tender.budget}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{tender.timeline}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">Deadline: <span className="font-medium text-gray-600">{tender.deadline}</span></div>
                    <div className="text-xs text-gray-400">{tender.proposals} proposal{tender.proposals !== 1 ? 's' : ''} received</div>
                  </div>
                  <Link
                    to={`/signin?returnUrl=/tenders/${tender.id}`}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit Proposal <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button className="py-2 px-4 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    View Brief
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">No tenders match your search.</div>
        )}
      </div>
    </div>
  );
};

export default TendersPage;
