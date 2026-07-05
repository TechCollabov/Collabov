import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Globe, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const MAX_LOGIN_ATTEMPTS = 3;

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signOut, user, profile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.user_type === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        setError('This account does not have admin access.');
        signOut();
      }
    }
  }, [user, profile, loading, navigate, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLocked(false);
    setIsLoading(true);

    try {
      const { data: lockRows } = await supabase.rpc('get_login_lock_status', { p_email: email });
      const lockStatus = Array.isArray(lockRows) ? lockRows[0] : lockRows;
      if (lockStatus?.is_locked) {
        setLocked(true);
        setError('This admin account is locked after repeated failed sign-in attempts. Ask another admin to unlock it from User Management.');
        setIsLoading(false);
        return;
      }
    } catch (lockErr) {
      console.error('[AdminLogin] lock status check failed:', lockErr);
    }

    try {
      await signIn(email, password);
      await supabase.rpc('record_login_attempt', { p_email: email, p_success: true });
    } catch (err) {
      try {
        await supabase.rpc('record_login_attempt', { p_email: email, p_success: false });
        const { data: lockRows } = await supabase.rpc('get_login_lock_status', { p_email: email });
        const lockStatus = Array.isArray(lockRows) ? lockRows[0] : lockRows;
        if (lockStatus?.is_locked) {
          setLocked(true);
          setError(`This admin account is now locked after ${MAX_LOGIN_ATTEMPTS} failed attempts. Ask another admin to unlock it from User Management.`);
          setIsLoading(false);
          return;
        }
      } catch (recordErr) {
        console.error('[AdminLogin] record login attempt failed:', recordErr);
      }
      setError(err instanceof Error ? err.message : 'Invalid email or password');
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0070F3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Globe className="h-8 w-8 text-[#0070F3]" />
          <span className="text-2xl font-bold text-[#0B2D59]">Collabov</span>
        </Link>
        <h2 className="text-center text-2xl font-bold text-gray-900">Admin sign in</h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Admin accounts are provisioned by the system administrator
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
              {locked && <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading
                ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Signing in...</>
                : 'Sign in to Admin'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Not an admin?{' '}
            <Link to="/signin" className="text-[#0070F3] hover:underline">Sign in here</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
