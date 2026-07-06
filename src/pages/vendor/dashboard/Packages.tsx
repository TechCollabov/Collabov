import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Package, Pencil, Trash2, Clock, DollarSign, Check, Loader2, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

const CATEGORIES = ['Cloud & Infrastructure', 'Managed IT', 'Software Development', 'Cybersecurity', 'DevOps', 'QA & Testing', 'Staff Augmentation'];
const TECH_TAGS = ['React', 'Node.js', 'Python', '.NET', 'Java', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform'];

interface PackageRow {
  id: string;
  name: string;
  category: string | null;
  price: number;
  billing_period: string | null;
  delivery_days: number | null;
  features: string[];
  tech_stack: string[];
  ideal_for: string | null;
  is_active: boolean;
}

interface FormState {
  id: string | null;
  name: string;
  category: string;
  price: string;
  billing_period: string;
  delivery_days: string;
  features: string; // one per line in the textarea
  tech_stack: string[];
  ideal_for: string;
}

const emptyForm = (): FormState => ({
  id: null, name: '', category: CATEGORIES[0], price: '', billing_period: 'one_time',
  delivery_days: '', features: '', tech_stack: [], ideal_for: '',
});

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
      features: Array.isArray(p.features) ? p.features : [],
      tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
      ideal_for: p.ideal_for, is_active: !!p.is_active,
    })));
    setActiveEngagementPackageIds(new Set((engs || []).map((e: any) => e.package_id).filter(Boolean)));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm(emptyForm()); setError(null); };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.price) { setError('Package title and price are required.'); return; }
    const features = form.features.split('\n').map(f => f.trim()).filter(Boolean);
    if (features.length < 3) { setError('Add at least 3 included items (one per line).'); return; }
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
      features: pkg.features.join('\n'), tech_stack: pkg.tech_stack, ideal_for: pkg.ideal_for || '',
    });
    setTab('builder');
  };

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
                      </span>
                      {pkg.delivery_days != null && (
                        <span className="flex items-center gap-1 text-gray-500 text-xs"><Clock className="h-3.5 w-3.5" />{pkg.delivery_days} days</span>
                      )}
                    </div>
                    <ul className="space-y-1 mb-3">
                      {pkg.features.map(item => (
                        <li key={item} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Check className="h-3.5 w-3.5 text-[#0070F3] flex-shrink-0" />{item}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">What's Included <span className="text-gray-400 font-normal">(min 3, one per line)</span></label>
              <textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} rows={4}
                placeholder={'e.g.\nCurrent state review\nArchitecture recommendations\nCost optimisation report'}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none" />
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
