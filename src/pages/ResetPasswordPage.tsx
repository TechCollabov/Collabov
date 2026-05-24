import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY on auth state change when the hash
    // contains type=recovery. We listen for it to confirm the token is valid.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check for an existing session (token may already be exchanged)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const validatePassword = (pw: string) => {
    if (pw.length < 10) return 'Password must be at least 10 characters';
    if (!/[A-Z]/.test(pw)) return 'Password must include at least one uppercase letter';
    if (!/[0-9]/.test(pw)) return 'Password must include at least one number';
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must include at least one symbol';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate('/signin'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
          <Globe className="h-10 w-10 text-[#0070F3]" />
          <span className="text-2xl font-bold text-[#0B2D59]">Collabov</span>
        </Link>
        <h2 className="text-center text-3xl font-bold text-[#0B2D59] mb-2">
          Set new password
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Choose a strong password for your account
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          className="bg-white py-10 px-8 shadow-xl sm:rounded-2xl border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-[#0B2D59] mb-2">Password updated!</h3>
              <p className="text-gray-600 text-sm">
                Your password has been changed. Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {!sessionReady && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-700 text-sm">Verifying your reset link…</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                      placeholder="Min 10 chars, uppercase, number, symbol"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                      placeholder="Repeat your new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !sessionReady}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                    isLoading || !sessionReady
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#0070F3] hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Updating…
                    </div>
                  ) : (
                    'Update password'
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
