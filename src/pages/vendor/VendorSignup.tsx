import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Globe, Eye, EyeOff, CheckCircle, Upload, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRedirectPath } from '../../utils/authRedirect';
import { supabase } from '../../lib/supabase';
import { isBusinessEmail } from '../../lib/workflows';

type BusinessType = 'msp' | 'agency' | 'staffaug';

const BUSINESS_TYPES: { id: BusinessType; label: string; blurb: string; contract: string }[] = [
  { id: 'msp', label: 'Managed IT (MSP)', blurb: 'Ongoing managed services — infrastructure, support, monitoring.', contract: 'Managed Service Agreement' },
  { id: 'agency', label: 'IT Agency', blurb: 'Project-based delivery — builds, launches, and discovery engagements.', contract: 'Project Delivery Contract' },
  { id: 'staffaug', label: 'Staff Augmentation', blurb: "Placing your own people into a buyer's team.", contract: 'Resource Supply Agreement + IR35 SDS' },
];

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

const VendorSignup: React.FC = () => {
  const navigate = useNavigate();
  const { type: typeParam } = useParams<{ type?: string }>();
  const { signUp, profile, user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 — pre-select from /vendor/signup/:type (e.g. a "Join as an MSP" landing link) if valid
  const preselectedType = BUSINESS_TYPES.some(bt => bt.id === typeParam) ? (typeParam as BusinessType) : '';
  const [businessType, setBusinessType] = useState<BusinessType | ''>(preselectedType);

  // Step 2
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 3
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  // Step 4
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');

  // Step 5
  const [companyRegFile, setCompanyRegFile] = useState<File | null>(null);
  const [vatFile, setVatFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [docsPendingUpload, setDocsPendingUpload] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  useEffect(() => {
    if (!loading && user && profile && step < 6) {
      navigate(getRedirectPath(profile.user_type), { replace: true });
    }
  }, [user, profile, loading, step, navigate]);

  const validatePassword = (pw: string) => {
    if (pw.length < 10) return 'Password must be at least 10 characters';
    if (!/[A-Z]/.test(pw)) return 'Must include an uppercase letter';
    if (!/[0-9]/.test(pw)) return 'Must include a number';
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Must include a symbol';
    return null;
  };

  /** 0-4 strength score driving the visual bar — same 4 rules as validatePassword. */
  const passwordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const STRENGTH_LABEL = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const STRENGTH_COLOR = ['bg-gray-200', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-500'];

  const handleBusinessTypeContinue = () => {
    setError(null);
    if (!businessType) { setError('Select a business type to continue'); return; }
    setStep(2);
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isBusinessEmail(email)) { setError('Please use a business email address — personal addresses (Gmail, Yahoo, Hotmail, Outlook) aren\'t accepted.'); return; }
    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }
    setStep(3);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!companyName.trim()) { setError('Company name is required'); return; }
    setIsLoading(true);
    try {
      const { data: rejected } = await supabase.rpc('check_vendor_rejected', { p_company_name: companyName.trim() });
      if (rejected) {
        setError('This company did not pass verification on a previous application. Contact support@collabov.com if you believe this is an error.');
        return;
      }
    } catch (checkErr) {
      console.error('[VendorSignup] rejection check failed:', checkErr);
    } finally {
      setIsLoading(false);
    }
    setStep(4);
  };

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (selectedServices.length === 0) { setError('Select at least one service category'); return; }
    setStep(5);
  };

  const handleStep4 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!companyRegFile) { setError('Company registration certificate is required'); return; }
    setStep(6);
  };

  const uploadVerificationDoc = async (
    vendorId: string,
    type: 'companies_house' | 'vat_certificate' | 'address_proof',
    file: File
  ) => {
    const path = `${vendorId}/${type}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadErr } = await supabase.storage.from('vendor-documents').upload(path, file);
    if (uploadErr) throw uploadErr;
    const { error: dbErr } = await supabase.from('vendor_documents').upsert(
      { vendor_id: vendorId, document_type: type, document_url: path, verification_status: 'submitted' },
      { onConflict: 'vendor_id,document_type' }
    );
    if (dbErr) throw dbErr;
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { user: newUser, hasSession } = await signUp(email, password, {
        fullName: companyName,
        userType: 'vendor',
        additionalData: {
          businessType,
          companyName,
          country,
          website,
          description,
          services: selectedServices,
          techStack: selectedTech,
        },
      });

      // Uploads need an authenticated session (RLS scopes vendor-documents to
      // auth.uid()). If email confirmation is required, signUp() doesn't
      // return a session — the vendor uploads later from My Listing instead.
      if (hasSession) {
        const docs: [typeof companyRegFile, 'companies_house' | 'vat_certificate' | 'address_proof'][] = [
          [companyRegFile, 'companies_house'],
          [vatFile, 'vat_certificate'],
          [addressFile, 'address_proof'],
        ];
        for (const [file, type] of docs) {
          if (!file) continue;
          try {
            await uploadVerificationDoc(newUser.id, type, file);
          } catch (uploadErr) {
            console.error(`[VendorSignup] document upload failed (${type}):`, uploadErr);
          }
        }
      } else {
        setDocsPendingUpload(true);
      }
      setAccountCreated(true);
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (s: string) =>
    setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleTech = (t: string) =>
    setSelectedTech(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const addTechFromInput = () => {
    const val = techInput.trim();
    if (val && !selectedTech.includes(val)) setSelectedTech(prev => [...prev, val]);
    setTechInput('');
  };

  const TOTAL_STEPS = 6;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <Globe className="h-8 w-8 text-[#0070F3]" />
        <span className="text-2xl font-bold text-[#0B2D59]">Collabov</span>
      </Link>

      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {step < TOTAL_STEPS && (
          <div className="flex items-center gap-1 mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step > s ? 'bg-[#0070F3] text-white' : step === s ? 'bg-[#0070F3] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {step > s ? <CheckCircle className="h-3 w-3" /> : s}
                </div>
                {s < 5 && <div className={`flex-1 h-1 rounded ${step > s ? 'bg-[#0070F3]' : 'bg-gray-100'}`} />}
              </React.Fragment>
            ))}
            <span className="ml-2 text-xs text-gray-400 flex-shrink-0">Step {step} of 5</span>
          </div>
        )}

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {/* Step 1 — Business Type */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold text-[#0B2D59] mb-1">What kind of provider are you?</h1>
            <p className="text-gray-500 text-sm mb-6">This sets your contract template and how buyers find you — choose before continuing.</p>
            <div className="space-y-3 mb-6">
              {BUSINESS_TYPES.map(bt => (
                <button
                  key={bt.id}
                  type="button"
                  onClick={() => setBusinessType(bt.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${businessType === bt.id ? 'border-[#0070F3] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0B2D59]">{bt.label}</span>
                    {businessType === bt.id && <CheckCircle className="h-5 w-5 text-[#0070F3]" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{bt.blurb}</p>
                  <p className="text-xs text-gray-400 mt-1">Contract: {bt.contract}</p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleBusinessTypeContinue}
              disabled={!businessType}
              className="w-full py-3 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{' '}
              <Link to="/signin" className="text-[#0070F3] font-medium hover:underline">Sign in</Link>
            </p>
          </>
        )}

        {/* Step 2 — Email + Password */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold text-[#0B2D59] mb-1">Create your provider account</h1>
            <p className="text-gray-500 text-sm mb-6">Join our network of verified IT service providers</p>
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Email <span className="text-red-500">*</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@company.com"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="Min 10 chars, uppercase, number, symbol"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (() => {
                  const strength = passwordStrength(password);
                  return (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < strength ? STRENGTH_COLOR[strength] : 'bg-gray-100'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{STRENGTH_LABEL[strength]}</p>
                    </div>
                  );
                })()}
              </div>
              <button type="submit" className="w-full py-3 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Continue
              </button>
            </form>
            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{' '}
              <Link to="/signin" className="text-[#0070F3] font-medium hover:underline">Sign in</Link>
            </p>
          </>
        )}

        {/* Step 3 — Company Basics */}
        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold text-[#0B2D59] mb-1">Company basics</h1>
            <p className="text-gray-500 text-sm mb-6">Tell us about your organisation</p>
            <form onSubmit={handleStep2} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required
                  placeholder="e.g. TechPro Solutions Ltd"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select value={country} onChange={e => setCountry(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brief Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                  placeholder="A short overview of what your company does and who you serve..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors">Back</button>
                <button type="submit" disabled={isLoading} className="flex-[2] py-3 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
                  {isLoading ? 'Checking...' : 'Continue'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 4 — Services & Tech Stack */}
        {step === 4 && (
          <>
            <h1 className="text-2xl font-bold text-[#0B2D59] mb-1">Services & tech stack</h1>
            <p className="text-gray-500 text-sm mb-6">What do you offer? This helps buyers find you.</p>
            <form onSubmit={handleStep3} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Categories <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_CATEGORIES.map(s => (
                    <button key={s} type="button" onClick={() => toggleService(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedServices.includes(s) ? 'bg-[#0070F3] text-white border-[#0070F3]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tech Stack</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {TECH_TAGS.map(t => (
                    <button key={t} type="button" onClick={() => toggleTech(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedTech.includes(t) ? 'bg-[#0070F3] text-white border-[#0070F3]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={techInput} onChange={e => setTechInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTechFromInput(); } }}
                    placeholder="Add custom technology..."
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
                  <button type="button" onClick={addTechFromInput} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">Add</button>
                </div>
                {selectedTech.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTech.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#0070F3] text-xs rounded-full">
                        {t}
                        <button type="button" onClick={() => toggleTech(t)}><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors">Back</button>
                <button type="submit" className="flex-[2] py-3 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">Continue</button>
              </div>
            </form>
          </>
        )}

        {/* Step 5 — Documents */}
        {step === 5 && (
          <>
            <h1 className="text-2xl font-bold text-[#0B2D59] mb-1">Verification documents</h1>
            <p className="text-gray-500 text-sm mb-2">We review all applications within 2 business days. Documents are kept confidential.</p>
            <p className="text-xs text-gray-400 mb-6">PDF or image, max 10MB each</p>
            <form onSubmit={handleStep4} className="space-y-4">
              {[
                { label: 'Company Registration Certificate (Companies House)', required: true, file: companyRegFile, setFile: setCompanyRegFile },
                { label: 'VAT Registration Certificate (if applicable)', required: false, file: vatFile, setFile: setVatFile },
                { label: 'Address Proof (utility bill or bank statement dated within 3 months)', required: false, file: addressFile, setFile: setAddressFile },
              ].map(({ label, required, file, setFile }) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#0070F3] transition-colors">
                    <Upload className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-500 flex-1">{file ? file.name : 'Click to upload'}</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
                      onChange={e => setFile(e.target.files?.[0] || null)} />
                    {file && <button type="button" onClick={e => { e.preventDefault(); setFile(null); }}><X className="h-4 w-4 text-gray-400" /></button>}
                  </label>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(4)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors">Back</button>
                <button type="submit" className="flex-[2] py-3 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">Submit Application</button>
              </div>
            </form>
          </>
        )}

        {/* Step 6 — Confirmation */}
        {step === 6 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-[#0070F3]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0B2D59] mb-3">Application submitted!</h1>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">{companyName}</span>
            </p>
            <p className="text-gray-500 text-sm mb-8">
              We review all applications within 2 business days. You will receive an email when your profile is approved.
            </p>
            {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
            {accountCreated ? (
              <>
                {docsPendingUpload && (
                  <div className="bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-lg mb-4 text-left">
                    Confirm your email first, then log in and upload your verification documents from
                    My Listing — we couldn't upload them yet because your account isn't verified.
                  </div>
                )}
                <p className="text-sm text-gray-500 mb-4">Check your inbox for a confirmation link to activate your account.</p>
                <Link to="/vendor/dashboard" className="block text-sm text-gray-400 hover:text-gray-600">
                  Go to vendor dashboard (limited view until approved)
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={handleFinalSubmit}
                  disabled={isLoading}
                  className="w-full py-3 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isLoading ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Creating account...</> : 'Create Account & Submit'}
                </button>
                <Link to="/vendor/dashboard" className="block mt-4 text-sm text-gray-400 hover:text-gray-600">
                  Go to vendor dashboard (limited view until approved)
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorSignup;
