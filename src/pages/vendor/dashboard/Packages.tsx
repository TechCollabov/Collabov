import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Package, Pencil, Trash2, Clock, DollarSign, Check, Minus, Loader2, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { normalizeFeatureRows, FeatureRow, FeatureValue } from '../../../lib/packageFeatures';

const CATEGORIES = ['Cloud & Infrastructure', 'Managed IT', 'Software Development', 'Cybersecurity', 'DevOps', 'QA & Testing', 'Staff Augmentation'];
const TECH_TAGS = ['React', 'Node.js', 'Python', '.NET', 'Java', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform'];

type VatTreatment = 'inclusive' | 'exclusive' | 'not_applicable';

const VAT_OPTIONS: { value: VatTreatment; label: string }[] = [
  { value: 'inclusive', label: 'Price includes VAT' },
  { value: 'exclusive', label: 'VAT added on top' },
  { value: 'not_applicable', label: 'Not VAT applicable' },
];

interface PackageRow {
  id: string;
  name: string;
  category: string | null;
  price: number;
  billing_period: string | null;
  delivery_days: number | null;
  featureRows: FeatureRow[];
  tech_stack: string[];
  ideal_for: string | null;
  is_active: boolean;
  vat_treatment: VatTreatment;
}

interface FormState {
  id: string | null;
  name: string;
  category: string;
  price: string;
  billing_period: string;
  delivery_days: string;
  features: FeatureRow[];
  tech_stack: string[];
  ideal_for: string;
  vat_treatment: VatTreatment;
}

const blankRow = (): FeatureRow => ({ label: '', value: true });

const emptyForm = (): FormState => ({
  id: null, name: '', category: CATEGORIES[0], price: '', billing_period: 'one_time',
  delivery_days: '', features: [blankRow(), blankRow(), blankRow()], tech_stack: [], ideal_for: '',
  vat_treatment: 'not_applicable',
});

type FeatureRowMode = 'included' | 'not_included' | 'custom';

function modeOf(value: FeatureValue): FeatureRowMode {
  if (value === true) return 'included';
  if (value === false) return 'not_included';
  return 'custom';
}

const Packages: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'packages' | 'builder'>('packages');
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEngagementPackageIds, setActiveEngagementPackageIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: pkgs }, { data: engs }] = await Promise.all([
      supabase.from('vendor_packages').select('*').eq('vendor_id', user.id).order('created_at', { ascending: false }),
      supabase.from('engagements').select('package_id').eq('vendor_id', user.id).not('package_id', 'is', null)
        .not('status', 'in', '(terminated,closed)'),
    ]);
    setPackages((pkgs || []).map((p: any) => ({
      id: p.id, name: p.name, category: p.category, price: Number(p.price) || 0,
      billing_period: p.billing_period, delivery_days: p.delivery_days,
      featureRows: normalizeFeatureRows(p.features),
      tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
      ideal_for: p.ideal_for, is_active: !!p.is_active,
      vat_treatment: (p.vat_treatment as VatTreatment) || 'not_applicable',
    })));
    setActiveEngagementPackageIds(new Set((engs || []).map((e: any) => e.package_id).filter(Boolean)));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm(emptyForm()); setError(null); };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.price) { setError('Package title and price are required.'); return; }
    const features = form.features
      .map(r => ({ label: r.label.trim(), value: typeof r.value === 'string' ? r.value.trim() : r.value }))
      .filter(r => r.label.length > 0);
    if (features.length < 3) { setError('Add at least 3 rows with a label.'); return; }
    setSaving(true);
    setError(null);
    const payload = {
      vendor_id: user.id,
      name: form.name,
      category: form.category,
      price: parseFloat(form.price),
      billing_period: form.billing_period,
      delivery_days: form.delivery_days ? parseInt(form.delivery_days) : null,
      features,
      tech_stack: form.tech_stack,
      ideal_for: form.ideal_for || null,
      vat_treatment: form.vat_treatment,
      is_active: true,
    };
    const { error: err } = form.id
      ? await supabase.from('vendor_packages').update(payload).eq('id', form.id)
      : await supabase.from('vendor_packages').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    resetForm();
    setTab('packages');
    load();
  };

  const handleEdit = (pkg: PackageRow) => {
    setForm({
      id: pkg.id, name: pkg.name, category: pkg.category || CATEGORIES[0], price: String(pkg.price),
      billing_period: pkg.billing_period || 'one_time', delivery_days: pkg.delivery_days ? String(pkg.delivery_days) : '',
      features: pkg.featureRows.length > 0 ? pkg.featureRows.map(r => ({ ...r })) : [blankRow(), blankRow(), blankRow()],
      tech_stack: pkg.tech_stack, ideal_for: pkg.ideal_for || '',
      vat_treatment: pkg.vat_treatment,
    });
    setTab('builder');
  };

  const updateRow = (idx: number, patch: Partial<FeatureRow>) => {
    setForm(f => ({ ...f, features: f.features.map((r, i) => (i === idx ? { ...r, ...patch } : r)) }));
  };
  const setRowMode = (idx: number, mode: FeatureRowMode) => {
    updateRow(idx, { value: mode === 'included' ? true : mode === 'not_included' ? false : '' });
  };
  const addRow = () => setForm(f => ({ ...f, features: [...f.features, blankRow()] }));
  const removeRow = (idx: number) => setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));

  const handleDelete = async (id: string) => {
    if (activeEngagementPackageIds.has(id)) return; // guarded in UI too, belt-and-braces
    const { error: err } = await supabase.from('vendor_packages').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setPackages(p => p.filter(pkg => pkg.id !== id));
  };

  const toggleTech = (t: string) => setForm(f => ({ ...f, tech_stack: f.tech_stack.includes(t) ? f.tech_stack.filter(x => x !== t) : [...f.tech_stack, t] }));

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-blue-500 animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2D59]">Services & Packages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your fixed-price packages visible on your profile</p>
        </div>
        <button
          onClick={() => { resetForm(); setTab('builder'); }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Package
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['packages', 'builder'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow-sm text-[#0B2D59]' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'packages' ? 'My Packages' : form.id ? 'Edit Package' : 'Package Builder'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center justify-between max-w-2xl">
          {error}<button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {tab === 'packages' && (
        <div className="space-y-4">
          {packages.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <div className="font-semibold text-gray-500 mb-1">No packages yet</div>
              <div className="text-sm text-gray-400">Create your first fixed-price package to attract clients</div>
            </div>
          )}
          {packages.map(pkg => {
            const inUse = activeEngagementPackageIds.has(pkg.id);
            return (
              <div key={pkg.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {pkg.category && <span className="text-xs bg-blue-50 text-[#0070F3] font-semibold px-2.5 py-1 rounded-full">{pkg.category}</span>}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pkg.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {pkg.is_active ? 'Active' : 'Draft'}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#0B2D59] mb-1">{pkg.name}</h3>
                    <div className="flex items-center gap-3 text-sm mb-3">
                      <span className="flex items-center gap-1 text-[#0070F3] font-bold">
                        <DollarSign className="h-4 w-4" />£{pkg.price.toLocaleString()} <span className="text-xs text-gray-400 font-normal">{pkg.billing_period === 'monthly' ? '/month' : 'fixed'}</span>
                        {pkg.vat_treatment === 'exclusive' && (
                          <span className="text-xs text-gray-400 font-normal">+ VAT</span>
                        )}
                        {pkg.vat_treatment === 'inclusive' && (
                          <span className="text-xs text-gray-400 font-normal">inc. VAT</span>
                        )}
                      </span>
                      {pkg.delivery_days != null && (
                        <span className="flex items-center gap-1 text-gray-500 text-xs"><Clock className="h-3.5 w-3.5" />{pkg.delivery_days} days</span>
                      )}
                    </div>
                    <ul className="space-y-1 mb-3">
                      {pkg.featureRows.map((row, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-3 text-xs text-gray-500 max-w-sm">
                          <span className="flex items-center gap-1.5">
                            {row.value === false
                              ? <Minus className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                              : <Check className="h-3.5 w-3.5 text-[#0070F3] flex-shrink-0" />}
                            {row.label}
                          </span>
                          {typeof row.value === 'string' && row.value && (
                            <span className="text-gray-400">{row.value}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {pkg.ideal_for && <p className="text-xs text-gray-400 mb-2">Ideal for: {pkg.ideal_for}</p>}
                    <div className="flex flex-wrap gap-1">
                      {pkg.tech_stack.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="flex gap-1.5">
                      <button onClick={() => handleEdit(pkg)} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(pkg.id)} disabled={inUse}
                        className="p-2 rounded-lg border border-gray-200 text-red-400 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed" title={inUse ? 'Package is used by an active engagement' : 'Delete'}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {inUse && <span className="text-[10px] text-gray-400 max-w-[7rem] text-right">In use by an active engagement</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'builder' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-[#0B2D59] mb-5">{form.id ? 'Edit Package' : 'Create a Package'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Cloud Infrastructure Audit"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Type</label>
                <select value={form.billing_period} onChange={e => setForm(f => ({ ...f, billing_period: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]">
                  <option value="one_time">Fixed Price</option>
                  <option value="monthly">Monthly Retainer</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (£) <span className="text-red-500">*</span></label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="e.g. 2800" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery (days)</label>
                <input type="number" value={form.delivery_days} onChange={e => setForm(f => ({ ...f, delivery_days: e.target.value }))}
                  placeholder="e.g. 14" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What's Included <span className="text-gray-400 font-normal">(min 3 rows)</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Each row is a feature label plus either "Included", "Not included", or a custom value like "1 FTE".
              </p>
              <div className="space-y-2">
                {form.features.map((row, idx) => {
                  const mode = modeOf(row.value);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.label}
                        onChange={e => updateRow(idx, { label: e.target.value })}
                        placeholder="e.g. Team size"
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                      />
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1 flex-shrink-0">
                        <button type="button" onClick={() => setRowMode(idx, 'included')} title="Included"
                          className={`p-1.5 rounded-md transition-colors ${mode === 'included' ? 'bg-white shadow-sm text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => setRowMode(idx, 'not_included')} title="Not included"
                          className={`p-1.5 rounded-md transition-colors ${mode === 'not_included' ? 'bg-white shadow-sm text-gray-600' : 'text-gray-400 hover:text-gray-600'}`}>
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => setRowMode(idx, 'custom')} title="Custom value"
                          className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'custom' ? 'bg-white shadow-sm text-[#0070F3]' : 'text-gray-400 hover:text-gray-600'}`}>
                          Custom
                        </button>
                      </div>
                      {mode === 'custom' && (
                        <input
                          type="text"
                          value={typeof row.value === 'string' ? row.value : ''}
                          onChange={e => updateRow(idx, { value: e.target.value })}
                          placeholder="e.g. 1 FTE"
                          className="w-28 flex-shrink-0 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                        />
                      )}
                      <button type="button" onClick={() => removeRow(idx)} disabled={form.features.length <= 1}
                        title="Remove row"
                        className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={addRow}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0070F3] hover:text-blue-700">
                <Plus className="h-3.5 w-3.5" /> Add row
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAT Treatment</label>
              <div className="flex gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1 w-fit">
                {VAT_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, vat_treatment: opt.value }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.vat_treatment === opt.value ? 'bg-white shadow-sm text-[#0070F3]' : 'text-gray-500 hover:text-gray-700'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ideal For <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={form.ideal_for} onChange={e => setForm(f => ({ ...f, ideal_for: e.target.value }))}
                placeholder="e.g. SMEs migrating off legacy infrastructure"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack Tags</label>
              <div className="flex flex-wrap gap-2">
                {TECH_TAGS.map(t => (
                  <button key={t} type="button" onClick={() => toggleTech(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.tech_stack.includes(t) ? 'bg-[#0070F3] text-white border-[#0070F3]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { resetForm(); setTab('packages'); }}
                className="py-2.5 px-4 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="inline-flex items-center gap-2 py-2.5 px-5 bg-[#0070F3] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {form.id ? 'Save Changes' : 'Save Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
