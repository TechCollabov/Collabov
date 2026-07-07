import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Star, ShieldCheck, Bookmark, BookmarkCheck, Share2, Flag, X, Upload,
  ChevronDown, Users, Briefcase, Globe, Clock, CheckCircle, Calendar,
  Code, Cloud, Database, Smartphone, Server, UserCheck, TrendingUp,
  MessageSquare, Phone, Video, MapPin, Loader2, Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { addHours, INTERVIEW_RESPONSE_HOURS, notify, logEvent, hasCompanyProfile, isBuyerBlacklisted } from '../lib/workflows';
import CompanyProfileGateModal from '../components/ui/CompanyProfileGateModal';

// ─── Mock data ────────────────────────────────────────────────────────────────

const DEMO_VENDOR = {
  id: 'demo',
  company_name: 'TechForge Solutions',
  trading_name: 'TechForge Solutions',
  tagline: 'UK-focused software development and cloud engineering for scale-ups',
  description:
    'TechForge Solutions is a 35-person IT agency based in Warsaw, Poland, specialising in building scalable web applications, cloud infrastructure, and DevOps automation for UK scale-ups and SMEs. We have delivered over 60 projects across fintech, healthtech, and SaaS — all on budget and on schedule.',
  business_type: 'agency',
  city: 'Warsaw',
  country: 'Poland',
  founded_year: 2016,
  team_size_band: '11-50',
  verification_status: 'verified',
  rating: 4.8,
  review_count: 23,
  engagement_count: 31,
  referral_count: 5,
  monthly_rate_min: 4200,
  monthly_rate_max: 12000,
  hourly_rate_min: 55,
  hourly_rate_max: 95,
  minimum_project_value: 5000,
  ir35_compliant: false,
  gdpr_ready: true,
  availability_status: 'available',
  response_time_hours: 3,
  timezone: 'CET',
  languages: ['English', 'Polish'],
  service_categories: ['Software Development', 'Cloud & Infrastructure', 'DevOps', 'QA & Testing'],
  tech_stack: {
    Frontend: ['React', 'TypeScript', 'Next.js', 'Vue.js'],
    Backend: ['Node.js', 'Python', 'Go', 'NestJS'],
    Cloud: ['AWS', 'GCP', 'Terraform'],
    DevOps: ['Docker', 'Kubernetes', 'GitHub Actions'],
    Database: ['PostgreSQL', 'MongoDB', 'Redis'],
  },
  engagement_models: ['Long-term Dedicated', 'Short-term Project'],
  industry_focus: ['Fintech', 'HealthTech', 'SaaS', 'E-commerce'],
  member_since: 'January 2024',
  logo_url: null as string | null,
  payment_reputation_rate: 97,
};

