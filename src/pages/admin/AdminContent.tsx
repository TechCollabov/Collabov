import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type InsightEntry = { rate: string; demand: string; tip: string };
type InsightTable = Record<string, InsightEntry>;
type StatCard = { value: string; label: string; source?: string };
type Testimonial = { quote: string; name: string; role: string; type: 'buyer' | 'vendor' };
type ComingSoonFlags = { market_insight: boolean };

const INSIGHT_CATEGORY_LABELS: Record<string, string> = {
  msp: 'Managed Service Provider (MSP)',
  agency: 'IT Agency',
  staffaug: 'Staff Augmentation',
  'software+development': 'Software Development',
  cybersecurity: 'Cybersecurity',
  'managed+it': 'Managed IT',
};

const TABS = ['Market Insight', 'Homepage Stats', 'Testimonials', 'Coming Soon Flags'] as const;
type Tab = typeof TABS[number];

function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="inline-flex items-center gap-1 text-xs text-green-400"><CheckCircle className="h-3.5 w-3.5" /> Saved</span>;
}

const AdminContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Market Insight');
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);

  const [marketInsight, setMarketInsight] = useState<InsightTable>({});
  const [insightDrafts, setInsightDrafts] = useState<Record<string, InsightEntry>>({});
  const [savedInsight, setSavedInsight] = useState<string | null>(null);

  const [homepageStats, setHomepageStats] = useState<StatCard[]>([]);
  const [statDrafts, setStatDrafts] = useState<Record<number, StatCard>>({});
  const [savedStat, setSavedStat] = useState<number | null>(null);

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testDrafts, setTestDrafts] = useState<Record<number, Testimonial>>({});
  const [savedTest, setSavedTest] = useState<number | null>(null);

  const [comingSoonFlags, setComingSoonFlags] = useState<ComingSoonFlags>({ market_insight: true });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('site_content').select('key, value');
    const map = new Map((data ?? []).map((r: any) => [r.key, r.value]));
    setMarketInsight((map.get('market_insight_table') as InsightTable) ?? {});
    setHomepageStats((map.get('homepage_stats') as StatCard[]) ?? []);
    setTestimonials((map.get('homepage_testimonials') as Testimonial[]) ?? []);
    setComingSoonFlags((map.get('coming_soon_flags') as ComingSoonFlags) ?? { market_insight: true });
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id ?? null));
    load();
  }, [load]);

  const persist = async (key: string, value: unknown) => {
    await supabase.from('site_content').upsert({ key, value: value as any, updated_at: new Date().toISOString(), updated_by: adminId }, { onConflict: 'key' });
  };

  // --- Market Insight ---
  const getInsightDraft = (cat: string): InsightEntry => insightDrafts[cat] ?? marketInsight[cat] ?? { rate: '', demand: '', tip: '' };
  const updateInsightDraft = (cat: string, field: keyof InsightEntry, value: string) => {
    const base = getInsightDraft(cat);
    setInsightDrafts(d => ({ ...d, [cat]: { ...base, [field]: value } }));
  };
  const saveInsight = async (cat: string) => {
    const draft = insightDrafts[cat];
    if (!draft) return;
    const next = { ...marketInsight, [cat]: draft };
    setMarketInsight(next);
    setInsightDrafts(d => { const n = { ...d }; delete n[cat]; return n; });
    await persist('market_insight_table', next);
    setSavedInsight(cat);
    setTimeout(() => setSavedInsight(null), 2000);
  };

  // --- Homepage stats ---
  const getStatDraft = (i: number): StatCard => statDrafts[i] ?? homepageStats[i];
  const updateStatDraft = (i: number, field: keyof StatCard, value: string) => {
    const base = getStatDraft(i);
    setStatDrafts(d => ({ ...d, [i]: { ...base, [field]: value } }));
  };
  const saveStat = async (i: number) => {
    const draft = statDrafts[i];
    if (!draft) return;
    const next = homepageStats.map((s, idx) => idx === i ? draft : s);
    setHomepageStats(next);
    setStatDrafts(d => { const n = { ...d }; delete n[i]; return n; });
    await persist('homepage_stats', next);
    setSavedStat(i);
    setTimeout(() => setSavedStat(null), 2000);
  };

  // --- Testimonials ---
  const getTestDraft = (i: number): Testimonial => testDrafts[i] ?? testimonials[i];
  const updateTestDraft = (i: number, field: keyof Testimonial, value: string) => {
    const base = getTestDraft(i);
    setTestDrafts(d => ({ ...d, [i]: { ...base, [field]: value } as Testimonial }));
  };
  const saveTest = async (i: number) => {
    const draft = testDrafts[i];
    if (!draft) return;
    const next = testimonials.map((t, idx) => idx === i ? draft : t);
    setTestimonials(next);
    setTestDrafts(d => { const n = { ...d }; delete n[i]; return n; });
    await persist('homepage_testimonials', next);
    setSavedTest(i);
    setTimeout(() => setSavedTest(null), 2000);
  };

  // --- Coming soon flags ---
  const toggleFlag = async (key: keyof ComingSoonFlags) => {
    const next = { ...comingSoonFlags, [key]: !comingSoonFlags[key] };
    setComingSoonFlags(next);
    await persist('coming_soon_flags', next);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-400" size={32} /></div>;
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

      {/* Tab 1: Market Insight — fixed categories consumed by ResultsPage's lookup table */}
      {activeTab === 'Market Insight' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Market Insight Strip</h2>
            <span className="text-xs text-slate-500">Feeds the market insight panel on search results.</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.keys(INSIGHT_CATEGORY_LABELS).map(cat => {
              const draft = getInsightDraft(cat);
              const isDirty = !!insightDrafts[cat];
              return (
                <div key={cat} className="bg-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">{INSIGHT_CATEGORY_LABELS[cat]}</h3>
                    <SavedBadge show={savedInsight === cat} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Rate benchmark</label>
                    <input className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none" value={draft.rate} onChange={e => updateInsightDraft(cat, 'rate', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Demand signal</label>
                    <input className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none" value={draft.demand} onChange={e => updateInsightDraft(cat, 'demand', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Tip</label>
                    <textarea rows={2} className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none resize-none" value={draft.tip} onChange={e => updateInsightDraft(cat, 'tip', e.target.value)} />
                  </div>
                  <button
                    onClick={() => saveInsight(cat)}
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

      {/* Tab 2: Homepage Stats */}
      {activeTab === 'Homepage Stats' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Homepage Stats</h2>
            <span className="text-xs text-slate-500">Feeds the 4 stat cards on the homepage.</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {homepageStats.map((_stat, i) => {
              const draft = getStatDraft(i);
              const isDirty = !!statDrafts[i];
              return (
                <div key={i} className="bg-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold block">Value</label>
                    <SavedBadge show={savedStat === i} />
                  </div>
                  <input
                    className="text-2xl font-bold text-white bg-slate-700 rounded-lg px-3 py-2 w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none"
                    value={draft.value}
                    onChange={e => updateStatDraft(i, 'value', e.target.value)}
                  />
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Label</label>
                    <input
                      className="text-sm text-slate-300 bg-slate-700 rounded-lg px-3 py-2 w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none"
                      value={draft.label}
                      onChange={e => updateStatDraft(i, 'label', e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => saveStat(i)}
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
            {testimonials.map((_t, i) => {
              const draft = getTestDraft(i);
              const isDirty = !!testDrafts[i];
              return (
                <div key={i} className="bg-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${draft.type === 'buyer' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/40' : 'bg-green-900/40 text-green-300 border border-green-700/40'}`}>
                      {draft.type === 'buyer' ? 'Buyer' : 'Vendor'}
                    </span>
                    <SavedBadge show={savedTest === i} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Quote</label>
                    <textarea
                      className="text-sm text-slate-200 bg-slate-700 rounded-lg px-3 py-2 w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none resize-none"
                      rows={4}
                      value={draft.quote}
                      onChange={e => updateTestDraft(i, 'quote', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Name</label>
                      <input
                        className="text-sm text-white bg-slate-700 rounded-lg px-3 py-2 w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none"
                        value={draft.name}
                        onChange={e => updateTestDraft(i, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Role</label>
                      <input
                        className="text-sm text-slate-300 bg-slate-700 rounded-lg px-3 py-2 w-full border border-slate-600 focus:border-[#0070F3] focus:outline-none"
                        value={draft.role}
                        onChange={e => updateTestDraft(i, 'role', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 block">Type</label>
                    <select
                      className="text-sm text-white bg-slate-700 rounded-lg px-3 py-2 border border-slate-600 focus:border-[#0070F3] focus:outline-none"
                      value={draft.type}
                      onChange={e => updateTestDraft(i, 'type', e.target.value)}
                    >
                      <option value="buyer">Buyer</option>
                      <option value="vendor">Vendor</option>
                    </select>
                  </div>
                  <button
                    onClick={() => saveTest(i)}
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
            <div className="bg-slate-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Market Insight nav badge</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Shows a "Coming Soon" badge on the Market Insight nav link. The destination page itself isn't built
                  yet, so this only controls the badge — not a live feature toggle.
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-medium ${comingSoonFlags.market_insight ? 'text-amber-400' : 'text-green-400'}`}>
                  {comingSoonFlags.market_insight ? 'Coming Soon' : 'Live'}
                </span>
                <button
                  onClick={() => toggleFlag('market_insight')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${comingSoonFlags.market_insight ? 'bg-amber-500' : 'bg-[#0070F3]'}`}
                  role="switch"
                  aria-checked={comingSoonFlags.market_insight}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${comingSoonFlags.market_insight ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContent;
