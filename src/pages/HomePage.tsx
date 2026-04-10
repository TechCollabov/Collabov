import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import cities from 'cities.json';
import {
  Search, MapPin, ArrowRight, Calculator,
  CheckCircle, Users, Briefcase, ShieldCheck,
  BarChart2, Lock, FileText, Headphones
} from 'lucide-react';

const categoryTags = [
  { label: 'Software Development', route: '/results?q=software+development' },
  { label: 'Managed IT (MSP)', route: '/results?q=managed+it+msp' },
  { label: 'Staff Augmentation', route: '/results?q=staff+augmentation' },
  { label: 'Cybersecurity', route: '/results?q=cybersecurity' },
  { label: 'Cloud & DevOps', route: '/results?q=cloud+devops' },
  { label: 'QA & Testing', route: '/results?q=qa+testing' },
  { label: 'Data & Analytics', route: '/results?q=data+analytics' },
  { label: 'UI/UX Design', route: '/results?q=uiux+design' },
];

const marqueeItems = [
  'Fintech startups',
  'Scale-up tech companies',
  'NHS-contracted IT suppliers',
  'UK SaaS businesses',
  'Manufacturing firms',
  'Professional services firms',
];

const marketStats = [
  { value: '$650B+', label: 'Global IT outsourcing market in 2024' },
  { value: '$214B+', label: 'Underserved SME and mid-market opportunity' },
  { value: '63%', label: 'of UK businesses planning to increase outsourcing' },
  { value: '40%', label: 'Average cost reduction vs equivalent UK hire' },
];

