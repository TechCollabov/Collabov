import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, User, X, Trash2, Loader2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface Employee {
  id: string;
  name: string;
  job_title: string | null;
  seniority: string | null;
  core_domain: string | null;
  skills: string[] | null;
  secondary_skills: string[] | null;
  years_experience: number | null;
  languages: string[] | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  engagement_type: string | null;
  availability_status: string;
  available_from: string | null;
  engaged_until: string | null;
  photo_url: string | null;
  is_active: boolean;
}

const SENIORITY = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'];
const ENGAGEMENT_TYPES = ['Full-time', 'Part-time', 'Project-based'];

const AVAILABILITY_BADGE: Record<string, { label: string; cls: string }> = {
  available: { label: 'Available Now', cls: 'bg-green-100 text-green-700' },
  available_from: { label: 'Available From', cls: 'bg-amber-100 text-amber-700' },
  engaged: { label: 'Engaged', cls: 'bg-gray-200 text-gray-600' },
};

interface EngagementOption {
  id: string;
  project_title: string | null;
  status: string;
  assigned_employee_id: string | null;
  contract_id: string | null;
  contract_number: string | null;
}

const emptyForm = {
  name: '', job_title: '', seniority: 'Mid', core_domain: '',
  primary_skills: '', secondary_skills: '', years_experience: '', languages: 'English',
  hourly_rate: '', monthly_rate: '', engagement_type: 'Full-time',
  availability_status: 'available', available_from: '', engaged_until: '',
};

