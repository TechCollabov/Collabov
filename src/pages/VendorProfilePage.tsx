import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Star, ShieldCheck, Bookmark, BookmarkCheck, Share2, Flag, X, Upload,
  ChevronDown, Users, Briefcase, Globe, Clock, CheckCircle, Calendar,
  Code, Cloud, Database, Smartphone, Server
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/* ── Mock data ── */
const mockVendor = {
  id: '1',
  name: 'TechPro Solutions',
  city: 'Warsaw',
  country: 'Poland',
  type: 'IT Agency',
  verified: true,
  rating: 4.8,
  reviewCount: 47,
  engagements: 23,
  responseTime: '4 hours',
  memberSince: 'January 2023',
  tagline: 'Full-stack React and Node.js agency specialising in fintech and SaaS platforms',
  description: 'TechPro Solutions is a Warsaw-based IT agency with over 8 years of experience delivering high-quality web applications for UK and European clients. We specialise in React, Node.js, and cloud-native architectures, with a strong focus on fintech, SaaS, and e-commerce verticals.\n\nOur team of 24 developers, designers, and QA engineers works in a structured agile process with weekly sprint reviews and transparent delivery tracking. Every engagement includes a dedicated project manager, weekly video standups, and access to our real-time delivery dashboard.',
  monthlyRate: 3200,
  hourlyRate: 45,
  teamSize: 24,
  timezone: 'CET (+1hr UK)',
  languages: ['English (Fluent)', 'Polish'],
  ir35: true,
  gdpr: true,
  availability: 'available' as const,
  services: ['Software Development', 'Cloud & Infrastructure', 'QA & Testing', 'DevOps'],
  techStack: {
    Frontend: ['React', 'Next.js', 'TypeScript', 'Vue', 'Tailwind CSS'],
    Backend: ['Node.js', 'Python', 'Java', 'FastAPI'],
    Cloud: ['AWS', 'GCP', 'Azure'],
    DevOps: ['Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    Database: ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL'],
    Mobile: ['React Native', 'Flutter'],
  },
  industries: ['Fintech', 'SaaS', 'E-commerce', 'Healthcare'],
  founded: 2016,
};

const mockTeam = [
  { id: '1', name: 'Aleksander Nowak', title: 'Senior Full-Stack Developer', seniority: 'Senior', domain: 'Full-Stack', skills: ['React', 'Node.js', 'PostgreSQL'], rate: 3800, availability: 'available' as const },
  { id: '2', name: 'Maria Kowalska', title: 'Lead Frontend Developer', seniority: 'Lead', domain: 'Frontend', skills: ['React', 'TypeScript', 'Next.js'], rate: 4200, availability: 'available' as const },
  { id: '3', name: 'Piotr Wiśniewski', title: 'DevOps Engineer', seniority: 'Senior', domain: 'DevOps', skills: ['Docker', 'Kubernetes', 'AWS'], rate: 3600, availability: 'limited' as const },
];

const mockPackages = [
  { id: '1', title: 'React SaaS Dashboard — Sprint Package', price: '£8,500', duration: '6 weeks', included: ['Discovery & architecture', 'UI/UX design', '2 development sprints', 'QA & testing', 'Deployment & handover'], ideal: 'Early-stage SaaS companies building their first dashboard' },
  { id: '2', title: 'Node.js API Build — Fixed Price', price: '£5,200', duration: '4 weeks', included: ['API design & documentation', 'Auth & RBAC', 'Core endpoints', 'Unit tests', 'Deployment to AWS'], ideal: 'Companies needing a robust REST API fast' },
];

const mockReviews = [
  { id: '1', reviewer: 'Fintech startup, London', projectType: 'Full-stack web development', value: '£15,000–£25,000', date: 'February 2026', rating: 5, text: 'Excellent team. Delivered on time and communicated proactively throughout. The React dashboard they built is robust and well-tested. Will definitely work with TechPro again.' },
  { id: '2', reviewer: 'SaaS company, Manchester', projectType: 'API development', value: '£5,000–£10,000', date: 'January 2026', rating: 5, text: 'Very professional agency. The Node.js API was exactly what we specified. Sprint reviews were useful and the PM kept everything on track.' },
];

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const s = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${s} ${i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </span>
  );
}

const TABS = ['Overview', 'Team Members', 'Services & Packages', 'Case Studies', 'Reviews', 'Calendar & Availability'];

const SENIORITY_COLOURS: Record<string, string> = {
  Junior: 'bg-gray-100 text-gray-600', Mid: 'bg-blue-100 text-blue-700',
  Senior: 'bg-green-100 text-green-700', Lead: 'bg-purple-100 text-purple-700', Principal: 'bg-navy-100 text-[#0B2D59]',
};

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'Software Development': <Code className="h-5 w-5" />,
  'Cloud & Infrastructure': <Cloud className="h-5 w-5" />,
  'QA & Testing': <CheckCircle className="h-5 w-5" />,
  DevOps: <Server className="h-5 w-5" />,
};

