import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';

const PACKAGES = [
  { id: '1', title: 'Software Development Sprint (6 weeks)', vendor: 'TechPro Solutions', category: 'Software Development', price: '£8,500', priceType: 'fixed', duration: '6 weeks', tags: ['React', 'Node.js', 'PostgreSQL'], included: ['Discovery & architecture', 'UI/UX design', '2 development sprints', 'QA & testing', 'Deployment & handover'] },
  { id: '2', title: 'Managed IT Support', vendor: 'CloudBridge MSP', category: 'Managed IT', price: '£1,200', priceType: 'monthly', duration: 'Monthly retainer', tags: ['Azure', 'Microsoft 365', '24/7 monitoring'], included: ['Infrastructure monitoring', 'Helpdesk support', 'Security patching', 'Monthly reporting'] },
  { id: '3', title: 'Cybersecurity Audit & Report', vendor: 'CyberShield MSP', category: 'Cybersecurity', price: '£3,500', priceType: 'fixed', duration: '2 weeks', tags: ['Penetration Testing', 'ISO 27001', 'GDPR'], included: ['Vulnerability assessment', 'Penetration test', 'Risk register', 'Remediation roadmap'] },
  { id: '4', title: 'Cloud Migration Assessment', vendor: 'DevForge Agency', category: 'Cloud & Infrastructure', price: '£4,200', priceType: 'fixed', duration: '2 weeks', tags: ['AWS', 'Azure', 'Terraform'], included: ['Current state analysis', 'Cloud readiness report', 'Migration strategy', 'Cost model'] },
  { id: '5', title: 'Dedicated React Developer', vendor: 'NexGen IT', category: 'Staff Augmentation', price: '£2,400', priceType: 'monthly', duration: 'Monthly', tags: ['React', 'TypeScript', 'Next.js'], included: ['Senior developer', 'Daily standups', 'Sprint participation', 'Code reviews'] },
  { id: '6', title: 'E-commerce Platform Build', vendor: 'TechPro Solutions', category: 'Software Development', price: '£12,000', priceType: 'fixed', duration: '10 weeks', tags: ['React', 'Node.js', 'Stripe', 'AWS'], included: ['Discovery & design', 'Frontend & backend', 'Payments integration', 'QA & deployment'] },
  { id: '7', title: 'DevOps Setup & CI/CD Pipeline', vendor: 'DevForge Agency', category: 'DevOps', price: '£5,800', priceType: 'fixed', duration: '3 weeks', tags: ['Docker', 'Kubernetes', 'GitHub Actions', 'AWS'], included: ['Docker containerisation', 'CI/CD pipeline', 'Monitoring setup', 'Documentation'] },
  { id: '8', title: 'QA & Testing Sprint (4 weeks)', vendor: 'TechPro Solutions', category: 'QA & Testing', price: '£4,500', priceType: 'fixed', duration: '4 weeks', tags: ['Cypress', 'Jest', 'Playwright'], included: ['Test strategy', 'Automated test suite', 'Manual QA', 'Bug report & fix verification'] },
];

const CATEGORIES = ['All', 'Software Development', 'Managed IT', 'Cybersecurity', 'Cloud & Infrastructure', 'Staff Augmentation', 'DevOps', 'QA & Testing'];

const PackagesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = PACKAGES.filter(p =>
    (category === 'All' || p.category === category) &&
    (search === '' || p.title.toLowerCase().includes(search.toLowerCase()) || p.vendor.toLowerCase().includes(search.toLowerCase()))
  );

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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow">
              <span className="text-xs bg-blue-50 text-[#0070F3] font-semibold px-2.5 py-1 rounded-full w-fit mb-3">{pkg.category}</span>
              <h3 className="font-bold text-[#0B2D59] text-sm mb-1">{pkg.title}</h3>
              <div className="text-xs text-gray-400 mb-3">by {pkg.vendor}</div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-[#0070F3]">{pkg.price}</span>
                <span className="text-xs text-gray-400">{pkg.priceType === 'monthly' ? '/month' : 'fixed'}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{pkg.duration}</span>
              </div>
              <ul className="space-y-1.5 mb-4 flex-1">
                {pkg.included.slice(0, 3).map(i => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0070F3] flex-shrink-0" />{i}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1 mb-4">
                {pkg.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>)}
              </div>
              <Link to={`/vendor/profile/1`} className="flex items-center justify-center gap-1 w-full py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                View Package <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">No packages match your search.</div>
        )}
      </div>
    </div>
  );
};

export default PackagesPage;
