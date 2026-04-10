import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Building2, User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const UserTypeSelection: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-10">
        <Globe className="h-8 w-8 text-[#0070F3]" />
        <span className="text-2xl font-bold text-[#0B2D59]">Collabov</span>
      </Link>

      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#0B2D59] mb-2">Join Collabov</h1>
          <p className="text-gray-500">Choose your account type to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Buyer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-[#0070F3] hover:shadow-lg transition-all duration-200 flex flex-col"
          >
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
              <User className="h-7 w-7 text-[#0070F3]" />
            </div>
            <h2 className="text-xl font-bold text-[#0B2D59] mb-2">Buyer</h2>
            <p className="text-gray-500 text-sm mb-5 flex-1">
              I want to outsource work — Find verified MSPs, agencies, and dedicated teams. Post jobs,
              receive proposals, and manage work in one place.
            </p>
            <Link
              to="/signup/customer"
              className="block w-full py-3 text-center bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign up as a Buyer →
            </Link>
          </motion.div>

          {/* Vendor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-[#0070F3] hover:shadow-lg transition-all duration-200 flex flex-col"
          >
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
              <Building2 className="h-7 w-7 text-[#0070F3]" />
            </div>
            <h2 className="text-xl font-bold text-[#0B2D59] mb-2">Vendor</h2>
            <p className="text-gray-500 text-sm mb-5 flex-1">
              I am an MSP, Agency, or Team Provider — List your services, receive RFPs from UK SMEs,
              and manage contracts and payments from your dashboard.
            </p>
            <Link
              to="/vendor/signup"
              className="block w-full py-3 text-center bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Join as a Provider →
            </Link>
          </motion.div>

          {/* Freelancer — Coming Soon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-white rounded-2xl p-8 border-2 border-gray-100 opacity-60 flex flex-col"
          >
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-5">
              <Clock className="h-7 w-7 text-gray-400" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-gray-500">Freelancer</h2>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Coming Soon</span>
            </div>
            <p className="text-gray-400 text-sm mb-5 flex-1">
              Individual freelancer marketplace launching Q3 2026. Join our waitlist to be first to know.
            </p>
            <button
              disabled
              className="block w-full py-3 text-center bg-gray-100 text-gray-400 rounded-lg font-semibold cursor-not-allowed"
            >
              Join Waitlist
            </button>
          </motion.div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Already have an account?{' '}
          <Link to="/signin" className="text-[#0070F3] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default UserTypeSelection;
