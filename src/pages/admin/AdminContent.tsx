import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';

type InsightRow = { id: string; service_type: string; geography: string; rate_benchmark: string; demand_signal: string; tip: string };
type StatCard = { id: string; value: string; label: string };
type Testimonial = { id: string; quote: string; name: string; role: string; type: 'buyer' | 'vendor' };
type ComingSoonFlags = { market_insight_nav: boolean; market_insight_page: boolean; freelancers: boolean };

const TABS = ['Market Insight', 'Homepage Stats', 'Testimonials', 'Coming Soon Flags'] as const;
type Tab = typeof TABS[number];

const AdminContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Market Insight');

  const [marketInsightRows, setMarketInsightRows] = useState<InsightRow[]>([
    { id: '1', service_type: 'MSP', geography: 'UK', rate_benchmark: '£1,200–£3,500/month', demand_signal: 'High demand — 847 active searches', tip: 'MSPs with SLA guarantees receive 3× more enquiries.' },
    { id: '2', service_type: 'IT Agency', geography: 'Poland', rate_benchmark: '£4,200–£12,000/project', demand_signal: 'High demand — 1,203 active searches', tip: 'Agencies with fintech case studies win 4× more contracts.' },
    { id: '3', service_type: 'Staff Aug', geography: 'Eastern Europe', rate_benchmark: '£2,800–£5,400/person/month', demand_signal: 'Growing — 634 active searches', tip: '3+ referrals win contracts 60% faster.' },
  ]);
  const [editingInsight, setEditingInsight] = useState<string | null>(null);
  const [editInsightDraft, setEditInsightDraft] = useState<InsightRow | null>(null);

  const [homepageStats, setHomepageStats] = useState<StatCard[]>([
    { id: '1', value: '$650B+', label: 'Global IT outsourcing market in 2024' },
    { id: '2', value: '$214B+', label: 'Underserved SME and mid-market opportunity' },
    { id: '3', value: '63%', label: 'of UK businesses planning to increase outsourcing' },
    { id: '4', value: '40%', label: 'Average cost reduction vs equivalent UK hire' },
  ]);
  const [statDrafts, setStatDrafts] = useState<Record<string, StatCard>>({});

  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    { id: '1', quote: 'We found a React development team in Poland within three days. The contract was signed on the platform, milestones tracked automatically, and we paid only when each piece of work was delivered.', name: 'James Whitfield', role: 'CTO — Paytrace Financial, London', type: 'buyer' },
    { id: '2', quote: 'As a 12-person agency in Krakow, getting in front of UK clients used to take months of sales effort. Collabov gave us a verified profile and we received our first RFP within two weeks.', name: 'Marta Kowalska', role: 'MD — CodeForge Solutions, Krakow', type: 'vendor' },
  ]);
  const [testDrafts, setTestDrafts] = useState<Record<string, Testimonial>>({});

  const [comingSoonFlags, setComingSoonFlags] = useState<ComingSoonFlags>({
    market_insight_nav: true,
    market_insight_page: true,
    freelancers: true,
  });

  // --- Market Insight helpers ---
  function startEditInsight(row: InsightRow) {
    setEditingInsight(row.id);
    setEditInsightDraft({ ...row });
  }
  function saveInsight() {
    if (!editInsightDraft) return;
    setMarketInsightRows(rows => rows.map(r => r.id === editInsightDraft.id ? editInsightDraft : r));
    setEditingInsight(null);
    setEditInsightDraft(null);
  }
  function cancelInsight() { setEditingInsight(null); setEditInsightDraft(null); }
  function deleteInsight(id: string) { setMarketInsightRows(rows => rows.filter(r => r.id !== id)); }
  function addInsightRow() {
    const newRow: InsightRow = { id: String(Date.now()), service_type: '', geography: '', rate_benchmark: '', demand_signal: '', tip: '' };
    setMarketInsightRows(rows => [...rows, newRow]);
    startEditInsight(newRow);
  }

  // --- Stat card helpers ---
  function getStatDraft(id: string): StatCard {
    return statDrafts[id] ?? homepageStats.find(s => s.id === id)!;
  }
  function updateStatDraft(id: string, field: keyof StatCard, value: string) {
    const base = getStatDraft(id);
    setStatDrafts(d => ({ ...d, [id]: { ...base, [field]: value } }));
  }
  function saveStat(id: string) {
    const draft = statDrafts[id];
    if (!draft) return;
    setHomepageStats(stats => stats.map(s => s.id === id ? draft : s));
    setStatDrafts(d => { const n = { ...d }; delete n[id]; return n; });
  }

  // --- Testimonial helpers ---
  function getTestDraft(id: string): Testimonial {
    return testDrafts[id] ?? testimonials.find(t => t.id === id)!;
  }
  function updateTestDraft(id: string, field: keyof Testimonial, value: string) {
    const base = getTestDraft(id);
    setTestDrafts(d => ({ ...d, [id]: { ...base, [field]: value } }));
  }
  function saveTest(id: string) {
    const draft = testDrafts[id];
    if (!draft) return;
    setTestimonials(ts => ts.map(t => t.id === id ? draft : t));
    setTestDrafts(d => { const n = { ...d }; delete n[id]; return n; });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Content Management</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1.5 w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-[#0070F3] text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Market Insight */}
      {activeTab === 'Market Insight' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Market Insight Strip</h2>
          </div>
          <div className="bg-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 border-b border-slate-700">
                <tr>
                  {['Service Type', 'Geography', 'Rate Benchmark', 'Demand Signal', 'Tip', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {marketInsightRows.map(row => {
                  const isEditing = editingInsight === row.id;
                  const draft = editInsightDraft;
                  return (
                    <tr key={row.id} className="hover:bg-slate-700/20">
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input className="bg-slate-700 text-white rounded px-2 py-1 text-sm w-full" value={draft?.service_type ?? ''} onChange={e => setEditInsightDraft(d => d ? { ...d, service_type: e.target.value } : d)} />
                        ) : <span className="text-white font-medium">{row.service_type}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input className="bg-slate-700 text-white rounded px-2 py-1 text-sm w-full" value={draft?.geography ?? ''} onChange={e => setEditInsightDraft(d => d ? { ...d, geography: e.target.value } : d)} />
                        ) : <span className="text-slate-300">{row.geography}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input className="bg-slate-700 text-white rounded px-2 py-1 text-sm w-full min-w-[160px]" value={draft?.rate_benchmark ?? ''} onChange={e => setEditInsightDraft(d => d ? { ...d, rate_benchmark: e.target.value } : d)} />
                        ) : <span className="text-slate-300">{row.rate_benchmark}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input className="bg-slate-700 text-white rounded px-2 py-1 text-sm w-full min-w-[180px]" value={draft?.demand_signal ?? ''} onChange={e => setEditInsightDraft(d => d ? { ...d, demand_signal: e.target.value } : d)} />
                        ) : <span className="text-slate-300">{row.demand_signal}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input className="bg-slate-700 text-white rounded px-2 py-1 text-sm w-full min-w-[200px]" value={draft?.tip ?? ''} onChange={e => setEditInsightDraft(d => d ? { ...d, tip: e.target.value } : d)} />
                        ) : <span className="text-slate-400 text-xs">{row.tip}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-1.5">
                            <button onClick={saveInsight} className="flex items-center gap-1 px-2.5 py-1 bg-[#0070F3] text-white rounded text-xs font-medium hover:bg-blue-700">
                              <Save className="h-3 w-3" /> Save
                            </button>
                            <button onClick={cancelInsight} className="flex items-center gap-1 px-2.5 py-1 bg-slate-700 text-slate-300 rounded text-xs font-medium hover:bg-slate-600">
                              <X className="h-3 w-3" /> Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            <button onClick={() => startEditInsight(row)} className="p-1.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deleteInsight(row.id)} className="p-1.5 rounded bg-red-900/40 text-red-400 hover:bg-red-900/70">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            onClick={addInsightRow}
            className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" /> Add row
          </button>
        </div>
      )}

      {/* Tab 2: Homepage Stats */}
      {activeTab === 'Homepage Stats' && (
        <div>
          <h2 className="text-base font-bold text-white mb-4">Homepage Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            {homepageStats.map(stat => {
              const draft = getStatDraft(stat.id);
              const isDirty = !!statDrafts[stat.id];
              return (
                <div key={stat.id} className="bg-slate-800 rounded-xl p-5 space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Value</label>
                    <input
                      className="text-2xl font-bold text-white bg-slate-700 rounded-lg px-3 py-2 w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none"
                      value={draft.value}
                      onChange={e => updateStatDraft(stat.id, 'value', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Label</label>
                    <input
                      className="text-sm text-slate-300 bg-slate-700 rounded-lg px-3 py-2 w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none"
                      value={draft.label}
                      onChange={e => updateStatDraft(stat.id, 'label', e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => saveStat(stat.id)}
                    disabled={!isDirty}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDirty ? 'bg-[#0070F3] text-white hover:bg-blue-700' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                  >
                    <Save className="h-3.5 w-3.5" /> Save changes
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Testimonials */}
      {activeTab === 'Testimonials' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Testimonials</h2>
            <span className="text-xs text-slate-500">Changes apply immediately to homepage.</span>
          </div>
          <div className="space-y-4">
            {testimonials.map(t => {
              const draft = getTestDraft(t.id);
              const isDirty = !!testDrafts[t.id];
              return (
                <div key={t.id} className="bg-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${draft.type === 'buyer' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/40' : 'bg-green-900/40 text-green-300 border border-green-700/40'}`}>
                      {draft.type === 'buyer' ? 'Buyer' : 'Vendor'}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Quote</label>
                    <textarea
                      className="text-sm text-slate-200 bg-slate-700 rounded-lg px-3 py-2 w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none resize-none"
                      rows={4}
                      value={draft.quote}
                      onChange={e => updateTestDraft(t.id, 'quote', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Name</label>
                      <input
                        className="text-sm text-white bg-slate-700 rounded-lg px-3 py-2 w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none"
                        value={draft.name}
                        onChange={e => updateTestDraft(t.id, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Role</label>
                      <input
                        className="text-sm text-slate-300 bg-slate-700 rounded-lg px-3 py-2 w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none"
                        value={draft.role}
                        onChange={e => updateTestDraft(t.id, 'role', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Type</label>
                    <select
                      className="text-sm text-white bg-slate-700 rounded-lg px-3 py-2 border border-slate-600 focus:border-[#0070F3] focus:outline-none"
                      value={draft.type}
                      onChange={e => updateTestDraft(t.id, 'type', e.target.value)}
                    >
                      <option value="buyer">Buyer</option>
                      <option value="vendor">Vendor</option>
                    </select>
                  </div>
                  <button
                    onClick={() => saveTest(t.id)}
                    disabled={!isDirty}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDirty ? 'bg-[#0070F3] text-white hover:bg-blue-700' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                  >
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Coming Soon Flags */}
      {activeTab === 'Coming Soon Flags' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Coming Soon Flags</h2>
            <span className="text-xs text-slate-500">Changes apply immediately. No deploy required.</span>
          </div>
          <div className="space-y-3">
            {([
              { key: 'market_insight_nav' as const, label: 'Market Insight nav link', description: 'Shows "Coming Soon" badge on the Market Insight nav item vs live link' },
              { key: 'market_insight_page' as const, label: 'Market Insight page (/market-insight)', description: 'Gates the full Market Insight page behind a "Coming Soon" placeholder' },
              { key: 'freelancers' as const, label: 'Freelancers panel (/freelancers)', description: 'Shows "Coming Soon" on the Freelancers discovery panel' },
            ] as { key: keyof ComingSoonFlags; label: string; description: string }[]).map(item => (
              <div key={item.key} className="bg-slate-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-medium ${comingSoonFlags[item.key] ? 'text-amber-400' : 'text-green-400'}`}>
                    {comingSoonFlags[item.key] ? 'Coming Soon' : 'Live'}
                  </span>
                  <button
                    onClick={() => setComingSoonFlags(f => ({ ...f, [item.key]: !f[item.key] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${comingSoonFlags[item.key] ? 'bg-amber-500' : 'bg-[#0070F3]'}`}
                    role="switch"
                    aria-checked={comingSoonFlags[item.key]}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${comingSoonFlags[item.key] ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContent;
