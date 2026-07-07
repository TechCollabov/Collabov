import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, ShieldCheck, Download, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatGBP, hoursLeft } from '../../lib/workflows';

type Tab = 'contracts' | 'disputes' | 'ir35' | 'gdpr';

const BuyerGovernance: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('contracts');
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [engagements, setEngagements] = useState<any[]>([]);
  const [vendorNames, setVendorNames] = useState<Map<string, string>>(new Map());

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [conRes, engRes] = await Promise.all([
      supabase.from('contracts').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('engagements').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false }),
    ]);
    const engagementIds = (engRes.data ?? []).map((e: any) => e.id);
    const { data: disputeRows } = engagementIds.length
      ? await supabase.from('disputes').select('*').in('engagement_id', engagementIds).order('opened_at', { ascending: false })
      : { data: [] as any[] };

    const vendorIds = Array.from(new Set([
      ...(conRes.data ?? []).map((c: any) => c.vendor_id),
      ...(engRes.data ?? []).map((e: any) => e.vendor_id),
    ].filter(Boolean)));
    const { data: vendors } = vendorIds.length
      ? await supabase.from('vendors').select('id, company_name').in('id', vendorIds)
      : { data: [] as any[] };
    setVendorNames(new Map((vendors ?? []).map((v: any) => [v.id, v.company_name])));

    setContracts(conRes.data ?? []);
    setEngagements(engRes.data ?? []);
    setDisputes(disputeRows ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const downloadSowText = (contract: any) => {
    const lines = [
      'STATEMENT OF WORK / CONTRACT',
      `Contract number: ${contract.contract_number}`,
      `Title: ${contract.title}`,
      `Value: ${formatGBP(contract.total_value)}`,
      `Status: ${contract.status}`,
      `Start: ${contract.start_date}${contract.end_date ? ` — End: ${contract.end_date}` : ''}`,
      '',
      contract.terms_and_conditions ?? '',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contract_${contract.contract_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDpa = (vendorName: string) => {
    const lines = [
      'GDPR DATA PROCESSING AGREEMENT',
      `Between: Buyer and ${vendorName}`,
      'Schedule 3 — Mutual NDA + GDPR DPA (standard Collabov platform terms)',
      '',
      'This DPA governs the processing of personal data between the parties',
      'for the duration of the engagement, per UK GDPR requirements.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DPA_${vendorName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const staffAugEngagements = engagements.filter(e => e.engagement_type === 'staff_aug');

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-8 w-8 text-[#0070F3] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/buyer/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-[#0B2D59]">Governance</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">Contracts, disputes, IR35 status and compliance downloads — everything needed for audit, in one place.</p>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {([
            ['contracts', 'Contracts & SOW'],
            ['disputes', 'Dispute Centre'],
            ['ir35', 'IR35 Status'],
            ['gdpr', 'GDPR Downloads'],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key ? 'bg-white text-[#0070F3] shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'contracts' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#0B2D59] mb-4 flex items-center gap-2"><FileText className="h-4 w-4" /> Contracts & SOW Library</h2>
            <div className="space-y-3">
              {contracts.length === 0 && <p className="text-sm text-gray-400">No contracts yet.</p>}
              {contracts.map(c => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 border border-gray-100 rounded-xl p-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{c.title}</div>
                    <div className="text-xs text-gray-400">{c.contract_number} · {vendorNames.get(c.vendor_id) ?? 'Vendor'} · {formatGBP(c.total_value)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                    <button onClick={() => downloadSowText(c)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'disputes' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#0B2D59] mb-4 flex items-center gap-2"><Scale className="h-4 w-4" /> Dispute Centre</h2>
            <div className="space-y-3">
              {disputes.length === 0 && <p className="text-sm text-gray-400">No disputes on any engagement.</p>}
              {disputes.map(d => {
                const eng = engagements.find(e => e.id === d.engagement_id);
                const hrs = d.status === 'bilateral' ? Math.max(0, hoursLeft(d.bilateral_deadline)) : null;
                return (
                  <Link key={d.id} to={eng ? `/engagement/${eng.id}` : '#'} className="block border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/40 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 capitalize">{d.reason?.replace(/_/g, ' ')} — {eng?.project_title ?? 'Engagement'}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        d.status === 'resolved' ? 'bg-green-100 text-green-700' : d.status === 'admin_review' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-600'}`}>
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{d.description}</p>
                    {hrs !== null && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />{Math.floor(hrs)}h left in bilateral window</p>
                    )}
                    {d.status === 'resolved' && d.resolution && (
                      <p className="text-xs text-green-700 mt-1">Resolution: {d.resolution.replace(/_/g, ' ')}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'ir35' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#0B2D59] mb-4 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> IR35 Status per Engagement</h2>
            <div className="space-y-3">
              {staffAugEngagements.length === 0 && <p className="text-sm text-gray-400">No staff augmentation engagements.</p>}
              {staffAugEngagements.map(e => (
                <Link key={e.id} to={`/engagement/${e.id}`} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/40 transition-colors">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{e.project_title}</div>
                    <div className="text-xs text-gray-400">{vendorNames.get(e.vendor_id) ?? 'Vendor'} · {e.working_location ?? 'Location not set'}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    e.ir35_status === 'outside' ? 'bg-green-100 text-green-700'
                    : e.ir35_status === 'inside' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {e.ir35_status ?? 'n/a'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {tab === 'gdpr' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#0B2D59] mb-4 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> GDPR DPA Downloads</h2>
            <div className="space-y-3">
              {contracts.length === 0 && <p className="text-sm text-gray-400">No contracts yet.</p>}
              {contracts.map(c => (
                <div key={c.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4">
                  <div className="text-sm text-gray-700">{vendorNames.get(c.vendor_id) ?? 'Vendor'} — {c.title}</div>
                  <button onClick={() => downloadDpa(vendorNames.get(c.vendor_id) ?? 'Vendor')} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    <Download className="h-3.5 w-3.5" /> Download DPA
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerGovernance;
