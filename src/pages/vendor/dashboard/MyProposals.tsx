import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface ProposalRow {
  id: string;
  proposal_kind: string;
  proposed_budget: number;
  proposed_timeline: string;
  workflow_state: string;
  submitted_at: string;
  enquiry_id: string | null;
  job_id: string | null;
  enquiry_title: string | null;
  job_title: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500',
  sent: 'bg-blue-100 text-blue-700',
  keep: 'bg-blue-100 text-blue-700',
  maybe: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  unsuccessful: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
  withdrawn: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  keep: 'Under review',
  maybe: 'Under review',
  accepted: 'Accepted',
  declined: 'Declined',
  unsuccessful: 'Unsuccessful',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
};

const MyProposals: React.FC = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          id, proposal_kind, proposed_budget, proposed_timeline, workflow_state,
          submitted_at, enquiry_id, job_id,
          enquiries (subject),
          jobs (title)
        `)
        .eq('vendor_id', user.id)
        .order('submitted_at', { ascending: false });

      if (!error && data) {
        const mapped: ProposalRow[] = (data as any[]).map((p) => {
          const enquiry = Array.isArray(p.enquiries) ? p.enquiries[0] : p.enquiries;
          const job = Array.isArray(p.jobs) ? p.jobs[0] : p.jobs;
          return {
            id: p.id,
            proposal_kind: p.proposal_kind ?? 'standard',
            proposed_budget: p.proposed_budget ?? 0,
            proposed_timeline: p.proposed_timeline ?? '',
            workflow_state: p.workflow_state ?? 'sent',
            submitted_at: p.submitted_at,
            enquiry_id: p.enquiry_id,
            job_id: p.job_id,
            enquiry_title: enquiry?.subject ?? null,
            job_title: job?.title ?? null,
          };
        });
        setProposals(mapped);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2D59]">My Proposals</h1>
        <p className="text-sm text-gray-500 mt-1">Track the proposals you've submitted to buyers</p>
      </div>

      {proposals.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <div className="font-semibold text-gray-500 mb-1">No proposals submitted yet</div>
          <div className="text-sm text-gray-400">Respond to an enquiry to send your first proposal</div>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => {
            const title = p.proposal_kind === 'discovery'
              ? `Discovery: ${p.enquiry_title ?? ''}`
              : (p.enquiry_title ?? p.job_title ?? 'Untitled request');
            const statusCls = STATUS_STYLES[p.workflow_state] ?? 'bg-gray-100 text-gray-500';
            const statusLabel = STATUS_LABELS[p.workflow_state] ?? p.workflow_state;
            const linkHref = p.enquiry_id
              ? '/vendor/dashboard/enquiries'
              : p.job_id
                ? '/vendor/dashboard/jobs'
                : null;

            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 truncate">{title}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusCls}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    £{p.proposed_budget.toLocaleString()} · {p.proposed_timeline || 'No timeline set'} · Submitted{' '}
                    {p.submitted_at ? new Date(p.submitted_at).toLocaleDateString('en-GB') : '—'}
                  </div>
                </div>
                {linkHref && (
                  <Link
                    to={linkHref}
                    className="flex-shrink-0 text-sm font-semibold text-[#0070F3] hover:text-blue-700 transition-colors"
                  >
                    View
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyProposals;
