import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Upload, Building2, Mail, Phone, User, Users,
  CheckCircle, X, Loader2, Plus, Trash2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

/* ── Shared option lists (kept local to this page, matching the pattern
   used by VendorSignup.tsx rather than introducing a new shared module) ── */
const SERVICE_CATEGORIES = [
  'Software Development', 'Managed IT', 'Staff Augmentation', 'Cybersecurity',
  'Cloud & Infrastructure', 'QA & Testing', 'DevOps', 'Data & Analytics',
  'UI/UX Design', 'AI & Machine Learning',
];
const TECH_TAGS = [
  'React', 'Node.js', 'Python', '.NET', 'Java', 'AWS', 'Azure', 'GCP',
  'Docker', 'Kubernetes', 'TypeScript', 'PHP', 'Ruby', 'Go', 'Terraform',
];
const COUNTRIES = [
  'United Kingdom', 'Ireland', 'Poland', 'Romania', 'Ukraine', 'India',
  'Portugal', 'Germany', 'Netherlands', 'United States', 'Other',
];
const INDUSTRY_SECTORS = [
  'Financial Services', 'Healthcare', 'Retail & E-commerce', 'Manufacturing',
  'Professional Services', 'Technology & SaaS', 'Public Sector', 'Education',
  'Media & Entertainment',
];
const SIZE_BANDS = ['1-10', '11-50', '51-200', '201-500', '500+'];

const STEPS = [
  { n: 1, label: 'Company Info' },
  { n: 2, label: 'Contact' },
  { n: 3, label: 'Business Overview' },
  { n: 4, label: 'Services & Rates' },
  { n: 5, label: 'Case Studies & Referrals' },
  { n: 6, label: 'Verification Docs' },
  { n: 7, label: 'Bank Details' },
];

/* ── Types matching the real vendors/case_studies/vendor_referrals columns ── */
interface VendorRow {
  company_name: string;
  website_url: string;
  address: string;
  city: string;
  state: string;
  country: string;
  logo_url: string | null;
  description: string;
  tagline: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  team_size_band: string;
  founded_year: number | null;
  industry_focus: string[];
  operating_locations: string[];
  service_categories: string[];
  tech_stack: string[];
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  monthly_rate_min: number | null;
  monthly_rate_max: number | null;
  minimum_project_value: number | null;
  ir35_compliant: boolean;
  gdpr_ready: boolean;
  business_type: string | null;
  registered_name: string;
  account_number: string;
  ifsc_code: string;
  bank_address: string;
  bank_name: string;
  registered_email: string;
}

const EMPTY_VENDOR: VendorRow = {
  company_name: '', website_url: '', address: '', city: '', state: '', country: '',
  logo_url: null, description: '', tagline: '',
  contact_name: '', contact_email: '', contact_phone: '',
  team_size_band: '', founded_year: null,
  industry_focus: [], operating_locations: [], service_categories: [], tech_stack: [],
  hourly_rate_min: null, hourly_rate_max: null, monthly_rate_min: null, monthly_rate_max: null,
  minimum_project_value: null, ir35_compliant: false, gdpr_ready: false, business_type: null,
  registered_name: '', account_number: '', ifsc_code: '', bank_address: '', bank_name: '', registered_email: '',
};

interface CaseStudyRow {
  id?: string;
  project_title: string;
  industry: string;
  services_delivered: string[];
  tech_stack: string[];
  duration: string;
  team_size: number | null;
  challenge: string;
  solution: string;
  outcomes: string[];
  client_quote: string;
  ai_keyword_tags?: string[];
}

const emptyCaseStudy = (): CaseStudyRow => ({
  project_title: '', industry: '', services_delivered: [], tech_stack: [],
  duration: '', team_size: null, challenge: '', solution: '',
  outcomes: ['', '', ''], client_quote: '',
});

interface ReferralRow {
  id?: string;
  contact_name: string;
  job_title: string;
  company: string;
  work_email: string;
  project_vouched_for: string;
  project_duration: string;
  project_value_band: string;
  confirmed?: boolean;
}

