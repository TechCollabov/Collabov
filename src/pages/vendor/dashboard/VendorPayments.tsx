import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, AlertCircle, ExternalLink, ArrowDownToLine, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { formatGBP, paymentBadge, PAYMENT_BADGE_LABEL } from '../../../lib/workflows';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  unfunded: { label: 'Unfunded', color: 'bg-gray-50 text-gray-500', icon: <Clock className="h-3.5 w-3.5" /> },
  funded: { label: 'In Escrow', color: 'bg-blue-50 text-blue-600', icon: <Clock className="h-3.5 w-3.5" /> },
  in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-600', icon: <Clock className="h-3.5 w-3.5" /> },
  submitted: { label: 'In Review', color: 'bg-amber-50 text-amber-700', icon: <Clock className="h-3.5 w-3.5" /> },
  rejected: { label: 'Revision', color: 'bg-red-50 text-red-600', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  in_dispute: { label: 'Disputed — frozen', color: 'bg-red-50 text-red-700', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  released: { label: 'Paid Out', color: 'bg-green-50 text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  refunded: { label: 'Refunded', color: 'bg-gray-50 text-gray-500', icon: <ArrowDownToLine className="h-3.5 w-3.5" /> },
  accepted: { label: 'Accepted', color: 'bg-green-50 text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
};

const VendorPayments: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'milestones' | 'payouts'>('milestones');
  const [loading, setLoading] = useState(true);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [engagements, setEngagements] = useState<Map<string, any>>(new Map());
  const [buyerBadges, setBuyerBadges] = useState<Map<string, string>>(new Map());

  const load = useCallback(async () => {
    if (!user) return;
    const { data: vendorRow } = await supabase.from('vendors').select('stripe_connect_status').eq('id', user.id).maybeSingle();
    setStripeConnected(vendorRow?.stripe_connect_status === 'connected');

    const { data: engs } = await supabase
      .from('engagements')
      .select('id, project_title, buyer_id, payment_model')
      .eq('vendor_id', user.id);
    const engMap = new Map((engs ?? []).map((e: any) => [e.id, e]));
    setEngagements(engMap);

    const buyerIds = Array.from(new Set((engs ?? []).map((e: any) => e.buyer_id)));
    if (buyerIds.length) {
      const { data: buyers } = await supabase.from('customers').select('id, company_name, on_time_payment_rate').in('id', buyerIds);
      setBuyerBadges(new Map((buyers ?? []).map((b: any) => [b.id, `${b.company_name}|${paymentBadge(b.on_time_payment_rate ?? 100)}`])));
    }

    const engIds = (engs ?? []).map((e: any) => e.id);
    if (engIds.length) {
      const [msRes, invRes] = await Promise.all([
        supabase.from('project_milestones').select('*').in('engagement_id', engIds).order('due_date', { ascending: true }),
        supabase.from('invoices').select('*').in('engagement_id', engIds).order('issued_at', { ascending: false }),
      ]);
      setMilestones(msRes.data ?? []);
      setInvoices(invRes.data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const connectStripe = async () => {
    if (!user) return;
    // Simulated Stripe Connect OAuth: recorded in-platform, no real Stripe account.
    await supabase.from('vendors').update({
      stripe_connect_status: 'connected',
      stripe_connected_at: new Date().toISOString(),
    }).eq('id', user.id);
    setStripeConnected(true);
  };

  const escrowed = milestones.filter(m => ['funded', 'in_progress', 'submitted', 'rejected'].includes(m.escrow_status)).reduce((s, m) => s + (m.amount ?? 0), 0);
  const totalEarned = invoices.reduce((s, i) => s + (i.net_amount ?? 0), 0);
  const pendingPayouts = milestones.filter(m => m.escrow_status === 'submitted').reduce((s, m) => s + (m.amount ?? 0), 0);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 text-[#0070F3] animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2D59]">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">All four payment models in one table — milestone, monthly, quarterly and hourly</p>
      </div>

      {/* Stripe Connect gate */}
      {!stripeConnected ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-amber-800 text-sm">Set up Stripe Connect to receive payouts — hard gate</div>
            <div className="text-xs text-amber-700 mt-0.5">Zero payouts until connected. Buyer acceptance is unaffected, but released funds are held in escrow.</div>
          </div>
          <button onClick={connectStripe} className="flex items-center gap-1.5 px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
            <ExternalLink className="h-4 w-4" /> Connect Stripe
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-6 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> Stripe Connect: connected — payouts flow automatically on release.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ['In Escrow', formatGBP(escrowed), `${milestones.filter(m => ['funded', 'in_progress', 'submitted'].includes(m.escrow_status)).length} milestones`],
          ['Total Earned (net)', formatGBP(totalEarned), `${invoices.length} invoices`],
          ['Pending Payouts', formatGBP(pendingPayouts), 'awaiting buyer review'],
          ['Next Payout', invoices[0] ? formatGBP(invoices[0].net_amount ?? 0) : '—', invoices[0] ? new Date(invoices[0].issued_at).toLocaleDateString('en-GB') : 'no payouts yet'],
        ].map(([label, value, sub]) => (
          <div key={label as string} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
            <div className="text-2xl font-bold text-[#0B2D59]">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {(['milestones', 'payouts'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white shadow-sm text-[#0B2D59]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'milestones' ? 'Milestones & Escrow' : 'Invoices & Payouts'}
          </button>
        ))}
      </div>

      {tab === 'milestones' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Engagement / Milestone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Buyer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Due Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Escrow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {milestones.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No milestones yet — they appear when a contract is signed.</td></tr>
              )}
              {milestones.map(m => {
                const s = STATUS_MAP[m.escrow_status] ?? STATUS_MAP.unfunded;
                const eng = engagements.get(m.engagement_id);
                const buyerInfo = eng ? buyerBadges.get(eng.buyer_id) : undefined;
                const [buyerName, badge] = buyerInfo ? buyerInfo.split('|') : ['—', 'green'];
                return (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#0B2D59] text-sm">{m.title}</div>
                      <div className="text-xs text-gray-400">{eng?.project_title ?? ''}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-gray-600">{buyerName}</div>
                      <div className={`text-xs font-medium ${badge === 'green' ? 'text-green-600' : badge === 'amber' ? 'text-amber-600' : 'text-red-600'}`}>
                        {PAYMENT_BADGE_LABEL[badge as 'green' | 'amber' | 'red']}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#0070F3]">{formatGBP(m.amount ?? 0)}</td>
                    <td className="px-5 py-4 text-gray-500">{m.due_date ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
                        {s.icon}{s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payouts' && (
        invoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <ArrowDownToLine className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <div className="font-semibold text-gray-600 mb-1">No payouts yet</div>
            <div className="text-sm text-gray-400">Invoices appear here when milestones are released or recurring charges fire.</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Invoice</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Gross</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Platform fee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Net payout</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-gray-600">{inv.description}{inv.period_label ? ` (${inv.period_label})` : ''}</td>
                    <td className="px-5 py-3">{formatGBP(inv.gross_amount)}</td>
                    <td className="px-5 py-3 text-gray-400">−{formatGBP(inv.platform_fee_amount ?? 0)}</td>
                    <td className="px-5 py-3 font-bold text-green-700">{formatGBP(inv.net_amount ?? inv.gross_amount)}</td>
                    <td className="px-5 py-3 text-gray-500">{new Date(inv.issued_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default VendorPayments;
