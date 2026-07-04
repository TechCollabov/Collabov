import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, Briefcase, ChevronDown, Star, ArrowRight, Loader2, Bookmark, EyeOff } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { matchScore, matchBand, notify, logEvent } from '../../../lib/workflows';

interface JobRow {
  id: string;
  title: string;
  description: string;
  category: string | null;
  service_type: string | null;
  job_kind: string;
  budget_amount: number;
  budget_from: number | null;
  budget_to: number | null;
  budget_type: string;
  tech_stack: string[] | null;
  submission_deadline: string | null;
  created_at: string;
  customer_id: string;
  company?: string;
}

const CATEGORIES = ['All', 'Software Development', 'Managed IT', 'Cybersecurity', 'Cloud & Infrastructure', 'DevOps', 'QA & Testing'];

const MATCH_BAND_COLOR: Record<string, string> = {
  High: 'bg-green-100 text-green-700',
  Medium: 'bg-blue-100 text-blue-700',
  Low: 'bg-gray-100 text-gray-600',
};

const JobBoard: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [bestMatchOnly, setBestMatchOnly] = useState(false);
  const [jobs, setJobs] = useState<(JobRow & { score: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState<Record<string, string>>({}); // job_id -> submitted_at
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [proposal, setProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: vendor } = await supabase
      .from('vendors')
      .select('service_categories, tech_stack, industry_focus')
      .eq('id', user.id)
      .maybeSingle();
    const myServices: string[] = (vendor?.service_categories as string[]) ?? [];
    const myTech: string[] = (vendor?.tech_stack as string[]) ?? [];

    // Public jobs only — admin approval queue is not built yet, so this
    // intentionally shows all public jobs regardless of admin_status.
    const { data: jobRows } = await supabase
      .from('jobs')
      .select('id, title, description, category, service_type, job_kind, budget_amount, budget_from, budget_to, budget_type, tech_stack, submission_deadline, created_at, customer_id')
      .eq('visibility', 'public')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    const customerIds = Array.from(new Set((jobRows ?? []).map(j => j.customer_id)));
    const { data: customers } = customerIds.length
      ? await supabase.from('customers').select('id, company_name').in('id', customerIds)
      : { data: [] as any[] };
    const custMap = new Map((customers ?? []).map((c: any) => [c.id, c.company_name]));

    const scored = (jobRows ?? []).map(j => {
      const jobTech = (j.tech_stack as string[]) ?? [];
      const overlap = jobTech.length > 0 ? jobTech.filter(t => myTech.includes(t)).length / jobTech.length : 0;
      const score = matchScore({
        serviceOverlap: myServices.some(s => s === j.service_type || s === j.category),
        techOverlap: overlap,
        caseStudyIndustryMatch: false,
        caseStudyTechMatch: overlap > 0,
        keywordMatch: false,
      });
      return { ...j, company: custMap.get(j.customer_id) ?? 'Buyer', score } as JobRow & { score: number };
    });
    setJobs(scored);

    // Which jobs has this vendor already applied to?
    const { data: myProposals } = await supabase
      .from('proposals')
      .select('job_id, submitted_at, workflow_state')
      .eq('vendor_id', user.id)
      .not('job_id', 'is', null);
    const appliedMap: Record<string, string> = {};
    (myProposals ?? []).forEach((p: any) => {
      if (p.workflow_state !== 'draft') appliedMap[p.job_id] = p.submitted_at;
    });
    setApplied(appliedMap);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const submitApplication = async (job: JobRow & { score: number }) => {
    if (!user || proposal.trim().length < 20) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('proposals').insert({
        vendor_id: user.id,
        customer_id: job.customer_id,
        job_id: job.id,
        proposal_kind: job.job_kind === 'tender' ? 'standard' : 'standard',
        proposal_content: proposal.trim(),
        approach_summary: proposal.trim(),
        proposed_budget: job.budget_amount ?? job.budget_to ?? 0,
        proposed_timeline: 'See proposal',
        workflow_state: 'sent',
      });
      if (error) throw error;
      await notify(job.customer_id, 'new_proposal', 'New application received',
        `A vendor applied to "${job.title}".`, '/proposals');
      await logEvent('proposal_submitted', user.id, 'vendor', 'proposal', job.id, { source: 'job_board' });
      setApplied(prev => ({ ...prev, [job.id]: new Date().toISOString() }));
      setApplyingTo(null);
      setProposal('');
    } catch (e) {
      console.error('Job application failed:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = jobs.filter(j =>
    !ignored.has(j.id) &&
    (category === 'All' || j.category === category) &&
    (!bestMatchOnly || j.score >= 70) &&
    (search === '' || j.title.toLowerCase().includes(search.toLowerCase()) || (j.company ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 text-[#0070F3] animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2D59]">Job Board</h1>
        <p className="text-sm text-gray-500 mt-1">Browse contract opportunities matched to your profile</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0070F3] text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0070F3] cursor-pointer"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        <label className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer bg-white">
          <input type="checkbox" checked={bestMatchOnly} onChange={e => setBestMatchOnly(e.target.checked)} className="rounded text-[#0070F3]" />
          Best matches only
        </label>
      </div>

      <div className="text-sm text-gray-500 mb-4">{filtered.length} opportunit{filtered.length !== 1 ? 'ies' : 'y'} found</div>

      {/* Job list */}
      <div className="space-y-4">
        {filtered.map(job => {
          const band = matchBand(job.score);
          const budgetLabel = job.budget_from || job.budget_to
            ? `£${(job.budget_from ?? 0).toLocaleString()}–£${(job.budget_to ?? 0).toLocaleString()}`
            : job.budget_amount ? `£${job.budget_amount.toLocaleString()}${job.budget_type === 'hourly' ? '/hr' : ''}` : 'Not specified';
          const alreadyApplied = applied[job.id];
          return (
            <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-50 text-[#0070F3] font-semibold px-2.5 py-1 rounded-full">{job.category ?? job.service_type ?? 'General'}</span>
                    {job.job_kind === 'tender' && <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded-full">Tender</span>}
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${MATCH_BAND_COLOR[band]}`}>
                      <Star className="h-3 w-3" />{band} match
                    </span>
                    <span className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                  <h3 className="font-bold text-[#0B2D59] mb-1">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.company}</span>
                    {job.submission_deadline && (
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Deadline {new Date(job.submission_deadline).toLocaleDateString('en-GB')}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description?.slice(0, 150)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(job.tech_stack ?? []).map(s => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="lg:w-44 flex flex-col gap-3 lg:text-right">
                  <div>
                    <div className="text-[#0070F3] font-bold text-sm">{budgetLabel}</div>
                  </div>
                  {alreadyApplied ? (
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-2 rounded-lg text-center">
                      Applied {new Date(alreadyApplied).toLocaleDateString('en-GB')}
                    </span>
                  ) : (
                    <button
                      onClick={() => setApplyingTo(job.id)}
                      className="flex items-center justify-center gap-1.5 py-2 px-4 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                  <div className="flex gap-2 lg:justify-end">
                    <button onClick={() => setSaved(prev => new Set(prev).add(job.id))} title="Save for later"
                      className={`p-1.5 rounded-lg ${saved.has(job.id) ? 'text-[#0070F3] bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <button onClick={() => setIgnored(prev => new Set(prev).add(job.id))} title="Ignore"
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50">
                      <EyeOff className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline proposal form */}
              {applyingTo === job.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Proposal</h4>
                  <textarea
                    value={proposal}
                    onChange={e => setProposal(e.target.value)}
                    rows={4}
                    placeholder="Briefly describe why you're a great fit for this role and your relevant experience..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setApplyingTo(null); setProposal(''); }}
                      className="py-2 px-4 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitApplication(job)}
                      disabled={proposal.trim().length < 20 || submitting}
                      className="py-2 px-4 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Submitting…' : 'Submit Proposal'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">No jobs match your search.</div>
      )}
    </div>
  );
};

export default JobBoard;
