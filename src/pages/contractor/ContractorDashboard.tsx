import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import AIProposalGenerator from '../../components/contractor/AIProposalGenerator';
import { 
  Search, Filter, Star, DollarSign, MessageSquare, 
  Briefcase, User, Settings, LogOut, Bell, 
  CheckCircle, AlertCircle, Upload, Edit, Eye,
  TrendingUp, Award, Globe, Clock, ChevronDown,
  Plus, Download, CreditCard, Target, Zap,
  BookOpen, HelpCircle, Camera, MapPin
} from 'lucide-react';

const ContractorDashboard: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAvailable, setIsAvailable] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(65);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAIProposal, setShowAIProposal] = useState(false);

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check for success message from URL params
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      const jobTitle = params.get('job');
      setShowSuccessMessage(true);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [location]);
  // Profile completion checklist
  const profileChecklist = [
    { task: 'Upload profile photo', completed: true },
    { task: 'Add job title & bio', completed: true },
    { task: 'Add work history', completed: false },
    { task: 'Add portfolio', completed: true },
    { task: 'Add hourly rate / fixed price', completed: true },
    { task: 'Take skill test', completed: false },
    { task: 'Verify email and phone', completed: false }
  ];

  const completedTasks = profileChecklist.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedTasks / profileChecklist.length) * 100);

  // Mock data
  const proposals = [
    {
      id: 1,
      title: 'React Developer for E-commerce Platform',
      client: 'TechCorp Inc.',
      budget: '$3,000 - $5,000',
      status: 'Interviewing',
      submittedDate: '2024-03-10'
    },
    {
      id: 2,
      title: 'UI/UX Design for Mobile App',
      client: 'StartupXYZ',
      budget: '$2,500',
      status: 'Submitted',
      submittedDate: '2024-03-08'
    }
  ];

  const messages = [
    {
      id: 1,
      client: 'John Smith',
      project: 'Website Redesign',
      lastMessage: 'When can we schedule a call?',
      time: '2 hours ago',
      unread: true
    },
    {
      id: 2,
      client: 'Sarah Johnson',
      project: 'Mobile App Development',
      lastMessage: 'Great work on the mockups!',
      time: '1 day ago',
      unread: false
    }
  ];

  const portfolioItems = [
    {
      id: 1,
      title: 'E-commerce Website',
      category: 'Web Development',
      image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2'
    },
    {
      id: 2,
      title: 'Mobile App UI',
      category: 'UI/UX Design',
      image: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2'
    }
  ];

  const skillTests = [
    { skill: 'React', level: 'Advanced', completed: true },
    { skill: 'JavaScript', level: 'Expert', completed: true },
    { skill: 'Node.js', level: 'Intermediate', completed: false },
    { skill: 'TypeScript', level: 'Advanced', completed: false }
  ];

  const navigationTabs = [
    { id: 'find-projects', label: 'Find Projects', icon: Search },
    { id: 'proposals', label: 'My Proposals', icon: Briefcase },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'dashboard', label: 'My Dashboard', icon: TrendingUp },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'help', label: 'Help', icon: HelpCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo */}
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-[#0070F3]" />
              <span className="text-xl font-bold text-[#0B2D59]">Collabov</span>
            </div>

            {/* Center: Navigation Tabs */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: User Profile */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">John Doe</p>
                      <p className="text-xs text-gray-500">john.doe@gmail.com</p>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <HelpCircle className="h-4 w-4" />
                      <span>Support</span>
                    </button>
                    <hr className="my-2" />
                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2">
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="flex space-x-1 overflow-x-auto">
              {navigationTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {showSuccessMessage && (
          <motion.div 
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">🎉 Proposal Successfully Submitted!</h4>
                <p className="text-sm text-green-700">
                  Your proposal has been sent to the client. We'll notify you if they respond.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-green-600 hover:text-green-700"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}

        {/* Profile Completion Banner */}
        <motion.div 
          className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Complete your profile to get noticed by clients</h3>
            <span className="text-sm font-medium text-green-600">{completionPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {profileChecklist.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                {item.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span className={`text-sm ${item.completed ? 'text-gray-700' : 'text-gray-500'}`}>
                  {item.task}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Summary Card */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="h-8 w-8 text-green-600" />
                    </div>
                    <button className="absolute bottom-0 right-0 bg-green-600 rounded-full p-1 hover:bg-green-700">
                      <Camera className="h-3 w-3 text-white" />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">John Doe</h2>
                    <p className="text-gray-600">Full Stack Developer</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">New York, USA</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">4.9 (23 reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <button className="btn-primary text-sm">Edit Profile</button>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Available</span>
                    <button
                      onClick={() => setIsAvailable(!isAvailable)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        isAvailable ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          isAvailable ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mt-4">
                Experienced full-stack developer specializing in React, Node.js, and modern web technologies. 
                Passionate about creating scalable solutions for businesses worldwide.
              </p>
            </motion.div>

            {/* Find Projects */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Find Projects</h3>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for jobs, tasks, or projects"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Category</option>
                    <option>IT</option>
                    <option>Writing</option>
                    <option>Design</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Budget</option>
                    <option>Hourly</option>
                    <option>Fixed</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Project Type</option>
                    <option>Short-Term</option>
                    <option>Long-Term</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Time Zone</option>
                    <option>UTC-8</option>
                    <option>UTC+0</option>
                  </select>
                </div>
                <button className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all flex items-center justify-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Use AI Match</span>
                </button>
              </div>
            </motion.div>

            {/* My Proposals */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Proposals</h3>
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{proposal.title}</h4>
                        <p className="text-sm text-gray-600">{proposal.client}</p>
                        <p className="text-sm text-gray-500">Budget: {proposal.budget}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          proposal.status === 'Interviewing' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {proposal.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{proposal.submittedDate}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button className="text-sm text-green-600 hover:text-green-700">Edit</button>
                      <button className="text-sm text-red-600 hover:text-red-700">Withdraw</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Messages Preview */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                <button className="text-sm text-green-600 hover:text-green-700">View All</button>
              </div>
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{message.client}</p>
                          <p className="text-sm text-gray-600">{message.project}</p>
                          <p className="text-sm text-gray-500">{message.lastMessage}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{message.time}</p>
                          {message.unread && (
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-1 ml-auto"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Earnings Dashboard */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">$12,450</p>
                  <p className="text-sm text-gray-600">Total Earned</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">$2,100</p>
                    <p className="text-xs text-gray-600">Available</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">$1,200</p>
                    <p className="text-xs text-gray-600">In Escrow</p>
                  </div>
                </div>
                <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Withdraw</span>
                </button>
                <div className="text-center">
                  <button className="text-sm text-green-600 hover:text-green-700">View Transaction History</button>
                </div>
              </div>
            </motion.div>

            {/* Portfolio */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Portfolio</h3>
                <button className="text-sm text-green-600 hover:text-green-700 flex items-center space-x-1">
                  <Plus className="h-4 w-4" />
                  <span>Add Project</span>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {portfolioItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-green-300 transition-colors">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-600">{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Skill Tests */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Tests & Certifications</h3>
              <div className="space-y-3">
                {skillTests.map((test, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {test.completed ? (
                        <Award className="h-5 w-5 text-green-500" />
                      ) : (
                        <Target className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-sm font-medium">{test.skill}</span>
                      {test.completed && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {test.level}
                        </span>
                      )}
                    </div>
                    {!test.completed && (
                      <button className="text-xs text-green-600 hover:text-green-700">Take Test</button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Performance Tracker */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Profile Views</span>
                  <span className="font-semibold">156 this week</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <span className="font-semibold text-green-600">92%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Client Satisfaction</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">4.9</span>
                  </div>
                </div>
                <button className="w-full text-sm text-green-600 hover:text-green-700 border border-green-200 py-2 rounded-lg hover:bg-green-50 transition-colors">
                  Improve My Profile
                </button>
              </div>
            </motion.div>

            {/* Call to Action Widgets */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-4">
                <h4 className="font-semibold mb-2">🚀 Get Featured</h4>
                <p className="text-sm mb-3">Apply to become a Top Freelancer</p>
                <button className="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                  Apply Now
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📈 Tips to Get More Projects</h4>
                <p className="text-sm text-blue-700 mb-3">View curated articles</p>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  Read Articles →
                </button>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">🤖 Smart Proposal Assistant</h4>
                <p className="text-sm text-purple-700 mb-3">Smart writing assistant for proposals</p>
                <button 
                  className="text-purple-600 text-sm font-medium hover:text-purple-700"
                  onClick={() => setShowAIProposal(true)}
                >
                  Try Smart Assistant →
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Smart Proposal Generator Modal */}
      <AIProposalGenerator 
        isOpen={showAIProposal}
        onClose={() => setShowAIProposal(false)}
      />
    </div>
  );
};


export default ContractorDashboard