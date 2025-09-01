import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Building2, User, Briefcase } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userType: z.enum(['vendor', 'expert', 'customer'], {
    required_error: "Please select a user type"
  })
});

type LoginFormData = z.infer<typeof loginSchema>;

const VendorLogin: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userType: 'vendor'
    }
  });

  const userType = watch('userType');

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Here we would handle the actual login process
      console.log('Login attempt:', data);
      
      // For demo, simulate successful login
      switch (data.userType) {
        case 'vendor':
          navigate('/vendor/dashboard');
          break;
        case 'contractor':
          navigate('/contractor/dashboard');
          break;
        case 'customer':
          navigate('/dashboard');
          break;
      }
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const userTypeOptions = [
    { value: 'vendor', label: 'Vendor', icon: Building2, description: 'Sign in as a service provider company' },
    { value: 'contractor', label: 'Independent Professional', icon: Briefcase, description: 'Sign in as an individual professional' },
    { value: 'customer', label: 'Customer', icon: User, description: 'Sign in as a business looking for services' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/vendor/signup" className="font-medium text-primary-600 hover:text-primary-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a...
              </label>
              <div className="grid grid-cols-1 gap-3">
                {userTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`
                        relative flex cursor-pointer rounded-lg border p-4 focus:outline-none
                        ${userType === option.value 
                          ? 'border-primary-600 ring-2 ring-primary-600' 
                          : 'border-gray-300 hover:border-gray-400'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        {...register('userType')}
                        value={option.value}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <div className={`
                          rounded-lg p-2 
                          ${userType === option.value ? 'bg-primary-100' : 'bg-gray-100'}
                        `}>
                          <Icon className={`
                            h-6 w-6 
                            ${userType === option.value ? 'text-primary-600' : 'text-gray-600'}
                          `} />
                        </div>
                        <div className="ml-4">
                          <p className={`
                            font-medium 
                            ${userType === option.value ? 'text-primary-900' : 'text-gray-900'}
                          `}>
                            {option.label}
                          </p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.userType && (
                <p className="mt-1 text-sm text-red-600">{errors.userType.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="pl-10 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className="pl-10 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Sign in
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorLogin;