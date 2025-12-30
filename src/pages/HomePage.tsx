import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import cities from 'cities.json';
import { 
  Search, MapPin, ArrowRight, Calculator, 
  CheckCircle, Users, Briefcase, Megaphone,
  Code, Palette, BarChart3, PenTool, Database,
  Headphones, Shield, Cloud, Zap, Brain, Package as PackageIcon
} from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Build search query parameters
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    if (location) {
      params.set('location', location);
    }

    // Navigate to search results page
    navigate(`/search?${params.toString()}`);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (value.length > 0) {
      const filtered = cities
        .filter(city => 
          city.name.toLowerCase().includes(value.toLowerCase()) ||
          city.country.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 10); // Limit to 10 results
      setFilteredCities(filtered);
      setShowLocationDropdown(true);
    } else {
      setShowLocationDropdown(false);
      setFilteredCities([]);
    }
  };

  const handleLocationSelect = (city: any) => {
    setLocation(`${city.name}, ${city.country}`);
    setShowLocationDropdown(false);
    setFilteredCities([]);
  };

  const categories = [
    'Web Development',
    'Mobile Apps',
    'UI/UX Design',
    'Digital Marketing',
    'Data Science',
    'DevOps',
    'Content Writing',
    'SEO Services'
  ];

  const skillsets = [
    'React & Node.js',
    'Python & AI/ML',
    'Figma & Adobe Creative',
    'Google Ads & Analytics',
    'AWS & Cloud Services',
    'WordPress & CMS',
    'Social Media Marketing',
    'Video Editing'
  ];

  const jobTitles = [
    'Full Stack Developer',
    'UI/UX Designer',
    'Digital Marketing Manager',
    'Data Analyst',
    'DevOps Engineer',
    'Content Strategist',
    'SEO Specialist',
    'Project Manager'
  ];

  const aiCategories = [
    'Presentations', 'Coding', 'Design', 'Writing', 
    'Data', 'Sales', 'Marketing', 'Learning', 'Admin'
  ];

  const packages = [
    'Software Development',
    'IT Support',
    'Digital Marketing',
    'Cybersecurity',
    'Cloud Migration',
    'Quality Testing'
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 pt-8 pb-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2" 
            alt="Professional team collaboration" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/85 via-blue-900/75 to-cyan-900/85"></div>
        </div>
        
        <div className="container mx-auto px-8">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent mb-10 max-w-[700px] mx-auto leading-tight"
            >
              A marketplace for all your outsourcing needs.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-cyan-100 mb-10 max-w-[700px] mx-auto"
            >
              Discover Projects, top companies, vetted freelancers, and global experts on a single platform
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-4xl mx-auto mb-8"
            >
              <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-[2]">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Find verified companies / freelancers / experts"
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3] text-lg"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="relative" onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}>
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        onFocus={() => {
                          if (location.length > 0) {
                            handleLocationChange(location);
                          }
                        }}
                        placeholder="Location"
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3] text-lg"
                        autoComplete="off"
                      />
                      {showLocationDropdown && filteredCities.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto mt-1">
                          {filteredCities.map((city, index) => (
                            <button
                              key={`${city.name}-${city.country}-${index}`}
                              type="button"
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center"
                              onClick={() => handleLocationSelect(city)}
                            >
                              <MapPin className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-gray-900">{city.name}</div>
                                <div className="text-sm text-gray-500">{city.country}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Search
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Trusted by Brands */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center text-white"
            >
              <p className="text-cyan-200 text-lg mb-8">
                Trusted by
              </p>
              <div className="overflow-hidden">
                <div className="flex animate-marquee space-x-16 whitespace-nowrap">
                  <div className="text-2xl font-bold text-cyan-300 hover:text-cyan-100 transition-colors">MRI</div>
                  <div className="text-2xl font-bold text-emerald-300 hover:text-emerald-100 transition-colors">Infosys</div>
                  <div className="text-2xl font-bold text-purple-300 hover:text-purple-100 transition-colors">HiBob</div>
                  <div className="text-2xl font-bold text-yellow-300 hover:text-yellow-100 transition-colors">Atlassian</div>
                  <div className="text-2xl font-bold text-red-300 hover:text-red-100 transition-colors">Slack</div>
                  <div className="text-2xl font-bold text-blue-300 hover:text-blue-100 transition-colors">Zoom</div>
                  <div className="text-2xl font-bold text-lime-300 hover:text-lime-100 transition-colors">Spotify</div>
                  <div className="text-2xl font-bold text-orange-300 hover:text-orange-100 transition-colors">Shopify</div>
                  <div className="text-2xl font-bold text-pink-300 hover:text-pink-100 transition-colors">Dropbox</div>
                  <div className="text-2xl font-bold text-indigo-300 hover:text-indigo-100 transition-colors">Figma</div>
                  <div className="text-2xl font-bold text-rose-300 hover:text-rose-100 transition-colors">Notion</div>
                  {/* Duplicate for seamless loop */}
                  <div className="text-2xl font-bold text-cyan-300 hover:text-cyan-100 transition-colors">MRI</div>
                  <div className="text-2xl font-bold text-emerald-300 hover:text-emerald-100 transition-colors">Infosys</div>
                  <div className="text-2xl font-bold text-purple-300 hover:text-purple-100 transition-colors">HiBob</div>
                  <div className="text-2xl font-bold text-yellow-300 hover:text-yellow-100 transition-colors">Atlassian</div>
                  <div className="text-2xl font-bold text-red-300 hover:text-red-100 transition-colors">Slack</div>
                  <div className="text-2xl font-bold text-blue-300 hover:text-blue-100 transition-colors">Zoom</div>
                  <div className="text-2xl font-bold text-lime-300 hover:text-lime-100 transition-colors">Spotify</div>
                  <div className="text-2xl font-bold text-orange-300 hover:text-orange-100 transition-colors">Shopify</div>
                  <div className="text-2xl font-bold text-pink-300 hover:text-pink-100 transition-colors">Dropbox</div>
                  <div className="text-2xl font-bold text-indigo-300 hover:text-indigo-100 transition-colors">Figma</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Matching Promo Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-8">
          <div className="max-w-4xl mx-auto text-center bg-white border border-gray-200 rounded-xl shadow-lg p-10">
            <h2 className="text-3xl font-bold text-[#0B2D59] mb-6">
              Describe Your Project — Let AI Find Perfect Matches
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Skip the guesswork. Just describe your project and our AI will instantly connect you with top independent professionals, agencies, or expert teams that fit your exact needs. Fast. Accurate. Effortless.
            </p>
            <Link
              to="/ai-services"
              className="inline-flex items-center px-8 py-4 bg-[#0070F3] text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg"
            >
              Start AI Search
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Categories & Skills */}

      {/* Everything You Need Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-primary-200 mb-6">
              <span className="text-primary-600 font-semibold text-sm">COMPREHENSIVE SOLUTIONS</span>
            </div>
            <h2 className="text-5xl font-bold text-[#0B2D59] mb-8 leading-tight">
              Everything You Need. One Platform.
            </h2>
            <p className="text-xl text-gray-700 mb-12 leading-relaxed font-medium max-w-4xl mx-auto">
              Access comprehensive outsourcing solutions through our integrated platform designed for modern businesses seeking excellence and efficiency.
            </p>
          </div>
          
          {/* Horizontal Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="group bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#0B2D59]">Service Categories</h3>
              </div>
              <ul className="space-y-4 mb-6">
                {categories.slice(0, 4).map((category, index) => (
                  <li key={index} className="flex items-center group-hover:translate-x-1 transition-transform duration-200" style={{ transitionDelay: `${index * 50}ms` }}>
                    <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 mr-4"></div>
                    <span className="text-[#0B2D59] font-semibold text-lg">{category}</span>
                  </li>
                ))}
              </ul>
              <button className="inline-flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all group">
                <span>View All Categories</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="group bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-emerald-200/50 hover:shadow-2xl hover:border-green-300/50 transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mr-4">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">Technical Skillsets</h3>
              </div>
              <ul className="space-y-4 mb-6">
                {skillsets.slice(0, 4).map((skill, index) => (
                  <li key={index} className="flex items-center group-hover:translate-x-1 transition-transform duration-200" style={{ transitionDelay: `${index * 50}ms` }}>
                    <div className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mr-4"></div>
                    <span className="text-slate-800 font-semibold text-lg">{skill}</span>
                  </li>
                ))}
              </ul>
              <button className="inline-flex items-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all group">
                <span>View All Skills</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="group bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-amber-200/50 hover:shadow-2xl hover:border-orange-300/50 transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-800 to-orange-700 bg-clip-text text-transparent">Professional Roles</h3>
              </div>
              <ul className="space-y-4 mb-6">
                {jobTitles.slice(0, 4).map((title, index) => (
                  <li key={index} className="flex items-center group-hover:translate-x-1 transition-transform duration-200" style={{ transitionDelay: `${index * 50}ms` }}>
                    <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 mr-4"></div>
                    <span className="text-slate-800 font-semibold text-lg">{title}</span>
                  </li>
                ))}
              </ul>
              <button className="inline-flex items-center bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent font-semibold hover:from-amber-700 hover:to-orange-700 transition-all group">
                <span>View All Roles</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How Collabov Works */}
      <section className="py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-indigo-800 bg-clip-text text-transparent mb-6">
              Comprehensive Outsourcing Solutions
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our platform provides end-to-end outsourcing capabilities designed to meet diverse business requirements
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Dedicated Teams */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 rounded-2xl p-8 shadow-xl border border-indigo-200/50 hover:shadow-2xl transition-all duration-300">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-900 to-blue-800 bg-clip-text text-transparent mb-4 text-center">Dedicated Team Solutions</h3>
                <div className="space-y-3 mb-6">
                  <p className="text-indigo-900 font-semibold">Cost reduction up to 60%</p>
                  <p className="text-slate-600">Timezone-aligned professional teams</p>
                  <p className="text-slate-600">Verified workforce from trusted vendors</p>
                  <p className="text-slate-600">Seamless integration with existing operations</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-indigo-200/50">
                  <p className="font-semibold text-indigo-900 mb-2">Process:</p>
                  <p className="text-sm text-slate-700">Search → Evaluate → Connect → Deploy</p>
                </div>
              </div>
            </div>

            {/* Project Posting */}
            <div className="relative">
              <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-100 rounded-2xl p-8 shadow-xl border border-purple-200/50 hover:shadow-2xl transition-all duration-300">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Megaphone className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-900 to-fuchsia-800 bg-clip-text text-transparent mb-4 text-center">Project Posting Platform</h3>
                <div className="space-y-3 mb-6">
                  <p className="text-purple-900 font-semibold">No-cost project posting</p>
                  <p className="text-slate-600">Competitive proposal evaluation</p>
                  <p className="text-slate-600">Expertise and pricing comparison</p>
                  <p className="text-slate-600">Comprehensive vendor selection</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-purple-200/50">
                  <p className="font-semibold text-purple-900 mb-2">Process:</p>
                  <p className="text-sm text-slate-700">Post → Review → Select → Monitor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Outsourcing Calculator Section */}
      <section className="py-16 bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-8 text-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image Section */}
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="AI-powered analytics dashboard" 
                className="rounded-2xl shadow-2xl w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/40 to-purple-600/20 rounded-2xl"></div>
              <div className="absolute top-6 left-6">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Calculator className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="text-center lg:text-left">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-6">AI-Powered Outsourcing Calculator</h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Leverage our advanced AI calculator to identify optimal outsourcing opportunities. 64% of our clients have successfully utilized this tool to streamline their operations.
              </p>
              <Link
                to="/ai-calculator"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Access Calculator
                <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Try AI Services Section */}
      <section className="py-16 bg-gradient-to-br from-violet-50 via-indigo-50 to-cyan-50">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content Section */}
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-indigo-800 bg-clip-text text-transparent mb-6">
                Comprehensive AI-Powered Solutions
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Access our curated collection of AI-powered tools designed to enhance productivity across presentations, development, design, content creation, marketing, and business operations.
              </p>
              
              <div className="grid grid-cols-3 gap-3 mb-8">
                {aiCategories.map((category, index) => (
                  <button
                    key={index}
                    className="px-4 py-3 bg-white/80 backdrop-blur-sm text-slate-800 rounded-xl hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 hover:text-white transition-all duration-300 font-medium border border-purple-200/50 shadow-sm hover:shadow-lg text-sm transform hover:-translate-y-0.5"
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              <Link
                to="/ai-services"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Explore AI Solutions
                <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </div>
            
            {/* Image Section */}
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="AI technology and automation" 
                className="rounded-2xl shadow-2xl w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-600/40 to-indigo-600/20 rounded-2xl"></div>
              <div className="absolute top-6 right-6">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Brain className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor & Freelancer Invitation */}
      <section className="py-16 bg-gradient-to-r from-indigo-900 via-purple-800 to-blue-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-blue-900/50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-8">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl font-bold mb-8">
              Join Our Global Professional Network
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <ul className="space-y-4 text-left">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                  <span>Access global clients actively seeking partners</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                  <span>Verified profiles, skill tests, and reviews</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                  <span>Manage teams, contractors & packages from your dashboard</span>
                </li>
              </ul>
              <ul className="space-y-4 text-left">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                  <span>Secure contracts & escrow payments</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                  <span>Boost brand visibility & generate leads</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/vendor/signup"
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl hover:bg-gray-100 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Join as Service Provider
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Packages & Bundles Section */}
      <section className="py-16 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image Section */}
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Business packages and solutions" 
                className="rounded-2xl shadow-2xl w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-600/40 to-amber-600/20 rounded-2xl"></div>
              <div className="absolute top-6 left-6">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <PackageIcon className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-orange-800 to-amber-800 bg-clip-text text-transparent mb-6">
                Explore Packages & Bundles
              </h2>
              <p className="text-xl text-slate-600 mb-4 leading-relaxed">
                Simplify outsourcing with curated fixed-price packages
              </p>
              <p className="text-lg text-slate-600 mb-8">
                Clear pricing, faster onboarding, tailored solutions from trusted vendors
              </p>
              
              <div className="grid grid-cols-1 gap-3 mb-8">
                {packages.map((pkg, index) => (
                  <div
                    key={index}
                    className="px-6 py-4 bg-white/90 backdrop-blur-sm text-slate-800 rounded-xl border border-orange-200/50 hover:border-amber-400 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-300 shadow-sm hover:shadow-lg font-medium transform hover:-translate-y-0.5"
                  >
                    {pkg}
                  </div>
                ))}
              </div>
              
              <Link
                to="/packages"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                View All Packages
                <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;