const IndependentSignup: React.FC = () => {
  const navigate = useNavigate();
  const [showOTP, setShowOTP] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState<SignupFormData | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: SignupFormData) => {
    console.log('Independent professional signup:', data);
    setFormData(data);
    setShowOTP(true);
    // Here you would send OTP to the phone number
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length === 6) {
      setIsVerifying(true);
      
      // Store user signup data for future sign-ins
      if (formData) {
        localStorage.setItem('userSignupData', JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: 'contractor',
          signupMethod: 'email'
        }));
      }
      
      // Simulate OTP verification
      setTimeout(() => {
        setIsVerifying(false);
        navigate('/contractor/dashboard');
      }, 2000);
    }
  };

  const handleGoogleSignup = () => {
    setShowGoogleModal(true);
  };

  const handleGoogleAccountSelect = (account: any) => {
    // Simulate Google OAuth flow
    console.log('Selected Google account:', account);
    setShowGoogleModal(false);
    
    // Store Google signup data
    localStorage.setItem('userSignupData', JSON.stringify({
      email: account.email,
      fullName: account.name,
      role: 'contractor',
      signupMethod: 'google',
      googleId: account.id
    }));
    
    // Simulate successful OAuth and redirect to profile setup
    setTimeout(() => {
      navigate('/contractor/profile-setup', {
        state: {
          googleData: {
            fullName: account.name,
            email: account.email,
            profilePicture: account.picture,
            googleId: account.id
          }
        }
      });
    }, 1000);
  };

  const handleAppleSignup = () => {
    // Handle Apple signup
    console.log('Apple signup');
  };

  if (showOTP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
            <Globe className="h-8 w-8 text-[#0070F3]" />
            <span className="text-xl font-bold text-[#0B2D59]">Collabov</span>
          </Link>
          <h2 className="text-center text-3xl font-bold text-[#0B2D59] mb-2">
           Join as an Independent Professional
          </h2>
          <p className="text-center text-gray-600 mb-8">
           Connect with clients worldwide and grow your professional business
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div 
            className="bg-white py-8 px-4 shadow-lg sm:rounded-2xl sm:px-10 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                  Enter 6-digit code
                </label>
                <div className="flex justify-center space-x-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3] focus:border-transparent"
                      maxLength={1}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={otp.join('').length !== 6 || isVerifying}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                  otp.join('').length === 6 && !isVerifying
                    ? 'bg-[#0070F3] hover:bg-blue-600 transform hover:scale-105'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {isVerifying ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify & Continue'
                )}
              </button>

              <div className="text-center">
                <button className="text-[#0070F3] hover:text-blue-600 text-sm font-medium">
                  Didn't receive code? Resend
                </button>
              </div>

              <div className="text-center">
                <button 
                  onClick={() => setShowOTP(false)}
                  className="inline-flex items-center text-gray-600 hover:text-gray-700 text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to signup
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
          <Globe className="h-8 w-8 text-[#0070F3]" />
          <span className="text-xl font-bold text-[#0B2D59]">Collabov</span>
        </Link>
        <h2 className="text-center text-3xl font-bold text-[#0B2D59] mb-2">
          Join as a Freelancer
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Connect with clients worldwide and grow your freelance business
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          className="bg-white py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Google Sign Up Button */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or sign up with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <div className="relative">
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
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <div className="relative">
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
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('contactNumber')}
                  type="tel"
                  className="pl-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              {errors.contactNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.contactNumber.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="pl-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className="pl-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="pl-10 block w-full shadow-sm focus:ring-[#0070F3] focus:border-[#0070F3] sm:text-sm border-gray-300 rounded-lg py-3"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#0070F3] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0070F3] transition-all duration-200 transform hover:scale-105"
              >
                Sign Up
              </button>
            </div>
          </form>

          {/* Social Sign Up Options */}
          <div className="mt-6 space-y-4">
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
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="ml-3">Apple</span>
              </button>
            </div>
            
            <p className="text-center text-xs text-gray-500">
              We'll never post without your permission
            </p>
          </div>

          {/* Privacy & Terms */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-[#0070F3] hover:text-blue-600 underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-[#0070F3] hover:text-blue-600 underline">
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/vendor/login" className="font-medium text-[#0070F3] hover:text-blue-600">
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
                  name: 'John Doe',
                  email: 'john.doe@gmail.com',
                  picture: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
                },
                {
                  id: '2',
                  name: 'John Doe',
                  email: 'john.doe@company.com',
                  picture: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
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

            {/* Add Account Option */}
            <div className="border-t border-gray-200 px-6 py-4">
              <button className="w-full flex items-center space-x-3 text-[#0070F3] hover:bg-blue-50 px-4 py-3 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium">Use another account</div>
                </div>
              </button>
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