const emptyReferral = (): ReferralRow => ({
  contact_name: '', job_title: '', company: '', work_email: '',
  project_vouched_for: '', project_duration: '', project_value_band: '',
});

const extractCaseStudyKeywords = async (caseStudy: CaseStudyRow): Promise<string[]> => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) return [];
  try {
    const prompt = `Extract 3-5 keyword tags from this IT project case study. Return ONLY a JSON array of strings, no other text.

Project: ${caseStudy.project_title}
Industry: ${caseStudy.industry}
Services: ${caseStudy.services_delivered.join(', ')}
Tech stack: ${caseStudy.tech_stack.join(', ')}
Challenge: ${caseStudy.challenge}
Solution: ${caseStudy.solution}
Outcomes: ${caseStudy.outcomes.filter(Boolean).join('. ')}

Return 3-5 specific keyword tags as a JSON array, e.g. ["fintech", "real-time-payments", "aws-lambda"]`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const tags = JSON.parse(text);
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
};

/* ── Small shared field components ── */
function TagPicker({ options, selected, onToggle, custom, onAddCustom, onRemoveCustom }: {
  options: string[]; selected: string[]; onToggle: (v: string) => void;
  custom?: string[]; onAddCustom?: (v: string) => void; onRemoveCustom?: (v: string) => void;
}) {
  const [input, setInput] = useState('');
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {options.map(o => (
          <button key={o} type="button" onClick={() => onToggle(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected.includes(o) ? 'bg-[#0070F3] text-white border-[#0070F3]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {o}
          </button>
        ))}
      </div>
      {onAddCustom && (
        <>
          <div className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (input.trim()) { onAddCustom(input.trim()); setInput(''); } } }}
              placeholder="Add custom..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
            <button type="button" onClick={() => { if (input.trim()) { onAddCustom(input.trim()); setInput(''); } }}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">Add</button>
          </div>
          {custom && custom.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {custom.map(c => (
                <span key={c} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#0070F3] text-xs rounded-full">
                  {c}<button type="button" onClick={() => onRemoveCustom?.(c)}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SaveBar({ saving, savedAt, onSave, disabled, disabledReason }: { saving: boolean; savedAt: number | null; onSave: () => void; disabled?: boolean; disabledReason?: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button type="button" onClick={onSave} disabled={saving || disabled}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        {saving ? 'Saving...' : 'Save this step'}
      </button>
      {savedAt && !saving && <span className="text-xs text-green-600">Saved</span>}
      {disabled && disabledReason && <span className="text-xs text-gray-400">{disabledReason}</span>}
    </div>
  );
}

/* ── Main component ── */
const ManageListings: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorRow>(EMPTY_VENDOR);
  const [caseStudies, setCaseStudies] = useState<CaseStudyRow[]>([emptyCaseStudy(), emptyCaseStudy(), emptyCaseStudy()]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([emptyReferral()]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<{ companies_house: File | null; vat_certificate: File | null; address_proof: File | null }>({ companies_house: null, vat_certificate: null, address_proof: null });
  const [existingDocs, setExistingDocs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: v }, { data: cs }, { data: refs }, { data: docs }] = await Promise.all([
      supabase.from('vendors').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('case_studies').select('*').eq('vendor_id', user.id).order('created_at', { ascending: true }),
      supabase.from('vendor_referrals').select('*').eq('vendor_id', user.id).order('created_at', { ascending: true }),
      supabase.from('vendor_documents').select('document_type, document_url').eq('vendor_id', user.id),
    ]);
    if (v) {
      setVendor({
        company_name: v.company_name ?? '', website_url: v.website_url ?? '', address: v.address ?? '',
        city: v.city ?? '', state: v.state ?? '', country: v.country ?? '', logo_url: v.logo_url ?? null,
        description: v.description ?? '', tagline: v.tagline ?? '',
        contact_name: v.contact_name ?? '', contact_email: v.contact_email ?? '', contact_phone: v.contact_phone ?? '',
        team_size_band: v.team_size_band ?? '', founded_year: v.founded_year ?? null,
        industry_focus: Array.isArray(v.industry_focus) ? v.industry_focus : [],
        operating_locations: Array.isArray(v.operating_locations) ? v.operating_locations : [],
        service_categories: Array.isArray(v.service_categories) ? v.service_categories : [],
        tech_stack: Array.isArray(v.tech_stack) ? v.tech_stack : [],
        hourly_rate_min: v.hourly_rate_min, hourly_rate_max: v.hourly_rate_max,
        monthly_rate_min: v.monthly_rate_min, monthly_rate_max: v.monthly_rate_max,
        minimum_project_value: v.minimum_project_value,
        ir35_compliant: !!v.ir35_compliant, gdpr_ready: !!v.gdpr_ready, business_type: v.business_type ?? null,
        registered_name: v.registered_name ?? '', account_number: v.account_number ?? '', ifsc_code: v.ifsc_code ?? '',
        bank_address: v.bank_address ?? '', bank_name: v.bank_name ?? '', registered_email: v.registered_email ?? '',
      });
    }
    if (cs && cs.length > 0) {
      const loaded = cs.slice(0, 3).map((row: any): CaseStudyRow => ({
        id: row.id, project_title: row.project_title ?? '', industry: row.industry ?? '',
        services_delivered: Array.isArray(row.services_delivered) ? row.services_delivered : [],
        tech_stack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
        duration: row.duration ?? '', team_size: row.team_size ?? null,
        challenge: row.challenge ?? '', solution: row.solution ?? '',
        outcomes: Array.isArray(row.outcomes) && row.outcomes.length > 0 ? [...row.outcomes, '', '', ''].slice(0, 3) : ['', '', ''],
        client_quote: row.client_quote ?? '', ai_keyword_tags: row.ai_keyword_tags ?? [],
      }));
      while (loaded.length < 3) loaded.push(emptyCaseStudy());
      setCaseStudies(loaded);
    }
    if (refs && refs.length > 0) {
      setReferrals(refs.map((row: any): ReferralRow => ({
        id: row.id, contact_name: row.contact_name ?? '', job_title: row.job_title ?? '',
        company: row.company ?? '', work_email: row.work_email ?? '',
        project_vouched_for: row.project_vouched_for ?? '', project_duration: row.project_duration ?? '',
        project_value_band: row.project_value_band ?? '', confirmed: row.confirmed ?? false,
      })));
    }
    if (docs) {
      const map: Record<string, string> = {};
      docs.forEach((d: any) => { map[d.document_type] = d.document_url; });
      setExistingDocs(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const markSaved = (key: string) => setSavedAt(prev => ({ ...prev, [key]: Date.now() }));

  const saveVendorFields = async (fields: Partial<VendorRow>, key: string) => {
    if (!user) return;
    setSaving(key);
    setError(null);
    const { error: err } = await supabase.from('vendors').update(fields).eq('id', user.id);
    setSaving(null);
    if (err) { setError(err.message); return; }
    setVendor(prev => ({ ...prev, ...fields }));
    markSaved(key);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user) return null;
    const ext = logoFile.name.split('.').pop();
    const path = `${user.id}/logo.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('vendor-logos').upload(path, logoFile, { upsert: true });
    if (uploadErr) { setError(uploadErr.message); return null; }
    const { data } = supabase.storage.from('vendor-logos').getPublicUrl(path);
    return data.publicUrl;
  };

  const saveStep1 = async () => {
    setSaving('step1');
    setError(null);
    let logo_url = vendor.logo_url;
    if (logoFile) {
      const uploaded = await uploadLogo();
      if (uploaded) logo_url = uploaded;
    }
    await saveVendorFields({
      company_name: vendor.company_name, website_url: vendor.website_url, address: vendor.address,
      city: vendor.city, state: vendor.state, country: vendor.country, description: vendor.description,
      tagline: vendor.tagline, team_size_band: vendor.team_size_band, founded_year: vendor.founded_year,
      logo_url,
    }, 'step1');
    setLogoFile(null);
  };

  const saveStep2 = () => saveVendorFields({
    contact_name: vendor.contact_name, contact_email: vendor.contact_email, contact_phone: vendor.contact_phone,
  }, 'step2');

  const saveStep3 = () => saveVendorFields({
    industry_focus: vendor.industry_focus, operating_locations: vendor.operating_locations,
  }, 'step3');

  const saveStep4 = () => saveVendorFields({
    service_categories: vendor.service_categories, tech_stack: vendor.tech_stack,
    hourly_rate_min: vendor.hourly_rate_min, hourly_rate_max: vendor.hourly_rate_max,
    monthly_rate_min: vendor.monthly_rate_min, monthly_rate_max: vendor.monthly_rate_max,
    minimum_project_value: vendor.minimum_project_value,
    ir35_compliant: vendor.ir35_compliant, gdpr_ready: vendor.gdpr_ready,
  }, 'step4');

  const saveStep7 = () => saveVendorFields({
    registered_name: vendor.registered_name, account_number: vendor.account_number, ifsc_code: vendor.ifsc_code,
    bank_address: vendor.bank_address, bank_name: vendor.bank_name, registered_email: vendor.registered_email,
  }, 'step7');

  const saveCaseStudy = async (idx: number) => {
    if (!user) return;
    const cs = caseStudies[idx];
    if (!cs.project_title.trim()) { setError('Project title is required before saving a case study.'); return; }
    setSaving(`cs${idx}`);
    setError(null);
    const keywords = await extractCaseStudyKeywords(cs);
    const payload = {
      vendor_id: user.id, project_title: cs.project_title, industry: cs.industry,
      services_delivered: cs.services_delivered, tech_stack: cs.tech_stack, duration: cs.duration,
      team_size: cs.team_size, challenge: cs.challenge, solution: cs.solution,
      outcomes: cs.outcomes.filter(Boolean), client_quote: cs.client_quote, ai_keyword_tags: keywords,
    };
    const { data, error: err } = cs.id
      ? await supabase.from('case_studies').update(payload).eq('id', cs.id).select().maybeSingle()
      : await supabase.from('case_studies').insert(payload).select().maybeSingle();
    setSaving(null);
    if (err) { setError(err.message); return; }
    setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, id: data?.id ?? f.id, ai_keyword_tags: keywords } : f));
    markSaved(`cs${idx}`);
  };

  const saveReferral = async (idx: number) => {
    if (!user) return;
    const r = referrals[idx];
    if (!r.contact_name.trim() || !r.work_email.trim() || !r.company.trim() || !r.job_title.trim() || !r.project_vouched_for.trim()) {
      setError('Referee name, job title, company, work email, and project details are all required.');
      return;
    }
    setSaving(`ref${idx}`);
    setError(null);
    const payload = {
      vendor_id: user.id, contact_name: r.contact_name, job_title: r.job_title, company: r.company,
      work_email: r.work_email, project_vouched_for: r.project_vouched_for,
      project_duration: r.project_duration, project_value_band: r.project_value_band,
    };
    const { data, error: err } = r.id
      ? await supabase.from('vendor_referrals').update(payload).eq('id', r.id).select().maybeSingle()
      : await supabase.from('vendor_referrals').insert(payload).select().maybeSingle();
    setSaving(null);
    if (err) { setError(err.message); return; }
    setReferrals(prev => prev.map((f, i) => i === idx ? { ...f, id: data?.id ?? f.id } : f));
    markSaved(`ref${idx}`);
  };

  const uploadDoc = async (type: 'companies_house' | 'vat_certificate' | 'address_proof') => {
    const file = docFiles[type];
    if (!file || !user) return;
    setSaving(`doc_${type}`);
    setError(null);
    const path = `${user.id}/${type}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadErr } = await supabase.storage.from('vendor-documents').upload(path, file);
    if (uploadErr) { setSaving(null); setError(uploadErr.message); return; }
    const { error: dbErr } = await supabase.from('vendor_documents').upsert(
      { vendor_id: user.id, document_type: type, document_url: path, verification_status: 'submitted' },
      { onConflict: 'vendor_id,document_type' }
    );
    setSaving(null);
    if (dbErr) { setError(dbErr.message); return; }
    setExistingDocs(prev => ({ ...prev, [type]: path }));
    setDocFiles(prev => ({ ...prev, [type]: null }));
    markSaved(`doc_${type}`);
  };

  const toggleArrayField = (field: 'industry_focus' | 'operating_locations' | 'service_categories' | 'tech_stack', value: string) => {
    setVendor(prev => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter(v => v !== value) : [...prev[field], value],
    }));
  };

  // Completion, computed from real loaded data (steps 1, 4, 5, 6 are mandatory per spec)
  const step1Complete = vendor.company_name.trim().length > 0 && vendor.description.trim().length >= 100;
  const step4Complete = vendor.service_categories.length > 0;
  const step5Complete = caseStudies.some(c => !!c.id) && referrals.some(r => !!r.id);
  const step6Complete = !!existingDocs['companies_house'] && !!existingDocs['address_proof'];
  const descriptionLen = vendor.description.length;
  const taglineLen = vendor.tagline.length;

  if (loading) {
    return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">My Listing</h1>
        <p className="text-gray-600 mt-1 text-sm">7 steps, any order — each saves independently. Steps 1, 4, 5 and 6 are required before your profile can go live.</p>
      </div>

      {/* Step tracker — clickable, any order */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STEPS.map(s => {
          const done = (s.n === 1 && step1Complete) || (s.n === 4 && step4Complete) || (s.n === 5 && step5Complete) || (s.n === 6 && step6Complete);
          return (
            <button key={s.n} type="button" onClick={() => setCurrentStep(s.n)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                currentStep === s.n ? 'bg-[#0070F3] text-white border-[#0070F3]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {done && <CheckCircle className="h-3 w-3" />}
              {s.n}. {s.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <motion.div className="bg-white rounded-lg shadow-sm p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* Step 1 — Company Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input type="text" value={vendor.company_name} onChange={e => setVendor(p => ({ ...p, company_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" value={vendor.website_url}
                    onChange={e => { let url = e.target.value; if (url && !url.match(/^https?:\/\//)) url = `https://${url}`; setVendor(p => ({ ...p, website_url: url })); }}
                    placeholder="e.g., https://example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {logoFile ? <img src={URL.createObjectURL(logoFile)} alt="Logo preview" className="w-full h-full object-cover" />
                    : vendor.logo_url ? <img src={vendor.logo_url} alt="Company logo" className="w-full h-full object-cover" />
                    : <Building2 className="h-12 w-12 text-gray-400" />}
                </div>
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <Upload className="h-4 w-4 mr-2" /> Upload Logo
                  <input type="file" className="hidden" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input type="text" value={vendor.address} onChange={e => setVendor(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input type="text" value={vendor.city} onChange={e => setVendor(p => ({ ...p, city: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State / Region</label>
                <input type="text" value={vendor.state} onChange={e => setVendor(p => ({ ...p, state: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <select value={vendor.country} onChange={e => setVendor(p => ({ ...p, country: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                <select value={vendor.team_size_band} onChange={e => setVendor(p => ({ ...p, team_size_band: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select size band</option>
                  {SIZE_BANDS.map(b => <option key={b} value={b}>{b} employees</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year Founded</label>
                <input type="number" min="1900" max={new Date().getFullYear()} value={vendor.founded_year ?? ''}
                  onChange={e => setVendor(p => ({ ...p, founded_year: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tagline <span className="text-gray-400 font-normal">(max 120 characters, shown on search cards)</span></label>
              <input type="text" maxLength={120} value={vendor.tagline} onChange={e => setVendor(p => ({ ...p, tagline: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <p className="text-xs text-gray-400 mt-1">{taglineLen}/120</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Description <span className="text-gray-400 font-normal">(100–1000 characters)</span></label>
              <textarea rows={5} maxLength={1000} value={vendor.description} onChange={e => setVendor(p => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <p className={`text-xs mt-1 ${descriptionLen < 100 ? 'text-gray-400' : 'text-green-600'}`}>{descriptionLen}/1000 (min 100)</p>
            </div>

            <SaveBar saving={saving === 'step1'} savedAt={savedAt.step1 ?? null} onSave={saveStep1}
              disabled={!vendor.company_name.trim() || descriptionLen < 100}
              disabledReason={descriptionLen < 100 ? 'Description needs at least 100 characters' : 'Company name is required'} />
          </div>
        )}

        {/* Step 2 — Contact (admin-only, never shown to buyers) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <p className="text-xs text-gray-400 -mt-4">Admin-only — never shown to buyers.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person's Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" value={vendor.contact_name} onChange={e => setVendor(p => ({ ...p, contact_name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="email" value={vendor.contact_email} onChange={e => setVendor(p => ({ ...p, contact_email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="tel" value={vendor.contact_phone} onChange={e => setVendor(p => ({ ...p, contact_phone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <SaveBar saving={saving === 'step2'} savedAt={savedAt.step2 ?? null} onSave={saveStep2} />
          </div>
        )}

        {/* Step 3 — Business Overview */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Business Overview</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-gray-400" /> Industry Focus</label>
              <TagPicker options={INDUSTRY_SECTORS} selected={vendor.industry_focus} onToggle={v => toggleArrayField('industry_focus', v)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Operating Locations</label>
              <TagPicker options={COUNTRIES} selected={vendor.operating_locations} onToggle={v => toggleArrayField('operating_locations', v)} />
            </div>
            <SaveBar saving={saving === 'step3'} savedAt={savedAt.step3 ?? null} onSave={saveStep3} />
          </div>
        )}

        {/* Step 4 — Services + Rates */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Services & Rates</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Categories <span className="text-red-500">*</span> (min 1)</label>
              <TagPicker options={SERVICE_CATEGORIES} selected={vendor.service_categories} onToggle={v => toggleArrayField('service_categories', v)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tech Stack</label>
              <TagPicker options={TECH_TAGS} selected={vendor.tech_stack} onToggle={v => toggleArrayField('tech_stack', v)}
                custom={vendor.tech_stack.filter(t => !TECH_TAGS.includes(t))}
                onAddCustom={v => setVendor(p => ({ ...p, tech_stack: [...p.tech_stack, v] }))}
                onRemoveCustom={v => setVendor(p => ({ ...p, tech_stack: p.tech_stack.filter(t => t !== v) }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate Band (£)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={vendor.hourly_rate_min ?? ''}
                    onChange={e => setVendor(p => ({ ...p, hourly_rate_min: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <input type="number" placeholder="Max" value={vendor.hourly_rate_max ?? ''}
                    onChange={e => setVendor(p => ({ ...p, hourly_rate_max: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rate Band (£)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={vendor.monthly_rate_min ?? ''}
                    onChange={e => setVendor(p => ({ ...p, monthly_rate_min: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <input type="number" placeholder="Max" value={vendor.monthly_rate_max ?? ''}
                    onChange={e => setVendor(p => ({ ...p, monthly_rate_max: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Project Value (£)</label>
              <input type="number" min="500" step="500" value={vendor.minimum_project_value ?? ''}
                onChange={e => setVendor(p => ({ ...p, minimum_project_value: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="5000" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
              <p className="text-xs text-gray-400 mt-1">Shown in your public profile sidebar. Min £500.</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div>
                <p className="font-semibold text-[#0B2D59] text-sm">IR35 Compliant</p>
                <p className="text-xs text-gray-500 mt-0.5">Only enable if you have obtained a favourable SDS determination.</p>
              </div>
              <button type="button" onClick={() => setVendor(p => ({ ...p, ir35_compliant: !p.ir35_compliant }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${vendor.ir35_compliant ? 'bg-[#0070F3]' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${vendor.ir35_compliant ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl border border-teal-100">
              <div>
                <p className="font-semibold text-[#0B2D59] text-sm">GDPR Ready</p>
                <p className="text-xs text-gray-500 mt-0.5">Only enable if you have appropriate data processing agreements in place.</p>
              </div>
              <button type="button" onClick={() => setVendor(p => ({ ...p, gdpr_ready: !p.gdpr_ready }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${vendor.gdpr_ready ? 'bg-[#0E7C6A]' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${vendor.gdpr_ready ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {vendor.business_type === 'staffaug' && (
              <p className="text-xs text-gray-400 italic">Packages aren't available for Staff Augmentation vendors — buyers hire your team members directly (see Team Members).</p>
            )}

            <SaveBar saving={saving === 'step4'} savedAt={savedAt.step4 ?? null} onSave={saveStep4} disabled={vendor.service_categories.length === 0}
              disabledReason="Select at least one service category" />
          </div>
        )}

        {/* Step 5 — Case Studies + Referrals */}
        {currentStep === 5 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-1">Case Studies</h2>
              <p className="text-sm text-gray-500 mb-4">Add up to 3 case studies. At least 1 is required.</p>
              <div className="space-y-6">
                {caseStudies.map((cs, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-700">Case Study {idx + 1} {idx === 0 && <span className="text-red-500">*</span>}</div>
                      {cs.id && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Saved
                          {cs.ai_keyword_tags && cs.ai_keyword_tags.length > 0 && <span className="ml-2 text-gray-400">· {cs.ai_keyword_tags.join(', ')}</span>}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                        <input type="text" value={cs.project_title} onChange={e => setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, project_title: e.target.value } : f))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="e.g., Cloud Migration for NHS Trust" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Industry</label>
                        <input type="text" value={cs.industry} onChange={e => setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, industry: e.target.value } : f))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="e.g., Healthcare" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <input type="text" value={cs.duration} onChange={e => setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, duration: e.target.value } : f))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="e.g., 4 months" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
                        <input type="number" value={cs.team_size ?? ''} onChange={e => setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, team_size: e.target.value ? parseInt(e.target.value) : null } : f))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Services Delivered</label>
                      <TagPicker options={SERVICE_CATEGORIES} selected={cs.services_delivered}
                        onToggle={v => setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, services_delivered: f.services_delivered.includes(v) ? f.services_delivered.filter(s => s !== v) : [...f.services_delivered, v] } : f))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack</label>
                      <TagPicker options={TECH_TAGS} selected={cs.tech_stack}
                        onToggle={v => setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, tech_stack: f.tech_stack.includes(v) ? f.tech_stack.filter(s => s !== v) : [...f.tech_stack, v] } : f))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Challenge</label>
                      <textarea rows={2} value={cs.challenge} onChange={e => setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, challenge: e.target.value } : f))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Solution</label>
                      <textarea rows={2} value={cs.solution} onChange={e => setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, solution: e.target.value } : f))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">3 Measurable Outcomes</label>
                      <div className="space-y-2">
                        {[0, 1, 2].map(oi => (
                          <input key={oi} type="text" value={cs.outcomes[oi] ?? ''}
                            onChange={e => setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, outcomes: f.outcomes.map((o, oidx) => oidx === oi ? e.target.value : o) } : f))}
                            placeholder={`Outcome ${oi + 1}, e.g. Reduced infrastructure costs by 35%`}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client Quote <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="text" value={cs.client_quote} onChange={e => setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, client_quote: e.target.value } : f))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => saveCaseStudy(idx)} disabled={saving === `cs${idx}` || !cs.project_title.trim()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070F3] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {saving === `cs${idx}` ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Save Case Study {idx + 1}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-1">Referrals</h2>
              <p className="text-sm text-gray-500 mb-4">At least 1 referral is required. The referee's email is never shown to buyers.</p>
              <div className="space-y-6">
                {referrals.map((r, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-700">Referral {idx + 1} {idx === 0 && <span className="text-red-500">*</span>}</div>
                      <div className="flex items-center gap-3">
                        {r.id && (
                          <span className="text-xs flex items-center gap-1 text-gray-500">
                            <CheckCircle className={`h-3.5 w-3.5 ${r.confirmed ? 'text-green-600' : 'text-amber-500'}`} />
                            {r.confirmed ? 'Confirmed' : 'Awaiting confirmation'}
                          </span>
                        )}
                        {referrals.length > 1 && (
                          <button type="button" onClick={() => setReferrals(prev => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referee Name</label>
                        <input type="text" value={r.contact_name} onChange={e => setReferrals(prev => prev.map((f, i) => i === idx ? { ...f, contact_name: e.target.value } : f))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                        <input type="text" value={r.job_title} onChange={e => setReferrals(prev => prev.map((f, i) => i === idx ? { ...f, job_title: e.target.value } : f))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <input type="text" value={r.company} onChange={e => setReferrals(prev => prev.map((f, i) => i === idx ? { ...f, company: e.target.value } : f))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Work Email <span className="text-gray-400 font-normal">(never shown to buyers)</span></label>
                        <input type="email" value={r.work_email} onChange={e => setReferrals(prev => prev.map((f, i) => i === idx ? { ...f, work_email: e.target.value } : f))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Duration</label>
                        <input type="text" value={r.project_duration} onChange={e => setReferrals(prev => prev.map((f, i) => i === idx ? { ...f, project_duration: e.target.value } : f))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="e.g., 3 months" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Value Band</label>
                        <select value={r.project_value_band} onChange={e => setReferrals(prev => prev.map((f, i) => i === idx ? { ...f, project_value_band: e.target.value } : f))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                          <option value="">Select band</option>
                          <option value="under_10k">Under £10k</option>
                          <option value="10k_50k">£10k–£50k</option>
                          <option value="50k_150k">£50k–£150k</option>
                          <option value="over_150k">£150k+</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Vouched For</label>
                      <textarea rows={2} value={r.project_vouched_for} onChange={e => setReferrals(prev => prev.map((f, i) => i === idx ? { ...f, project_vouched_for: e.target.value } : f))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="What did this referee vouch for?" />
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => saveReferral(idx)} disabled={saving === `ref${idx}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070F3] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {saving === `ref${idx}` ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Save Referral {idx + 1}
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setReferrals(prev => [...prev, emptyReferral()])}
                  className="inline-flex items-center gap-2 text-sm text-[#0070F3] font-medium hover:underline">
                  <Plus className="h-4 w-4" /> Add another referral
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 6 — Verification Documents */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Verification Documents</h2>
            <p className="text-sm text-gray-500">Reviewed by the Collabov team — never shown publicly.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {([
                { key: 'companies_house' as const, label: 'Companies House Registration Certificate', required: true, hint: 'Certificate of Incorporation' },
                { key: 'address_proof' as const, label: 'Proof of Business Address', required: true, hint: 'Utility bill or bank statement, within 3 months' },
                { key: 'vat_certificate' as const, label: 'VAT Registration Certificate', required: false, hint: 'HMRC VAT certificate (if VAT registered)' },
              ]).map(doc => (
                <div key={doc.key} className="border border-gray-200 rounded-xl p-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {doc.label}{doc.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <p className="text-xs text-gray-400 mb-3">{doc.hint}</p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Upload className="h-4 w-4" /> Choose file
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => setDocFiles(prev => ({ ...prev, [doc.key]: e.target.files?.[0] ?? null }))} />
                  </label>
                  {docFiles[doc.key] && <p className="text-xs text-gray-500 mt-2">{docFiles[doc.key]!.name}</p>}
                  {existingDocs[doc.key] && !docFiles[doc.key] && <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Uploaded</p>}
                  {docFiles[doc.key] && (
                    <button type="button" onClick={() => uploadDoc(doc.key)} disabled={saving === `doc_${doc.key}`}
                      className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#0070F3] text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {saving === `doc_${doc.key}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Upload
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 7 — Bank Details (reference only — real payouts run through Stripe Connect) */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Bank Details</h2>
            <p className="text-xs text-gray-400 -mt-4">Reference only — actual payouts run through Stripe Connect in Account Settings.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registered Name</label>
                <input type="text" value={vendor.registered_name} onChange={e => setVendor(p => ({ ...p, registered_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input type="text" value={vendor.account_number} onChange={e => setVendor(p => ({ ...p, account_number: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort Code / IFSC</label>
                <input type="text" value={vendor.ifsc_code} onChange={e => setVendor(p => ({ ...p, ifsc_code: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input type="text" value={vendor.bank_name} onChange={e => setVendor(p => ({ ...p, bank_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Address</label>
                <textarea rows={3} value={vendor.bank_address} onChange={e => setVendor(p => ({ ...p, bank_address: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registered Email</label>
                <input type="email" value={vendor.registered_email} onChange={e => setVendor(p => ({ ...p, registered_email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <SaveBar saving={saving === 'step7'} savedAt={savedAt.step7 ?? null} onSave={saveStep7} />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ManageListings;
