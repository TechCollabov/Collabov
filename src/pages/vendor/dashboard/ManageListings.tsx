import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Upload, Building2, Mail, Phone, User, Users,
  CheckCircle, X, Loader2, Plus, Trash2, Award, AlertTriangle, ExternalLink
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
  { n: 8, label: 'Tax & Compliance' },
];

const COMMON_CERT_TYPES = [
  'Microsoft Certified Partner', 'AWS Partner', 'Google Cloud Partner',
  'SOC 2', 'ISO 27001', 'ISO 9001', 'Cyber Essentials', 'Other',
];

const CERT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  submitted:      { label: 'Pending Review', color: 'bg-amber-100 text-amber-700' },
  valid:          { label: 'Valid',          color: 'bg-green-100 text-green-700' },
  invalid:        { label: 'Invalid',        color: 'bg-red-100 text-red-700' },
  cannot_verify:  { label: 'Cannot Verify',  color: 'bg-gray-100 text-gray-600' },
};

/* ── Country-aware field labels ── */
function getBankFieldLabels(country: string) {
  if (country === 'United Kingdom') {
    return { sortLabel: 'Sort Code', sortHint: 'e.g. 12-34-56', accountLabel: 'Account Number (8 digits)' };
  }
  if (country === 'United States') {
    return { sortLabel: 'Routing Number', sortHint: '9-digit ABA routing number', accountLabel: 'Account Number' };
  }
  if (country === 'India') {
    return { sortLabel: 'IFSC Code', sortHint: 'e.g. HDFC0001234', accountLabel: 'Account Number' };
  }
  return { sortLabel: 'Sort Code / IFSC / Routing Number', sortHint: '', accountLabel: 'Account Number' };
}

function getTaxFieldLabels(country: string) {
  if (country === 'United Kingdom') {
    return { primaryLabel: 'VAT Number', secondaryLabel: 'UTR (Unique Taxpayer Reference)', showSecondary: true };
  }
  if (country === 'United States') {
    return { primaryLabel: 'EIN (Employer Identification Number)', secondaryLabel: '', showSecondary: false };
  }
  if (country === 'India') {
    return { primaryLabel: 'PAN Number', secondaryLabel: 'GST Number', showSecondary: true };
  }
  return { primaryLabel: 'Tax ID', secondaryLabel: 'Additional Tax Reference (optional)', showSecondary: true };
}

// Required compliance documents by country. vat_certificate is already
// collected in Step 6 (Verification Docs) for UK vendors, so it's not
// duplicated here.
function getComplianceDocs(country: string): { key: 'w9_form' | 'pan' | 'gst'; label: string; hint: string }[] {
  if (country === 'United States') {
    return [{ key: 'w9_form', label: 'IRS Form W-9', hint: 'Request for Taxpayer Identification Number and Certification' }];
  }
  if (country === 'India') {
    return [
      { key: 'pan', label: 'PAN Card', hint: 'Permanent Account Number document' },
      { key: 'gst', label: 'GST Registration Certificate', hint: 'GST registration document' },
    ];
  }
  return [];
}

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
  swift_code: string;
  tax_id_primary: string;
  tax_id_secondary: string;
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
  swift_code: '', tax_id_primary: '', tax_id_secondary: '',
};

interface CaseStudyRow {
  id?: string;
  project_title: string;
  file_url: string | null;
}

