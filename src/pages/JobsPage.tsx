import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Clock, MapPin, Briefcase, ChevronDown, Loader2, Bookmark } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SAVED_JOBS_KEY = 'collabov_saved_jobs';

function loadSavedIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

interface JobRow {
  id: string;
  title: string;
  description: string;
  category: string | null;
  job_kind: string;
  budget_amount: number;
  budget_type: string;
  currency: string | null;
  timeline: string | null;
  location: string | null;
  tech_stack: string[] | null;
  submission_deadline: string | null;
  created_at: string;
  buyer_id: string;
  company?: string;
}

const CATEGORIES = ['All', 'Software Development', 'Managed IT', 'Cybersecurity', 'Cloud & Infrastructure', 'DevOps', 'QA & Testing'];
const LOCATIONS = ['All', 'Remote (UK)', 'London', 'Manchester', 'Birmingham', 'On-site'];

function formatRate(job: JobRow): string {
  const amount = job.budget_amount ? job.budget_amount.toLocaleString() : '—';
  const currency = job.currency || 'GBP';
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
  return job.budget_type === 'hourly' ? `${symbol}${amount}/hr` : `${symbol}${amount}`;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

const JobsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('All');
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => loadSavedIds());

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: jobRows } = await supabase
        .from('jobs')
        .select('id, title, description, category, job_kind, budget_amount, budget_type, currency, timeline, location, tech_stack, submission_deadline, created_at, buyer_id')
        .eq('visibility', 'public')
        .eq('status', 'open')
        .eq('admin_status', 'live')
        .order('created_at', { ascending: false });

      const buyerIds = Array.from(new Set((jobRows ?? []).map(j => j.buyer_id)));
      const { data: buyers } = buyerIds.length
        ? await supabase.from('buyers').select('id, company_name').in('id', buyerIds)
        : { data: [] as any[] };
      const companyMap = new Map((buyers ?? []).map((b: any) => [b.id, b.company_name]));

      setJobs((jobRows ?? []).map(j => ({ ...j, company: companyMap.get(j.buyer_id) ?? 'Buyer' })));
      setLoading(false);
    })();
  }, []);

  const filtered = jobs.filter(j =>
    (category === 'All' || j.category === category) &&
    (location === 'All' || (j.location ?? '').includes(location)) &&
    (search === '' || j.title.toLowerCase().includes(search.toLowerCase()) || (j.company ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-[#0B2D59] text-white py-14">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-3">IT Contract Jobs</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">Browse contract roles from UK businesses. Day-rate contracts for IT professionals and vendor teams.</p>
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
              placeholder="Search jobs..."
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
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="appearance-none pl-3 pr-8 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0070F3] cursor-pointer"
              >
                {LOCATIONS.map(l => <option key={l} value={l}>{l === 'All' ? 'All Locations' : l}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading jobs...
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-5">{filtered.length} job{filtered.length !== 1 ? 's' : ''} found</div>

            {/* List */}
            <div className="space-y-4">
              {filtered.map(job => (
                <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {job.category && <span className="text-xs bg-blue-50 text-[#0070F3] font-semibold px-2.5 py-1 rounded-full">{job.category}</span>}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{job.job_kind === 'tender' ? 'Tender' : 'Contract'}</span>
                        <span className="text-xs text-gray-400">{timeAgo(job.created_at)}</span>
                      </div>
                      <h2 className="text-lg font-bold text-[#0B2D59] mb-1">{job.title}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.company}</span>
                        {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(job.tech_stack ?? []).map(s => (
                          <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>

                    <div className="lg:w-48 flex flex-col gap-4 lg:text-right">
                      <div className="space-y-1.5">
                        <div className="text-[#0070F3] font-bold text-sm">{formatRate(job)}</div>
                        {job.timeline && (
                          <div className="flex items-center lg:justify-end gap-1 text-sm text-gray-500">
                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{job.timeline}</span>
                          </div>
                        )}
                        {job.submission_deadline && (
                          <div className="text-xs text-gray-400">Deadline: <span className="font-medium text-gray-600">{new Date(job.submission_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                        )}
                      </div>
                      <Link
                        to={`/signin?returnUrl=/vendor/dashboard/jobs`}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Apply Now <ArrowRight className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => toggleSave(job.id)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-4 border text-sm font-medium rounded-lg transition-colors ${
                          savedIds.has(job.id)
                            ? 'border-[#0070F3] text-[#0070F3] bg-blue-50'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 ${savedIds.has(job.id) ? 'fill-current' : ''}`} />
                        {savedIds.has(job.id) ? 'Saved' : 'Save Job'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">No jobs match your search.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
