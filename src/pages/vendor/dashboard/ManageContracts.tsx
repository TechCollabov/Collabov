import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { formatGBP } from '../../../lib/workflows';

/** Live engagements for this vendor — incoming SOWs to sign and active work. */
function LiveEngagements() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: engs } = await supabase
        .from('engagements')
        .select('id, project_title, status, engagement_type, total_value, payment_model, contract_id, created_at')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });
      const contractIds = (engs ?? []).map(e => e.contract_id).filter(Boolean);
      const { data: cons } = contractIds.length
        ? await supabase.from('contracts').select('id, signed_by_buyer, signed_by_vendor, contract_number').in('id', contractIds)
        : { data: [] as any[] };
      const conMap = new Map((cons ?? []).map((c: any) => [c.id, c]));
      setRows((engs ?? []).map(e => ({ ...e, contract: e.contract_id ? conMap.get(e.contract_id) : null })));
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-blue-500 animate-spin" /></div>;
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center text-sm text-gray-500">
        No engagements yet. Once a buyer's proposal is accepted and a SOW is signed, it will appear here.
      </div>
    );
  }

  const STATUS_CLS: Record<string, string> = {
    pending_signature: 'bg-amber-100 text-amber-700',
    pending_ir35: 'bg-amber-100 text-amber-700',
    active: 'bg-green-100 text-green-700',
    closing: 'bg-purple-100 text-purple-700',
    terminated: 'bg-red-100 text-red-600',
    closed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold mb-1">Engagements</h2>
      <p className="text-xs text-gray-400 mb-4">Incoming SOWs to sign and live delivery — open the workspace to submit evidence, respond to flags and manage disputes.</p>
      <div className="space-y-2">
        {rows.map(e => {
          const needsSignature = e.contract && !e.contract.signed_by_vendor;
          return (
            <Link key={e.id} to={`/engagement/${e.id}`}
              className="flex flex-wrap items-center justify-between gap-2 border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/40 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{e.project_title ?? 'Engagement'}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[e.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {e.status?.replace(/_/g, ' ')}
                  </span>
                  {needsSignature && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">Sign now</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {e.contract?.contract_number ?? 'No contract'} · {e.payment_model} · {e.total_value != null ? formatGBP(e.total_value) : '—'}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const ManageContracts: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Manage Contracts</h1>
      <LiveEngagements />
    </div>
  );
};

export default ManageContracts;
