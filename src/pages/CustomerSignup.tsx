import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Building2, Globe, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRedirectPath } from '../utils/authRedirect';

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  companyName: z.string().min(2, 'Company name is required'),
  workEmail: z.string().email('Valid work email is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

const CustomerSignup: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, profile, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  });

  useEffect(() => {
    if (!loading && user && profile && !error && !isLoading) {
      const redirectPath = getRedirectPath(profile.user_type);
      navigate(redirectPath, { replace: true });
    }
  }, [user, profile, navigate, error, loading, isLoading]);

  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      await signUp(data.workEmail, data.password, {
        fullName: `${data.firstName} ${data.lastName}`,
        userType: 'customer',
        additionalData: {
          companyName: data.companyName,
          phone: data.phoneNumber,
        },
      });
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during signup');
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setShowGoogleModal(true);
  };

  const handleGoogleAccountSelect = (account: any) => {
    setShowGoogleModal(false);
    
    // Store Google signup data
    localStorage.setItem('userSignupData', JSON.stringify({
      email: account.email,
      fullName: account.name,
      role: 'customer',
      signupMethod: 'google',
      googleId: account.id
    }));
    
    // Simulate successful OAuth and redirect to dashboard
    setTimeout(() => {
      navigate('/customer/dashboard');
    }, 1000);
  };

  const handleAppleSignup = () => {
    // Simulate Apple signup
    setTimeout(() => {
      navigate('/customer/dashboard');
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0070F3]"></div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
          <Globe className="h-10 w-10 text-[#0070F3]" />
          <span className="text-2xl font-bold text-[#0B2D59]">Collabov</span>
        </Link>
        <h2 className="text-center text-3xl font-bold text-[#0B2D59] mb-2">
          Create your customer account
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Join thousands of businesses finding their perfect outsourcing partners
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          className="bg-white py-10 px-8 shadow-xl sm:rounded-2xl border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Social Sign Up Options */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              
              <button
                onClick={handleAppleSignup}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-black text-white hover:bg-gray-800 transition-all duration-200 font-medium"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Apple
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or sign up with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="pl-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="pl-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('companyName')}
                  type="text"
                  className="pl-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                  placeholder="Your Company Inc."
                />
              </div>
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="workEmail" className="block text-sm font-medium text-gray-700">
                Work Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('workEmail')}
                  type="email"
                  className="pl-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                  placeholder="john@company.com"
                />
              </div>
              {errors.workEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.workEmail.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('phoneNumber')}
                  type="tel"
                  className="pl-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Create Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="pl-10 pr-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="pl-10 pr-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms and Privacy */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms-agreement"
                className="mt-1 h-4 w-4 text-[#0070F3] focus:ring-[#0070F3] border-gray-300 rounded"
                required
              />
              <label htmlFor="terms-agreement" className="text-sm text-gray-700">
                I agree to Collabov's{' '}
                <Link to="/terms" className="text-[#0070F3] hover:text-blue-600 underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-[#0070F3] hover:text-blue-600 underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#0070F3] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0070F3] transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/signin" className="font-medium text-[#0070F3] hover:text-blue-600">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>

    {/* Google Account Selection Modal */}
    {showGoogleModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div 
          className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Modal Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Choose an account</h3>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">to continue to Collabov</p>
          </div>

          {/* Account List */}
          <div className="max-h-80 overflow-y-auto">
            {[
              {
                id: '1',
                name: 'John Smith',
                email: 'john@techcorp.com',
                picture: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
              },
              {
                id: '2',
                name: 'Sarah Johnson',
                email: 'sarah@startup.com',
                picture: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
              }
            ].map((account) => (
              <button
                key={account.id}
                onClick={() => handleGoogleAccountSelect(account)}
                className="w-full px-6 py-4 hover:bg-gray-50 transition-colors flex items-center space-x-4 border-b border-gray-100 last:border-b-0"
              >
                <img
                  src={account.picture}
                  alt={account.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{account.name}</div>
                  <div className="text-sm text-gray-600">{account.email}</div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 text-center">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <Link to="/privacy" className="hover:text-gray-700">Privacy Policy</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-gray-700">Terms of Service</Link>
            </div>
          </div>
        </motion.div>
      </div>
    )}
    </>
  );
};

export default CustomerSignup;