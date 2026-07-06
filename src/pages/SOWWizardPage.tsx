import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { logEvent, NOTICE_PERIOD_DAYS, VENDOR_CONTRACT_TEMPLATE, IR35_QUESTIONS } from '../lib/workflows';
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  FileText,
  Mail,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AcceptanceCriteria {
  id: string;
  text: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  amount: number;
  due_date: string;
  acceptance_criteria: string[];
  expanded?: boolean;
}

interface MSPOnboarding {
  fee: number;
  completion_date: string;
  deliverables: { id: string; text: string; checked: boolean }[];
  min_contract_term: string;
}

interface FormData {
  // Step 1
  project_title: string;
  service_type: string;
  description: string;
  start_date: string;
  end_date: string;
  budget: number;
  // Step 2
  milestones: Milestone[];
  msp_onboarding: MSPOnboarding;
  // Step 3
  payment_model: string;
  staffaug_min_engagement: string;
  equipment_provision: string;
  // Step 4
  ip_ownership: string;
  ip_shared_terms: string;
  working_location: string;
  ir35_answers: Record<string, string>;
  right_to_work_confirmed: boolean;
  response_time_slo: string;
  uptime_slo: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  'Project Intent',
  'Deliverables',
  'Payment Structure',
  'IP & Compliance',
  'Review & Generate',
];

const SERVICE_TYPES = [
  'Software Development',
  'Managed IT',
  'Staff Augmentation',
  'Cybersecurity',
  'Cloud & Infrastructure',
  'QA & Testing',
  'DevOps',
  'Data & Analytics',
  'UI/UX Design',
];

const DEFAULT_MSP_DELIVERABLES = [
  'Infrastructure audit',
  'Monitoring agents installed',
  'Helpdesk portal configured',
  'Kick-off call completed',
  'Service runbook delivered',
];

const TIME_PERIOD_WORDS = /month|week|april|may|june|july|august|september|october|november|december|january|february|march|q1|q2|q3|q4/i;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

