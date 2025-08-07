import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, MapPin, Users, Phone, Bookmark, Eye, 
  ArrowLeft, Filter, ToggleLeft, ToggleRight,
  Award, Building2, User, Globe, Mail, 
  CheckCircle, Info, Download, Share2,
  Calendar, Clock, DollarSign, Target,
  Briefcase, Shield, Zap, MessageSquare
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  type: 'vendor' | 'freelancer';
  avatar: string;
  rating: number;
  reviewCount: number;
  hourlyRate?: string;
  monthlyRate?: string;
  services: string[];
  employeeSize?: string;
  location: string;
  reviewHighlights: string[];
  expertiseScore?: number;
  industryTags: string[];
  certifications: string[];
  responseTime: string;
  completedProjects: number;
  yearsExperience: number;
  languages: string[];
  availability: string;
  portfolioItems: number;
}

const VendorComparison: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [compareType, setCompareType] = useState<'all' | 'freelancers' | 'vendors'>('all');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [savedVendors, setSavedVendors] = useState<string[]>([]);

  // Mock data - in production this would come from URL params or API
  const [vendors] = useState<Vendor[]>([
    {
      id: '1',
      name: 'TechPro Solutions',
      type: 'vendor',
      avatar: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 4.9,
      reviewCount: 127,
      hourlyRate: '$40-60',
      monthlyRate: '$8,000-12,000',
      services: ['React Development', 'Node.js', 'AWS', 'Mobile Apps'],
      employeeSize: '50-100',
      location: 'London, UK',
      reviewHighlights: [
        'Excellent communication and delivery',
        'High-quality code and documentation',
        'Always meets deadlines'
      ],
      industryTags: ['E-commerce', 'FinTech', 'Healthcare'],
      certifications: ['AWS Certified', 'ISO 9001', 'Agile Certified'],
      responseTime: '< 2 hours',
      completedProjects: 156,
      yearsExperience: 8,
      languages: ['English', 'Spanish'],
      availability: 'Available',
      portfolioItems: 24
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      type: 'freelancer',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 4.8,
      reviewCount: 89,
      hourlyRate: '$45',
      services: ['UI/UX Design', 'Figma', 'Prototyping', 'User Research'],
      location: 'New York, USA',
      reviewHighlights: [
        'Creative and innovative designs',
        'Great attention to detail',
        'Professional and responsive'
      ],
      expertiseScore: 92,
      industryTags: ['SaaS', 'E-commerce', 'Mobile Apps'],
      certifications: ['Google UX Certificate', 'Adobe Certified'],
      responseTime: '< 1 hour',
      completedProjects: 73,
      yearsExperience: 5,
      languages: ['English', 'French'],
      availability: 'Available',
      portfolioItems: 18
    },
    {
      id: '3',
      name: 'Digital Innovators',
      type: 'vendor',
      avatar: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 4.7,
      reviewCount: 203,
      hourlyRate: '$35-55',
      monthlyRate: '$6,000-10,000',
      services: ['Mobile Development', 'React Native', 'Flutter', 'API Integration'],
      employeeSize: '20-50',
      location: 'Berlin, Germany',
      reviewHighlights: [
        'Innovative mobile solutions',
        'Strong technical expertise',
        'Excellent project management'
      ],
      industryTags: ['Mobile Apps', 'Startups', 'Enterprise'],
      certifications: ['Google Play Partner', 'Apple Developer Program'],
      responseTime: '< 4 hours',
      completedProjects: 89,
      yearsExperience: 6,
      languages: ['English', 'German'],
      availability: 'Available',
      portfolioItems: 31
    }
  ]);

  const filteredVendors = vendors.filter(vendor => {
    if (compareType === 'freelancers') return vendor.type === 'freelancer';
    if (compareType === 'vendors') return vendor.type === 'vendor';
    return true;
  });

  const handleSaveVendor = (vendorId: string) => {
    setSavedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleContactVendor = (vendor: Vendor) => {
    // Navigate to contact/message page
    navigate(`/customer/contact/${vendor.id}`);
  };

  const handleViewProfile = (vendor: Vendor) => {
    // Navigate to vendor profile page
    navigate(`/customer/vendor/${vendor.id}`);
  };

  const comparisonFields = [
    {
      key: 'rating',
      label: 'Rating & Reviews',
      tooltip: 'Average rating based on client feedback and number of reviews',
      icon: Star
    },
    {
      key: 'pricing',
      label: 'Pricing',
      tooltip: 'Hourly or monthly rates for services',
      icon: DollarSign
    },
    {
      key: 'services',
      label: 'Services Offered',
      tooltip: 'Primary services and technologies offered',
      icon: Briefcase
    },
    {
      key: 'size',
      label: 'Team Size',
      tooltip: 'Number of employees or if individual freelancer',
      icon: Users
    },
    {
      key: 'location',
      label: 'Location & Timezone',
      tooltip: 'Geographic location and working timezone',
      icon: MapPin
    },
    {
      key: 'reviews',
      label: 'Review Highlights',
      tooltip: 'Top 3 most mentioned positive feedback points',
      icon: MessageSquare
    },
    {
      key: 'expertise',
      label: 'Expertise Score',
      tooltip: 'Average score from skill tests and assessments (freelancers only)',
      icon: Target
    },
    {
      key: 'industries',
      label: 'Industry Specialization',
      tooltip: 'Industries and sectors with proven experience',
      icon: Building2
    },
    {
      key: 'certifications',
      label: 'Certifications',
      tooltip: 'Professional certifications and qualifications',
      icon: Award
    },
    {
      key: 'experience',
      label: 'Experience',
      tooltip: 'Years of experience and completed projects',
      icon: Calendar
    },
    {
      key: 'availability',
      label: 'Availability',
      tooltip: 'Current availability status and response time',
      icon: Clock
    }
  ];

  const renderFieldValue = (field: string, vendor: Vendor) => {
    switch (field) {
      case 'rating':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < Math.floor(vendor.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="font-semibold">{vendor.rating}</span>
            </div>
            <p className="text-sm text-gray-600">{vendor.reviewCount} reviews</p>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-1">
            <p className="font-semibold">{vendor.hourlyRate}/hr</p>
            {vendor.monthlyRate && (
              <p className="text-sm text-gray-600">{vendor.monthlyRate}/month</p>
            )}
          </div>
        );

      case 'services':
        return (
          <div className="space-y-2">
            {vendor.services.slice(0, 3).map((service, idx) => (
              <span 
                key={idx}
                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
              >
                {service}
              </span>
            ))}
            {vendor.services.length > 3 && (
              <span className="text-xs text-gray-500">+{vendor.services.length - 3} more</span>
            )}
          </div>
        );

      case 'size':
        return (
          <div className="flex items-center space-x-2">
            {vendor.type === 'vendor' ? (
              <>
                <Building2 className="h-4 w-4 text-gray-400" />
                <span>{vendor.employeeSize} employees</span>
              </>
            ) : (
              <>
                <User className="h-4 w-4 text-gray-400" />
                <span>Individual</span>
              </>
            )}
          </div>
        );

      case 'location':
        return (
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{vendor.location}</span>
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-2">
            {vendor.reviewHighlights.map((highlight, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                <span className="text-sm">{highlight}</span>
              </div>
            ))}
          </div>
        );

      case 'expertise':
        return vendor.type === 'freelancer' && vendor.expertiseScore ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-green-600">{vendor.expertiseScore}</span>
              <span className="text-gray-500">/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${vendor.expertiseScore}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">N/A for companies</span>
        );

      case 'industries':
        return (
          <div className="space-y-2">
            {vendor.industryTags.map((tag, idx) => (
              <span 
                key={idx}
                className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
              >
                {tag}
              </span>
            ))}
          </div>
        );

      case 'certifications':
        return vendor.certifications.length > 0 ? (
          <div className="space-y-2">
            {vendor.certifications.map((cert, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <Award className="h-3 w-3 text-yellow-500" />
                <span className="text-sm">{cert}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">No certifications listed</span>
        );

      case 'experience':
        return (
          <div className="space-y-1">
            <p className="font-semibold">{vendor.yearsExperience} years</p>
            <p className="text-sm text-gray-600">{vendor.completedProjects} projects</p>
            <p className="text-sm text-gray-600">{vendor.portfolioItems} portfolio items</p>
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">{vendor.availability}</span>
            </div>
            <p className="text-xs text-gray-600">Response: {vendor.responseTime}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {vendor.languages.map((lang, idx) => (
                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/customer/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Compare Vendors & Freelancers</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="h-4 w-4" />
                <span>Share Comparison</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCompareType('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    compareType === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All ({vendors.length})
                </button>
                <button
                  onClick={() => setCompareType('freelancers')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    compareType === 'freelancers'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Freelancers Only ({vendors.filter(v => v.type === 'freelancer').length})
                </button>
                <button
                  onClick={() => setCompareType('vendors')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    compareType === 'vendors'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Companies Only ({vendors.filter(v => v.type === 'vendor').length})
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Comparing {filteredVendors.length} {filteredVendors.length === 1 ? 'provider' : 'providers'}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              {/* Sticky Header with Vendor Names */}
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 w-48">
                    Comparison Criteria
                  </th>
                  {filteredVendors.map((vendor) => (
                    <th key={vendor.id} className="px-6 py-4 text-center min-w-80">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="relative">
                          <img
                            src={vendor.avatar}
                            alt={vendor.name}
                            className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                            vendor.type === 'freelancer' ? 'bg-green-500' : 'bg-blue-500'
                          }`}>
                            {vendor.type === 'freelancer' ? (
                              <User className="h-3 w-3 text-white" />
                            ) : (
                              <Building2 className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{vendor.type}</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Comparison Rows */}
              <tbody className="divide-y divide-gray-200">
                {comparisonFields.map((field, fieldIndex) => {
                  const Icon = field.icon;
                  return (
                    <motion.tr 
                      key={field.key}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: fieldIndex * 0.05 }}
                    >
                      <td className="px-6 py-6 bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{field.label}</span>
                              <button
                                className="text-gray-400 hover:text-gray-600"
                                onMouseEnter={() => setShowTooltip(field.key)}
                                onMouseLeave={() => setShowTooltip(null)}
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </div>
                            {showTooltip === field.key && (
                              <div className="absolute z-20 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 mt-2 max-w-xs">
                                {field.tooltip}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {filteredVendors.map((vendor) => (
                        <td key={vendor.id} className="px-6 py-6 text-center">
                          {renderFieldValue(field.key, vendor)}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })}
              </tbody>

              {/* Action Buttons Row */}
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-6">
                    <span className="font-medium text-gray-900">Actions</span>
                  </td>
                  {filteredVendors.map((vendor) => (
                    <td key={vendor.id} className="px-6 py-6">
                      <div className="space-y-3">
                        <button
                          onClick={() => handleContactVendor(vendor)}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Phone className="h-4 w-4" />
                          <span>Contact</span>
                        </button>
                        
                        <button
                          onClick={() => handleSaveVendor(vendor.id)}
                          className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                            savedVendors.includes(vendor.id)
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          <Bookmark className={`h-4 w-4 ${savedVendors.includes(vendor.id) ? 'fill-current' : ''}`} />
                          <span>{savedVendors.includes(vendor.id) ? 'Saved' : 'Save'}</span>
                        </button>
                        
                        <button
                          onClick={() => handleViewProfile(vendor)}
                          className="w-full bg-white text-gray-700 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Profile</span>
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Highest Rated</h3>
            </div>
            {(() => {
              const topRated = filteredVendors.reduce((prev, current) => 
                prev.rating > current.rating ? prev : current
              );
              return (
                <div className="flex items-center space-x-3">
                  <img src={topRated.avatar} alt={topRated.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-medium">{topRated.name}</p>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm">{topRated.rating} ({topRated.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Most Affordable</h3>
            </div>
            {(() => {
              const mostAffordable = filteredVendors.reduce((prev, current) => {
                const prevRate = parseInt(prev.hourlyRate?.replace(/[^0-9]/g, '') || '999');
                const currentRate = parseInt(current.hourlyRate?.replace(/[^0-9]/g, '') || '999');
                return prevRate < currentRate ? prev : current;
              });
              return (
                <div className="flex items-center space-x-3">
                  <img src={mostAffordable.avatar} alt={mostAffordable.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-medium">{mostAffordable.name}</p>
                    <p className="text-sm text-gray-600">{mostAffordable.hourlyRate}/hr</p>
                  </div>
                </div>
              );
            })()}
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Fastest Response</h3>
            </div>
            {(() => {
              const fastestResponse = filteredVendors.reduce((prev, current) => {
                const prevTime = parseInt(prev.responseTime.replace(/[^0-9]/g, '') || '999');
                const currentTime = parseInt(current.responseTime.replace(/[^0-9]/g, '') || '999');
                return prevTime < currentTime ? prev : current;
              });
              return (
                <div className="flex items-center space-x-3">
                  <img src={fastestResponse.avatar} alt={fastestResponse.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-medium">{fastestResponse.name}</p>
                    <p className="text-sm text-gray-600">Responds in {fastestResponse.responseTime}</p>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div 
          className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-2xl font-bold mb-4">Ready to Start Your Project?</h3>
          <p className="text-blue-100 mb-6">
            Contact your preferred vendors or save them to your shortlist for future reference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/customer/dashboard"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Back to Dashboard
            </Link>
            <Link
              to="/customer/post-job"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-400 transition-colors"
            >
              Post a New Job
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VendorComparison;