const packageList = [
  { name: 'Software Development Sprint (6 weeks)', price: '£8,500' },
  { name: 'Managed IT Support (Monthly retainer)', price: '£1,200/month' },
  { name: 'Cybersecurity Audit & Report', price: '£3,500' },
  { name: 'Cloud Migration Assessment', price: '£4,200' },
  { name: 'Dedicated React Developer (Monthly)', price: '£2,400/month' },
  { name: 'E-commerce Platform Build', price: '£12,000' },
  { name: 'DevOps Setup & CI/CD Pipeline', price: '£5,800' },
  { name: 'QA & Testing Sprint (4 weeks)', price: '£4,500' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    navigate(`/results?${params.toString()}`);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (value.length > 0) {
      const filtered = (cities as any[])
        .filter((city: any) =>
          city.name.toLowerCase().includes(value.toLowerCase()) ||
          city.country.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 10);
      setFilteredCities(filtered);
      setShowLocationDropdown(true);
    } else {
      setShowLocationDropdown(false);
      setFilteredCities([]);
    }
  };

  const handleLocationSelect = (city: any) => {
    setLocation(`${city.name}, ${city.country}`);
    setShowLocationDropdown(false);
    setFilteredCities([]);
  };

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-[#0B2D59] via-blue-900 to-[#0B2D59] pt-10 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2"
            alt="Professional team collaboration"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B2D59]/85 via-blue-900/75 to-[#0B2D59]/85" />
        </div>

        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-3xl font-bold text-white mb-6 leading-tight"
            >
              Find Verified IT Partners. Outsource With Confidence.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto"
            >
              The only UK marketplace to find, hire, and manage verified MSPs, IT agencies, and dedicated
              teams — with contracts, escrow payments, and delivery tracking built in.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-3xl mx-auto mb-6"
            >
              <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg p-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-[2]">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="What do you need? e.g. React development team, MSP, cybersecurity"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3] text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="relative" onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}>
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        onFocus={() => { if (location.length > 0) handleLocationChange(location); }}
                        placeholder="City or country — or type 'Remote'"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3] text-sm"
                        autoComplete="off"
                      />
                      {showLocationDropdown && filteredCities.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto mt-1">
                          {filteredCities.map((city: any, index: number) => (
                            <button
                              key={`${city.name}-${city.country}-${index}`}
                              type="button"
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center"
                              onClick={() => handleLocationSelect(city)}
                            >
                              <MapPin className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-gray-900">{city.name}</div>
                                <div className="text-xs text-gray-500">{city.country}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#0070F3] text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    Search <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Quick-click category tags */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap justify-center gap-2 mb-10"
            >
              {categoryTags.map((tag) => (
                <Link
                  key={tag.route}
                  to={tag.route}
                  className="px-4 py-2 bg-white/15 text-white text-sm rounded-full border border-white/30 hover:bg-white/25 transition-colors font-medium"
                >
                  {tag.label}
                </Link>
              ))}
            </motion.div>

            {/* Trusted-by marquee */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <p className="text-gray-300 text-sm mb-4">Trusted by</p>
              <div className="overflow-hidden">
                <div className="flex animate-marquee space-x-10 whitespace-nowrap">
                  {[...marqueeItems, ...marqueeItems].map((item, i) => (
                    <span key={i} className="text-gray-300 font-medium text-sm">{item}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── AI Matching Promo ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-8">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm p-10">
            <h2 className="text-3xl font-bold text-[#0B2D59] mb-4">
              Not sure where to start? Describe your project — AI finds the right partner.
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Type your requirement in plain English. Our AI reads it and instantly shortlists the
              best-matched verified vendors from our network — ranked by fit, location, and pricing.
              No forms, no sales calls. Just results.
            </p>
            <Link
              to="/results"
              className="inline-flex items-center px-8 py-4 bg-[#0070F3] text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Try AI Search <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Who Do You Need? (Vendor Type Cards) ── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#0B2D59] mb-3">Who Do You Need?</h2>
            <p className="text-xl text-gray-500">Three types of verified IT outsourcing partners — all on one platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* MSP Card */}
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-[#0070F3] p-8 hover:shadow-md transition-shadow">
              <ShieldCheck className="h-10 w-10 text-[#0070F3] mb-4" />
              <h3 className="text-xl font-bold text-[#0B2D59] mb-1">Managed Service Providers</h3>
              <p className="text-gray-500 text-sm mb-4">Ongoing IT management, support, and infrastructure</p>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Perfect for businesses that need consistent, reliable IT operations without an in-house
                team. MSPs manage your infrastructure, cloud, cybersecurity, and helpdesk on a monthly retainer.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['SLA-backed', 'Monthly contracts', 'Avg. response under 4hrs'].map((s) => (
                  <span key={s} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{s}</span>
                ))}
              </div>
              <Link to="/results?type=msp" className="text-[#0070F3] font-semibold text-sm hover:underline">
                Browse MSPs →
              </Link>
            </div>

            {/* IT Agencies Card */}
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-[#1A6B3C] p-8 hover:shadow-md transition-shadow">
              <Briefcase className="h-10 w-10 text-[#1A6B3C] mb-4" />
              <h3 className="text-xl font-bold text-[#0B2D59] mb-1">IT Agencies</h3>
              <p className="text-gray-500 text-sm mb-4">Project-based development, design, and digital delivery</p>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Need a team to build a product or run a digital transformation? Agencies take on defined
                project scopes and deliver structured results at a fixed price or on milestones.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['Fixed-price packages', 'Milestone delivery', 'Verified portfolios'].map((s) => (
                  <span key={s} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{s}</span>
                ))}
              </div>
              <Link to="/results?type=agency" className="text-[#1A6B3C] font-semibold text-sm hover:underline">
                Browse Agencies →
              </Link>
            </div>

            {/* Dedicated Teams Card */}
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-[#5C3D8F] p-8 hover:shadow-md transition-shadow">
              <Users className="h-10 w-10 text-[#5C3D8F] mb-4" />
              <h3 className="text-xl font-bold text-[#0B2D59] mb-1">Dedicated Teams</h3>
              <p className="text-gray-500 text-sm mb-4">Extended team members hired on a monthly basis</p>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Hire vetted developers, QA engineers, or DevOps specialists who work exclusively for
                you — without the overhead of direct employment. Scale up or down month to month.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['Monthly pricing', 'Full team visibility', 'Replacement guarantee'].map((s) => (
                  <span key={s} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{s}</span>
                ))}
              </div>
              <Link to="/results?type=dedicated" className="text-[#5C3D8F] font-semibold text-sm hover:underline">
                Browse Dedicated Teams →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#0B2D59] mb-3">How Collabov Works</h2>
            <p className="text-xl text-gray-500">From finding the right partner to completing the work — all in one place.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: <Search className="h-7 w-7 text-[#0070F3]" />,
                heading: 'SEARCH & DISCOVER',
                body: 'Browse verified MSPs, agencies, and dedicated teams. Filter by service, location, tech stack, and budget. Every vendor is manually reviewed before their profile goes live.',
              },
              {
                step: '2',
                icon: <BarChart2 className="h-7 w-7 text-[#0070F3]" />,
                heading: 'COMPARE & SHORTLIST',
                body: 'View detailed profiles, team members, case studies, and reviews. Shortlist up to 4 vendors side by side. Request proposals directly from the results page.',
              },
              {
                step: '3',
                icon: <ShieldCheck className="h-7 w-7 text-[#0070F3]" />,
                heading: 'HIRE & MANAGE',
                body: 'Sign a platform-standard contract, fund milestones via secure escrow, and track delivery in your dashboard. Payments only release when you approve the work.',
              },
            ].map(({ step, icon, heading, body }) => (
              <div key={step} className="text-center px-6">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  {icon}
                </div>
                <div className="text-xs font-bold text-[#0070F3] mb-1">Step {step}</div>
                <h3 className="text-base font-bold text-[#0B2D59] mb-3">{heading}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Outsourcing Calculator ── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Calculator className="h-12 w-12 text-[#0070F3] mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-[#0B2D59] mb-4">Should you outsource? Find out in 60 seconds.</h2>
            <p className="text-lg text-gray-600 mb-8">
              Our AI calculator compares your current in-house IT costs against outsourcing equivalents — by role,
              seniority, and geography. No sign-up required. Get your personalised cost breakdown instantly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-8 mb-10">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#0070F3]">64%</div>
                <div className="text-sm text-gray-500">of users discover savings over 30%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#0070F3]">1,200+</div>
                <div className="text-sm text-gray-500">UK businesses used it</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#0070F3]">Free</div>
                <div className="text-sm text-gray-500">No sign-up required</div>
              </div>
            </div>
            <Link
              to="/ai-calculator"
              className="inline-flex items-center px-8 py-4 bg-[#0070F3] text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Calculate My Savings <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Market Stats Strip ── */}
      <section className="py-12 bg-[#F4F6FB]">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            {marketStats.map((stat) => (
              <div key={stat.value} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="text-3xl font-bold text-[#0B2D59] mb-2">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center">
            Source: Grand View Research, Collabov Market Analysis 2026
          </p>
        </div>
      </section>

      {/* ── Packages ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-[#0B2D59] mb-3">Fixed-Price Packages. No Negotiation Required.</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Browse pre-scoped service bundles from verified vendors. Clear deliverables, defined timelines,
              transparent pricing. Start in days, not weeks.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {packageList.map((pkg) => (
              <div key={pkg.name} className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-[#0070F3] hover:shadow-sm transition-all">
                <div className="font-semibold text-[#0B2D59] text-sm mb-2">{pkg.name}</div>
                <div className="text-[#0070F3] font-bold">Starting from {pkg.price}</div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              to="/packages"
              className="inline-flex items-center px-8 py-4 bg-[#0070F3] text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Browse All Packages <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Join as a Provider ── */}
      <section className="py-16 bg-[#0070F3] text-white">
        <div className="container mx-auto px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold mb-4">Get Found by UK Businesses Ready to Outsource</h2>
              <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                Join as a verified MSP, IT agency, or dedicated team provider. Build your profile, list
                your packages, receive RFPs from qualified buyers — all through one platform. Free to join
                as a Founding Vendor.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <ul className="space-y-3">
                {[
                  'Access UK SME buyers actively outsourcing now',
                  'Free to join as a Founding Vendor — first 12 months',
                  'Verified badge builds immediate trust with new buyers',
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-200" />
                    <span className="text-blue-50">{b}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-3">
                {[
                  'Secure, escrow-protected payments — no chasing invoices',
                  'Manage your team, packages, and engagements in one dashboard',
                  'Respond to jobs and tenders matching your services',
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-200" />
                    <span className="text-blue-50">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/vendor/signup?type=msp" className="px-6 py-3 bg-white text-[#0070F3] rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center">
                Join as an MSP
              </Link>
              <Link to="/vendor/signup?type=agency" className="px-6 py-3 bg-white text-[#0070F3] rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center">
                Join as an Agency
              </Link>
              <Link to="/vendor/signup?type=dedicated" className="px-6 py-3 bg-white text-[#0070F3] rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center">
                Join as a Dedicated Team Provider
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Post a Project ── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-[#0B2D59] mb-3">Post a Project. Receive Proposals Within 24 Hours.</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Whether it's a quick task or a six-month platform build — post your brief once and receive
              competitive proposals from verified vendors.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Post a Job',
                body: 'Hire a specialist or small team for a defined scope. Ideal for development sprints, design work, and QA projects. Proposals arrive within 24 hours.',
                cta: 'Post a Job →',
                route: '/customer/dashboard',
              },
              {
                title: 'Create a Tender',
                body: 'Large structured project requiring multiple vendor proposals and formal evaluation. Ideal for platform builds, IT migrations, and long-term partnerships.',
                cta: 'Create a Tender →',
                route: '/customer/dashboard',
              },
              {
                title: 'Browse Open Work',
                body: 'Already a verified vendor? Browse all active jobs and tenders. Submit proposals directly from the listing. AI matches briefs to your profile.',
                cta: 'Browse Jobs →',
                route: '/jobs',
              },
            ].map((card) => (
              <div key={card.title} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-[#0B2D59] mb-3">{card.title}</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{card.body}</p>
                <Link to={card.route} className="text-[#0070F3] font-semibold text-sm hover:underline">
                  {card.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