const TECH_ICONS: Record<string, React.ReactNode> = {
  Frontend: <Code className="h-4 w-4" />, Backend: <Server className="h-4 w-4" />,
  Cloud: <Cloud className="h-4 w-4" />, DevOps: <Globe className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />, Mobile: <Smartphone className="h-4 w-4" />,
};

const VendorProfilePage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('Overview');
  const [sticky, setSticky] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showRFP, setShowRFP] = useState(false);
  const [caseStudyExpanded, setCaseStudyExpanded] = useState<Record<string, boolean>>({});
  const headerRef = useRef<HTMLDivElement>(null);

  // Use mock vendor (in real app, fetch by vendorId)
  const vendor = mockVendor;

  useEffect(() => {
    const onScroll = () => {
      if (headerRef.current) {
        setSticky(window.scrollY > headerRef.current.offsetHeight + 60);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openRFP = () => {
    if (!user) { navigate(`/signin?returnUrl=/vendor/profile/${vendorId}`); return; }
    setShowRFP(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact sticky header */}
      {sticky && (
        <div className="fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {vendor.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="font-semibold text-[#0B2D59] text-sm">{vendor.name}</div>
              <div className="flex items-center gap-1"><Stars rating={vendor.rating} /><span className="text-xs text-gray-500">{vendor.rating}</span></div>
            </div>
          </div>
          <button onClick={openRFP} className="px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Request Proposal
          </button>
        </div>
      )}

      {/* Profile header */}
      <div ref={headerRef} className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-xl bg-blue-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {vendor.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-[#0B2D59]">{vendor.name}</h1>
                  {vendor.verified && (
                    <span className="flex items-center gap-1 text-sm text-[#0070F3] font-medium">
                      <ShieldCheck className="h-4 w-4" /> Verified
                    </span>
                  )}
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">{vendor.type}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-gray-500">
                  <Stars rating={vendor.rating} />
                  <span className="font-bold text-gray-700">{vendor.rating}</span>
                  <span>({vendor.reviewCount} reviews)</span>
                  <span>·</span>
                  <span>{vendor.engagements} engagements</span>
                  <span>·</span>
                  <span>{vendor.city}, {vendor.country}</span>
                  <span>·</span>
                  <span>Member since {vendor.memberSince}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={openRFP} className="px-5 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Request Proposal
              </button>
              <button onClick={openRFP} className="px-4 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Send Message
              </button>
              <button className="px-4 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Check Availability
              </button>
              <button className="px-4 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                View Packages
              </button>
              <button onClick={() => setSaved(!saved)} className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-[#0070F3]">
                {saved ? <BookmarkCheck className="h-5 w-5 text-[#0070F3]" /> : <Bookmark className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-6">
          <div className="flex gap-0 border-b border-gray-200 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-[#0070F3] text-[#0070F3]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="container mx-auto px-6 py-8">

        {/* ── Overview ── */}
        {activeTab === 'Overview' && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left 2/3 */}
            <div className="flex-[2] space-y-8">
              <section>
                <h2 className="text-xl font-bold text-[#0B2D59] mb-4">About {vendor.name}</h2>
                <div className="flex flex-wrap gap-3 mb-5">
                  {[`Founded ${vendor.founded}`, `${vendor.teamSize} employees`, `${vendor.city}, ${vendor.country}`, `${vendor.engagements} engagements`].map(f => (
                    <span key={f} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{f}</span>
                  ))}
                </div>
                {vendor.description.split('\n\n').map((p, i) => (
                  <p key={i} className="text-gray-600 text-sm leading-relaxed mb-3">{p}</p>
                ))}
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Core Services</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {vendor.services.map(s => (
                    <div key={s} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                      <div className="text-[#0070F3] mb-2 flex justify-center">{SERVICE_ICONS[s] || <Briefcase className="h-5 w-5" />}</div>
                      <div className="text-xs font-semibold text-gray-700">{s}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Technology Stack</h2>
                <div className="space-y-4">
                  {Object.entries(vendor.techStack).map(([cat, tags]) => (
                    <div key={cat} className="flex items-start gap-3">
                      <div className="flex items-center gap-1.5 w-24 flex-shrink-0 text-gray-400 text-sm pt-0.5">
                        {TECH_ICONS[cat]}{cat}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{t}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Industries We Serve</h2>
                <div className="flex flex-wrap gap-2">
                  {vendor.industries.map(i => (
                    <span key={i} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-700">{i}</span>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[#0B2D59] mb-4">How We Work</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: 'Long-term Dedicated Resource', body: 'Monthly pricing with a minimum 3-month commitment. Team members work exclusively for you. Replacement guarantee within 2 weeks if needed.' },
                    { title: 'Short-term Project', body: 'Fixed-price or T&M engagement. Milestone-based delivery with clear acceptance criteria. Typically 4–16 weeks.' },
                    { title: 'Quick Engagement', body: 'Sub-£10K single deliverable with a simplified process. Ideal for proofs of concept, audits, and scoped tasks.' },
                  ].map(e => (
                    <div key={e.title} className="bg-white rounded-xl p-5 border border-gray-100">
                      <div className="font-semibold text-gray-800 text-sm mb-2">{e.title}</div>
                      <div className="text-gray-500 text-xs leading-relaxed">{e.body}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right sidebar */}
            <div className="lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20 space-y-3">
                <div className="text-2xl font-bold text-[#0B2D59]">From £{vendor.monthlyRate.toLocaleString()}/month</div>
                <div className="text-sm text-gray-500">From £{vendor.hourlyRate}/hour</div>
                <hr className="border-gray-100" />
                {[
                  { label: 'Team size', value: `${vendor.teamSize} people` },
                  { label: 'Timezone', value: vendor.timezone },
                  { label: 'Languages', value: vendor.languages.join(', ') },
                  { label: 'Response time', value: `Within ${vendor.responseTime}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium text-gray-700">{value}</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  {vendor.ir35 && <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-1 rounded-full font-medium">IR35 Compliant</span>}
                  {vendor.gdpr && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-full font-medium">GDPR-Ready</span>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-green-700 font-medium">Available now</span>
                </div>
                <hr className="border-gray-100" />
                <button onClick={openRFP} className="w-full py-3 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  Request a Proposal
                </button>
                <button onClick={openRFP} className="w-full py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Send a Message
                </button>
                <hr className="border-gray-100" />
                <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors w-full">
                  <Share2 className="h-4 w-4" /> Copy link
                </button>
                <button className="flex items-center gap-2 text-xs text-gray-300 hover:text-gray-400 transition-colors w-full">
                  <Flag className="h-3.5 w-3.5" /> Report this listing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Team Members ── */}
        {activeTab === 'Team Members' && (
          <div>
            <h2 className="text-xl font-bold text-[#0B2D59] mb-6">Team Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockTeam.map(m => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#0070F3] font-bold mb-3">
                    {m.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="font-semibold text-gray-800">{m.name}</div>
                  <div className="text-sm text-gray-500 mb-2">{m.title}</div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SENIORITY_COLOURS[m.seniority] || 'bg-gray-100 text-gray-600'}`}>{m.seniority}</span>
                    <span className="text-xs text-gray-400">{m.domain}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {m.skills.map(s => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-[#0B2D59]">£{m.rate.toLocaleString()}/mo</span>
                    <span className={`flex items-center gap-1 text-xs ${m.availability === 'available' ? 'text-green-600' : 'text-amber-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.availability === 'available' ? 'bg-green-500' : 'bg-amber-400'}`} />
                      {m.availability === 'available' ? 'Available now' : 'Limited'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Services & Packages ── */}
        {activeTab === 'Services & Packages' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Fixed-Price Packages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {mockPackages.map(pkg => (
                  <div key={pkg.id} className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 mb-1">{pkg.title}</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl font-bold text-[#0070F3]">{pkg.price}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{pkg.duration}</span>
                    </div>
                    <ul className="space-y-1.5 mb-4">
                      {pkg.included.map(i => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />{i}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-400 mb-4">Ideal for: {pkg.ideal}</p>
                    <button onClick={openRFP} className="w-full py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                      Purchase Package
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Case Studies ── */}
        {activeTab === 'Case Studies' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Case Studies</h2>
            {[
              { id: 'cs1', title: 'E-commerce Platform Rebuild for UK Retailer', industry: 'E-commerce', outcomes: ['65% faster page load', '40% increase in checkout conversion', '99.9% uptime since launch'], challenge: 'A UK-based fashion retailer was suffering from a slow, fragile legacy platform built on an outdated PHP stack. Checkout conversion was declining and mobile performance was poor.', solution: 'We migrated the platform to a Next.js frontend with a Node.js API backend, hosted on AWS with CloudFront CDN. The checkout flow was rebuilt using Stripe with one-click purchasing.' },
              { id: 'cs2', title: 'Fintech SaaS Dashboard for Investment Platform', industry: 'Fintech', outcomes: ['3x faster data load time', 'Launched in 8 weeks', '92% user satisfaction score'], challenge: 'A fintech startup needed a real-time investment dashboard with complex data visualisations and sub-second performance for their web app.', solution: 'We built a React dashboard with WebSocket-driven live data feeds, recharts visualisations, and a PostgreSQL backend with materialised views for query performance.' },
            ].map(cs => {
              const expanded = caseStudyExpanded[cs.id];
              return (
                <div key={cs.id} className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-gray-800">{cs.title}</h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cs.industry}</span>
                      </div>
                      <ul className="space-y-1">
                        {cs.outcomes.slice(0, 2).map(o => (
                          <li key={o} className="flex items-center gap-2 text-sm text-green-600 font-medium">
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />{o}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button onClick={() => setCaseStudyExpanded(p => ({ ...p, [cs.id]: !p[cs.id] }))} className="text-[#0070F3] text-sm font-medium hover:underline ml-4 flex-shrink-0">
                      {expanded ? 'Show less' : 'Read more'}
                    </button>
                  </div>
                  {expanded && (
                    <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                      <div><div className="font-semibold text-gray-700 mb-1 text-sm">The Challenge</div><p className="text-gray-500 text-sm">{cs.challenge}</p></div>
                      <div><div className="font-semibold text-gray-700 mb-1 text-sm">Our Solution</div><p className="text-gray-500 text-sm">{cs.solution}</p></div>
                      <div><div className="font-semibold text-gray-700 mb-2 text-sm">Outcomes</div>
                        <ul className="space-y-1">
                          {cs.outcomes.map(o => <li key={o} className="flex items-center gap-2 text-sm text-green-600 font-medium"><CheckCircle className="h-4 w-4" />{o}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Reviews ── */}
        {activeTab === 'Reviews' && (
          <div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 flex flex-col md:flex-row gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-[#0B2D59] mb-1">{vendor.rating}</div>
                <Stars rating={vendor.rating} size="md" />
                <div className="text-sm text-gray-400 mt-1">out of 5</div>
              </div>
              <div className="flex-1 space-y-2">
                {[['Quality of Work', 4.9], ['Communication', 4.8], ['Timeliness', 4.7], ['Professionalism', 4.9], ['Overall', 4.8]].map(([label, score]) => (
                  <div key={label as string} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-36">{label as string}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${((score as number) / 5) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8">{score}</span>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">{vendor.reviewCount}</div>
                <div className="text-sm text-gray-400">reviews</div>
              </div>
            </div>
            <div className="space-y-4">
              {mockReviews.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-700 text-sm">{r.reviewer}</div>
                      <div className="text-xs text-gray-400">{r.projectType} · {r.value} · {r.date}</div>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-gray-600 text-sm">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Calendar ── */}
        {activeTab === 'Calendar & Availability' && (
          <div>
            <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Calendar & Availability</h2>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="text-sm text-gray-500 mb-4">April 2026</div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 30 }, (_, i) => {
                  const day = i + 1;
                  const colour = day <= 20 ? 'bg-green-100 text-green-700' : day <= 25 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400';
                  return (
                    <div key={day} className={`rounded-lg py-2 text-xs font-medium ${colour}`}>{day}</div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100" /> Limited</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100" /> Booked</span>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">Current capacity: 7 of 24 team members available</div>
                <div className="text-sm text-gray-500 mb-4">Average lead time to start: 2 weeks</div>
                <button onClick={openRFP} className="px-5 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  Book a Discovery Call
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RFP Modal */}
      {showRFP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0B2D59]">Request a Proposal</h2>
              <button onClick={() => setShowRFP(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project title <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. React dashboard for SaaS platform" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service type <span className="text-red-500">*</span></label>
                <select className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]">
                  <option value="">Select service type</option>
                  {['Software Development', 'Managed IT', 'Staff Augmentation', 'Cybersecurity', 'Cloud & Infra', 'QA & Testing', 'DevOps', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project description <span className="text-red-500">*</span></label>
                <textarea rows={4} placeholder="Describe what you need built or managed, key requirements, and any technical context." className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget from (£)</label>
                  <input type="number" placeholder="e.g. 10000" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget to (£)</label>
                  <input type="number" placeholder="e.g. 25000" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engagement model</label>
                <div className="space-y-2">
                  {['Long-term dedicated resource', 'Short-term project', 'Flexible', 'Not sure'].map(m => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="model" className="text-[#0070F3]" />
                      <span className="text-sm text-gray-600">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attach a project brief (optional)</label>
                <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#0070F3] transition-colors">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-400">PDF or DOCX, max 10MB</span>
                  <input type="file" accept=".pdf,.docx" className="sr-only" />
                </label>
              </div>
              <button className="w-full py-3 bg-[#0070F3] text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Send Proposal Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProfilePage;
