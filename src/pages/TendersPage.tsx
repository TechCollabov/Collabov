import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Clock, Building2, DollarSign, ChevronDown, Loader2, Bookmark, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SAVED_TENDERS_KEY = 'collabov_saved_tenders';

function loadSavedIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SAVED_TENDERS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

interface TenderRow {
  id: string;
  title: string;
  tender_title: string | null;
  description: string;
  category: string | null;
  budget_amount: number;
  currency: string | null;
  timeline: string | null;
  submission_deadline: string | null;
  evaluation_criteria: string[] | null;
  tech_stack: string[] | null;
  created_at: string;
  buyer_id: string;
  company?: string;
}

const CATEGORIES = ['All', 'Software Development', 'Managed IT', 'Cybersecurity', 'Cloud & Infrastructure', 'DevOps', 'QA & Testing'];
const BUDGETS = ['All', 'Under £10k', '£10k–£30k', '£30k–£60k', '£60k+'];

function formatBudget(amount: number, currency: string | null): string {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
  return amount ? `${symbol}${amount.toLocaleString()}` : 'Budget on request';
}

function budgetBand(amount: number): string {
  if (amount < 10000) return 'Under £10k';
  if (amount < 30000) return '£10k–£30k';
  if (amount < 60000) return '£30k–£60k';
  return '£60k+';
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

const TendersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [budget, setBudget] = useState('All');
  const [tenders, setTenders] = useState<TenderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => loadSavedIds());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: rows } = await supabase
        .from('jobs')
        .select('id, title, tender_title, description, category, budget_amount, currency, timeline, submission_deadline, evaluation_criteria, tech_stack, created_at, buyer_id')
        .eq('job_kind', 'tender')
        .eq('visibility', 'public')
        .eq('status', 'open')
        .eq('admin_status', 'live')
        .order('created_at', { ascending: false });

      const buyerIds = Array.from(new Set((rows ?? []).map(t => t.buyer_id)));
      const { data: buyers } = buyerIds.length
        ? await supabase.from('buyers').select('id, company_name').in('id', buyerIds)
        : { data: [] as any[] };
      const companyMap = new Map((buyers ?? []).map((b: any) => [b.id, b.company_name]));

      setTenders((rows ?? []).map(t => ({
        ...t,
        company: companyMap.get(t.buyer_id) ?? 'Buyer',
      })));
      setLoading(false);
    })();
  }, []);

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(SAVED_TENDERS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const filtered = tenders.filter(t =>
    (category === 'All' || t.category === category) &&
    (budget === 'All' || budgetBand(t.budget_amount) === budget) &&
    (search === '' || t.title.toLowerCase().includes(search.toLowerCase()) || (t.company ?? '').toLowerCase().includes(search.toLowerCase()))
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

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading tenders...
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-5">{filtered.length} tender{filtered.length !== 1 ? 's' : ''} found</div>

            {/* List */}
            <div className="space-y-4">
              {filtered.map(tender => {
                const displayTitle = tender.tender_title || tender.title;
                const expanded = expandedId === tender.id;
                return (
                  <div key={tender.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {tender.category && <span className="text-xs bg-blue-50 text-[#0070F3] font-semibold px-2.5 py-1 rounded-full">{tender.category}</span>}
                          <span className="text-xs text-gray-400">{timeAgo(tender.created_at)}</span>
                        </div>
                        <h2 className="text-lg font-bold text-[#0B2D59] mb-1">{displayTitle}</h2>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                          <Building2 className="h-4 w-4" />
                          <span>{tender.company}</span>
                        </div>
                        <p className={`text-sm text-gray-600 leading-relaxed mb-4 ${expanded ? '' : 'line-clamp-2'}`}>{tender.description}</p>
                        {expanded && tender.evaluation_criteria && tender.evaluation_criteria.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-semibold text-gray-500 mb-1.5">Evaluation Criteria</div>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                              {tender.evaluation_criteria.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {(tender.tech_stack ?? []).map(s => (
                            <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>

                      <div className="lg:w-52 flex flex-col gap-4 lg:text-right">
                        <div className="space-y-2">
                          <div className="flex lg:flex-col items-center lg:items-end gap-3 lg:gap-1">
                            <div className="flex items-center gap-1 text-[#0070F3] font-bold text-lg">
                              <DollarSign className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm">{formatBudget(tender.budget_amount, tender.currency)}</span>
                            </div>
                            {tender.timeline && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{tender.timeline}</span>
                              </div>
                            )}
                          </div>
                          {tender.submission_deadline && (
                            <div className="text-xs text-gray-400">Deadline: <span className="font-medium text-gray-600">{new Date(tender.submission_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                          )}
                        </div>
                        <Link
                          to={`/signin?returnUrl=/vendor/dashboard/jobs`}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Submit Proposal <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setExpandedId(expanded ? null : tender.id)}
                          className="flex items-center justify-center gap-1.5 py-2 px-4 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {expanded ? <>Hide Brief <ChevronUp className="h-4 w-4" /></> : 'View Brief'}
                        </button>
                        <button
                          onClick={() => toggleSave(tender.id)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-4 border text-sm font-medium rounded-lg transition-colors ${
                            savedIds.has(tender.id)
                              ? 'border-[#0070F3] text-[#0070F3] bg-blue-50'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Bookmark className={`h-4 w-4 ${savedIds.has(tender.id) ? 'fill-current' : ''}`} />
                          {savedIds.has(tender.id) ? 'Saved' : 'Save Tender'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">No tenders match your search.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TendersPage;
