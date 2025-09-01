import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, User, Award, ArrowRight, Globe, Check } from 'lucide-react';

interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
}

const ServiceProviderSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>('');

  const roleOptions: RoleOption[] = [
    {
      id: 'company',
      title: 'Company',
      description: 'An agency or company offering services through a team or workforce.',
      icon: Building2,
      features: [
        'Team management tools',
        'Multi-project handling',
        'Enterprise-level contracts',
        'Dedicated account manager'
      ]
    },
    {
      id: 'freelancer',
      title: 'Independent Professional',
      description: 'An individual professional offering services independently.',
      icon: User,
      features: [
        'Personal brand building',
        'Flexible project selection',
        'Direct client communication',
        'Individual portfolio showcase'
      ]
    },
    {
      id: 'expert',
      title: 'Expert',
      description: 'A master-level specialist or advisor in a specific domain.',
      icon: Award,
      features: [
        'Premium consulting rates',
        'Thought leadership platform',
        'Exclusive project access',
        'Industry recognition'
      ]
    }
  ];

  const handleContinue = () => {
    if (selectedRole) {
      // Navigate to appropriate signup page based on role
      if (selectedRole === 'independent') {
        navigate('/independent/signup');
      } else {
        navigate(`/vendor/signup?role=${selectedRole}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-[#0070F3]" />
              <span className="text-xl font-bold text-[#0B2D59]">Collabov</span>
            </Link>
            <Link 
              to="/vendor/login" 
              className="text-gray-600 hover:text-[#0070F3] font-medium transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl font-bold text-[#0B2D59] mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            What type of service provider are you?
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Choose the option that best describes your business model to get a tailored experience
          </motion.p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {roleOptions.map((role, index) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <motion.div
                key={role.id}
                className={`relative cursor-pointer transition-all duration-300 ${
                  isSelected 
                    ? 'transform -translate-y-2' 
                    : 'hover:transform hover:-translate-y-1'
                }`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className={`
                  relative bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300
                  ${isSelected 
                    ? 'border-[#0070F3] shadow-xl ring-4 ring-[#0070F3]/10' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
                  }
                `}>
                  {/* Selection Indicator */}
                  <div className="absolute top-6 right-6">
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
                      ${isSelected 
                        ? 'border-[#0070F3] bg-[#0070F3]' 
                        : 'border-gray-300'
                      }
                    `}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300
                    ${isSelected 
                      ? 'bg-[#0070F3] text-white' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-[#0B2D59] mb-3">
                    {role.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {role.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-3">
                    {role.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <div className={`
                          w-2 h-2 rounded-full mr-3 transition-all duration-300
                          ${isSelected ? 'bg-[#0070F3]' : 'bg-gray-400'}
                        `} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Selected Badge */}
                  {isSelected && (
                    <motion.div
                      className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="bg-[#0070F3] text-white px-4 py-1 rounded-full text-sm font-medium">
                        Selected
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Continue Button */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`
              inline-flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform
              ${selectedRole
                ? 'bg-[#0070F3] text-white hover:bg-blue-600 hover:scale-105 shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
          
          {!selectedRole && (
            <p className="text-gray-500 text-sm mt-3">
              Please select a role to continue
            </p>
          )}
        </motion.div>

        {/* Help Section */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-gray-500 text-sm">
            Not sure which option fits you best? {' '}
            <Link to="/contact" className="text-[#0070F3] hover:text-blue-700 font-medium">
              Get help from our team
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ServiceProviderSelection;