const ManageEmployee: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [assignedElsewhere, setAssignedElsewhere] = useState<Set<string>>(new Set());
  const [engagements, setEngagements] = useState<EngagementOption[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('vendor_employees')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });
    setEmployees((data as Employee[]) ?? []);

    // Engagements assignable to employees; also used as the delete guard.
    const { data: engs } = await supabase
      .from('engagements')
      .select('id, project_title, status, assigned_employee_id, contract_id')
      .eq('vendor_id', user.id)
      .in('status', ['pending_signature', 'pending_ir35', 'active', 'closing']);
    const contractIds = (engs ?? []).map((e: any) => e.contract_id).filter(Boolean);
    const { data: cons } = contractIds.length
      ? await supabase.from('contracts').select('id, contract_number').in('id', contractIds)
      : { data: [] as any[] };
    const conMap = new Map((cons ?? []).map((c: any) => [c.id, c.contract_number]));
    const engOptions: EngagementOption[] = (engs ?? []).map((e: any) => ({
      id: e.id,
      project_title: e.project_title,
      status: e.status,
      assigned_employee_id: e.assigned_employee_id,
      contract_id: e.contract_id,
      contract_number: e.contract_id ? conMap.get(e.contract_id) ?? null : null,
    }));
    setEngagements(engOptions);
    setAssignedElsewhere(new Set(engOptions.filter(e => e.assigned_employee_id).map(e => e.assigned_employee_id as string)));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      name: emp.name, job_title: emp.job_title ?? '', seniority: emp.seniority ?? 'Mid',
      core_domain: emp.core_domain ?? '', primary_skills: (emp.skills ?? []).join(', '),
      secondary_skills: (emp.secondary_skills ?? []).join(', '),
      years_experience: emp.years_experience != null ? String(emp.years_experience) : '',
      languages: (emp.languages ?? ['English']).join(', '),
      hourly_rate: emp.hourly_rate != null ? String(emp.hourly_rate) : '',
      monthly_rate: emp.monthly_rate != null ? String(emp.monthly_rate) : '',
      engagement_type: emp.engagement_type ?? 'Full-time',
      availability_status: emp.availability_status,
      available_from: emp.available_from ?? '',
      engaged_until: emp.engaged_until ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.name.trim()) { setError('Name is required.'); return; }
    const primarySkills = form.primary_skills.split(',').map(s => s.trim()).filter(Boolean);
    if (primarySkills.length > 5) { setError('Primary skills: maximum 5.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        vendor_id: user.id,
        name: form.name.trim(),
        job_title: form.job_title.trim() || null,
        seniority: form.seniority,
        core_domain: form.core_domain.trim() || null,
        skills: primarySkills,
        secondary_skills: form.secondary_skills.split(',').map(s => s.trim()).filter(Boolean),
        years_experience: form.years_experience ? Number(form.years_experience) : null,
        languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
        monthly_rate: form.monthly_rate ? Number(form.monthly_rate) : null,
        engagement_type: form.engagement_type,
        availability_status: form.availability_status,
        available_from: form.availability_status === 'available_from' ? (form.available_from || null) : null,
        engaged_until: form.availability_status === 'engaged' ? (form.engaged_until || null) : null,
        is_active: true,
      };
      if (editing) {
        const { error: err } = await supabase.from('vendor_employees').update(payload).eq('id', editing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('vendor_employees').insert(payload);
        if (err) throw err;
      }
      setShowModal(false);
      await load();
    } catch (e) {
      console.error('Save employee failed:', e);
      setError('Could not save this profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (emp: Employee) => {
    if (assignedElsewhere.has(emp.id)) return;
    await supabase.from('vendor_employees').delete().eq('id', emp.id);
    await load();
  };

  const engagementLabel = (eng: EngagementOption) =>
    eng.project_title || eng.contract_number || `Engagement ${eng.id.slice(0, 8)}`;

  const assignEmployee = async (emp: Employee, engagementId: string) => {
    const currentAssignment = engagements.find(e => e.assigned_employee_id === emp.id);

    if (!engagementId) {
      // Unassign
      if (currentAssignment) {
        await supabase.from('engagements').update({ assigned_employee_id: null }).eq('id', currentAssignment.id);
        await load();
      }
      return;
    }

    if (currentAssignment && currentAssignment.id === engagementId) return;

    const target = engagements.find(e => e.id === engagementId);
    if (target?.assigned_employee_id && target.assigned_employee_id !== emp.id) {
      const otherName = employees.find(e => e.id === target.assigned_employee_id)?.name ?? 'another employee';
      const confirmed = window.confirm(
        `${engagementLabel(target)} is already assigned to ${otherName}. Reassign it to ${emp.name}?`
      );
      if (!confirmed) return;
    }

    setAssigning(emp.id);
    try {
      if (currentAssignment) {
        await supabase.from('engagements').update({ assigned_employee_id: null }).eq('id', currentAssignment.id);
      }
      await supabase.from('engagements').update({ assigned_employee_id: emp.id }).eq('id', engagementId);
      await load();
    } finally {
      setAssigning(null);
    }
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.job_title ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableCount = employees.filter(e => e.availability_status !== 'engaged').length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 text-[#0070F3] animate-spin" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-semibold">Team Members</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0070F3] text-white rounded-lg text-sm font-semibold hover:bg-blue-700" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Employee
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Bench summary: <span className="font-semibold text-gray-700">{availableCount} of {employees.length}</span> available.
        {employees.length < 3 && (
          <span className="text-amber-600 ml-2">
            <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
            Add {3 - employees.length} more profile{3 - employees.length !== 1 ? 's' : ''} to show the Team Members tab to buyers.
          </span>
        )}
      </p>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain / Skills</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">No team members yet.</td></tr>
              )}
              {filtered.map((employee) => {
                const badge = AVAILABILITY_BADGE[employee.availability_status] ?? AVAILABILITY_BADGE.available;
                const guarded = assignedElsewhere.has(employee.id);
                const currentAssignment = engagements.find(e => e.assigned_employee_id === employee.id);
                return (
                  <tr key={employee.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-[#0070F3]" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-xs text-gray-500">{employee.job_title} {employee.seniority ? `· ${employee.seniority}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{employee.core_domain}</div>
                      <div className="text-xs text-gray-500">{(employee.skills ?? []).join(', ')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{employee.hourly_rate ? `£${employee.hourly_rate}/hr` : '—'}</div>
                      <div className="text-sm text-gray-500">{employee.monthly_rate ? `£${employee.monthly_rate}/mo` : ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.cls}`}>
                        {badge.label}{employee.availability_status === 'available_from' && employee.available_from ? ` ${employee.available_from}` : ''}
                        {employee.availability_status === 'engaged' && employee.engaged_until ? ` until ${employee.engaged_until}` : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {currentAssignment ? (
                        <div className="text-sm text-gray-900 mb-1">{engagementLabel(currentAssignment)}</div>
                      ) : (
                        <div className="text-sm text-gray-400 mb-1">Unassigned</div>
                      )}
                      <select
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                        value={currentAssignment?.id ?? ''}
                        disabled={assigning === employee.id}
                        onChange={(e) => assignEmployee(employee, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {engagements.map(eng => (
                          <option key={eng.id} value={eng.id}>{engagementLabel(eng)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEdit(employee)} className="text-[#0070F3] hover:text-blue-700 mr-3">Edit</button>
                      <button
                        onClick={() => remove(employee)}
                        disabled={guarded}
                        title={guarded ? 'Set as unavailable instead — assigned to an active engagement.' : 'Delete'}
                        className={`inline-flex items-center gap-1 ${guarded ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{editing ? 'Edit' : 'Add'} Employee</h3>
                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowModal(false)}><X className="h-6 w-6" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                      value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seniority</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                      value={form.seniority} onChange={e => setForm(f => ({ ...f, seniority: e.target.value }))}>
                      {SENIORITY.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Core Domain</label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                      placeholder="e.g. Frontend Engineering" value={form.core_domain} onChange={e => setForm(f => ({ ...f, core_domain: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Skills <span className="text-gray-400 font-normal">(max 5, comma-separated)</span></label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                    placeholder="React, TypeScript, Node.js" value={form.primary_skills} onChange={e => setForm(f => ({ ...f, primary_skills: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Skills <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                    value={form.secondary_skills} onChange={e => setForm(f => ({ ...f, secondary_skills: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label>
                    <input type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                      value={form.years_experience} onChange={e => setForm(f => ({ ...f, years_experience: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Languages <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                      value={form.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (£)</label>
                    <input type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                      value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rate (£)</label>
                    <input type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                      value={form.monthly_rate} onChange={e => setForm(f => ({ ...f, monthly_rate: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                    value={form.engagement_type} onChange={e => setForm(f => ({ ...f, engagement_type: e.target.value }))}>
                    {ENGAGEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <div className="flex gap-2 mb-2">
                    {([['available', 'Available Now'], ['available_from', 'Available From'], ['engaged', 'Engaged Until']] as const).map(([val, label]) => (
                      <button key={val} type="button"
                        onClick={() => setForm(f => ({ ...f, availability_status: val }))}
                        className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium ${form.availability_status === val ? 'border-[#0070F3] bg-blue-50 text-[#0070F3]' : 'border-gray-200 text-gray-600'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {form.availability_status === 'available_from' && (
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.available_from}
                      onChange={e => setForm(f => ({ ...f, available_from: e.target.value }))} />
                  )}
                  {form.availability_status === 'engaged' && (
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.engaged_until}
                      onChange={e => setForm(f => ({ ...f, engaged_until: e.target.value }))} />
                  )}
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" className="px-4 py-2 text-gray-600 hover:text-gray-700" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="button" disabled={saving} onClick={save}
                    className="px-4 py-2 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editing ? 'Save Changes' : 'Add Employee'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ManageEmployee;
