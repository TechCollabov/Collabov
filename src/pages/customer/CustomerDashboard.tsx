import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Plus, FileText, Bot, Bookmark, 
  FolderOpen, FileCheck, CreditCard, MessageSquare, 
  AlertTriangle, HelpCircle, Search, Filter, Calendar,
  Clock, DollarSign, Users, Star, TrendingUp, Bell,
  Settings, LogOut, ChevronDown, User, Globe, Eye,
  Edit, Trash2, Download, Upload, CheckCircle,
  AlertCircle, Target, Briefcase, Building2, Zap,
  BarChart3, PieChart, Activity, ArrowRight, Send
} from 'lucide-react';

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigationTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'post-job', label: 'Post a Job', icon: Plus },
    { id: 'create-tender', label: 'Create a Tender', icon: FileText },
    { id: 'ai-matchmaking', label: 'AI Matchmaking', icon: Bot },
    { id: 'saved-talent', label: 'Saved Talent', icon: Bookmark },
    { id: 'my-projects', label: 'My Projects', icon: FolderOpen },
    { id: 'contracts', label: 'Contracts', icon: FileCheck },
    { id: 'invoices', label: 'Invoices', icon: CreditCard },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'help', label: 'Help Center', icon: HelpCircle }
  ];

  // Mock data
  const quickStats = [
    { label: 'Active Projects', value: '8', icon: FolderOpen, color: 'blue' },
    { label: 'Total Spent', value: '$45,200', icon: DollarSign, color: 'green' },
    { label: 'Saved Vendors', value: '23', icon: Bookmark, color: 'purple' },
    { label: 'Pending Proposals', value: '12', icon: FileText, color: 'orange' }
  ];

  const activeProjects = [
    {
      id: 1,
      title: 'E-commerce Website Development',
      vendor: 'TechPro Solutions',
      budget: '$15,000',
      progress: 75,
      status: 'In Progress',
      deadline: '2024-04-15'
    },
    {
      id: 2,
      title: 'Mobile App UI/UX Design',
      vendor: 'Design Studio Inc',
      budget: '$8,500',
      progress: 45,
      status: 'In Progress',
      deadline: '2024-04-20'
    },
    {
      id: 3,
      title: 'Digital Marketing Campaign',
      vendor: 'Marketing Experts',
      budget: '$5,000',
      progress: 90,
      status: 'Review',
      deadline: '2024-03-30'
    }
  ];

  const pendingProposals = [
    {
      id: 1,
      jobTitle: 'React Developer for SaaS Platform',
      proposals: 8,
      budget: '$12,000',
      posted: '2 days ago'
    },
    {
      id: 2,
      jobTitle: 'Content Writer for Blog',
      proposals: 15,
      budget: '$2,500',
      posted: '5 days ago'
    }
  ];

  const recentMessages = [
    {
      id: 1,
      sender: 'Alex from TechPro',
      message: 'Project milestone completed, ready for review',
      time: '2 hours ago',
      unread: true
    },
    {
      id: 2,
      sender: 'Sarah from Design Studio',
      message: 'Updated mockups are ready for feedback',
      time: '4 hours ago',
      unread: true
    },
    {
      id: 3,
      sender: 'Mike from Marketing',
      message: 'Campaign performance report attached',
      time: '1 day ago',
      unread: false
    }
  ];

  const savedVendors = [
    {
      id: 1,
      name: 'TechPro Solutions',
      rating: 4.9,
      reviews: 127,
      speciality: 'Web Development',
      location: 'London, UK'
    },
    {
      id: 2,
      name: 'Design Innovators',
      rating: 4.8,
      reviews: 89,
      speciality: 'UI/UX Design',
      location: 'Berlin, Germany'
    }
  ];

  const aiSuggestions = [
    {
      type: 'vendor',
      title: 'Perfect match for your web app project',
      description: 'Based on your requirements, we found 3 vendors specializing in React development',
      action: 'View Matches'
    },
    {
      type: 'budget',
      title: 'Optimize your project budget',
      description: 'Similar projects typically cost 20% less. Consider adjusting your budget.',
      action: 'See Analysis'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-[#0070F3]" />
              <span className="text-xl font-bold text-[#0B2D59]">Collabov</span>
            </Link>

            {/* Center: Navigation Tabs */}
            <div className="hidden lg:flex items-center space-x-6">
              {navigationTabs.slice(0, 6).map((tab) => {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#0070F3] text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              
              {/* More dropdown */}
              <div className="relative">
                <button className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  <span>More</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right: Notifications & User Profile */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  className="p-2 text-gray-400 hover:text-gray-600 relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h3 className="font-medium text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">New proposal received</p>
                        <p className="text-xs text-gray-500">TechPro Solutions submitted a proposal for your React project</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">Project milestone completed</p>
                        <p className="text-xs text-gray-500">E-commerce website development is 75% complete</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0070F3] flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">John Smith</p>
                      <p className="text-xs text-gray-500">john@techcorp.com</p>
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
          <div className="lg:hidden border-t border-gray-200 py-2">
            <div className="flex space-x-1 overflow-x-auto">
              {navigationTabs.slice(0, 4).map((tab) => {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#0070F3] text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
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
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, John!</h1>
          <p className="text-gray-600 mt-1">Manage your outsourcing projects and find the perfect talent for your business.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                    <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Start Actions */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0070F3] hover:bg-blue-50 transition-all group"
                  onClick={() => navigate('/customer/post-job')}
                  type="button"
                >
                  <div className="p-2 bg-[#0070F3] rounded-lg group-hover:scale-110 transition-transform">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">Post a Job</h3>
                    <p className="text-sm text-gray-600">Find freelancers for your project</p>
                  </div>
                </button>

                <button className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group">
                  <div className="p-2 bg-green-600 rounded-lg group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">Create a Tender</h3>
                    <p className="text-sm text-gray-600">Large project bidding</p>
                  </div>
                </button>

                <button className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group">
                  <div className="p-2 bg-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">Use AI to Find Talent</h3>
                    <p className="text-sm text-gray-600">Smart vendor matching</p>
                  </div>
                </button>

                <button className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group">
                  <div className="p-2 bg-orange-600 rounded-lg group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">Upload Project Brief</h3>
                    <p className="text-sm text-gray-600">Detailed project requirements</p>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Active Projects */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Active Projects</h2>
                <Link to="#" className="text-[#0070F3] hover:text-blue-600 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {activeProjects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#0070F3] transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-600">by {project.vendor}</p>
                        <p className="text-sm text-gray-500">Budget: {project.budget}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'In Progress' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Due: {project.deadline}</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className="bg-[#0070F3] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{project.progress}% Complete</span>
                      <div className="flex space-x-2">
                        <button className="text-sm text-[#0070F3] hover:text-blue-600">View Details</button>
                        <button className="text-sm text-gray-600 hover:text-gray-700">Message Vendor</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Pending Proposals */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Pending Proposals</h2>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                  {pendingProposals.length} Jobs
                </span>
              </div>
              <div className="space-y-4">
                {pendingProposals.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#0070F3] transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{job.jobTitle}</h3>
                        <p className="text-sm text-gray-600">{job.proposals} proposals received</p>
                        <p className="text-sm text-gray-500">Budget: {job.budget} • Posted {job.posted}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-sm bg-[#0070F3] text-white px-3 py-1 rounded-lg hover:bg-blue-600">
                          Review Proposals
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* AI Smart Suggestions */}
            <motion.div 
              className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
              </div>
              <div className="space-y-4">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-purple-100">
                    <h4 className="font-medium text-gray-900 mb-2">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                    <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                      {suggestion.action} →
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Messages */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
                <Link to="#" className="text-[#0070F3] hover:text-blue-600 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {recentMessages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{message.sender}</p>
                          <p className="text-sm text-gray-600 truncate">{message.message}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-xs text-gray-500">{message.time}</p>
                          {message.unread && (
                            <div className="w-2 h-2 bg-[#0070F3] rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Saved Vendors */}
            <motion.div 
              className="bg-white rounded-lg shadow-sm border p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Saved Vendors</h3>
                <Link to="#" className="text-[#0070F3] hover:text-blue-600 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {savedVendors.map((vendor) => (
                  <div key={vendor.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#0070F3] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{vendor.name}</h4>
                        <p className="text-sm text-gray-600">{vendor.speciality}</p>
                        <p className="text-xs text-gray-500">{vendor.location}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600">{vendor.rating} ({vendor.reviews})</span>
                        </div>
                      </div>
                      <button className="text-sm text-[#0070F3] hover:text-blue-600">
                        Contact
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-4">
                <h4 className="font-semibold mb-2">🚀 Need Help Getting Started?</h4>
                <p className="text-sm mb-3">Schedule a free consultation with our experts</p>
                <button className="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                  Book Consultation
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📊 Project Analytics</h4>
                <p className="text-sm text-blue-700 mb-3">View detailed insights on your projects</p>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  View Analytics →
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">💡 Outsourcing Tips</h4>
                <p className="text-sm text-yellow-700 mb-3">Learn best practices for successful projects</p>
                <button className="text-yellow-600 text-sm font-medium hover:text-yellow-700">
                  Read Guide →
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;