import React, { useState } from 'react';
import { Plus, Package, Pencil, Trash2, Clock, DollarSign, Check } from 'lucide-react';

const MOCK_PACKAGES = [
  {
    id: '1',
    title: 'Cloud Infrastructure Audit',
    category: 'Cloud & Infrastructure',
    price: '£2,800',
    priceType: 'fixed',
    duration: '1 week',
    status: 'active',
    included: ['Current state review', 'Architecture recommendations', 'Cost optimisation report', 'Security assessment'],
    tags: ['AWS', 'Azure', 'Terraform'],
  },
  {
    id: '2',
    title: 'Managed IT Support — SME',
    category: 'Managed IT',
    price: '£950',
    priceType: 'monthly',
    duration: 'Monthly retainer',
    status: 'active',
    included: ['Helpdesk support (Mon–Fri)', 'Infrastructure monitoring', 'Security patching', 'Monthly report'],
    tags: ['Microsoft 365', 'Azure AD', 'Windows'],
  },
  {
    id: '3',
    title: 'DevOps Setup Sprint',
    category: 'DevOps',
    price: '£4,500',
    priceType: 'fixed',
    duration: '2 weeks',
    status: 'draft',
    included: ['Docker containerisation', 'CI/CD pipeline (GitHub Actions)', 'Monitoring setup', 'Documentation'],
    tags: ['Docker', 'Kubernetes', 'GitHub Actions'],
  },
];

const CATEGORIES = ['Cloud & Infrastructure', 'Managed IT', 'Software Development', 'Cybersecurity', 'DevOps', 'QA & Testing', 'Staff Augmentation'];

const emptyForm = { title: '', category: CATEGORIES[0], price: '', priceType: 'fixed', duration: '', included: '', tags: '' };

const Packages: React.FC = () => {
  const [tab, setTab] = useState<'packages' | 'builder'>('packages');
  const [packages, setPackages] = useState(MOCK_PACKAGES);
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = () => {
    if (!form.title || !form.price) return;
    const newPkg = {
      id: String(Date.now()),
      title: form.title,
      category: form.category,
      price: `£${form.price}`,
      priceType: form.priceType,
      duration: form.duration,
      status: 'draft',
      included: form.included.split('\n').filter(Boolean),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    setPackages(p => [...p, newPkg]);
    setForm(emptyForm);
    setTab('packages');
  };

  const handleDelete = (id: string) => setPackages(p => p.filter(pkg => pkg.id !== id));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2D59]">Services & Packages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your fixed-price packages visible on your profile</p>
        </div>
        <button
          onClick={() => setTab('builder')}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Package
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['packages', 'builder'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow-sm text-[#0B2D59]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'packages' ? 'My Packages' : 'Package Builder'}
          </button>
        ))}
      </div>

      {tab === 'packages' && (
        <div className="space-y-4">
          {packages.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <div className="font-semibold text-gray-500 mb-1">No packages yet</div>
              <div className="text-sm text-gray-400">Create your first fixed-price package to attract clients</div>
            </div>
          )}
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-50 text-[#0070F3] font-semibold px-2.5 py-1 rounded-full">{pkg.category}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pkg.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {pkg.status === 'active' ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#0B2D59] mb-1">{pkg.title}</h3>
                  <div className="flex items-center gap-3 text-sm mb-3">
                    <span className="flex items-center gap-1 text-[#0070F3] font-bold">
                      <DollarSign className="h-4 w-4" />{pkg.price} <span className="text-xs text-gray-400 font-normal">{pkg.priceType === 'monthly' ? '/month' : 'fixed'}</span>
                    </span>
                    <span className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock className="h-3.5 w-3.5" />{pkg.duration}
                    </span>
                  </div>
                  <ul className="space-y-1 mb-3">
                    {pkg.included.map(item => (
                      <li key={item} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Check className="h-3.5 w-3.5 text-[#0070F3] flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1">
                    {pkg.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>)}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(pkg.id)} className="p-2 rounded-lg border border-gray-200 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'builder' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-[#0B2D59] mb-5">Create a Package</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Cloud Infrastructure Audit"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Type</label>
                <select
                  value={form.priceType}
                  onChange={e => setForm(f => ({ ...f, priceType: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="monthly">Monthly Retainer</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (£) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="e.g. 2800"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="e.g. 2 weeks"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What's Included <span className="text-gray-400 font-normal">(one item per line)</span></label>
              <textarea
                value={form.included}
                onChange={e => setForm(f => ({ ...f, included: e.target.value }))}
                rows={4}
                placeholder="e.g.&#10;Current state review&#10;Architecture recommendations&#10;Cost optimisation report"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tech Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="e.g. AWS, Terraform, Docker"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setTab('packages')}
                className="py-2.5 px-4 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="py-2.5 px-5 bg-[#0070F3] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Save Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
