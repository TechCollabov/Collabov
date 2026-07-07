import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Download, Plus, Trash2, Loader2, ArrowLeft, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatGBP } from '../../lib/workflows';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  issued_at: string;
  gross_amount: number;
  vat_amount: number;
  status: string;
  description: string | null;
  period_label: string | null;
  vendor_id: string;
  engagement_id: string | null;
  vendorName?: string;
  projectTitle?: string;
}

interface TxRow {
  id: string;
  transaction_type: string;
  amount: number;
  card_last4: string | null;
  created_at: string;
  reference: string | null;
  status: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

const BuyerPayments: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ last4: '4242', exp_month: '12', exp_year: '2028' });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [invRes, txRes, methodRes] = await Promise.all([
      supabase.from('invoices').select('*').eq('buyer_id', user.id).order('issued_at', { ascending: false }),
      supabase.from('escrow_transactions').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('payment_methods').select('*').eq('buyer_id', user.id).order('created_at', { ascending: true }),
    ]);
    const invoiceRows = (invRes.data ?? []) as InvoiceRow[];
    const vendorIds = Array.from(new Set(invoiceRows.map(i => i.vendor_id)));
    const engagementIds = Array.from(new Set(invoiceRows.map(i => i.engagement_id).filter(Boolean))) as string[];
    const [{ data: vendors }, { data: engs }] = await Promise.all([
      vendorIds.length ? supabase.from('vendors').select('id, company_name').in('id', vendorIds) : Promise.resolve({ data: [] as any[] }),
      engagementIds.length ? supabase.from('engagements').select('id, project_title').in('id', engagementIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const vMap = new Map((vendors ?? []).map((v: any) => [v.id, v.company_name]));
    const eMap = new Map((engs ?? []).map((e: any) => [e.id, e.project_title]));
    setInvoices(invoiceRows.map(i => ({
      ...i,
      vendorName: vMap.get(i.vendor_id) ?? 'Vendor',
      projectTitle: i.engagement_id ? (eMap.get(i.engagement_id) ?? '') : '',
    })));
    setTransactions((txRes.data ?? []) as TxRow[]);
    setMethods((methodRes.data ?? []) as PaymentMethod[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filteredInvoices = invoices.filter(i => {
    if (dateFrom && new Date(i.issued_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(i.issued_at) > new Date(dateTo)) return false;
    return true;
  });

  const totalEscrowed = transactions.filter(t => t.transaction_type === 'fund').reduce((s, t) => s + t.amount, 0)
    - transactions.filter(t => ['release', 'refund', 'split_release'].includes(t.transaction_type)).reduce((s, t) => s + t.amount, 0);
  const released = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.gross_amount, 0);
  const pendingApproval = transactions.filter(t => t.transaction_type === 'fund' && t.status === 'completed').length
    - invoices.length; // rough count of funded-but-not-yet-invoiced milestones

  const exportCsv = () => {
    const header = ['Invoice', 'Date', 'Vendor', 'Description', 'Net', 'VAT', 'Total', 'Status'];
    const rows = filteredInvoices.map(i => [
      i.invoice_number,
      new Date(i.issued_at).toLocaleDateString('en-GB'),
      i.vendorName ?? '',
      `${i.description ?? ''}${i.period_label ? ` (${i.period_label})` : ''}`,
      i.gross_amount.toFixed(2),
      (i.vat_amount ?? 0).toFixed(2),
      (i.gross_amount + (i.vat_amount ?? 0)).toFixed(2),
      i.status,
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addCard = async () => {
    if (!user) return;
    const isFirst = methods.length === 0;
    const { error } = await supabase.from('payment_methods').insert({
      buyer_id: user.id,
      brand: 'Visa',
      last4: newCard.last4,
      exp_month: Number(newCard.exp_month),
      exp_year: Number(newCard.exp_year),
      is_default: isFirst,
    });
    if (!error) {
      setShowAddCard(false);
      setNewCard({ last4: '4242', exp_month: '12', exp_year: '2028' });
      load();
    }
  };

  const removeCard = async (id: string) => {
    await supabase.from('payment_methods').delete().eq('id', id);
    load();
  };

  const setDefaultCard = async (id: string) => {
    if (!user) return;
    await supabase.from('payment_methods').update({ is_default: false }).eq('buyer_id', user.id);
    await supabase.from('payment_methods').update({ is_default: true }).eq('id', id);
    load();
  };

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
          <h1 className="text-2xl font-bold text-[#0B2D59]">Payments & Escrow</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Full money trail across every engagement. You always see gross amounts — the platform fee is a vendor-side deduction.
        </p>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Escrowed</div>
            <div className="text-2xl font-bold text-blue-600">{formatGBP(Math.max(0, totalEscrowed))}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Released</div>
            <div className="text-2xl font-bold text-green-600">{formatGBP(released)}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Pending Approval</div>
            <div className="text-2xl font-bold text-amber-600">{Math.max(0, pendingApproval)}</div>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-bold text-[#0B2D59]">Invoices</h2>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <span className="text-xs text-gray-400">to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <button onClick={exportCsv} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500">
                <tr className="border-b border-gray-100 text-left">
                  <th className="py-2 pr-4">Invoice</th><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Vendor</th>
                  <th className="py-2 pr-4">Milestone</th><th className="py-2 pr-4">Net</th><th className="py-2 pr-4">VAT</th>
                  <th className="py-2 pr-4">Total</th><th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-gray-400">No invoices yet.</td></tr>}
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{new Date(inv.issued_at).toLocaleDateString('en-GB')}</td>
                    <td className="py-2.5 pr-4 text-gray-700">{inv.vendorName}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{inv.description}{inv.period_label ? ` (${inv.period_label})` : ''}</td>
                    <td className="py-2.5 pr-4">{formatGBP(inv.gross_amount)}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{formatGBP(inv.vat_amount ?? 0)}</td>
                    <td className="py-2.5 pr-4 font-semibold">{formatGBP(inv.gross_amount + (inv.vat_amount ?? 0))}</td>
                    <td className="py-2.5"><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-[#0B2D59] mb-4">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500">
                <tr className="border-b border-gray-100 text-left">
                  <th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Amount</th><th className="py-2">Card</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-gray-400">No charges yet.</td></tr>}
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4 text-gray-600">{new Date(t.created_at).toLocaleDateString('en-GB')}</td>
                    <td className="py-2.5 pr-4 capitalize text-gray-700">{t.transaction_type.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 pr-4 font-semibold">{formatGBP(t.amount)}</td>
                    <td className="py-2.5 text-gray-500">{t.card_last4 ? `•••• ${t.card_last4}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0B2D59]">Payment Methods</h2>
            <button onClick={() => setShowAddCard(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0070F3] text-white text-xs font-semibold rounded-lg">
              <Plus className="h-3.5 w-3.5" /> Add Card
            </button>
          </div>
          <div className="space-y-2">
            {methods.length === 0 && <p className="text-sm text-gray-400">No saved cards yet.</p>}
            {methods.map(m => (
              <div key={m.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{m.brand} •••• {m.last4} — expires {m.exp_month}/{m.exp_year}</span>
                  {m.is_default && <span className="text-xs bg-blue-50 text-[#0070F3] px-2 py-0.5 rounded-full font-medium">Default</span>}
                </div>
                <div className="flex gap-2">
                  {!m.is_default && (
                    <button onClick={() => setDefaultCard(m.id)} className="text-xs text-[#0070F3] font-medium">Set default</button>
                  )}
                  <button onClick={() => removeCard(m.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Recurring engagements charge this card automatically. You can't cancel a subscription directly here — use the termination flow on the engagement itself.
          </p>

          {showAddCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold text-[#0B2D59] mb-4">Add Card (simulated)</h3>
                <div className="space-y-3">
                  <input value={newCard.last4} onChange={e => setNewCard(p => ({ ...p, last4: e.target.value.slice(0, 4) }))}
                    placeholder="Last 4 digits" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <input value={newCard.exp_month} onChange={e => setNewCard(p => ({ ...p, exp_month: e.target.value }))}
                      placeholder="MM" className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <input value={newCard.exp_year} onChange={e => setNewCard(p => ({ ...p, exp_year: e.target.value }))}
                      placeholder="YYYY" className="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={addCard} className="flex-1 py-2.5 bg-[#0070F3] text-white font-semibold rounded-lg text-sm">Save Card</button>
                  <button onClick={() => setShowAddCard(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerPayments;
