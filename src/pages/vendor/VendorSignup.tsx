import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Globe, Eye, EyeOff, CheckCircle } from 'lucide-react';
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

const MAX_BUSINESS_TYPES = 2;

const VendorSignup: React.FC = () => {
  const navigate = useNavigate();
  const { type: typeParam } = useParams<{ type?: string }>();
  const { signUp, profile, user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 — pre-select from /vendor/signup/:type (e.g. a "Join as an MSP" landing link) if valid
  const preselectedType = BUSINESS_TYPES.some(bt => bt.id === typeParam) ? (typeParam as BusinessType) : null;
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>(preselectedType ? [preselectedType] : []);

  // Step 2
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Step 3 — email OTP
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && user && profile) {
      navigate(getRedirectPath(profile.user_type), { replace: true });
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (step === 3) otpInputRef.current?.focus();
  }, [step]);

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

  const toggleBusinessType = (id: BusinessType) => {
    setBusinessTypes(prev => {
      if (prev.includes(id)) return prev.filter(t => t !== id);
      if (prev.length >= MAX_BUSINESS_TYPES) return prev;
      return [...prev, id];
    });
  };

  const handleBusinessTypeContinue = () => {
    setError(null);
    if (businessTypes.length === 0) { setError('Select at least one business type to continue'); return; }
    setStep(2);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // TODO(revert-before-launch): business-email check disabled for testing — re-enable
    // by uncommenting the line below. Applies to all three vendor types (MSP/agency/staffaug)
    // since they share this one signup component.
    // if (!isBusinessEmail(email)) { setError('Please use a business email address — personal addresses (Gmail, Yahoo, Hotmail, Outlook) aren\'t accepted.'); return; }
    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }
    if (!phone.trim()) { setError('Contact number is required'); return; }

    setIsLoading(true);
    try {
      const { hasSession } = await signUp(email, password, {
        fullName: email.split('@')[0],
        userType: 'vendor',
        additionalData: {
          businessType: businessTypes[0],
          businessTypeSecondary: businessTypes[1] ?? null,
          contactPhone: phone.trim(),
        },
      });
      if (hasSession) {
        // Confirmation not required (e.g. local dev) — straight to dashboard.
        navigate('/vendor/dashboard', { replace: true });
        return;
      }
      setOtpSent(true);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.trim().length < 6) { setError('Enter the 6-digit code from your email'); return; }
    setIsLoading(true);
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: 'signup' });
      if (verifyErr) throw verifyErr;
      navigate('/vendor/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Please try again or request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setResending(true);
    setResent(false);
    try {
      const { error: resendErr } = await supabase.auth.resend({ type: 'signup', email });
      if (resendErr) throw resendErr;
      setResent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  const TOTAL_STEPS = 3;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <Globe className="h-8 w-8 text-[#0070F3]" />
        <span className="text-2xl font-bold text-[#0B2D59]">Collabov</span>
      </Link>

      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-1 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step > s ? 'bg-[#0070F3] text-white' : step === s ? 'bg-[#0070F3] text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > s ? <CheckCircle className="h-3 w-3" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 rounded ${step > s ? 'bg-[#0070F3]' : 'bg-gray-100'}`} />}
            </React.Fragment>
          ))}
          <span className="ml-2 text-xs text-gray-400 flex-shrink-0">Step {step} of {TOTAL_STEPS}</span>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {/* Step 1 — Business Type(s) */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold text-[#0B2D59] mb-1">What kind of provider are you?</h1>
            <p className="text-gray-500 text-sm mb-6">Pick up to two — most vendors do more than one. This sets your contract templates and how buyers find you.</p>
            <div className="space-y-3 mb-6">
              {BUSINESS_TYPES.map(bt => {
                const selected = businessTypes.includes(bt.id);
                const disabled = !selected && businessTypes.length >= MAX_BUSINESS_TYPES;
                return (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => toggleBusinessType(bt.id)}
                    disabled={disabled}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${selected ? 'border-[#0070F3] bg-blue-50' : disabled ? 'border-gray-100 opacity-50 cursor-not-allowed' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0B2D59]">{bt.label}</span>
                      {selected && <CheckCircle className="h-5 w-5 text-[#0070F3]" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{bt.blurb}</p>
                    <p className="text-xs text-gray-400 mt-1">Contract: {bt.contract}</p>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleBusinessTypeContinue}
              disabled={businessTypes.length === 0}
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

        {/* Step 2 — Email, Password, Phone */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold text-[#0B2D59] mb-1">Create your provider account</h1>
            <p className="text-gray-500 text-sm mb-6">You'll fill in company details and documents from your dashboard after this.</p>
            <form onSubmit={handleAccountSubmit} className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+44 7700 900000"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors">Back</button>
                <button type="submit" disabled={isLoading} className="flex-[2] py-3 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {isLoading ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Creating account...</> : 'Continue'}
                </button>
              </div>
            </form>
            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{' '}
              <Link to="/signin" className="text-[#0070F3] font-medium hover:underline">Sign in</Link>
            </p>
          </>
        )}

        {/* Step 3 — Email OTP */}
        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold text-[#0B2D59] mb-1">Verify your email</h1>
            <p className="text-gray-500 text-sm mb-6">
              We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>. Enter it below to activate your account.
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              </div>
              <button type="submit" disabled={isLoading || otp.length < 6} className="w-full py-3 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {isLoading ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Verifying...</> : 'Verify & Continue'}
              </button>
            </form>
            <div className="text-center mt-4">
              {resent && <p className="text-xs text-green-600 mb-2">A new code has been sent.</p>}
              <button type="button" onClick={handleResendOtp} disabled={resending} className="text-sm text-[#0070F3] font-medium hover:underline disabled:opacity-60">
                {resending ? 'Resending...' : "Didn't get a code? Resend"}
              </button>
            </div>
            {otpSent && (
              <p className="text-xs text-gray-400 mt-6 text-center">
                You can also just click the confirmation link in that email instead of entering a code.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VendorSignup;
