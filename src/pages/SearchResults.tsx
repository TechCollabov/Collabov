import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Star, MapPin, Clock, DollarSign,
  Briefcase, CheckCircle, Users, Calendar, Globe,
  Mail, Phone, ChevronDown, Building2
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  logo: string | null;
  description: string;
  location: string;
  hourlyRate: string;
  monthlyRate: string;
  services: string[];
  employeeCount: string;
  projectsCompleted: number;
  yearsInBusiness: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  responseTime: string;
  industries: string[];
  website: string;
  contactEmail: string;
  contactPhone: string;
}

const SearchResults: React.FC = () => {
  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get('q') || '';
  const [filters, setFilters] = useState({
    services: '',
    location: '',
    hourlyRate: '',
    employeeCount: '',
    rating: '',
    industries: ''
  });

  // Mock data - in production this would come from your backend/Supabase
  const [companies] = useState<Company[]>([
    {
      id: '1',
      name: 'TechPro Solutions',
      logo: null,
      description: 'Specialized in full-stack development with focus on e-commerce solutions and enterprise applications.',
      location: 'London, UK',
      hourlyRate: '$40-60',
      monthlyRate: '$8,000-12,000',
      services: ['React Development', 'Node.js', 'AWS', 'Mobile Apps'],
      employeeCount: '50-100',
      projectsCompleted: 156,
      yearsInBusiness: 8,
      rating: 4.8,
      reviewCount: 127,
      isVerified: true,
      responseTime: '< 24 hours',
      industries: ['E-commerce', 'FinTech', 'Healthcare'],
      website: 'https://techpro.com',
      contactEmail: 'contact@techpro.com',
      contactPhone: '+44 20 1234 5678'
    },
    {
      id: '2',
      name: 'Digital Innovators',
      logo: null,
      description: 'Award-winning digital agency specializing in mobile app development and UI/UX design.',
      location: 'Manchester, UK',
      hourlyRate: '$50-80',
      monthlyRate: '$10,000-15,000',
      services: ['Mobile Development', 'UI/UX Design', 'React Native'],
      employeeCount: '20-50',
      projectsCompleted: 89,
      yearsInBusiness: 5,
      rating: 4.9,
      reviewCount: 73,
      isVerified: true,
      responseTime: '< 48 hours',
      industries: ['Retail', 'Education', 'Social Media'],
      website: 'https://digitalinnovators.com',
      contactEmail: 'hello@digitalinnovators.com',
      contactPhone: '+44 20 9876 5432'
    }
  ]);

  const [filteredCompanies, setFilteredCompanies] = useState(companies);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  useEffect(() => {
    // Filter companies based on search query and filters
    let results = companies;
    if (searchQuery) {
      results = results.filter(company => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.services.some(service => 
          service.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    setFilteredCompanies(results);
  }, [searchQuery, companies, filters]);

  const toggleCompanyDetails = (companyId: string) => {
    setExpandedCompany(expandedCompany === companyId ? null : companyId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container">
        {/* Search Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold mb-2">
                Search Results for "{searchQuery}"
              </h1>
              <p className="text-gray-600">
                Found {filteredCompanies.length} companies matching your criteria
              </p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Refine your search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Filter className="h-5 w-5 text-gray-500" />
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Services
                  </label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={filters.services}
                    onChange={(e) => setFilters({...filters, services: e.target.value})}
                  >
                    <option value="">All Services</option>
                    <option value="mobile">Mobile Development</option>
                    <option value="web">Web Development</option>
                    <option value="design">UI/UX Design</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  >
                    <option value="">All Locations</option>
                    <option value="london">London</option>
                    <option value="manchester">Manchester</option>
                    <option value="birmingham">Birmingham</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rate
                  </label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={filters.hourlyRate}
                    onChange={(e) => setFilters({...filters, hourlyRate: e.target.value})}
                  >
                    <option value="">Any Rate</option>
                    <option value="0-5000">$0-5,000</option>
                    <option value="5000-10000">$5,000-10,000</option>
                    <option value="10000+">$10,000+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={filters.employeeCount}
                    onChange={(e) => setFilters({...filters, employeeCount: e.target.value})}
                  >
                    <option value="">Any Size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51+">51+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={filters.rating}
                    onChange={(e) => setFilters({...filters, rating: e.target.value})}
                  >
                    <option value="">Any Rating</option>
                    <option value="4.5">4.5+ stars</option>
                    <option value="4.0">4.0+ stars</option>
                    <option value="3.5">3.5+ stars</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry Focus
                  </label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={filters.industries}
                    onChange={(e) => setFilters({...filters, industries: e.target.value})}
                  >
                    <option value="">All Industries</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="fintech">FinTech</option>
                    <option value="healthcare">Healthcare</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {filteredCompanies.map((company, index) => (
                <motion.div 
                  key={company.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="w-24 h-24 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        {company.logo ? (
                          <img 
                            src={company.logo} 
                            alt={`${company.name} logo`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Building2 className="h-12 w-12 text-primary-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold flex items-center">
                            {company.name}
                            {company.isVerified && (
                              <CheckCircle className="h-5 w-5 text-primary-600 ml-2" />
                            )}
                          </h3>
                          <div className="flex items-center">
                            <Star className="h-5 w-5 text-yellow-400 fill-current" />
                            <span className="ml-1 font-semibold">{company.rating}</span>
                            <span className="text-gray-500 ml-1">({company.reviewCount} reviews)</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{company.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {company.location}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                            {company.monthlyRate}/month
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            {company.employeeCount} employees
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            Response: {company.responseTime}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {company.services.map((service) => (
                            <span 
                              key={service}
                              className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                            >
                              {service}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                              {company.projectsCompleted} projects
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              {company.yearsInBusiness} years in business
                            </div>
                          </div>
                          <button
                            onClick={() => toggleCompanyDetails(company.id)}
                            className="flex items-center text-primary-600 hover:text-primary-700"
                          >
                            {expandedCompany === company.id ? 'Show Less' : 'View Details'}
                            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${
                              expandedCompany === company.id ? 'transform rotate-180' : ''
                            }`} />
                          </button>
                        </div>

                        {/* Expanded Details */}
                        {expandedCompany === company.id && (
                          <motion.div 
                            className="mt-6 pt-6 border-t"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-semibold mb-2">Industry Focus</h4>
                                <div className="flex flex-wrap gap-2">
                                  {company.industries.map((industry) => (
                                    <span 
                                      key={industry}
                                      className="px-3 py-1 bg-secondary-50 text-secondary-700 rounded-full text-sm"
                                    >
                                      {industry}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold mb-2">Contact Information</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center text-sm">
                                    <Globe className="h-4 w-4 mr-2 text-gray-400" />
                                    <a 
                                      href={company.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary-600 hover:text-primary-700"
                                    >
                                      {company.website}
                                    </a>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                    <a 
                                      href={`mailto:${company.contactEmail}`}
                                      className="text-primary-600 hover:text-primary-700"
                                    >
                                      {company.contactEmail}
                                    </a>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>{company.contactPhone}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end mt-6">
                              <Link 
                                to={`/contact?company=${company.id}`}
                                className="btn-primary"
                              >
                                Request Quote
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;