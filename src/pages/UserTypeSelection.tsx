import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, User, ArrowRight, Globe } from 'lucide-react';
import { UI_VENDOR_LABEL, UI_CUSTOMER_LABEL } from '../constants/roles';

const UserTypeSelection: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
          <Globe className="h-10 w-10 text-[#0070F3]" />
          <span className="text-2xl font-bold text-[#0B2D59]">Collabov</span>
        </Link>
        <h2 className="text-center text-3xl font-bold text-[#0B2D59] mb-2">
          Join Collabov
        </h2>
        <p className="text-center text-lg text-gray-600 mb-8">
          Choose your account type to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
          {/* Service Provider Option */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="group"
          >
            <Link
              to="/sign-up/vendor"
              className="block bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#0070F3]/30"
            >
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#0070F3] to-blue-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#0B2D59] mb-4">
                  {UI_VENDOR_LABEL}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Are you a company, agency, or freelancer looking to offer your services to global clients?
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-[#0070F3] mr-3"></div>
                    <span>Access global client base</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-[#0070F3] mr-3"></div>
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-[#0070F3] mr-3"></div>
                    <span>Professional profile & portfolio</span>
                  </div>
                </div>
                <div className="inline-flex items-center text-[#0070F3] font-semibold group-hover:text-blue-700 transition-colors">
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Customer Option */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group"
          >
            <Link
              to="/sign-up/customer"
              className="block bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30"
            >
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <User className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#0B2D59] mb-4">
                  {UI_CUSTOMER_LABEL}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Are you a business looking to outsource projects or hire dedicated teams?
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mr-3"></div>
                    <span>Access verified service providers</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mr-3"></div>
                    <span>AI-powered matching</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mr-3"></div>
                    <span>Project management tools</span>
                  </div>
                </div>
                <div className="inline-flex items-center text-emerald-600 font-semibold group-hover:text-emerald-700 transition-colors">
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Sign In Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-8 mx-4">
            <h3 className="text-xl font-semibold text-[#0B2D59] mb-4">
              Already have an account?
            </h3>
            <p className="text-gray-600 mb-6">
              Sign in to access your dashboard and continue where you left off
            </p>
            <Link
              to="/sign-in"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#0070F3] to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Sign In
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 text-center px-4"
        >
          <p className="text-gray-500 text-sm">
            Need help choosing? {' '}
            <Link to="/contact" className="text-[#0070F3] hover:text-blue-700 font-medium">
              Contact our support team
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default UserTypeSelection;