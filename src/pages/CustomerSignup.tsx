import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe, Eye, EyeOff, CheckCircle, ArrowRight, Search, Briefcase, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRedirectPath } from '../utils/authRedirect';

const INDUSTRIES = [
  'Technology', 'Financial Services', 'Healthcare', 'E-commerce', 'Manufacturing',
  'Professional Services', 'Media & Entertainment', 'Education', 'Government', 'Other',
];
const HEADCOUNT_BANDS = ['1–10', '11–50', '51–200', '201–1,000', '1,000+'];
const COUNTRIES = ['United Kingdom', 'Ireland', 'United States', 'Germany', 'France', 'Netherlands', 'Other'];

const CustomerSignup: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, profile, user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 1 state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 state
  const [legalName, setLegalName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [industry, setIndustry] = useState('');
  const [headcount, setHeadcount] = useState('');
  const [country, setCountry] = useState('United Kingdom');

  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    if (!loading && user && profile && step < 3) {
      const redirectPath = getRedirectPath(profile.user_type);
      navigate(redirectPath, { replace: true });
    }
  }, [user, profile, loading, step, navigate]);

  const validatePassword = (pw: string) => {
    if (pw.length < 10) return 'Password must be at least 10 characters';
    if (!/[A-Z]/.test(pw)) return 'Password must include at least one uppercase letter';
    if (!/[0-9]/.test(pw)) return 'Password must include at least one number';
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must include at least one symbol';
    return null;
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!legalName.trim()) { setError('Legal entity name is required'); return; }
    if (!industry) { setError('Please select your industry'); return; }
    if (!headcount) { setError('Please select your company size'); return; }

    setIsLoading(true);
    try {
      const name = legalName.trim();
      const extractedFirst = name.split(' ')[0];
      setFirstName(extractedFirst);
      await signUp(email, password, {
        fullName: name,
        userType: 'customer',
        additionalData: { companyName: tradingName || legalName },
      });
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <Globe className="h-8 w-8 text-[#0070F3]" />
        <span className="text-2xl font-bold text-[#0B2D59]">Collabov</span>
      </Link>

      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-[#0070F3] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                </div>
                {s < 2 && <div className={`flex-1 h-1 rounded ${step > s ? 'bg-[#0070F3]' : 'bg-gray-100'}`} />}
              </React.Fragment>
            ))}
            <span className="ml-2 text-sm text-gray-400">Step {step} of 2</span>
          </div>
        )}

        {/* Step 1 — Email & Password */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold text-[#0B2D59] mb-1">Create your account</h1>
            <p className="text-gray-500 text-sm mb-6">Join thousands of businesses finding their perfect outsourcing partners</p>
            {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@company.com"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="Min 10 chars, uppercase, number, symbol"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    placeholder="Repeat your password"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
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

        {/* Step 2 — Company Profile */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold text-[#0B2D59] mb-1">Your company profile</h1>
            <p className="text-gray-500 text-sm mb-6">Tell us about your business so we can tailor your experience.</p>
            {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleStep2} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legal Entity Name <span className="text-red-500">*</span></label>
                <input type="text" value={legalName} onChange={e => setLegalName(e.target.value)} required
                  placeholder="e.g. Acme Technologies Ltd"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trading Name <span className="text-gray-400 font-normal">(if different)</span></label>
                <input type="text" value={tradingName} onChange={e => setTradingName(e.target.value)}
                  placeholder="e.g. Acme Tech"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry <span className="text-red-500">*</span></label>
                <select value={industry} onChange={e => setIndustry(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Size <span className="text-red-500">*</span></label>
                <select value={headcount} onChange={e => setHeadcount(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]">
                  <option value="">Select headcount</option>
                  {HEADCOUNT_BANDS.map(h => <option key={h} value={h}>{h} employees</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Country</label>
                <select value={country} onChange={e => setCountry(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-3 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {isLoading ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Creating account...</> : 'Create Account'}
              </button>
            </form>
          </>
        )}

        {/* Step 3 — Welcome */}
        {step === 3 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-[#0B2D59] mb-2">
              You are all set{firstName ? `, ${firstName}` : ''}!
            </h1>
            <p className="text-gray-500 mb-8">What would you like to do first?</p>
            <div className="grid grid-cols-1 gap-4">
              <Link to="/results" className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left">
                <Search className="h-6 w-6 text-[#0070F3] flex-shrink-0" />
                <div>
                  <div className="font-semibold text-[#0B2D59]">Search for vendors</div>
                  <div className="text-sm text-gray-500">Browse verified MSPs, agencies, and dedicated teams</div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              </Link>
              <Link to="/customer/dashboard" className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left">
                <Briefcase className="h-6 w-6 text-[#0070F3] flex-shrink-0" />
                <div>
                  <div className="font-semibold text-[#0B2D59]">Post your first job</div>
                  <div className="text-sm text-gray-500">Receive proposals from verified vendors within 24 hours</div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              </Link>
              <Link to="/customer/dashboard" className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left">
                <Users className="h-6 w-6 text-[#0070F3] flex-shrink-0" />
                <div>
                  <div className="font-semibold text-[#0B2D59]">Invite your existing agency</div>
                  <div className="text-sm text-gray-500">Bring your current vendor onto the platform</div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSignup;