const emptyCaseStudy = (): CaseStudyRow => ({
  project_title: '', file_url: null,
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

interface CertificationRow {
  id: string;
  cert_type: string;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  verification_status: string;
  admin_notes: string | null;
}

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
  const [caseStudyFiles, setCaseStudyFiles] = useState<(File | null)[]>([null, null, null]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([emptyReferral()]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({ companies_house: null, vat_certificate: null, address_proof: null, w9_form: null, pan: null, gst: null });
  const [existingDocs, setExistingDocs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Certifications (step 6)
  const [certifications, setCertifications] = useState<CertificationRow[]>([]);
  const [certSignedUrls, setCertSignedUrls] = useState<Record<string, string>>({});
  const [showAddCert, setShowAddCert] = useState(false);
  const [certForm, setCertForm] = useState({ cert_type: COMMON_CERT_TYPES[0], custom_type: '', issuer: '', issue_date: '', expiry_date: '' });
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certSaving, setCertSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: v }, { data: cs }, { data: refs }, { data: docs }, { data: certs }] = await Promise.all([
      supabase.from('vendors').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('case_studies').select('*').eq('vendor_id', user.id).order('created_at', { ascending: true }),
      supabase.from('vendor_referrals').select('*').eq('vendor_id', user.id).order('created_at', { ascending: true }),
      supabase.from('vendor_documents').select('document_type, document_url').eq('vendor_id', user.id),
      supabase.from('vendor_certifications').select('*').eq('vendor_id', user.id).order('created_at', { ascending: true }),
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
        swift_code: v.swift_code ?? '', tax_id_primary: v.tax_id_primary ?? '', tax_id_secondary: v.tax_id_secondary ?? '',
      });
    }
    if (cs && cs.length > 0) {
      const loaded = cs.slice(0, 3).map((row: any): CaseStudyRow => ({
        id: row.id, project_title: row.project_title ?? '', file_url: row.file_url ?? null,
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
    if (certs) {
      setCertifications(certs as CertificationRow[]);
      const urlEntries = await Promise.all(certs.map(async (c: any) => {
        if (!c.document_url) return null;
        const { data: signed } = await supabase.storage.from('vendor-documents').createSignedUrl(c.document_url, 3600);
        return signed?.signedUrl ? [c.id, signed.signedUrl] as const : null;
      }));
      const signedMap: Record<string, string> = {};
      urlEntries.forEach(e => { if (e) signedMap[e[0]] = e[1]; });
      setCertSignedUrls(signedMap);
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
    if (vendor.company_name.trim()) {
      const { data: rejected } = await supabase.rpc('check_vendor_rejected', { p_company_name: vendor.company_name.trim() });
      if (rejected) {
        setError('This company did not pass verification on a previous application. Contact support@collabov.com if you believe this is an error.');
        setSaving(null);
        return;
      }
    }
    let logo_url = vendor.logo_url;
    if (logoFile) {
      const uploaded = await uploadLogo();
      if (uploaded) logo_url = uploaded;
    }
    const trimmedUrl = vendor.website_url.trim();
    const website_url = trimmedUrl && !/^https?:\/\//i.test(trimmedUrl) ? `https://${trimmedUrl}` : trimmedUrl;
    await saveVendorFields({
      company_name: vendor.company_name, website_url, address: vendor.address,
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
    swift_code: vendor.swift_code,
  }, 'step7');

  const saveStep8 = () => saveVendorFields({
    tax_id_primary: vendor.tax_id_primary, tax_id_secondary: vendor.tax_id_secondary,
  }, 'step8');

  const saveCaseStudy = async (idx: number) => {
    if (!user) return;
    const cs = caseStudies[idx];
    const file = caseStudyFiles[idx];
    if (!cs.project_title.trim()) { setError('A title is required before saving a case study.'); return; }
    if (!file && !cs.file_url) { setError('Upload a file before saving a case study.'); return; }
    setSaving(`cs${idx}`);
    setError(null);

    let file_url = cs.file_url;
    if (file) {
      const path = `${user.id}/case-study-${idx}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadErr } = await supabase.storage.from('case-study-files').upload(path, file, { upsert: true });
      if (uploadErr) { setSaving(null); setError(uploadErr.message); return; }
      const { data: pub } = supabase.storage.from('case-study-files').getPublicUrl(path);
      file_url = pub.publicUrl;
    }

    const payload = { vendor_id: user.id, project_title: cs.project_title, file_url };
    const { data, error: err } = cs.id
      ? await supabase.from('case_studies').update(payload).eq('id', cs.id).select().maybeSingle()
      : await supabase.from('case_studies').insert(payload).select().maybeSingle();
    setSaving(null);
    if (err) { setError(err.message); return; }
    setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, id: data?.id ?? f.id, file_url } : f));
    setCaseStudyFiles(prev => prev.map((f, i) => i === idx ? null : f));
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

  const uploadDoc = async (type: 'companies_house' | 'vat_certificate' | 'address_proof' | 'w9_form' | 'pan' | 'gst') => {
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

  const addCertification = async () => {
    if (!user) return;
    const cert_type = certForm.cert_type === 'Other' ? certForm.custom_type.trim() : certForm.cert_type;
    if (!cert_type) { setError('Select or enter a certification type.'); return; }
    if (!certFile) { setError('Upload a document before adding a certification.'); return; }
    setCertSaving(true);
    setError(null);
    const path = `${user.id}/cert-${Date.now()}.${certFile.name.split('.').pop()}`;
    const { error: uploadErr } = await supabase.storage.from('vendor-documents').upload(path, certFile);
    if (uploadErr) { setCertSaving(false); setError(uploadErr.message); return; }
    const { data, error: dbErr } = await supabase.from('vendor_certifications').insert({
      vendor_id: user.id,
      cert_type,
      issuer: certForm.issuer || null,
      issue_date: certForm.issue_date || null,
      expiry_date: certForm.expiry_date || null,
      document_url: path,
      verification_status: 'submitted',
    }).select().maybeSingle();
    setCertSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    if (data) {
      setCertifications(prev => [...prev, data as CertificationRow]);
      const { data: signed } = await supabase.storage.from('vendor-documents').createSignedUrl(path, 3600);
      if (signed?.signedUrl) setCertSignedUrls(prev => ({ ...prev, [(data as CertificationRow).id]: signed.signedUrl }));
    }
    setCertForm({ cert_type: COMMON_CERT_TYPES[0], custom_type: '', issuer: '', issue_date: '', expiry_date: '' });
    setCertFile(null);
    setShowAddCert(false);
  };

  const deleteCertification = async (id: string) => {
    setError(null);
    const { error: err } = await supabase.from('vendor_certifications').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setCertifications(prev => prev.filter(c => c.id !== id));
  };

  const toggleArrayField = (field: 'industry_focus' | 'operating_locations' | 'service_categories' | 'tech_stack', value: string) => {
    setVendor(prev => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter(v => v !== value) : [...prev[field], value],
    }));
  };

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const descriptionWords = wordCount(vendor.description);
  const MAX_DESCRIPTION_WORDS = 200;

  // Completion, computed from real loaded data (steps 1, 4, 5, 6 are mandatory per spec)
  const step1Complete = vendor.company_name.trim().length > 0 && vendor.description.trim().length > 0 && descriptionWords <= MAX_DESCRIPTION_WORDS;
  const step4Complete = vendor.service_categories.length > 0;
  const step5Complete = caseStudies.some(c => !!c.id) && referrals.some(r => !!r.id);
  const step6Complete = !!existingDocs['companies_house'] && !!existingDocs['address_proof'];
  const taglineLen = vendor.tagline.length;

  if (loading) {
    return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">My Listing</h1>
        <p className="text-gray-600 mt-1 text-sm">8 steps, any order — each saves independently. Steps 1, 4, 5 and 6 are required before your profile can go live.</p>
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
                    onChange={e => setVendor(p => ({ ...p, website_url: e.target.value }))}
                    placeholder="e.g., example.com"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Description <span className="text-gray-400 font-normal">(max 200 words)</span></label>
              <textarea rows={5} value={vendor.description}
                onChange={e => {
                  const text = e.target.value;
                  const words = text.trim().split(/\s+/).filter(Boolean);
                  if (words.length <= MAX_DESCRIPTION_WORDS) setVendor(p => ({ ...p, description: text }));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <p className={`text-xs mt-1 ${descriptionWords > MAX_DESCRIPTION_WORDS ? 'text-red-600' : 'text-gray-400'}`}>{descriptionWords}/{MAX_DESCRIPTION_WORDS} words</p>
            </div>

            <SaveBar saving={saving === 'step1'} savedAt={savedAt.step1 ?? null} onSave={saveStep1}
              disabled={!vendor.company_name.trim() || descriptionWords === 0 || descriptionWords > MAX_DESCRIPTION_WORDS}
              disabledReason={descriptionWords > MAX_DESCRIPTION_WORDS ? 'Description must be 200 words or fewer' : 'Company name and description are required'} />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Monthly Cost (£)</label>
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
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input type="text" value={cs.project_title} onChange={e => setCaseStudies(prev => prev.map((f, i) => i === idx ? { ...f, project_title: e.target.value } : f))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="e.g., Cloud Migration for NHS Trust" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Case Study File <span className="text-gray-400 font-normal">(PDF or image)</span></label>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                        <Upload className="h-4 w-4" /> Choose file
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={e => setCaseStudyFiles(prev => prev.map((f, i) => i === idx ? (e.target.files?.[0] ?? null) : f))} />
                      </label>
                      {caseStudyFiles[idx] && <p className="text-xs text-gray-500 mt-2">{caseStudyFiles[idx]!.name}</p>}
                      {cs.file_url && !caseStudyFiles[idx] && (
                        <p className="text-sm mt-2">
                          <a href={cs.file_url} target="_blank" rel="noopener noreferrer" className="text-[#0070F3] hover:underline">View uploaded file</a>
                        </p>
                      )}
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

            {/* Certifications */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Award className="h-5 w-5 text-gray-400" /> Certifications</h3>
                <button type="button" onClick={() => setShowAddCert(s => !s)}
                  className="inline-flex items-center gap-2 text-sm text-[#0070F3] font-medium hover:underline">
                  <Plus className="h-4 w-4" /> Add Certification
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">Microsoft Certified Partner, SOC 2, ISO 27001, or any other certification — each is reviewed independently.</p>

              {showAddCert && (
                <div className="border border-gray-200 rounded-xl p-5 space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Certification Type</label>
                      <select value={certForm.cert_type} onChange={e => setCertForm(p => ({ ...p, cert_type: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {COMMON_CERT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {certForm.cert_type === 'Other' && (
                        <input type="text" value={certForm.custom_type} onChange={e => setCertForm(p => ({ ...p, custom_type: e.target.value }))}
                          placeholder="Enter certification name" className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issuer</label>
                      <input type="text" value={certForm.issuer} onChange={e => setCertForm(p => ({ ...p, issuer: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                      <input type="date" value={certForm.issue_date} onChange={e => setCertForm(p => ({ ...p, issue_date: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input type="date" value={certForm.expiry_date} onChange={e => setCertForm(p => ({ ...p, expiry_date: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Document</label>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      <Upload className="h-4 w-4" /> Choose file
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setCertFile(e.target.files?.[0] ?? null)} />
                    </label>
                    {certFile && <p className="text-xs text-gray-500 mt-2">{certFile.name}</p>}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddCert(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                    <button type="button" onClick={addCertification} disabled={certSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070F3] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                      {certSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Save Certification
                    </button>
                  </div>
                </div>
              )}

              {certifications.length === 0 ? (
                <p className="text-sm text-gray-400">No certifications added yet.</p>
              ) : (
                <div className="space-y-3">
                  {certifications.map(c => {
                    const status = CERT_STATUS_MAP[c.verification_status] || CERT_STATUS_MAP.submitted;
                    return (
                      <div key={c.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-800">{c.cert_type}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {c.issuer && <>Issuer: {c.issuer} · </>}
                            {c.issue_date && <>Issued {c.issue_date}</>}
                            {c.expiry_date && <> · Expires {c.expiry_date}</>}
                          </p>
                          {c.admin_notes && (c.verification_status === 'invalid' || c.verification_status === 'cannot_verify') && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {c.admin_notes}</p>
                          )}
                          {certSignedUrls[c.id] && (
                            <a href={certSignedUrls[c.id]} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0070F3] hover:underline inline-flex items-center gap-1 mt-1">
                              View document <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <button type="button" onClick={() => deleteCertification(c.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 7 — Bank Details (reference only — real payouts run through Stripe Connect) */}
        {currentStep === 7 && (() => {
          const { sortLabel, sortHint, accountLabel } = getBankFieldLabels(vendor.country);
          return (
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{accountLabel}</label>
                <input type="text" value={vendor.account_number} onChange={e => setVendor(p => ({ ...p, account_number: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{sortLabel}</label>
                <input type="text" value={vendor.ifsc_code} onChange={e => setVendor(p => ({ ...p, ifsc_code: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                {sortHint && <p className="text-xs text-gray-400 mt-1">{sortHint}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input type="text" value={vendor.bank_name} onChange={e => setVendor(p => ({ ...p, bank_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SWIFT / BIC Code <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={vendor.swift_code} onChange={e => setVendor(p => ({ ...p, swift_code: e.target.value }))}
                  placeholder="e.g. HDFCINBB" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p className="text-xs text-gray-400 mt-1">For international wire transfers.</p>
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
          );
        })()}

        {/* Step 8 — Tax & Compliance */}
        {currentStep === 8 && (() => {
          const { primaryLabel, secondaryLabel, showSecondary } = getTaxFieldLabels(vendor.country);
          const complianceDocs = getComplianceDocs(vendor.country);
          return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Tax & Compliance</h2>
            <p className="text-xs text-gray-400 -mt-4">Not required to go live — helps buyers and finance teams process invoices correctly for your country.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{primaryLabel}</label>
                <input type="text" value={vendor.tax_id_primary} onChange={e => setVendor(p => ({ ...p, tax_id_primary: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              {showSecondary && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{secondaryLabel}</label>
                  <input type="text" value={vendor.tax_id_secondary} onChange={e => setVendor(p => ({ ...p, tax_id_secondary: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              )}
            </div>
            <SaveBar saving={saving === 'step8'} savedAt={savedAt.step8 ?? null} onSave={saveStep8} />

            {complianceDocs.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-semibold mb-1">Required Compliance Documents</h3>
                <p className="text-sm text-gray-500 mb-4">Based on your country ({vendor.country || 'not set'}). Reviewed by the Collabov team — never shown publicly.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {complianceDocs.map(doc => (
                    <div key={doc.key} className="border border-gray-200 rounded-xl p-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{doc.label}</label>
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
          </div>
          );
        })()}
      </motion.div>
    </div>
  );
};

export default ManageListings;