const DEMO_TEAM = [
  { id: '1', name: 'Aleksei Nowak', title: 'Senior Full-Stack Developer', seniority: 'Senior', domain: 'Full-Stack', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'], rate_monthly: 4800, availability: 'available', available_from: null as string | null, engaged_until: null as string | null },
  { id: '2', name: 'Karolina Wiśniewska', title: 'Lead DevOps Engineer', seniority: 'Lead', domain: 'DevOps', skills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'CI/CD'], rate_monthly: 5200, availability: 'available_from', available_from: '1 July 2026', engaged_until: null as string | null },
  { id: '3', name: 'Piotr Krawczyk', title: 'Senior Backend Developer', seniority: 'Senior', domain: 'Backend', skills: ['Go', 'Python', 'gRPC', 'PostgreSQL', 'Redis'], rate_monthly: 4600, availability: 'engaged', available_from: null as string | null, engaged_until: 'Aug 2026' },
  { id: '4', name: 'Anna Kowalczyk', title: 'Mid Frontend Developer', seniority: 'Mid', domain: 'Frontend', skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'], rate_monthly: 3200, availability: 'available', available_from: null as string | null, engaged_until: null as string | null },
  { id: '5', name: 'Marcin Zielinski', title: 'QA Engineer', seniority: 'Mid', domain: 'QA', skills: ['Playwright', 'Cypress', 'Jest', 'API Testing'], rate_monthly: 2800, availability: 'available', available_from: null as string | null, engaged_until: null as string | null },
];

const DEMO_CASE_STUDIES = [
  {
    id: '1',
    title: 'Fintech Payment Gateway — Real-time Settlement Engine',
    industry: 'Fintech',
    services: ['Software Development', 'Cloud & Infrastructure'],
    tech: ['Node.js', 'PostgreSQL', 'AWS Lambda', 'Stripe', 'React'],
    duration: '6 months',
    team_size: 4,
    challenge:
      'A UK-based fintech needed a real-time payment settlement engine capable of handling 50,000 transactions per day with sub-100ms latency. Their existing batch processing system caused 4-6 hour settlement delays, creating cash flow problems for merchants.',
    solution:
      'We designed an event-driven microservices architecture on AWS using Lambda functions for transaction processing and PostgreSQL with read replicas for high-volume queries. Implemented optimistic locking to prevent double-processing and built a React dashboard for real-time monitoring.',
    outcomes: [
      { metric: '99.97% uptime', description: 'Over 18 months of production operation' },
      { metric: '< 80ms average settlement', description: 'Down from 4-6 hour batch window' },
      { metric: '£2.3M in operational savings', description: 'First year vs. enterprise vendor alternative' },
    ],
    client_quote:
      'TechForge delivered exactly what they scoped. No surprises, no overruns. The settlement engine has processed over £400M without a single critical incident.',
  },
  {
    id: '2',
    title: 'NHS-Contracted HealthTech — Patient Data Platform',
    industry: 'HealthTech',
    services: ['Software Development', 'QA & Testing'],
    tech: ['React', 'Python', 'AWS', 'PostgreSQL', 'FHIR API'],
    duration: '4 months',
    team_size: 3,
    challenge:
      'A HealthTech SaaS company needed to integrate with NHS FHIR APIs to pull patient records into their care coordination platform. The integration required GDPR compliance, NHS DSP Toolkit alignment, and real-time sync from multiple trust systems.',
    solution:
      'Built a FHIR R4-compliant integration layer in Python with end-to-end encryption, role-based access control, and an audit trail for all data access events. Full test suite with 94% code coverage and penetration testing by third-party.',
    outcomes: [
      { metric: '3 NHS trusts integrated', description: 'Within 16 weeks of project start' },
      { metric: '94% test coverage', description: 'Across all integration endpoints' },
      { metric: 'DSPT-aligned', description: 'Passed NHS data security assessment first attempt' },
    ],
    client_quote: null as string | null,
  },
];

const DEMO_REFERRALS = [
  {
    id: '1',
    contact_name: 'Sarah Thompson',
    job_title: 'Head of Engineering',
    company: 'Paytrace Financial',
    relationship_type: 'Client',
    project_vouched_for: 'Payment Settlement Engine',
    project_duration: '6 months',
    project_value_band: '£50k+',
    specific_outcome:
      'Delivered a real-time settlement engine processing 50,000 transactions/day with 99.97% uptime. On budget, on schedule.',
    written_statement:
      'TechForge are one of the most professional engineering teams we have worked with. They flagged risks early, communicated daily, and delivered exactly what was scoped.',
    confirmed: true,
    confirmed_at: 'March 2025',
  },
  {
    id: '2',
    contact_name: 'Dr. James Okafor',
    job_title: 'CTO',
    company: 'CareSync Health',
    relationship_type: 'Client',
    project_vouched_for: 'NHS FHIR Integration Platform',
    project_duration: '4 months',
    project_value_band: '£10k-£50k',
    specific_outcome:
      'Built and delivered an NHS-compliant FHIR integration passing DSPT assessment first attempt.',
    written_statement: null as string | null,
    confirmed: true,
    confirmed_at: 'November 2024',
  },
  {
    id: '3',
    contact_name: 'Mark Williams',
    job_title: 'VP Product',
    company: 'ShopBridge Commerce',
    relationship_type: 'Client',
    project_vouched_for: 'E-commerce Platform Migration',
    project_duration: '3 months',
    project_value_band: '£10k-£50k',
    specific_outcome: null as string | null,
    written_statement: null as string | null,
    confirmed: false,
    confirmed_at: null as string | null,
  },
];

const DEMO_REVIEWS = [
  {
    id: '1',
    company_type: 'Fintech scale-up',
    location: 'London, UK',
    project_type: 'Software Development',
    budget_range: '£50k+',
    date: 'March 2025',
    overall: 5,
    quality: 5,
    communication: 5,
    timeliness: 4,
    professionalism: 5,
    text: 'Exceptional team. They understood our domain quickly, proactively flagged two architectural risks we had missed, and delivered ahead of schedule. The codebase quality is excellent — our internal engineers were impressed.',
    vendor_response: null as string | null,
  },
  {
    id: '2',
    company_type: 'SaaS platform',
    location: 'Manchester, UK',
    project_type: 'DevOps & Cloud',
    budget_range: '£10k-£50k',
    date: 'January 2025',
    overall: 5,
    quality: 4,
    communication: 5,
    timeliness: 5,
    professionalism: 5,
    text: 'Our CI/CD pipeline was a mess before TechForge came in. They restructured everything within 3 weeks. Kubernetes setup is solid and the documentation they left behind means our team can manage it themselves.',
    vendor_response:
      'Thank you for the kind words. It was a pleasure working on your infrastructure. The team did great work on the documentation — please reach out if you ever need anything else.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const s = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${s} ${i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </span>
  );
}

function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const sizeClass = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'sm' ? 'w-9 h-9 text-sm' : 'w-12 h-12 text-base';
  return (
    <div className={`${sizeClass} rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

const SENIORITY_COLOURS: Record<string, string> = {
  Junior: 'bg-gray-100 text-gray-600',
  Mid: 'bg-blue-100 text-blue-700',
  Senior: 'bg-green-100 text-green-700',
  Lead: 'bg-purple-100 text-purple-700',
  Principal: 'bg-[#0B2D59]/10 text-[#0B2D59]',
};

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'Software Development': <Code className="h-5 w-5" />,
  'Cloud & Infrastructure': <Cloud className="h-5 w-5" />,
  'QA & Testing': <CheckCircle className="h-5 w-5" />,
  DevOps: <Server className="h-5 w-5" />,
};

const TECH_ICONS: Record<string, React.ReactNode> = {
  Frontend: <Code className="h-4 w-4" />,
  Backend: <Server className="h-4 w-4" />,
  Cloud: <Cloud className="h-4 w-4" />,
  DevOps: <Globe className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  Mobile: <Smartphone className="h-4 w-4" />,
};

const TABS = [
  'Overview',
  'Team Members',
  'Services & Packages',
  'Case Studies',
  'Referrals',
  'Reviews',
  'Calendar & Availability',
];

type VendorData = any;

// ─── DB Types ─────────────────────────────────────────────────────────────────

interface DBVendor {
  id: string;
  company_name: string;
  tagline: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  rating: number | null;
  review_count: number | null;
  projects_completed: number | null;
  response_time: string | null;
  monthly_rate: number | null;
  hourly_rate: number | null;
  is_verified: boolean;
  employee_count: number | null;
  years_in_business: number | null;
  created_at: string;
}

interface DBEmployee {
  id: string;
  vendor_id: string;
  name: string;
  title: string | null;
  bio: string | null;
  profile_picture_url: string | null;
}

interface DBPackage {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number | null;
  delivery_days: number | null;
  category: string | null;
  tech_stack: string[] | null;
  ideal_for: string | null;
  features: string[] | null;
}

interface DBPortfolioItem {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
}

interface DBReview {
  id: string;
  vendor_id: string;
  buyer_id: string;
  rating: number;
  comment: string | null;
  would_recommend: boolean | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

interface DBCaseStudy {
  id: string;
  vendor_id: string;
  title: string;
  challenge: string | null;
  solution: string | null;
  outcome: string | null;
  tech_stack: string[] | null;
  created_at: string;
}

interface DBReferral {
  id: string;
  vendor_id: string;
  referee_name: string;
  referee_title: string | null;
  referee_company: string | null;
  statement: string | null;
  verified: boolean;
  created_at: string;
}

// ─── Interview Modal ──────────────────────────────────────────────────────────

interface InterviewModalProps {
  member: any;
  vendorId: string;
  onClose: () => void;
}

function InterviewModal({ member, vendorId, onClose }: InterviewModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviewType, setInterviewType] = useState<'candidate' | 'discovery'>('candidate');
  const [format, setFormat] = useState<'video' | 'phone' | 'inperson'>('video');
  const [message, setMessage] = useState('');
  const [dates, setDates] = useState(['', '', '']);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!user) { navigate('/signin'); return; }
    const proposedTimes = dates.filter(Boolean);
    if (proposedTimes.length === 0) { setError('Add at least one preferred date/time.'); return; }
    setSending(true);
    setError('');
    try {
      const { error: insErr } = await supabase.from('interview_requests').insert({
        buyer_id: user.id,
        vendor_id: vendorId,
        employee_id: member.id,
        interview_type: interviewType === 'candidate' ? 'interview' : 'discovery_call',
        format: format === 'inperson' ? 'in_person' : format,
        proposed_times: proposedTimes,
        respond_by: addHours(new Date(), INTERVIEW_RESPONSE_HOURS).toISOString(),
      });
      if (insErr) throw insErr;
      if (message.trim()) {
        await supabase.from('messages').insert({
          sender_id: user.id,
          recipient_id: vendorId,
          content: message.trim(),
          thread_type: 'pre_engagement',
        });
      }
      await notify(vendorId, 'enquiry', 'New interview request',
        `A buyer requested an interview with ${member.name}. Respond within 48 hours.`,
        '/vendor/dashboard/enquiries');
      setSent(true);
    } catch (e) {
      console.error('Interview request failed:', e);
      setError('Could not send the interview request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0B2D59] mb-1">Interview request sent</h2>
          <p className="text-sm text-gray-500 mb-5">
            The vendor has 48 hours to confirm one of your times or propose alternatives.
          </p>
          <button onClick={onClose} className="px-5 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0B2D59]">Request Interview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Pre-filled candidate */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#0070F3] font-bold text-sm flex-shrink-0">
              {member.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">{member.name}</div>
              <div className="text-xs text-gray-500">{member.title}</div>
            </div>
          </div>

          {/* Interview type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interview type</label>
            <div className="space-y-2">
              {([['candidate', 'Interview this candidate'], ['discovery', 'General discovery call']] as const).map(
                ([val, label]) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="interviewType"
                      checked={interviewType === val}
                      onChange={() => setInterviewType(val)}
                      className="text-[#0070F3]"
                    />
                    <span className="text-sm text-gray-600">{label}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <div className="flex gap-3">
              {([
                ['video', 'Video', <Video className="h-4 w-4" />],
                ['phone', 'Phone', <Phone className="h-4 w-4" />],
                ['inperson', 'In-person', <MapPin className="h-4 w-4" />],
              ] as const).map(([val, label, icon]) => (
                <button
                  key={val}
                  onClick={() => setFormat(val)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    format === val
                      ? 'border-[#0070F3] bg-blue-50 text-[#0070F3]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {icon}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Date/time preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred date/time slots <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="space-y-2">
              {[0, 1, 2].map(i => (
                <div key={i}>
                  <label className="block text-xs text-gray-400 mb-1">Preferred date/time {i + 1}</label>
                  <input
                    type="datetime-local"
                    value={dates[i]}
                    onChange={e => setDates(prev => prev.map((d, j) => (j === i ? e.target.value : d)))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Introduce yourself and describe the role or project..."
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={submit}
              disabled={sending}
              className="flex-1 py-3 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send Interview Request'}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Discovery Call Modal ─────────────────────────────────────────────────────

// Only reachable when the vendor hasn't connected Cal.diy — bookings for a
// connected vendor happen directly in the embedded widget on the Calendar tab.
function DiscoveryModal({ vendor, onClose }: { vendor: any; onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState(
    `Hi ${vendor.company_name}, I'd like to book a discovery call to discuss a potential project.`
  );
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!user) { navigate('/signin'); return; }
    setSending(true);
    setError('');
    try {
      const { error: msgErr } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: vendor.id,
        content: msg.trim(),
        thread_type: 'pre_engagement',
      });
      if (msgErr) throw msgErr;
      await notify(vendor.id, 'message', 'Discovery call request',
        'A buyer wants to arrange a discovery call. Reply with your availability.', '/messages');
      setDone(true);
    } catch (e) {
      console.error('Booking failed:', e);
      setError('Could not complete the booking. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0B2D59] mb-1">Message sent</h2>
          <p className="text-sm text-gray-500 mb-5">The vendor will reply with available times.</p>
          <button onClick={onClose} className="px-5 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0B2D59]">Book a Discovery Call</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Send a message to introduce your project. The vendor will respond with available times.
          </p>
          <textarea
            rows={4}
            value={msg}
            onChange={e => setMsg(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={submit}
              disabled={sending}
              className="flex-1 py-3 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send Request'}
            </button>
            <button onClick={onClose} className="px-5 py-3 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Badge ────────────────────────────────────────────────────────────

const PaymentBadge = ({ rate }: { rate: number }) => {
  if (rate >= 95) return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
      <span className="text-green-700 font-medium">Reliable payer</span>
    </div>
  );
  if (rate >= 80) return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
      <span className="text-amber-700 font-medium">Average payer</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
      <span className="text-red-700 font-medium">Late payer history</span>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ vendor, onRFP }: { vendor: any; onRFP: () => void }) {
  const monthlyRate = vendor.monthly_rate ?? vendor.monthly_rate_min ?? 0;
  const hourlyRate = vendor.hourly_rate ?? vendor.hourly_rate_min ?? 0;
  const teamSize = vendor.team_size_band ?? (vendor.employee_count ? `${vendor.employee_count} employees` : 'N/A');
  const timezone = vendor.timezone ?? 'N/A';
  const languages = vendor.languages ?? ['English'];
  const responseTime = vendor.response_time_hours ?? vendor.response_time ?? 'N/A';
  const minProjectValue = vendor.minimum_project_value ?? 0;
  const ir35 = vendor.ir35_compliant ?? false;
  const gdpr = vendor.gdpr_ready ?? false;
  const avail = vendor.availability_status ?? 'available';
  const paymentRate = vendor.payment_reputation_rate ?? 97;

  const availEl =
    avail === 'available' ? (
      <span className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-green-700 font-medium">Available now</span></span>
    ) : avail === 'available_from' ? (
      <span className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-amber-700 font-medium">Available soon</span></span>
    ) : (
      <span className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-red-700 font-medium">Fully booked</span></span>
    );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20 space-y-3">
      <div className="text-3xl font-black text-[#0B2D59]">From £{monthlyRate.toLocaleString()}/month</div>
      <div className="text-sm text-gray-500">From £{hourlyRate}/hour</div>
      <hr className="border-gray-100" />
      {[
        { label: 'Team size', value: teamSize },
        { label: 'Timezone', value: timezone },
        { label: 'Languages', value: Array.isArray(languages) ? languages.join(', ') : languages },
        { label: 'Response time', value: typeof responseTime === 'number' ? `Within ${responseTime}h` : responseTime },
        { label: 'Min. project value', value: `£${minProjectValue.toLocaleString()}` },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between text-sm">
          <span className="text-gray-400">{label}</span>
          <span className="font-medium text-gray-700">{value}</span>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {ir35 && (
          <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-1 rounded-full font-medium">
            IR35 Compliant
          </span>
        )}
        {gdpr && (
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-full font-medium">
            GDPR-Ready
          </span>
        )}
      </div>
      {availEl}
      <div>
        <div className="text-xs text-gray-500 mb-1">Buyer payment history</div>
        <PaymentBadge rate={paymentRate} />
      </div>
      <hr className="border-gray-100" />
      <button
        onClick={onRFP}
        className="w-full py-3 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
      >
        Request a Proposal
      </button>
      <button
        onClick={onRFP}
        className="w-full py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Send a Message
      </button>
      {vendor.business_type === 'agency' && (
        <>
          <Link
            to={`/discovery-brief?vendor=${vendor.id}`}
            className="block w-full text-center py-2.5 border border-[#0070F3] text-[#0070F3] text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            Start a Discovery
          </Link>
          <p className="text-xs text-gray-400">
            Not sure what you need built yet? A discovery gets you a scoped spec first — request a proposal instead if you already know what to build.
          </p>
        </>
      )}
      <hr className="border-gray-100" />
      <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors w-full">
        <Share2 className="h-4 w-4" /> Copy link
      </button>
      <button className="flex items-center gap-2 text-xs text-gray-300 hover:text-gray-400 transition-colors w-full">
        <Flag className="h-3.5 w-3.5" /> Report this listing
      </button>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ vendor, onRFP, serviceCategories, industries }: { vendor: any; onRFP: () => void; serviceCategories: string[]; industries: string[] }) {
  const displayServices = serviceCategories.length > 0 ? serviceCategories : (vendor.service_categories || []);
  const displayIndustries = industries.length > 0 ? industries : (vendor.industry_focus || []);
  const facts = [
    vendor.years_in_business || vendor.founded_year ? `Founded ${vendor.founded_year ?? new Date().getFullYear() - (vendor.years_in_business ?? 0)}` : null,
    vendor.team_size_band || vendor.employee_count ? `${vendor.team_size_band ?? vendor.employee_count + ' employees'}` : null,
    (vendor.city || vendor.country) ? `${vendor.city ?? ''}, ${vendor.country ?? ''}`.replace(/^, |, $/, '') : null,
    `${vendor.engagement_count ?? vendor.projects_completed ?? 0} engagements`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-[2] space-y-8">
        {/* About */}
        <section>
          <h2 className="text-xl font-bold text-[#0B2D59] mb-4">About {vendor.company_name}</h2>
          <div className="flex flex-wrap gap-3 mb-5">
            {facts.map(f => (
              <span key={f} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{f}</span>
            ))}
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{vendor.description}</p>
        </section>

        {/* Core Services */}
        <section>
          <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Core Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {displayServices.map((s: string) => (
              <div key={s} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                <div className="text-[#0070F3] mb-2 flex justify-center">
                  {SERVICE_ICONS[s] || <Briefcase className="h-5 w-5" />}
                </div>
                <div className="text-xs font-semibold text-gray-700">{s}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        {vendor.tech_stack && Object.keys(vendor.tech_stack).length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Technology Stack</h2>
          <div className="space-y-4">
            {Object.entries(vendor.tech_stack).map(([cat, tags]) => (
              <div key={cat} className="flex items-start gap-3">
                <div className="flex items-center gap-1.5 w-24 flex-shrink-0 text-gray-400 text-sm pt-0.5">
                  {TECH_ICONS[cat]}{cat}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(tags as string[]).map(t => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Industries */}
        {displayIndustries.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Industries We Serve</h2>
          <div className="flex flex-wrap gap-2">
            {displayIndustries.map((i: string) => (
              <span key={i} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-700">{i}</span>
            ))}
          </div>
        </section>
        )}

        {/* How We Work */}
        <section>
          <h2 className="text-xl font-bold text-[#0B2D59] mb-4">How We Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Long-term Dedicated Resource',
                body: 'Monthly pricing with a minimum 3-month commitment. Team members work exclusively for you. Replacement guarantee within 2 weeks if needed.',
              },
              {
                title: 'Short-term Project',
                body: 'Fixed-price or T&M engagement. Milestone-based delivery with clear acceptance criteria. Typically 4–16 weeks.',
              },
              {
                title: 'Quick Engagement',
                body: 'Sub-£10K single deliverable with a simplified process. Ideal for proofs of concept, audits, and scoped tasks.',
              },
            ].map(e => (
              <div key={e.title} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="font-semibold text-gray-800 text-sm mb-2">{e.title}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{e.body}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <div className="lg:w-64 flex-shrink-0">
        <Sidebar vendor={vendor} onRFP={onRFP} />
      </div>
    </div>
  );
}

// ─── Tab: Team Members ────────────────────────────────────────────────────────

type TeamMember = {
  id: string;
  name: string;
  title: string;
  seniority?: string;
  domain?: string;
  skills?: string[];
  rate_monthly?: number;
  availability?: string;
  available_from?: string | null;
  engaged_until?: string | null;
  bio?: string | null;
  profile_picture_url?: string | null;
};

function TeamTab({ onInterviewRequest, employees }: { onInterviewRequest: (m: any) => void; employees: DBEmployee[] }) {
  const [domainFilter, setDomainFilter] = useState('All');
  const [seniorityFilter, setSeniorityFilter] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Map DBEmployee to TeamMember shape
  const team: TeamMember[] = employees.map(e => ({
    id: e.id,
    name: e.name,
    title: e.title || '',
    bio: e.bio,
    profile_picture_url: e.profile_picture_url,
  }));

  const domains = ['All', ...Array.from(new Set(team.map(m => m.domain).filter(Boolean) as string[]))];
  const seniorities = ['All', ...Array.from(new Set(team.map(m => m.seniority).filter(Boolean) as string[]))];

  const filtered = team.filter(m => {
    if (domainFilter !== 'All' && m.domain !== domainFilter) return false;
    if (seniorityFilter !== 'All' && m.seniority !== seniorityFilter) return false;
    if (availableOnly && m.availability !== 'available') return false;
    return true;
  });

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Domain:</label>
          <select
            value={domainFilter}
            onChange={e => setDomainFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
          >
            {domains.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Seniority:</label>
          <select
            value={seniorityFilter}
            onChange={e => setSeniorityFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
          >
            {seniorities.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
          <div
            onClick={() => setAvailableOnly(v => !v)}
            className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${availableOnly ? 'bg-[#0070F3]' : 'bg-gray-200'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${availableOnly ? 'translate-x-4' : ''}`} />
          </div>
          Available now only
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">No team members match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => {
            const isAvailable = m.availability === 'available';
            const isAvailableFrom = m.availability === 'available_from';
            const isEngaged = m.availability === 'engaged';

            const availDot = isAvailable
              ? 'bg-green-500'
              : isAvailableFrom
              ? 'bg-amber-400'
              : 'bg-gray-400';

            const availLabel = isAvailable
              ? 'Available now'
              : isAvailableFrom
              ? `From ${m.available_from}`
              : `Engaged until ${m.engaged_until}`;

            const availColor = isAvailable
              ? 'text-green-600'
              : isAvailableFrom
              ? 'text-amber-600'
              : 'text-gray-500';

            const skills = m.skills || [];

            return (
              <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#0070F3] font-bold flex-shrink-0">
                    {m.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {m.seniority && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SENIORITY_COLOURS[m.seniority] || 'bg-gray-100 text-gray-600'}`}>
                      {m.seniority}
                    </span>
                  )}
                  {m.domain && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{m.domain}</span>}
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 5).map(s => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm mt-auto">
                  {m.rate_monthly ? (
                    <span className="font-bold text-[#0B2D59]">£{m.rate_monthly.toLocaleString()}/mo</span>
                  ) : <span />}
                  {m.availability && (
                    <span className={`flex items-center gap-1 text-xs ${availColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${availDot}`} />
                      {availLabel}
                    </span>
                  )}
                </div>
                {isEngaged ? (
                  <button className="w-full py-2 border border-gray-200 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                    View Profile
                  </button>
                ) : (
                  <button
                    onClick={() => onInterviewRequest(m)}
                    className="w-full py-2 border border-[#0070F3] text-[#0070F3] text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Request Interview
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Services & Packages ─────────────────────────────────────────────────

function ServicesTab({ vendor, onRFP, packages, serviceCategories }: { vendor: any; onRFP: () => void; packages: DBPackage[]; serviceCategories: string[] }) {
  const displayServices = serviceCategories.length > 0 ? serviceCategories : (vendor.service_categories || []);
  const serviceDescriptions: Record<string, string> = {
    'Software Development': 'Full-cycle web application development: discovery, architecture, build, QA, and deployment. We work in React, Node.js, Go, and Python.',
    'Cloud & Infrastructure': 'Cloud architecture, migration, and ongoing management across AWS and GCP. Infrastructure-as-Code with Terraform.',
    DevOps: 'CI/CD pipelines, Kubernetes orchestration, monitoring, and DevSecOps practices to accelerate your engineering team.',
    'QA & Testing': 'End-to-end and integration testing with Playwright and Cypress. API and performance testing. 90%+ coverage targets.',
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Services</h2>
        {displayServices.length === 0 ? (
          <p className="text-gray-400 text-sm">No services listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayServices.map((s: string) => (
              <div key={s} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-[#0070F3]">{SERVICE_ICONS[s] || <Briefcase className="h-5 w-5" />}</div>
                  <h3 className="font-bold text-gray-800 text-sm">{s}</h3>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed mb-4">
                  {serviceDescriptions[s] || 'Service description coming soon.'}
                </p>
                <button
                  onClick={onRFP}
                  className="px-4 py-2 border border-[#0070F3] text-[#0070F3] text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Request Quote
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Packages</h2>
        {packages.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
            <Briefcase className="h-8 w-8 mx-auto mb-3 text-gray-200" />
            <p className="text-sm">No packages listed yet.</p>
            <p className="text-xs mt-1">This vendor operates on a bespoke project basis. Use "Request Quote" above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map(pkg => (
              <div key={pkg.id} className="bg-white rounded-xl border border-gray-100 p-5">
                {pkg.category && <span className="text-xs bg-blue-50 text-[#0070F3] font-semibold px-2 py-0.5 rounded-full mb-2 inline-block">{pkg.category}</span>}
                <h3 className="font-bold text-gray-800 text-sm mb-1">{pkg.name}</h3>
                {pkg.description && <p className="text-gray-500 text-xs leading-relaxed mb-3">{pkg.description}</p>}
                {pkg.features && pkg.features.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {pkg.features.map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Check className="h-3.5 w-3.5 text-[#0070F3] flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between mt-2">
                  {pkg.price != null && <span className="font-bold text-[#0B2D59]">£{pkg.price.toLocaleString()}</span>}
                  {pkg.delivery_days != null && <span className="text-xs text-gray-400">{pkg.delivery_days} days delivery</span>}
                </div>
                {pkg.tech_stack && pkg.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {pkg.tech_stack.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>)}
                  </div>
                )}
                {pkg.ideal_for && <p className="text-xs text-gray-400 mt-2">Ideal for: {pkg.ideal_for}</p>}
                <button onClick={onRFP} className="mt-3 w-full px-4 py-2 border border-[#0070F3] text-[#0070F3] text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                  Request Quote
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Case Studies ────────────────────────────────────────────────────────

type CaseStudy = {
  id: string;
  title: string;
  challenge?: string | null;
  solution?: string | null;
  outcome?: string | null;
  tech_stack?: string[] | null;
  created_at?: string | null;
  // real case_studies table shape
  project_title?: string;
  services_delivered?: string[];
  // demo shape fields
  industry?: string;
  tech?: string[];
  duration?: string;
  team_size?: number;
  services?: string[];
  outcomes?: ({ metric: string; description: string } | string)[];
  client_quote?: string | null;
};

function CaseStudiesTab({ caseStudies }: { caseStudies: CaseStudy[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const items = caseStudies.length > 0 ? caseStudies : DEMO_CASE_STUDIES;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Case Studies</h2>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">No case studies available yet.</p>
      ) : items.map(cs => {
        const isExpanded = expanded[cs.id];
        // Support both the real case_studies table shape (project_title, services_delivered,
        // outcomes as a plain string[]) and the demo shape (title, services, outcomes as
        // {metric, description}[]).
        const title = cs.title || cs.project_title || 'Case Study';
        const tech = cs.tech_stack || cs.tech || [];
        const services = cs.services || cs.services_delivered || [];
        const rawOutcomes = cs.outcomes || (cs.outcome ? [cs.outcome] : []);
        const outcomes = rawOutcomes.map(o => typeof o === 'string' ? { metric: o, description: '' } : o);
        return (
          <div key={cs.id} className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-bold text-gray-800">{title}</h3>
                  {cs.industry && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cs.industry}</span>}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {tech.map(t => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <ul className="space-y-1">
                  {outcomes.slice(0, 2).map(o => (
                    <li key={o.metric} className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <TrendingUp className="h-4 w-4 flex-shrink-0" />
                      <span>{o.metric}</span>
                      {o.description && <span className="text-gray-400 font-normal text-xs">— {o.description}</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setExpanded(p => ({ ...p, [cs.id]: !p[cs.id] }))}
                className="text-[#0070F3] text-sm font-medium hover:underline flex-shrink-0"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            </div>

            {isExpanded && (
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                {(cs.duration || cs.team_size || services.length > 0) && (
                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 mb-2">
                    {cs.duration && <span><span className="font-semibold text-gray-700">Duration:</span> {cs.duration}</span>}
                    {cs.team_size && <span><span className="font-semibold text-gray-700">Team size:</span> {cs.team_size} people</span>}
                    {services.length > 0 && <span><span className="font-semibold text-gray-700">Services:</span> {services.join(', ')}</span>}
                  </div>
                )}
                {cs.challenge && (
                  <div>
                    <div className="font-semibold text-gray-700 mb-1 text-sm">The Challenge</div>
                    <p className="text-gray-500 text-sm">{cs.challenge}</p>
                  </div>
                )}
                {cs.solution && (
                  <div>
                    <div className="font-semibold text-gray-700 mb-1 text-sm">Our Solution</div>
                    <p className="text-gray-500 text-sm">{cs.solution}</p>
                  </div>
                )}
                {outcomes.length > 0 && (
                  <div>
                    <div className="font-semibold text-gray-700 mb-2 text-sm">Outcomes</div>
                    <ul className="space-y-2">
                      {outcomes.map(o => (
                        <li key={o.metric} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>
                            <span className="font-semibold text-gray-700">{o.metric}</span>
                            {o.description && <span className="text-gray-500"> — {o.description}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {cs.client_quote && (
                  <div className="border-l-4 border-blue-300 pl-4 py-1 bg-blue-50 rounded-r-lg">
                    <p className="text-sm text-blue-800 italic">"{cs.client_quote}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Referrals ───────────────────────────────────────────────────────────

type Referral = {
  id: string;
  contact_name?: string | null;
  referee_name?: string | null;
  job_title?: string | null;
  referee_title?: string | null;
  company?: string | null;
  referee_company?: string | null;
  relationship_type?: string | null;
  project_vouched_for?: string | null;
  project_duration?: string | null;
  project_value_band?: string | null;
  specific_outcome?: string | null;
  written_statement?: string | null;
  statement?: string | null;
  confirmed?: boolean | null;
  verified?: boolean | null;
  confirmed_at?: string | null;
  created_at?: string | null;
};

function ReferralsTab({ referrals }: { referrals: Referral[] }) {
  const items = referrals.length > 0 ? referrals : DEMO_REFERRALS;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#0B2D59]">Referrals</h2>
        <p className="text-xs text-gray-400">Referee email addresses are never shared with buyers.</p>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">No referrals confirmed yet.</p>
      ) : (
        items.map(r => {
          // Normalise field names between DB shape and demo shape
          const contactName = r.contact_name || r.referee_name || '';
          const jobTitle = r.job_title || r.referee_title || '';
          const company = r.company || r.referee_company || '';
          const statement = r.written_statement || r.statement || null;
          const confirmed = r.confirmed ?? r.verified ?? false;
          const confirmedAt = r.confirmed_at || (r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : null);
          return (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-gray-800">{contactName}</div>
                <div className="text-sm text-gray-500">{jobTitle} · {company}</div>
                {r.relationship_type && <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{r.relationship_type}</span>}
              </div>
              {confirmed ? (
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium whitespace-nowrap">
                  <CheckCircle className="h-4 w-4" />
                  Confirmed {confirmedAt}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium whitespace-nowrap">
                  <Clock className="h-4 w-4" />
                  Confirmation pending
                </span>
              )}
            </div>

            {/* Project details */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              {r.project_vouched_for && (
                <div className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">Project:</span> {r.project_vouched_for}
                </div>
              )}
              <div className="flex gap-4 text-xs text-gray-500">
                {r.project_duration && <span><span className="font-semibold text-gray-700">Duration:</span> {r.project_duration}</span>}
                {r.project_value_band && <span><span className="font-semibold text-gray-700">Value:</span> {r.project_value_band}</span>}
              </div>
              {r.specific_outcome && (
                <div className="text-xs text-gray-600 mt-1">{r.specific_outcome}</div>
              )}
            </div>

            {/* Written statement */}
            {statement && (
              <div className="border-l-4 border-teal-300 pl-4 py-1 bg-teal-50 rounded-r-lg">
                <p className="text-sm text-teal-800 italic">"{statement}"</p>
              </div>
            )}
          </div>
          );
        })
      )}
    </div>
  );
}

// ─── Tab: Reviews ─────────────────────────────────────────────────────────────

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  would_recommend?: boolean | null;
  created_at?: string | null;
  profiles?: { full_name: string | null } | null;
  // demo shape fields
  company_type?: string;
  location?: string;
  project_type?: string;
  budget_range?: string;
  date?: string;
  overall?: number;
  quality?: number;
  communication?: number;
  timeliness?: number;
  professionalism?: number;
  text?: string;
  vendor_response?: string | null;
};

function ReviewsTab({ vendor, reviews }: { vendor: VendorData; reviews: Review[] }) {
  const items = reviews.length > 0 ? reviews : DEMO_REVIEWS;

  const avgRating = items.length > 0
    ? (items.reduce((sum, r) => sum + (r.overall ?? r.rating ?? 0), 0) / items.length).toFixed(1)
    : String(vendor.rating);

  return (
    <div>
      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 flex flex-col md:flex-row gap-8">
        <div className="text-center flex-shrink-0">
          <div className="text-5xl font-bold text-[#0B2D59] mb-1">{avgRating}</div>
          <Stars rating={parseFloat(avgRating)} size="md" />
          <div className="text-sm text-gray-400 mt-1">out of 5</div>
        </div>
        <div className="text-center flex-shrink-0 self-center">
          <div className="text-2xl font-bold text-gray-700">{items.length || vendor.review_count}</div>
          <div className="text-sm text-gray-400">reviews</div>
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-4">
        {items.map(r => {
          const overallRating = r.overall ?? r.rating ?? 0;
          const reviewDate = r.date || (r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
          const reviewerName = r.profiles?.full_name || r.company_type || 'Anonymous';
          const reviewText = r.text || r.comment || '';
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div>
                  <div className="font-semibold text-gray-700 text-sm">{reviewerName}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    {r.location && <><MapPin className="h-3 w-3" />{r.location} · </>}
                    {r.project_type && <>{r.project_type} · </>}
                    {r.budget_range && <>{r.budget_range} · </>}
                    {reviewDate}
                  </div>
                </div>
                <Stars rating={overallRating} />
              </div>
              {(r.quality || r.communication || r.timeliness || r.professionalism) && (
                <div className="flex gap-4 mb-3 flex-wrap text-xs text-gray-500">
                  {(['quality', 'communication', 'timeliness', 'professionalism'] as const).map(k => r[k] ? (
                    <span key={k} className="capitalize">
                      <span className="font-medium text-gray-600">{k.charAt(0).toUpperCase() + k.slice(1)}:</span> {r[k]}/5
                    </span>
                  ) : null)}
                </div>
              )}
              {reviewText && <p className="text-gray-600 text-sm">{reviewText}</p>}
              {r.vendor_response && (
                <div className="mt-3 border-l-4 border-blue-200 pl-4 py-2 bg-blue-50 rounded-r-lg">
                  <div className="text-xs font-semibold text-blue-700 mb-1">Vendor response</div>
                  <p className="text-sm text-blue-800">{r.vendor_response}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Calendar & Availability ─────────────────────────────────────────────

const AVAILABILITY_LABEL: Record<string, { label: string; dot: string }> = {
  available: { label: 'Available for new engagements', dot: 'bg-green-500' },
  available_from: { label: 'Available soon', dot: 'bg-amber-400' },
  limited: { label: 'Limited availability', dot: 'bg-amber-400' },
  booked: { label: 'Fully booked', dot: 'bg-red-400' },
};

function CalendarTab({ vendor, onDiscovery }: { vendor: any; onDiscovery: () => void }) {
  const connected = vendor.booking_method === 'cal_diy' && !!vendor.cal_diy_url;
  const avail = AVAILABILITY_LABEL[vendor.availability_status ?? 'available'] ?? AVAILABILITY_LABEL.available;

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Calendar & Availability</h2>

      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2.5 h-2.5 rounded-full ${avail.dot}`} />
        <span className="text-sm font-medium text-gray-700">{avail.label}</span>
        {vendor.availability_status === 'available_from' && vendor.availability_from && (
          <span className="text-xs text-gray-400">from {new Date(vendor.availability_from).toLocaleDateString('en-GB')}</span>
        )}
      </div>

      {connected ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <iframe
            src={vendor.cal_diy_url}
            title="Book a discovery call with this vendor"
            className="w-full"
            style={{ height: 700, border: 0 }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">No calendar connected yet.</div>
            <div className="text-xs text-gray-400 mb-4">
              Send a message to arrange a discovery call directly with this vendor.
            </div>
            <button
              onClick={onDiscovery}
              className="px-5 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book a Discovery Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RFP Modal ────────────────────────────────────────────────────────────────

function RFPModal({ vendor, onClose }: { vendor: VendorData; onClose: () => void }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [budgetFrom, setBudgetFrom] = useState('');
  const [budgetTo, setBudgetTo] = useState('');
  const [model, setModel] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [showProfileGate, setShowProfileGate] = useState(false);

  const submit = async () => {
    if (!user) { navigate('/signin'); return; }
    if (!title.trim() || !serviceType) { setError('Title and service type are required.'); return; }
    if (description.trim().length < 100) {
      setError(`Description must be at least 100 characters (currently ${description.trim().length}).`);
      return;
    }
    setSending(true);
    setError('');
    try {
      if (!(await hasCompanyProfile(user.id))) {
        setShowProfileGate(true);
        setSending(false);
        return;
      }
      if (await isBuyerBlacklisted(user.id)) {
        setError('This account is blacklisted and cannot send new enquiries. Contact support@collabov.com.');
        setSending(false);
        return;
      }
      const { data: enquiry, error: insErr } = await supabase.from('enquiries').insert({
        buyer_id: user.id,
        vendor_id: (vendor as any).id,
        enquiry_type: 'rfp',
        subject: title.trim(),
        title: title.trim(),
        service_type: serviceType,
        message: description.trim(),
        budget_from: budgetFrom ? Number(budgetFrom) : null,
        budget_to: budgetTo ? Number(budgetTo) : null,
        engagement_model: model || null,
        buyer_email: profile?.email ?? user.email ?? '',
        status: 'new',
      }).select().single();
      if (insErr) throw insErr;
      await notify((vendor as any).id, 'enquiry', 'New proposal request',
        `You received a direct RFP: "${title.trim()}". Respond from your Enquiries inbox.`,
        '/vendor/dashboard/enquiries');
      await logEvent('rfp_sent', user.id, 'buyer', 'enquiry', enquiry.id, { vendor_id: (vendor as any).id });
      setSent(true);
    } catch (e) {
      console.error('RFP failed:', e);
      setError('Could not send the request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0B2D59] mb-1">Proposal request sent</h2>
          <p className="text-sm text-gray-500 mb-5">
            {vendor.company_name} has been notified. Their proposal will appear in your Proposals inbox.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/proposals')} className="px-5 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg">View Proposals</button>
            <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg">Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (showProfileGate) {
    return <CompanyProfileGateModal action="request a proposal" onClose={() => setShowProfileGate(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0B2D59]">Request a Proposal</h2>
            <p className="text-xs text-gray-400">from {vendor.company_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project title <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. React dashboard for SaaS platform" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service type <span className="text-red-500">*</span></label>
            <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]">
              <option value="">Select service type</option>
              {['Software Development', 'Cloud & Infrastructure', 'DevOps', 'QA & Testing', 'Staff Augmentation', 'Other'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project description <span className="text-red-500">*</span>{' '}
              <span className="text-gray-400 font-normal">(min 100 characters)</span>
            </label>
            <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what you need built or managed, key requirements, and any technical context." className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none" />
            <p className="text-xs text-gray-400 mt-1">{description.trim().length}/100 characters minimum</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget from (£)</label>
              <input type="number" value={budgetFrom} onChange={e => setBudgetFrom(e.target.value)} placeholder="e.g. 10000" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget to (£)</label>
              <input type="number" value={budgetTo} onChange={e => setBudgetTo(e.target.value)} placeholder="e.g. 50000" className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Engagement model</label>
            <div className="space-y-2">
              {['Long-term dedicated resource', 'Short-term project', 'Flexible', 'Not sure'].map(m => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="model" checked={model === m} onChange={() => setModel(m)} className="text-[#0070F3]" />
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
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={submit} disabled={sending} className="w-full py-3 bg-[#0070F3] text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {sending ? 'Sending…' : 'Send Proposal Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const VendorProfilePage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [dbEmployees, setDbEmployees] = useState<DBEmployee[]>([]);
  const [dbPackages, setDbPackages] = useState<DBPackage[]>([]);
  const [dbPortfolio, setDbPortfolio] = useState<DBPortfolioItem[]>([]);
  const [dbReviews, setDbReviews] = useState<DBReview[]>([]);
  const [dbCaseStudies, setDbCaseStudies] = useState<DBCaseStudy[]>([]);
  const [dbReferrals, setDbReferrals] = useState<DBReferral[]>([]);
  const [dbServiceCategories, setDbServiceCategories] = useState<string[]>([]);
  const [dbIndustries, setDbIndustries] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState('Overview');
  const [sticky, setSticky] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showRFP, setShowRFP] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [interviewTarget, setInterviewTarget] = useState<any>(null);

  const headerRef = useRef<HTMLDivElement>(null);

  // Fetch from Supabase
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (vendorId === 'demo') {
        if (!cancelled) { setVendor(DEMO_VENDOR as any); setLoading(false); }
        return;
      }
      try {
        // Fetch vendor
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendorId)
          .single();
        if (cancelled) return;
        if (vendorError || !vendorData) { setNotFound(true); setLoading(false); return; }
        setVendor(vendorData as any);

        // Fetch related data in parallel
        const [
          { data: employeesData },
          { data: packagesData },
          { data: portfolioData },
          { data: reviewsData },
          { data: servicesData },
          { data: industriesData },
        ] = await Promise.all([
          supabase.from('vendor_employees').select('*').eq('vendor_id', vendorId),
          supabase.from('vendor_packages').select('*').eq('vendor_id', vendorId),
          supabase.from('portfolio_items').select('*').eq('vendor_id', vendorId),
          supabase.from('reviews').select('*, profiles(full_name)').eq('vendor_id', vendorId).order('created_at', { ascending: false }),
          supabase.from('vendor_services').select('service_categories(name)').eq('vendor_id', vendorId),
          supabase.from('vendor_industries').select('industries(name)').eq('vendor_id', vendorId),
        ]);

        if (!cancelled) {
          setDbEmployees((employeesData || []) as DBEmployee[]);
          setDbPackages((packagesData || []) as DBPackage[]);
          setDbPortfolio((portfolioData || []) as DBPortfolioItem[]);
          setDbReviews((reviewsData || []) as DBReview[]);
          setDbServiceCategories(((servicesData || []) as any[]).map((s: any) => s.service_categories?.name).filter(Boolean));
          setDbIndustries(((industriesData || []) as any[]).map((i: any) => i.industries?.name).filter(Boolean));
        }

        // Try sprint-3 tables — graceful fallback
        try {
          const [{ data: csData }, { data: refData }] = await Promise.all([
            supabase.from('case_studies').select('*').eq('vendor_id', vendorId),
            supabase.from('vendor_referrals').select('*').eq('vendor_id', vendorId),
          ]);
          if (!cancelled) {
            setDbCaseStudies((csData || []) as DBCaseStudy[]);
            setDbReferrals((refData || []) as DBReferral[]);
          }
        } catch {
          // tables don't exist yet — leave as []
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Log profile view (fire and forget)
      const logProfileView = async () => {
        try {
          const { supabase: sb } = await import('../lib/supabase');
          await sb.from('platform_event').insert({
            event_type: 'profile_view',
            actor_id: user?.id || '00000000-0000-0000-0000-000000000000',
            actor_role: user ? (user.user_metadata?.user_type || 'anonymous') : 'anonymous',
            entity_type: 'vendor',
            entity_id: vendorId || 'demo',
            payload: { page: 'vendor_profile', vendor_id: vendorId },
          });
          if (vendorId && vendorId !== 'demo') {
            await sb.rpc('increment_profile_views', { vendor_id: vendorId });
          }
        } catch { /* silent */ }
      };
      if (!cancelled) logProfileView();
    }
    load();
    return () => { cancelled = true; };
  }, [vendorId, user]);

  useEffect(() => {
    const onScroll = () => {
      if (headerRef.current) setSticky(window.scrollY > headerRef.current.offsetHeight + 60);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openRFP = () => {
    if (!user) { navigate(`/signin?returnUrl=/vendor/profile/${vendorId}`); return; }
    setShowRFP(true);
  };

  const handleInterviewRequest = (m: any) => {
    if (!user) { navigate(`/signin?returnUrl=/vendor/profile/${vendorId}`); return; }
    setInterviewTarget(m);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </div>
    );
  }

  if (notFound || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24">
        <div className="text-center">
          <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-700 mb-2">Vendor profile not found</h1>
          <p className="text-gray-500 text-sm mb-6">This profile may not exist or is pending approval.</p>
          <Link to="/results" className="px-4 py-2 bg-[#0070F3] text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Browse verified vendors
          </Link>
        </div>
      </div>
    );
  }

  const initials = vendor.company_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact sticky bar */}
      {sticky && (
        <div className="fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <div>
              <div className="font-semibold text-[#0B2D59] text-sm">{vendor.company_name}</div>
              <div className="flex items-center gap-1">
                <Stars rating={vendor.rating} />
                <span className="text-xs text-gray-500">{vendor.rating}</span>
              </div>
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
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-[#0B2D59]">{vendor.company_name}</h1>
                  {(vendor.is_verified || vendor.verification_status === 'verified') && (
                    <span className="flex items-center gap-1 text-sm text-[#0070F3] font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="h-4 w-4" /> Verified
                    </span>
                  )}
                  {vendor.business_type && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 capitalize">
                      {vendor.business_type}
                    </span>
                  )}
                </div>
                {vendor.tagline && (
                  <p className="text-sm text-gray-500 mt-1 max-w-xl">{vendor.tagline}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap text-sm text-gray-500">
                  <Stars rating={vendor.rating} />
                  <span className="font-bold text-gray-700">{vendor.rating}</span>
                  <span>({vendor.review_count} reviews)</span>
                  <span>·</span>
                  <span>{vendor.projects_completed ?? vendor.engagement_count ?? 0} engagements</span>
                  <span>·</span>
                  {(vendor.referral_count ?? 0) > 0 && (
                    <>
                      <span className="flex items-center gap-1 text-teal-600 font-medium">
                        <UserCheck className="h-4 w-4" />{vendor.referral_count} referrals verified
                      </span>
                      <span>·</span>
                    </>
                  )}
                  {(vendor.city || vendor.country) && <><span>{[vendor.city, vendor.country].filter(Boolean).join(', ')}</span><span>·</span></>}
                  <span>Member since {vendor.member_since ?? (vendor.created_at ? new Date(vendor.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'N/A')}</span>
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
              {vendor.business_type === 'agency' && (
                <Link
                  to={`/discovery-brief?vendor=${vendor.id}`}
                  className="px-4 py-2.5 border border-[#0070F3] text-[#0070F3] text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Start a Discovery
                </Link>
              )}
              <button
                onClick={() => setActiveTab('Calendar & Availability')}
                className="px-4 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Check Availability
              </button>
              <button
                onClick={() => setSaved(!saved)}
                className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-[#0070F3]"
              >
                {saved ? <BookmarkCheck className="h-5 w-5 text-[#0070F3]" /> : <Bookmark className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs — min 3 employee profiles required before staff-aug vendors show Team Members to buyers */}
        <div className="container mx-auto px-6">
          <div className="flex gap-0 border-b border-gray-200 overflow-x-auto">
            {TABS.filter(tab =>
              tab !== 'Team Members' || vendor.business_type !== 'staffaug' || dbEmployees.length >= 3
            ).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab ? 'border-[#0070F3] text-[#0070F3]' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'Overview' && <OverviewTab vendor={vendor} onRFP={openRFP} serviceCategories={dbServiceCategories} industries={dbIndustries} />}
        {activeTab === 'Team Members' && <TeamTab onInterviewRequest={handleInterviewRequest} employees={dbEmployees} />}
        {activeTab === 'Services & Packages' && <ServicesTab vendor={vendor} onRFP={openRFP} packages={dbPackages} serviceCategories={dbServiceCategories} />}
        {activeTab === 'Case Studies' && <CaseStudiesTab caseStudies={dbCaseStudies} />}
        {activeTab === 'Referrals' && <ReferralsTab referrals={dbReferrals} />}
        {activeTab === 'Reviews' && <ReviewsTab vendor={vendor} reviews={dbReviews} />}
        {activeTab === 'Calendar & Availability' && <CalendarTab vendor={vendor} onDiscovery={() => setShowDiscovery(true)} />}
      </div>

      {/* Modals */}
      {showRFP && <RFPModal vendor={vendor} onClose={() => setShowRFP(false)} />}
      {showDiscovery && <DiscoveryModal vendor={vendor} onClose={() => setShowDiscovery(false)} />}
      {interviewTarget && (
        <InterviewModal member={interviewTarget} vendorId={(vendor as any).id ?? vendorId ?? ''} onClose={() => setInterviewTarget(null)} />
      )}
    </div>
  );
};

export default VendorProfilePage;
