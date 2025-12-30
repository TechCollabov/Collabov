import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MapPin, DollarSign, Users, Clock, Building2,
  ChevronDown, CheckCircle, Bookmark, GitCompare, TrendingUp,
  Globe, Award, Calendar, Briefcase, AlertCircle, X
} from 'lucide-react';

interface MarketInsight {
  location: string;
  avgMonthlyCost: string;
  commonSkills: string[];
  experienceRange: string;
  timeZoneOverlap: string;
  avgOnboardingTime: string;
  talentSupply: 'High' | 'Medium' | 'Low';
  overview: string;
  ukLocalCost: string;
  outsourcedCost: string;
  savingsPercent: string;
  expertTip: string;
}

interface Vendor {
  id: string;
  name: string;
  logo: string | null;
  primaryLocations: string[];
  companySize: string;
  yearsInOperation: number;
  industryFocus: string[];
  engagementModels: string[];
  monthlyCostRange: string;
  avgContractLength: string;
  responseTimeBadge: string;
  description: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
}

interface Role {
  id: string;
  title: string;
  vendorId: string;
  vendorName: string;
  location: string;
  experienceLevel: string;
  keySkills: string[];
  monthlyCost: string;
  availabilityStatus: 'Available' | 'Limited' | 'Unavailable';
}

const SearchResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = new URLSearchParams(location.search).get('q') || '';
  const [viewMode, setViewMode] = useState<'vendors' | 'roles'>('vendors');
  const [shortlisted, setShortlisted] = useState<string[]>([]);
  const [comparing, setComparing] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const [filters, setFilters] = useState({
    location: 'Eastern Europe',
    engagementType: '',
    experienceLevel: '',
    budgetRange: '',
    industry: ''
  });

  // Market insights data
  const marketInsights: Record<string, MarketInsight> = {
    'Eastern Europe': {
      location: 'Eastern Europe',
      avgMonthlyCost: '£3,000 – £4,500',
      commonSkills: ['React', 'Node.js', 'Python', 'Java', 'DevOps', 'QA Testing'],
      experienceRange: 'Mid to Senior (3-10+ years)',
      timeZoneOverlap: 'GMT+2 to GMT+3 (1-2 hours ahead)',
      avgOnboardingTime: '2-3 weeks',
      talentSupply: 'High',
      overview: 'Eastern Europe offers strong mid-to-senior engineering talent with high English proficiency and close UK time zone overlap.',
      ukLocalCost: '£6,000 – £8,000',
      outsourcedCost: '£3,000 – £4,500',
      savingsPercent: '40–60%',
      expertTip: 'UK companies hiring from this location typically prefer fixed monthly dedicated resources over hourly contracts for better delivery continuity.'
    },
    'India': {
      location: 'India',
      avgMonthlyCost: '£2,000 – £3,500',
      commonSkills: ['Full-stack', 'Mobile', 'Cloud', 'AI/ML', 'QA', 'DevOps'],
      experienceRange: 'Junior to Senior (1-10+ years)',
      timeZoneOverlap: 'GMT+5:30 (4.5-5.5 hours ahead)',
      avgOnboardingTime: '2-4 weeks',
      talentSupply: 'High',
      overview: 'India provides the largest talent pool with comprehensive technical expertise across modern and legacy technologies.',
      ukLocalCost: '£6,000 – £8,000',
      outsourcedCost: '£2,000 – £3,500',
      savingsPercent: '55–70%',
      expertTip: 'Companies value India for scalable teams and cost efficiency. Establish clear communication protocols for best results.'
    }
  };

  const currentMarketInsight = marketInsights[filters.location] || marketInsights['Eastern Europe'];

  // Mock vendor data
  const vendors: Vendor[] = [
    {
      id: 'v1',
      name: 'TechForge Solutions',
      logo: null,
      primaryLocations: ['Poland', 'Ukraine'],
      companySize: '150-200 employees',
      yearsInOperation: 8,
      industryFocus: ['FinTech', 'E-commerce', 'SaaS'],
      engagementModels: ['Dedicated Team', 'Staff Augmentation'],
      monthlyCostRange: '£3,200 – £4,800',
      avgContractLength: '12-24 months',
      responseTimeBadge: '< 24 hours',
      description: 'Specialized in building dedicated development teams for UK and EU companies. Strong focus on FinTech and e-commerce platforms.',
      rating: 4.8,
      reviewCount: 47,
      isVerified: true
    },
    {
      id: 'v2',
      name: 'CodeCraft Studios',
      logo: null,
      primaryLocations: ['Romania', 'Moldova'],
      companySize: '80-120 employees',
      yearsInOperation: 6,
      industryFocus: ['Healthcare', 'EdTech', 'Enterprise'],
      engagementModels: ['Dedicated Team', 'Project-Based'],
      monthlyCostRange: '£2,800 – £4,200',
      avgContractLength: '6-18 months',
      responseTimeBadge: '< 48 hours',
      description: 'Expert team in healthcare compliance and enterprise solutions. HIPAA and GDPR certified development processes.',
      rating: 4.9,
      reviewCount: 33,
      isVerified: true
    },
    {
      id: 'v3',
      name: 'Digital Builders Ltd',
      logo: null,
      primaryLocations: ['Czech Republic', 'Slovakia'],
      companySize: '200-300 employees',
      yearsInOperation: 12,
      industryFocus: ['Manufacturing', 'Logistics', 'Retail'],
      engagementModels: ['Dedicated Team', 'Staff Augmentation', 'Managed Services'],
      monthlyCostRange: '£3,500 – £5,000',
      avgContractLength: '18-36 months',
      responseTimeBadge: '< 12 hours',
      description: 'Large-scale enterprise development with expertise in legacy modernization and IoT solutions.',
      rating: 4.7,
      reviewCount: 89,
      isVerified: true
    }
  ];

  // Mock role data
  const roles: Role[] = [
    {
      id: 'r1',
      title: 'Senior Backend Developer',
      vendorId: 'v1',
      vendorName: 'TechForge Solutions',
      location: 'Poland',
      experienceLevel: 'Senior (7+ years)',
      keySkills: ['Node.js', 'PostgreSQL', 'AWS', 'Microservices'],
      monthlyCost: '£4,200',
      availabilityStatus: 'Available'
    },
    {
      id: 'r2',
      title: 'Full-Stack Development Team',
      vendorId: 'v1',
      vendorName: 'TechForge Solutions',
      location: 'Ukraine',
      experienceLevel: 'Mid-Senior (4-8 years)',
      keySkills: ['React', 'Node.js', 'MongoDB', 'Docker'],
      monthlyCost: '£3,800 per developer',
      availabilityStatus: 'Available'
    },
    {
      id: 'r3',
      title: 'QA & Testing Team',
      vendorId: 'v2',
      vendorName: 'CodeCraft Studios',
      location: 'Romania',
      experienceLevel: 'Mid-Level (3-6 years)',
      keySkills: ['Selenium', 'Cypress', 'Jest', 'Performance Testing'],
      monthlyCost: '£2,900 per tester',
      availabilityStatus: 'Limited'
    },
    {
      id: 'r4',
      title: 'DevOps Engineer',
      vendorId: 'v3',
      vendorName: 'Digital Builders Ltd',
      location: 'Czech Republic',
      experienceLevel: 'Senior (6+ years)',
      keySkills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS/Azure'],
      monthlyCost: '£4,500',
      availabilityStatus: 'Available'
    }
  ];

  const handleShortlist = (id: string) => {
    setShortlisted(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCompare = (id: string) => {
    if (comparing.includes(id)) {
      setComparing(prev => prev.filter(x => x !== id));
    } else if (comparing.length < 3) {
      setComparing(prev => [...prev, id]);
    }
  };

  const clearComparison = () => {
    setComparing([]);
    setShowComparison(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Search & Filter Bar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by skill, role, or team (e.g. React Developers, QA Team)"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={searchQuery}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
              >
                <option value="Eastern Europe">Eastern Europe</option>
                <option value="India">India</option>
                <option value="Latin America">Latin America</option>
                <option value="Southeast Asia">Southeast Asia</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.engagementType}
                onChange={(e) => setFilters({...filters, engagementType: e.target.value})}
              >
                <option value="">Engagement Type</option>
                <option value="dedicated">Dedicated Team</option>
                <option value="augmentation">Staff Augmentation</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.experienceLevel}
                onChange={(e) => setFilters({...filters, experienceLevel: e.target.value})}
              >
                <option value="">Experience Level</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.budgetRange}
                onChange={(e) => setFilters({...filters, budgetRange: e.target.value})}
              >
                <option value="">Monthly Budget</option>
                <option value="2000-3000">£2,000 - £3,000</option>
                <option value="3000-4000">£3,000 - £4,000</option>
                <option value="4000-5000">£4,000 - £5,000</option>
                <option value="5000+">£5,000+</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.industry}
                onChange={(e) => setFilters({...filters, industry: e.target.value})}
              >
                <option value="">Industry Experience</option>
                <option value="fintech">FinTech</option>
                <option value="healthcare">Healthcare</option>
                <option value="ecommerce">E-commerce</option>
                <option value="saas">SaaS</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Location-Based Market Insight Section */}
        <div className="mb-12">
          {/* Market Overview Card */}
          <motion.div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">{currentMarketInsight.location} Market Overview</h2>
                </div>
                <p className="text-gray-600 text-lg">{currentMarketInsight.overview}</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  {currentMarketInsight.talentSupply} Talent Supply
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="text-sm text-gray-500 mb-1">Average Monthly Cost (per employee)</div>
                <div className="text-2xl font-bold text-gray-900">{currentMarketInsight.avgMonthlyCost}</div>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <div className="text-sm text-gray-500 mb-1">Experience Range</div>
                <div className="text-lg font-semibold text-gray-900">{currentMarketInsight.experienceRange}</div>
              </div>

              <div className="border-l-4 border-amber-500 pl-4">
                <div className="text-sm text-gray-500 mb-1">Time Zone Overlap with UK</div>
                <div className="text-lg font-semibold text-gray-900">{currentMarketInsight.timeZoneOverlap}</div>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <div className="text-sm text-gray-500 mb-1">Average Onboarding Time</div>
                <div className="text-lg font-semibold text-gray-900">{currentMarketInsight.avgOnboardingTime}</div>
              </div>

              <div className="border-l-4 border-indigo-500 pl-4 md:col-span-2">
                <div className="text-sm text-gray-500 mb-2">Common Skills Availability</div>
                <div className="flex flex-wrap gap-2">
                  {currentMarketInsight.commonSkills.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cost Benchmark Comparison */}
          <motion.div
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
              Cost Benchmark Comparison
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <div className="text-sm text-gray-500 mb-1">UK Local Hire</div>
                <div className="text-2xl font-bold text-gray-900">{currentMarketInsight.ukLocalCost} / month</div>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-green-500">
                <div className="text-sm text-gray-500 mb-1">Outsourced via Collabov</div>
                <div className="text-2xl font-bold text-green-600">{currentMarketInsight.outsourcedCost} / month</div>
                <div className="text-sm text-green-700 mt-2 font-semibold">
                  Save {currentMarketInsight.savingsPercent} on average
                </div>
              </div>
            </div>
            <p className="text-gray-700 mt-4">
              Companies typically save <span className="font-bold">{currentMarketInsight.savingsPercent}</span> compared to UK local hiring.
            </p>
          </motion.div>

          {/* Hiring Advisory Insight */}
          <motion.div
            className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex items-start gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Expert Hiring Advisory</h4>
              <p className="text-gray-700">{currentMarketInsight.expertTip}</p>
            </div>
          </motion.div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border shadow-sm">
            <button
              onClick={() => setViewMode('vendors')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                viewMode === 'vendors'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              View by Vendors
            </button>
            <button
              onClick={() => setViewMode('roles')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                viewMode === 'roles'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              View by Roles / Teams
            </button>
          </div>

          <div className="text-sm text-gray-600">
            {viewMode === 'vendors' ? vendors.length : roles.length} results found
          </div>
        </div>

        {/* Comparison Bar */}
        {comparing.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-900">
                  {comparing.length} vendor{comparing.length > 1 ? 's' : ''} selected for comparison
                </span>
                <button
                  onClick={() => setShowComparison(true)}
                  disabled={comparing.length < 2}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    comparing.length >= 2
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <GitCompare className="inline h-4 w-4 mr-2" />
                  Compare Now
                </button>
              </div>
              <button onClick={clearComparison} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Vendor Listings */}
        {viewMode === 'vendors' && (
          <div className="space-y-6">
            {vendors.map((vendor, index) => (
              <motion.div
                key={vendor.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Logo */}
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                      {vendor.logo ? (
                        <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Building2 className="h-10 w-10 text-blue-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {vendor.name}
                            {vendor.isVerified && (
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                            )}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {vendor.primaryLocations.join(', ')}
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {vendor.companySize}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {vendor.yearsInOperation} years
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShortlist(vendor.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              shortlisted.includes(vendor.id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Shortlist"
                          >
                            <Bookmark className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleCompare(vendor.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              comparing.includes(vendor.id)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Add to comparison"
                          >
                            <GitCompare className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{vendor.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-500">Monthly Cost</div>
                            <div className="font-semibold text-gray-900">{vendor.monthlyCostRange}</div>
                          </div>
                        </div>

                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-500">Response Time</div>
                            <div className="font-semibold text-green-600">{vendor.responseTimeBadge}</div>
                          </div>
                        </div>

                        <div className="flex items-center text-sm">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-500">Avg Contract</div>
                            <div className="font-semibold text-gray-900">{vendor.avgContractLength}</div>
                          </div>
                        </div>

                        <div className="flex items-center text-sm">
                          <Award className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-xs text-gray-500">Rating</div>
                            <div className="font-semibold text-gray-900">
                              {vendor.rating} ({vendor.reviewCount})
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="text-xs font-semibold text-gray-500 mr-2">Engagement Models:</div>
                        {vendor.engagementModels.map(model => (
                          <span key={model} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {model}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="text-xs font-semibold text-gray-500 mr-2">Industry Focus:</div>
                        {vendor.industryFocus.map(industry => (
                          <span key={industry} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                            {industry}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                          View Profile
                        </button>
                        <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                          Request Quote
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Role/Team Listings */}
        {viewMode === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{role.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    role.availabilityStatus === 'Available'
                      ? 'bg-green-100 text-green-700'
                      : role.availabilityStatus === 'Limited'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {role.availabilityStatus}
                  </span>
                </div>

                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-3">
                  {role.vendorName}
                </button>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {role.location}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Award className="h-4 w-4 mr-2 text-gray-400" />
                    {role.experienceLevel}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-semibold text-gray-900">{role.monthlyCost}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Key Skills:</div>
                  <div className="flex flex-wrap gap-2">
                    {role.keySkills.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    View Vendor
                  </button>
                  <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                    Request Interview
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Comparison Modal */}
        {showComparison && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-gray-900">Vendor Comparison</h2>
                <button onClick={() => setShowComparison(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {comparing.slice(0, 3).map(vendorId => {
                    const vendor = vendors.find(v => v.id === vendorId);
                    if (!vendor) return null;
                    return (
                      <div key={vendor.id} className="border rounded-lg p-4">
                        <h3 className="font-bold text-lg mb-4">{vendor.name}</h3>
                        <div className="space-y-3 text-sm">
                          <div>
                            <div className="text-gray-500">Cost Range</div>
                            <div className="font-semibold">{vendor.monthlyCostRange}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Team Size</div>
                            <div className="font-semibold">{vendor.companySize}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Location</div>
                            <div className="font-semibold">{vendor.primaryLocations.join(', ')}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Industries</div>
                            <div className="font-semibold">{vendor.industryFocus.join(', ')}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Engagement Model</div>
                            <div className="font-semibold">{vendor.engagementModels.join(', ')}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