function buildDefaultFormData(
  vendor: string,
  type: string,
  budget: number,
  project: string
): FormData {
  const paymentDefault =
    type === 'msp' || type === 'staffaug' ? 'Monthly Recurring' : 'Milestone-based';

  return {
    project_title: project || '',
    service_type: type === 'msp' ? 'Managed IT' : type === 'staffaug' ? 'Staff Augmentation' : 'Software Development',
    description: '',
    start_date: '',
    end_date: '',
    budget: budget || 0,
    milestones: [],
    msp_onboarding: {
      fee: 0,
      completion_date: '',
      deliverables: DEFAULT_MSP_DELIVERABLES.map((t) => ({ id: uid(), text: t, checked: true })),
      min_contract_term: '12 months',
    },
    payment_model: paymentDefault,
    staffaug_min_engagement: '3 months',
    equipment_provision: 'Buyer provides equipment',
    ip_ownership: 'Buyer retains all IP',
    ip_shared_terms: '',
    working_location: 'Remote from home country',
    ir35_answers: {},
    right_to_work_confirmed: false,
    response_time_slo: '',
    uptime_slo: '',
  };
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {STEPS.map((label, idx) => {
            const stepNum = idx + 1;
            const completed = stepNum < current;
            const active = stepNum === current;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors
                      ${completed ? 'bg-blue-600 border-blue-600 text-white' : active ? 'bg-white border-blue-600 text-blue-600' : 'bg-white border-gray-300 text-gray-400'}`}
                  >
                    {completed ? <CheckCircle className="w-4 h-4" /> : stepNum}
                  </div>
                  <span
                    className={`text-xs font-medium text-center leading-tight px-1 hidden sm:block
                      ${active ? 'text-blue-600' : completed ? 'text-gray-700' : 'text-gray-400'}`}
                  >
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 ${completed ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({
  formData,
  onChange,
}: {
  formData: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Project Intent</h2>
      <p className="text-gray-500 text-sm">Tell us about the project so we can generate a tailored Statement of Work.</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.project_title}
          onChange={(e) => onChange({ project_title: e.target.value })}
          placeholder="e.g. Customer Portal Redesign"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {formData.project_title.length > 0 && formData.project_title.length < 5 && (
          <p className="text-red-500 text-xs mt-1">Minimum 5 characters required.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Service Type <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.service_type}
          onChange={(e) => onChange({ service_type: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Select a service type…</option>
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={5}
          placeholder="Describe the scope, goals, and context of the project…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex justify-between mt-1">
          {formData.description.length > 0 && formData.description.length < 100 ? (
            <p className="text-red-500 text-xs">Minimum 100 characters ({100 - formData.description.length} more needed).</p>
          ) : (
            <span />
          )}
          <span className={`text-xs ${formData.description.length >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
            {formData.description.length} chars
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => onChange({ start_date: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => onChange({ end_date: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Total Budget <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">£</span>
          <input
            type="number"
            min={0}
            value={formData.budget || ''}
            onChange={(e) => onChange({ budget: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Acceptance Criteria Tooltip ──────────────────────────────────────────────

function ACTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="text-blue-500 hover:text-blue-700 ml-1 align-middle"
        aria-label="Acceptance criteria guidance"
      >
        <Info className="w-4 h-4 inline" />
      </button>
      {open && (
        <div className="absolute z-30 left-0 top-6 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs text-gray-700 leading-relaxed">
          <p className="font-semibold mb-1">Good acceptance criteria are testable and specific.</p>
          <p className="text-gray-500">Examples:</p>
          <ul className="mt-1 space-y-1 list-disc list-inside text-gray-600">
            <li>'User can log in with email and password'</li>
            <li>'Source code delivered to buyer's GitHub with README'</li>
            <li>'UAT sign-off document provided within 5 business days'</li>
          </ul>
        </div>
      )}
    </span>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({
  formData,
  vendorType,
  onChange,
}: {
  formData: FormData;
  vendorType: string;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const [generating, setGenerating] = useState(false);

  const setMilestones = (milestones: Milestone[]) => onChange({ milestones });

  const generateDeliverables = async () => {
    setGenerating(true);
    try {
      const prompt = `Create 3-4 project milestones for this IT project SOW. Return ONLY valid JSON array.
Project: ${formData.project_title}
Service: ${formData.service_type}
Description: ${formData.description}
Budget: £${formData.budget}
Format: [{"name": "...", "description": "...", "amount": number, "acceptance_criteria": ["...", "...", "..."]}]`;
      const { data: envelope, error } = await supabase.functions.invoke('anthropic-generate', {
        body: { prompt, maxTokens: 1000 },
      });
      if (error) throw error;
      const text: string = envelope?.text || '[]';
      // Extract JSON array from possible surrounding text
      const match = text.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(match ? match[0] : text);
      setMilestones(
        parsed.map((m: any) => ({ ...m, id: uid(), due_date: '', acceptance_criteria: m.acceptance_criteria || [] }))
      );
    } catch {
      setMilestones([
        { id: uid(), name: 'Discovery & Architecture', description: 'Technical architecture document and project plan', amount: Math.round(formData.budget * 0.2), due_date: '', acceptance_criteria: ['Architecture document delivered', 'Technology stack confirmed', 'Project plan approved'] },
        { id: uid(), name: 'Core Development', description: 'Main application features built and tested', amount: Math.round(formData.budget * 0.5), due_date: '', acceptance_criteria: ['All core features functional', 'Unit tests passing (>80% coverage)', 'Staging environment deployed'] },
        { id: uid(), name: 'Testing & Launch', description: 'UAT, bug fixes, and production deployment', amount: Math.round(formData.budget * 0.3), due_date: '', acceptance_criteria: ['UAT sign-off from buyer', 'Production deployment complete', 'Handover documentation delivered'] },
      ]);
    }
    setGenerating(false);
  };

  const updateMilestone = (id: string, patch: Partial<Milestone>) => {
    setMilestones(formData.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const removeMilestone = (id: string) => {
    if (formData.milestones.length <= 1) return;
    setMilestones(formData.milestones.filter((m) => m.id !== id));
  };

  const addMilestone = () => {
    setMilestones([
      ...formData.milestones,
      { id: uid(), name: '', description: '', amount: 0, due_date: '', acceptance_criteria: ['', ''] },
    ]);
  };

  const updateCriteria = (milestoneId: string, idx: number, value: string) => {
    const m = formData.milestones.find((x) => x.id === milestoneId);
    if (!m) return;
    const updated = [...m.acceptance_criteria];
    updated[idx] = value;
    updateMilestone(milestoneId, { acceptance_criteria: updated });
  };

  const addCriterion = (milestoneId: string) => {
    const m = formData.milestones.find((x) => x.id === milestoneId);
    if (!m) return;
    updateMilestone(milestoneId, { acceptance_criteria: [...m.acceptance_criteria, ''] });
  };

  const removeCriterion = (milestoneId: string, idx: number) => {
    const m = formData.milestones.find((x) => x.id === milestoneId);
    if (!m || m.acceptance_criteria.length <= 2) return;
    const updated = m.acceptance_criteria.filter((_, i) => i !== idx);
    updateMilestone(milestoneId, { acceptance_criteria: updated });
  };

  const totalMilestones = formData.milestones.reduce((s, m) => s + (m.amount || 0), 0);
  const budgetMatch = totalMilestones === formData.budget;
  const budgetOver = totalMilestones > formData.budget;

  const isSoftware = ['Software Development', 'QA & Testing', 'DevOps', 'UI/UX Design', 'Cloud & Infrastructure'].includes(formData.service_type);

  const updateMSPOnboarding = (patch: Partial<MSPOnboarding>) =>
    onChange({ msp_onboarding: { ...formData.msp_onboarding, ...patch } });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Deliverables & Milestones</h2>
      <p className="text-gray-500 text-sm">Define what will be delivered and when. Use AI to generate a suggested breakdown.</p>

      {/* MSP Onboarding Section */}
      {vendorType === 'msp' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-base">MSP Onboarding</h3>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            Monthly subscription activates only after you confirm onboarding is complete.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Onboarding Fee (£)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">£</span>
                <input
                  type="number"
                  min={0}
                  value={formData.msp_onboarding.fee || ''}
                  onChange={(e) => updateMSPOnboarding({ fee: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Onboarding Completion Date</label>
              <input
                type="date"
                value={formData.msp_onboarding.completion_date}
                onChange={(e) => updateMSPOnboarding({ completion_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Onboarding Deliverables</label>
            <div className="space-y-2">
              {formData.msp_onboarding.deliverables.map((d) => (
                <div key={d.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={d.checked}
                    onChange={(e) =>
                      updateMSPOnboarding({
                        deliverables: formData.msp_onboarding.deliverables.map((x) =>
                          x.id === d.id ? { ...x, checked: e.target.checked } : x
                        ),
                      })
                    }
                    className="rounded"
                  />
                  <input
                    type="text"
                    value={d.text}
                    onChange={(e) =>
                      updateMSPOnboarding({
                        deliverables: formData.msp_onboarding.deliverables.map((x) =>
                          x.id === d.id ? { ...x, text: e.target.value } : x
                        ),
                      })
                    }
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateMSPOnboarding({
                    deliverables: [...formData.msp_onboarding.deliverables, { id: uid(), text: '', checked: true }],
                  })
                }
                className="text-blue-600 text-xs flex items-center gap-1 hover:text-blue-800"
              >
                <Plus className="w-3 h-3" /> Add deliverable
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Contract Term</label>
            <select
              value={formData.msp_onboarding.min_contract_term}
              onChange={(e) => updateMSPOnboarding({ min_contract_term: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {['3 months', '6 months', '12 months', 'No minimum'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        type="button"
        onClick={generateDeliverables}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating suggestions…
          </>
        ) : (
          <>
            <FileText className="w-5 h-5" />
            Generate Milestones with AI
          </>
        )}
      </button>

      {/* Milestones Table */}
      {formData.milestones.length > 0 && (
        <div className="space-y-4">
          {formData.milestones.map((m, idx) => (
            <div key={m.id} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600">Milestone {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeMilestone(m.id)}
                  disabled={formData.milestones.length <= 1}
                  className="text-red-400 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                  aria-label="Remove milestone"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => updateMilestone(m.id, { name: e.target.value })}
                    placeholder="Milestone name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount (£)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
                    <input
                      type="number"
                      min={0}
                      value={m.amount || ''}
                      onChange={(e) => updateMilestone(m.id, { amount: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={m.description}
                    onChange={(e) => updateMilestone(m.id, { description: e.target.value })}
                    placeholder="Short description"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={m.due_date}
                    onChange={(e) => updateMilestone(m.id, { due_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <button
                    type="button"
                    onClick={() => updateMilestone(m.id, { expanded: !m.expanded })}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {m.expanded ? '▾' : '▸'} Acceptance Criteria ({m.acceptance_criteria.filter(Boolean).length})
                  </button>
                  <ACTooltip />
                </div>
                {m.expanded && (
                  <div className="space-y-2 pl-2">
                    {m.acceptance_criteria.map((ac, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs w-4">{i + 1}.</span>
                        <input
                          type="text"
                          value={ac}
                          onChange={(e) => updateCriteria(m.id, i, e.target.value)}
                          placeholder="e.g. User can log in with email and password"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeCriterion(m.id, i)}
                          disabled={m.acceptance_criteria.length <= 2}
                          className="text-red-300 hover:text-red-500 disabled:text-gray-200 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addCriterion(m.id)}
                      className="text-blue-600 text-xs flex items-center gap-1 hover:text-blue-800"
                    >
                      <Plus className="w-3 h-3" /> Add criterion
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Milestone */}
          <button
            type="button"
            onClick={addMilestone}
            className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl py-3 text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Milestone
          </button>

          {/* Budget Total */}
          <div className={`flex justify-between items-center px-4 py-3 rounded-xl border text-sm font-semibold
            ${budgetMatch ? 'bg-green-50 border-green-200 text-green-700' : budgetOver ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
            <span>Milestone Total</span>
            <span>
              £{totalMilestones.toLocaleString()} / £{formData.budget.toLocaleString()}
              {budgetMatch ? ' ✓' : budgetOver ? ' (over budget!)' : ' (under budget)'}
            </span>
          </div>
        </div>
      )}

      {/* Go-live callout for software projects */}
      {isSoftware && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          <strong>For software projects:</strong> include a Production Deployment or Go-Live milestone as the final milestone. Without it, the final payment can release before the system is in production.
        </div>
      )}
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3({
  formData,
  vendorType,
  onChange,
}: {
  formData: FormData;
  vendorType: string;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const [showRecurringAlert, setShowRecurringAlert] = useState(false);

  // Override detection
  useEffect(() => {
    if (formData.milestones.length < 2) return;
    const amounts = formData.milestones.map((m) => m.amount);
    const allEqual = amounts.every((a) => a === amounts[0]);
    const hasTimePeriod = formData.milestones.some((m) => TIME_PERIOD_WORDS.test(m.name));
    setShowRecurringAlert(allEqual && hasTimePeriod && formData.payment_model === 'Milestone-based');
  }, [formData.milestones, formData.payment_model]);

  const PAYMENT_MODELS = ['Milestone-based', 'Monthly Recurring', 'Quarterly Recurring', 'Hourly'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Payment Structure</h2>
      <p className="text-gray-500 text-sm">Choose how payments will be structured between buyer and vendor.</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Model</label>
        <div className="space-y-2">
          {PAYMENT_MODELS.map((model) => (
            <label key={model} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="payment_model"
                value={model}
                checked={formData.payment_model === model}
                onChange={() => onChange({ payment_model: model })}
                className="accent-blue-600"
              />
              <span className="text-sm font-medium text-gray-800">{model}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Override alert */}
      {showRecurringAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium mb-1">These milestones look like recurring payments.</p>
            <p className="text-amber-700 mb-2">Switch to Monthly Recurring?</p>
            <button
              type="button"
              onClick={() => { onChange({ payment_model: 'Monthly Recurring' }); setShowRecurringAlert(false); }}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Yes, switch
            </button>
          </div>
        </div>
      )}

      {/* Milestone payment explainer */}
      {formData.payment_model === 'Milestone-based' && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          <strong>Milestone payments</strong> act as built-in instalments. You only pay for each phase of work when it is complete and accepted.
        </div>
      )}

      {/* Staff aug fields */}
      {vendorType === 'staffaug' && (
        <div className="border border-gray-200 rounded-xl p-5 space-y-5">
          <h3 className="font-semibold text-gray-800">Staff Augmentation Options</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Engagement Period</label>
            <select
              value={formData.staffaug_min_engagement}
              onChange={(e) => onChange({ staffaug_min_engagement: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {['1 month', '3 months', 'No minimum'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Provision</label>
            <div className="space-y-2">
              {['Buyer provides equipment', 'Vendor provides equipment'].map((opt) => (
                <label key={opt} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="equipment_provision"
                    value={opt}
                    checked={formData.equipment_provision === opt}
                    onChange={() => onChange({ equipment_provision: opt })}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-800">{opt}</span>
                </label>
              ))}
            </div>
            {formData.equipment_provision === 'Vendor provides equipment' && (
              <p className="text-xs text-gray-500 mt-2 pl-1">Vendor-provided equipment supports an outside-IR35 position.</p>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700">
            <p className="font-semibold mb-1">Permanent Hire Conversion</p>
            <p className="text-gray-500 leading-relaxed">
              The Resource Supply Agreement includes a non-solicitation clause. If you wish to permanently hire this individual during or after the engagement, a conversion fee may apply as specified in the agreement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

function Step4({
  formData,
  vendorType,
  onChange,
}: {
  formData: FormData;
  vendorType: string;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const showRightToWork = vendorType === 'staffaug' && (formData.working_location === 'On-site at buyer premises in UK' || formData.working_location === 'Hybrid');

  const updateIR35 = (idx: number, val: string) =>
    onChange({ ir35_answers: { ...formData.ir35_answers, [idx]: val } });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">IP & Compliance</h2>
      <p className="text-gray-500 text-sm">Set intellectual property ownership and compliance requirements.</p>

      {/* IP Ownership */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          IP Ownership <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {['Buyer retains all IP', 'Vendor retains all IP', 'Shared IP (specify terms)'].map((opt) => (
            <label key={opt} className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="ip_ownership"
                value={opt}
                checked={formData.ip_ownership === opt}
                onChange={() => onChange({ ip_ownership: opt })}
                className="accent-blue-600 mt-0.5"
              />
              <span className="text-sm text-gray-800">{opt}</span>
            </label>
          ))}
        </div>
        {formData.ip_ownership === 'Shared IP (specify terms)' && (
          <textarea
            value={formData.ip_shared_terms}
            onChange={(e) => onChange({ ip_shared_terms: e.target.value })}
            rows={3}
            placeholder="Describe the shared IP terms…"
            className="w-full mt-3 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        )}
      </div>

      {/* Working Location (staff aug) */}
      {vendorType === 'staffaug' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Working Location <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {['Remote from home country', 'On-site at buyer premises in UK', 'Hybrid'].map((opt) => (
              <label key={opt} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="working_location"
                  value={opt}
                  checked={formData.working_location === opt}
                  onChange={() => onChange({ working_location: opt })}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-800">{opt}</span>
              </label>
            ))}
          </div>

          {showRightToWork && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mt-3 text-sm text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-1">Right to Work Check Required</p>
                <p className="leading-relaxed mb-3">
                  You are required to verify this person's right to work in the UK before they begin. This is a legal obligation under the Immigration, Asylum and Nationality Act 2006. Collabov does not conduct this check — it is your responsibility.
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.right_to_work_confirmed}
                    onChange={(e) => onChange({ right_to_work_confirmed: e.target.checked })}
                    className="mt-0.5 accent-amber-600"
                  />
                  <span className="font-medium">I confirm I will complete this right-to-work check before the worker begins.</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* IR35 Questions (staff aug only) */}
      {vendorType === 'staffaug' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">IR35 Indicators</h3>
          <p className="text-sm text-gray-500">Answer the following questions honestly. These inform the Status Determination Statement (SDS).</p>

          {IR35_QUESTIONS.map((q, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-800 mb-3 font-medium">{q}</p>
              <div className="flex gap-4">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`ir35_${idx}`}
                      value={opt}
                      checked={formData.ir35_answers[idx] === opt}
                      onChange={() => updateIR35(idx, opt)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
            Your answers are reviewed by Collabov admin, who stamps the IR35 SDS. The determination is their responsibility, not the platform's.
          </div>
        </div>
      )}

      {/* SLA Fields */}
      <div className="border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">SLA Terms (Optional)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Response Time SLO (hours)</label>
            <input
              type="number"
              min={0}
              value={formData.response_time_slo}
              onChange={(e) => onChange({ response_time_slo: e.target.value })}
              placeholder="e.g. 4"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Uptime SLO (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={formData.uptime_slo}
              onChange={(e) => onChange({ uptime_slo: e.target.value })}
              placeholder="e.g. 99.9"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">SLA terms are stored in your contract. Monitoring is available in Phase 2.</p>
      </div>
    </div>
  );
}

// ─── Step 5 ───────────────────────────────────────────────────────────────────

function Step5({
  formData,
  vendor,
  vendorType,
  onGenerate,
  generating,
  generated,
  onDownload,
  onESignature,
  showESignatureModal,
  onBuyerSign,
  buyerSigned,
  signingInProgress,
  obligations,
  openSignUrl,
  openSignError,
  onRefreshStatus,
}: {
  formData: FormData;
  vendor: string;
  vendorType: string;
  onGenerate: () => void;
  generating: boolean;
  generated: boolean;
  onDownload: () => void;
  onESignature: () => void;
  showESignatureModal: boolean;
  onBuyerSign: () => void;
  buyerSigned: boolean;
  signingInProgress: boolean;
  obligations: string;
  openSignUrl: string | null;
  openSignError: string | null;
  onRefreshStatus: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Review & Generate</h2>
      <p className="text-gray-500 text-sm">Review the SOW summary below before generating your contract.</p>

      {/* Summary Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {[
              ['Project Title', formData.project_title],
              ['Vendor', vendor || '—'],
              ['Vendor Type', vendorType || '—'],
              ['Service Type', formData.service_type],
              ['Start Date', formData.start_date || '—'],
              ['End Date', formData.end_date || '—'],
              ['Total Budget', `£${formData.budget.toLocaleString()}`],
              ['Payment Model', formData.payment_model],
              ['IP Ownership', formData.ip_ownership],
              ...(vendorType === 'staffaug' ? [['Working Location', formData.working_location]] : []),
              ...(formData.response_time_slo ? [['Response Time SLO', `${formData.response_time_slo} hours`]] : []),
              ...(formData.uptime_slo ? [['Uptime SLO', `${formData.uptime_slo}%`]] : []),
            ].map(([label, value], i) => (
              <tr key={label} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-2.5 font-medium text-gray-600 w-44">{label}</td>
                <td className="px-4 py-2.5 text-gray-800">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Milestones */}
      {formData.milestones.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2 text-sm">Milestones</h3>
          <div className="space-y-2">
            {formData.milestones.map((m, idx) => (
              <div key={m.id} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{idx + 1}. {m.name || 'Unnamed'}</p>
                  {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                  {m.due_date && <p className="text-xs text-gray-400 mt-0.5">Due: {m.due_date}</p>}
                  {m.acceptance_criteria.filter(Boolean).length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {m.acceptance_criteria.filter(Boolean).map((ac, i) => (
                        <li key={i} className="text-xs text-gray-500 flex gap-1"><span>•</span>{ac}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-700 ml-4 flex-shrink-0">£{m.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IR35 summary */}
      {vendorType === 'staffaug' && Object.keys(formData.ir35_answers).length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2 text-sm">IR35 Indicators</h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {IR35_QUESTIONS.map((q, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-2 text-gray-600">{q}</td>
                    <td className={`px-4 py-2 font-semibold w-12 text-center ${formData.ir35_answers[idx] === 'Yes' ? 'text-amber-600' : 'text-green-600'}`}>
                      {formData.ir35_answers[idx] || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate button */}
      {!generated && (
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-3 bg-[#0070F3] hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-xl text-base transition-colors shadow-md"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating your SOW…
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Generate SOW Document
            </>
          )}
        </button>
      )}

      {/* Success state */}
      {generated && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <span className="font-semibold">SOW document generated</span>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Your obligations in plain English</h4>
            <p className="text-xs text-gray-600 leading-relaxed">{obligations}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 rounded-xl transition-colors"
            >
              <Download className="w-5 h-5" />
              Download SOW
            </button>
            <button
              type="button"
              onClick={onESignature}
              className="flex items-center justify-center gap-2 bg-[#0070F3] hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              <Mail className="w-5 h-5" />
              Proceed to E-Signature
            </button>
          </div>
        </div>
      )}

      {/* E-Signature Modal — real OpenSign signing, not an in-app flip */}
      {showESignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center space-y-3">
              <div className="flex justify-center">
                <Mail className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {buyerSigned ? 'You have signed' : 'Sign the contract'}
              </h3>
              <p className="text-sm text-gray-600">
                {buyerSigned
                  ? 'Waiting for the vendor to counter-sign. Both parties sign independently — the contract activates once both signatures are in.'
                  : 'Signing happens in OpenSign, which opens in a new tab. The vendor signs separately from their Active Contracts screen. The contract activates when both have signed.'}
              </p>

              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between bg-white border border-blue-100 rounded-lg px-4 py-2 text-sm">
                  <span className="text-gray-600">Buyer (you)</span>
                  {buyerSigned
                    ? <span className="text-green-600 font-medium text-xs">✓ Signed</span>
                    : <span className="text-amber-600 font-medium text-xs">Awaiting signature</span>}
                </div>
                <div className="flex items-center justify-between bg-white border border-blue-100 rounded-lg px-4 py-2 text-sm">
                  <span className="text-gray-600">Vendor: <span className="font-semibold text-gray-800">{vendor || 'Vendor'}</span></span>
                  <span className="text-amber-600 font-medium text-xs">{buyerSigned ? 'Notified — awaiting signature' : 'Awaiting signature'}</span>
                </div>
              </div>

              {vendorType === 'staffaug' && (
                <p className="text-xs text-amber-600 mt-2">
                  Staff augmentation: after both signatures, an admin stamps the IR35 status determination
                  before the contract becomes active.
                </p>
              )}

              {openSignError && <p className="text-xs text-red-600 mt-2">{openSignError}</p>}

              {!buyerSigned ? (
                <div className="space-y-2 mt-2">
                  <button
                    type="button"
                    onClick={onBuyerSign}
                    disabled={!openSignUrl}
                    className="w-full bg-[#0070F3] hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    {openSignUrl ? 'Sign with OpenSign →' : 'Preparing signing link…'}
                  </button>
                  <button
                    type="button"
                    onClick={onRefreshStatus}
                    disabled={signingInProgress}
                    className="w-full border border-blue-200 text-blue-700 font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {signingInProgress ? 'Checking…' : "I've signed — refresh status"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/customer/dashboard')}
                  className="w-full bg-[#0070F3] hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl mt-2 transition-colors"
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, formData: FormData, vendorType: string): string | null {
  if (step === 1) {
    if (!formData.project_title || formData.project_title.length < 5) return 'Project title must be at least 5 characters.';
    if (!formData.service_type) return 'Please select a service type.';
    if (!formData.description || formData.description.length < 100) return 'Description must be at least 100 characters.';
    if (!formData.budget || formData.budget <= 0) return 'Please enter a valid budget.';
  }
  if (step === 2) {
    if (formData.milestones.length === 0) return 'Please generate or add at least one milestone.';
    for (const m of formData.milestones) {
      if (!m.name) return 'All milestones must have a name.';
      const validCriteria = m.acceptance_criteria.filter(Boolean);
      if (validCriteria.length < 2) return `Milestone "${m.name || 'Unnamed'}" needs at least 2 acceptance criteria.`;
    }
  }
  if (step === 4) {
    if (!formData.ip_ownership) return 'Please select IP ownership.';
    if (formData.ip_ownership === 'Shared IP (specify terms)' && !formData.ip_shared_terms.trim()) {
      return 'Please specify the shared IP terms.';
    }
    const showRightToWork = vendorType === 'staffaug' &&
      (formData.working_location === 'On-site at buyer premises in UK' || formData.working_location === 'Hybrid');
    if (showRightToWork && !formData.right_to_work_confirmed) {
      return 'Please confirm you will complete the right-to-work check before proceeding.';
    }
  }
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SOWWizardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const vendor = searchParams.get('vendor') || '';
  const vendorType = searchParams.get('type') || 'agency';
  const budget = parseFloat(searchParams.get('budget') || '0');
  const project = searchParams.get('project') || '';
  const vendorId = searchParams.get('vendorId') || '';
  const proposalId = searchParams.get('proposal') || '';
  const packageId = searchParams.get('package') || '';
  const isDiscovery = searchParams.get('discovery') === '1';
  const discoveryFromId = searchParams.get('discoveryFrom') || '';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(() =>
    buildDefaultFormData(vendor, vendorType, budget, project)
  );
  const [error, setError] = useState<string | null>(null);

  // Step 5 state
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [showESignatureModal, setShowESignatureModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [buyerSigned, setBuyerSigned] = useState(false);
  const [persistedIds, setPersistedIds] = useState<{ engagementId: string; contractId: string; sowId: string } | null>(null);
  const [openSignBuyerUrl, setOpenSignBuyerUrl] = useState<string | null>(null);
  const [openSignError, setOpenSignError] = useState<string | null>(null);

  // Pre-fill from the accepted proposal or purchased package.
  useEffect(() => {
    let cancelled = false;
    async function prefill() {
      if (proposalId) {
        const { data: p } = await supabase
          .from('proposals')
          .select('milestones, approach_summary, proposed_budget, discovery_fee, spec_structure, proposal_kind')
          .eq('id', proposalId)
          .single();
        if (!p || cancelled) return;
        if (p.proposal_kind === 'discovery') {
          // Discovery: simplified 1-step SOW — single milestone equals the fee.
          setFormData(prev => ({
            ...prev,
            budget: p.discovery_fee ?? prev.budget,
            payment_model: 'Milestone-based',
            milestones: [{
              id: uid(),
              name: 'Discovery: specification document',
              description: (Array.isArray(p.spec_structure) ? p.spec_structure.map(String).join('; ') : 'Specification document delivery'),
              amount: p.discovery_fee ?? prev.budget,
              due_date: '',
              acceptance_criteria: ['Specification document delivered as PDF', 'Executive summary and approach included'],
            }],
          }));
        } else if (Array.isArray(p.milestones) && p.milestones.length > 0) {
          setFormData(prev => ({
            ...prev,
            milestones: (p.milestones as any[]).map((m: any) => ({
              id: uid(),
              name: m.name ?? '',
              description: m.description ?? '',
              amount: Number(m.amount) || 0,
              due_date: m.due_date ?? '',
              acceptance_criteria: ['', ''],
            })),
          }));
        }
      } else if (discoveryFromId) {
        // "Build with [Vendor]": pre-populate from the discovery spec, locked to this vendor.
        const { data: msRows } = await supabase
          .from('project_milestones')
          .select('id')
          .eq('engagement_id', discoveryFromId)
          .limit(1);
        const specMilestoneId = msRows?.[0]?.id;
        const { data: ev } = specMilestoneId
          ? await supabase.from('evidence').select('delivery_description, files').eq('milestone_id', specMilestoneId).maybeSingle()
          : { data: null };
        if (cancelled) return;
        setFormData(prev => ({
          ...prev,
          description: ev?.delivery_description
            ? `${ev.delivery_description}\n\nBuilt from discovery specification.`
            : prev.description,
        }));
      } else if (packageId) {
        const { data: pkg } = await supabase
          .from('vendor_packages')
          .select('name, description, price, billing_period, features')
          .eq('id', packageId)
          .single();
        if (!pkg || cancelled) return;
        const features = Array.isArray(pkg.features) ? pkg.features.map(String) : [];
        setFormData(prev => ({
          ...prev,
          project_title: pkg.name,
          description: pkg.description ?? prev.description,
          budget: Number(pkg.price) || prev.budget,
          milestones: [{
            id: uid(),
            name: pkg.name,
            description: features.join('; '),
            amount: Number(pkg.price) || 0,
            due_date: '',
            acceptance_criteria: features.length >= 2 ? features.slice(0, 3) : ['All included items delivered', 'Buyer sign-off received'],
          }],
        }));
      }
    }
    prefill();
    return () => { cancelled = true; };
  }, [proposalId, packageId, discoveryFromId]);

  const onChange = (patch: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const goNext = () => {
    const err = validateStep(step, formData, vendorType);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Plain-English obligations summary (AI-assisted in production; deterministic fallback). */
  const obligationsSummary = () => {
    const ms = formData.milestones.length;
    const model = formData.payment_model;
    return (
      `The buyer funds each ${model === 'Monthly Recurring' ? 'monthly period' : 'milestone'} into escrow before work starts, ` +
      `reviews delivery against ${ms > 0 ? `${ms} milestone(s) with agreed acceptance criteria` : 'the agreed acceptance criteria'}, ` +
      `and releases payment on acceptance (or automatically after 7 days of silence). ` +
      `The vendor delivers to the agreed scope, submits evidence for review, and responds to flagged criteria within 5 days. ` +
      `IP: ${formData.ip_ownership}. Disputes freeze escrow and follow a 72-hour bilateral window before admin resolution. ` +
      `UK law governs; a 12-month mutual non-solicitation applies.`
    );
  };

  /** Persist the full SOW graph: engagement, contract, sow_documents, milestones. */
  const handleGenerate = async () => {
    if (!user) { navigate('/signin'); return; }
    if (!vendorId) { setError('Missing vendor reference — reopen this wizard from the proposal or package.'); return; }
    setGenerating(true);
    setError(null);
    try {
      const paymentModel =
        formData.payment_model === 'Monthly Recurring' ? 'monthly'
        : formData.payment_model === 'Quarterly' ? 'quarterly'
        : formData.payment_model === 'Hourly' ? 'hourly' : 'milestone';
      const startDate = formData.start_date || new Date().toISOString().slice(0, 10);

      // 1. Project record (workspace surface)
      const { data: proj, error: projErr } = await supabase.from('projects').insert({
        customer_id: user.id,
        vendor_id: vendorId,
        title: formData.project_title,
        description: formData.description,
        budget: formData.budget,
        status: 'in-progress',
        start_date: startDate,
        deadline: formData.end_date || null,
      }).select().single();
      if (projErr) throw projErr;

      // 2. Engagement (lifecycle spine)
      const { data: eng, error: engErr } = await supabase.from('engagements').insert({
        buyer_id: user.id,
        vendor_id: vendorId,
        project_title: formData.project_title,
        status: 'pending_signature',
        engagement_type: isDiscovery ? 'discovery' : vendorType === 'msp' ? 'managed_service' : vendorType === 'staffaug' ? 'staff_aug' : 'project',
        source: discoveryFromId ? 'discovery_conversion' : packageId ? 'package' : isDiscovery ? 'discovery' : 'rfp',
        proposal_id: proposalId || null,
        package_id: packageId || null,
        parent_engagement_id: discoveryFromId || null,
        payment_model: paymentModel,
        monthly_amount: paymentModel === 'monthly' ? formData.budget : null,
        total_value: formData.budget,
        start_date: startDate,
        end_date: formData.end_date || null,
        working_location: vendorType === 'staffaug' ? formData.working_location : null,
        equipment_provider: vendorType === 'staffaug' ? (formData.equipment_provision.startsWith('Buyer') ? 'buyer' : 'vendor') : null,
        minimum_contract_months: vendorType === 'msp' ? parseInt(formData.msp_onboarding.min_contract_term) || 12 : 12,
        minimum_engagement_months: vendorType === 'staffaug' ? parseInt(formData.staffaug_min_engagement) || 3 : 3,
        ir35_status: vendorType === 'staffaug' ? 'pending' : null,
      }).select().single();
      if (engErr) throw engErr;

      // 3. Contract (template assigned by vendor type)
      const contractNumber = `COL-${Date.now().toString(36).toUpperCase()}`;
      const { data: contract, error: conErr } = await supabase.from('contracts').insert({
        contract_number: contractNumber,
        project_id: proj.id,
        customer_id: user.id,
        vendor_id: vendorId,
        title: `${VENDOR_CONTRACT_TEMPLATE[vendorType] ?? 'Service Agreement'} — ${formData.project_title}`,
        start_date: startDate,
        end_date: formData.end_date || null,
        total_value: formData.budget,
        payment_terms: formData.payment_model,
        status: 'pending',
        terms_and_conditions:
          `${VENDOR_CONTRACT_TEMPLATE[vendorType] ?? 'Service Agreement'}. Mutual NDA, GDPR DPA Schedule 3, ` +
          `dispute clause, UK governing law, 12-month non-solicitation.`,
        notice_period_days: NOTICE_PERIOD_DAYS[vendorType] ?? 14,
        defect_liability_days: vendorType === 'agency' ? 30 : 0,
      }).select().single();
      if (conErr) throw conErr;

      // 4. SOW document (full wizard payload)
      const { data: sow, error: sowErr } = await supabase.from('sow_documents').insert({
        engagement_id: eng.id,
        contract_id: contract.id,
        proposal_id: proposalId || null,
        buyer_id: user.id,
        vendor_id: vendorId,
        vendor_business_type: vendorType,
        project_title: formData.project_title,
        service_type: formData.service_type,
        description: formData.description,
        start_date: startDate,
        end_date: formData.end_date || null,
        total_budget: formData.budget,
        milestones: formData.milestones.map(m => ({
          name: m.name, description: m.description, amount: m.amount,
          due_date: m.due_date, acceptance_criteria: m.acceptance_criteria.filter(Boolean),
        })),
        payment_model: paymentModel,
        msp_onboarding: vendorType === 'msp' ? {
          fee: formData.msp_onboarding.fee,
          go_live_date: formData.msp_onboarding.completion_date,
          deliverables: formData.msp_onboarding.deliverables.filter(d => d.checked).map(d => d.text),
          min_contract_term: formData.msp_onboarding.min_contract_term,
        } : null,
        monthly_amount: paymentModel === 'monthly' ? formData.budget : null,
        equipment_provider: vendorType === 'staffaug' ? (formData.equipment_provision.startsWith('Buyer') ? 'buyer' : 'vendor') : null,
        ip_ownership: formData.ip_ownership.startsWith('Buyer') ? 'buyer' : formData.ip_ownership.startsWith('Vendor') ? 'vendor' : 'shared',
        ip_shared_terms: formData.ip_shared_terms || null,
        working_location: vendorType === 'staffaug' ? formData.working_location : null,
        ir35_answers: vendorType === 'staffaug' ? formData.ir35_answers : null,
        right_to_work_confirmed: vendorType === 'staffaug' ? formData.right_to_work_confirmed : false,
        obligations_summary: obligationsSummary(),
        status: 'generated',
        generated_at: new Date().toISOString(),
      }).select().single();
      if (sowErr) throw sowErr;

      await supabase.from('engagements').update({ contract_id: contract.id, sow_id: sow.id, job_id: null }).eq('id', eng.id);

      // 5. Milestones with escrow state machine (MSP: onboarding milestone first)
      const milestoneRows: any[] = [];
      if (vendorType === 'msp') {
        milestoneRows.push({
          project_id: proj.id,
          engagement_id: eng.id,
          title: 'Onboarding',
          description: formData.msp_onboarding.deliverables.filter(d => d.checked).map(d => d.text).join('; '),
          amount: formData.msp_onboarding.fee ?? 0,
          due_date: formData.msp_onboarding.completion_date || null,
          acceptance_criteria: formData.msp_onboarding.deliverables.filter(d => d.checked).map(d => d.text),
          milestone_type: 'onboarding',
          escrow_status: 'unfunded',
          display_order: 0,
        });
      }
      formData.milestones.forEach((m, i) => {
        milestoneRows.push({
          project_id: proj.id,
          engagement_id: eng.id,
          title: m.name,
          description: m.description,
          amount: m.amount,
          due_date: m.due_date || null,
          acceptance_criteria: m.acceptance_criteria.filter(Boolean),
          milestone_type: isDiscovery ? 'discovery' : 'standard',
          escrow_status: 'unfunded',
          display_order: i + 1,
        });
      });
      if (milestoneRows.length > 0) {
        const { error: msErr } = await supabase.from('project_milestones').insert(milestoneRows);
        if (msErr) throw msErr;
      }

      await logEvent('sow_generated', user.id, 'buyer', 'sow', sow.id, { total: formData.budget });
      setPersistedIds({ engagementId: eng.id, contractId: contract.id, sowId: sow.id });
      setGenerated(true);

      // Real e-signature request — replaces the old in-app "click to sign"
      // flip. Failure here isn't fatal to SOW generation; the buyer can retry
      // from the e-signature step.
      try {
        const { data: envelope, error: envelopeErr } = await supabase.functions.invoke('opensign-create-envelope', { body: { sowId: sow.id } });
        if (envelopeErr) throw envelopeErr;
        setOpenSignBuyerUrl(envelope?.buyerSignUrl ?? null);
      } catch (envelopeErr) {
        console.error('OpenSign envelope creation failed:', envelopeErr);
        setOpenSignError('Could not prepare the e-signature request. You can retry from the e-signature step.');
      }
    } catch (e) {
      console.error('SOW generation failed:', e);
      setError('Could not generate the SOW. Please check the form and try again.');
    } finally {
      setGenerating(false);
    }
  };

  /** Opens the real OpenSign signing page — the actual signature happens
   *  there, not in this app. buyer_signed_at is only ever set by the
   *  opensign-webhook Edge Function once OpenSign reports it's complete. */
  const handleBuyerSign = () => {
    if (!openSignBuyerUrl) return;
    window.open(openSignBuyerUrl, '_blank', 'noopener,noreferrer');
  };

  /** Re-fetches the SOW to pick up a signature the webhook has since recorded. */
  const refreshSignStatus = async () => {
    if (!persistedIds) return;
    setSigning(true);
    try {
      const { data } = await supabase.from('sow_documents').select('buyer_signed_at').eq('id', persistedIds.sowId).maybeSingle();
      setBuyerSigned(!!data?.buyer_signed_at);
    } finally {
      setSigning(false);
    }
  };

  const handleDownload = () => {
    const lines: string[] = [
      'STATEMENT OF WORK',
      `Generated: ${new Date().toLocaleDateString('en-GB')}`,
      `Project: ${formData.project_title}`,
      `Vendor: ${vendor}`,
      `Total Value: £${formData.budget.toLocaleString()}`,
      '',
      'MILESTONES:',
      ...formData.milestones.map((m, i) => [
        `${i + 1}. ${m.name} — £${m.amount.toLocaleString()}${m.due_date ? ` (Due: ${m.due_date})` : ''}`,
        `   ${m.description}`,
        ...m.acceptance_criteria.filter(Boolean).map((ac) => `   - ${ac}`),
      ].join('\n')),
      '',
      `PAYMENT MODEL: ${formData.payment_model}`,
      `IP OWNERSHIP: ${formData.ip_ownership}`,
      '',
      'Governed by English law. Platform-standard contract template applies.',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOW_${formData.project_title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stepProps = { formData, onChange };

  return (
    <div className="min-h-screen bg-gray-50">
      <StepIndicator current={step} />

      {/* Content */}
      <div className="pt-28 pb-32 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && <Step1 {...stepProps} />}
          {step === 2 && <Step2 {...stepProps} vendorType={vendorType} />}
          {step === 3 && <Step3 {...stepProps} vendorType={vendorType} />}
          {step === 4 && <Step4 {...stepProps} vendorType={vendorType} />}
          {step === 5 && (
            <Step5
              formData={formData}
              vendor={vendor}
              vendorType={vendorType}
              onGenerate={handleGenerate}
              generating={generating}
              generated={generated}
              onDownload={handleDownload}
              onESignature={() => setShowESignatureModal(true)}
              showESignatureModal={showESignatureModal}
              onBuyerSign={handleBuyerSign}
              buyerSigned={buyerSigned}
              signingInProgress={signing}
              obligations={obligationsSummary()}
              openSignUrl={openSignBuyerUrl}
              openSignError={openSignError}
              onRefreshStatus={refreshSignStatus}
            />
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <span className="text-xs text-gray-400 font-medium">Step {step} of {STEPS.length}</span>

          {step < 5 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0070F3] hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/customer/dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Exit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
