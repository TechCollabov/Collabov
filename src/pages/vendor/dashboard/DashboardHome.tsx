import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart2, DollarSign, Users, MessageSquare,
  Clock, Star, TrendingUp, Calendar, FileCheck,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const data = [
  { name: 'Jan', views: 400, earnings: 2400 },
  { name: 'Feb', views: 300, earnings: 1398 },
  { name: 'Mar', views: 200, earnings: 9800 },
  { name: 'Apr', views: 278, earnings: 3908 },
  { name: 'May', views: 189, earnings: 4800 },
  { name: 'Jun', views: 239, earnings: 3800 },
];

interface ResourceDetails {
  name: string;
  project: string;
  hours: number;
  progress: number;
}

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [showResourceModal, setShowResourceModal] = useState(false);

  // Mock profile completion data
  const profileSections = [
    { name: 'Company Information', completed: true, step: 1 },
    { name: 'Contact Information', completed: false, step: 2 },
    { name: 'Business Overview', completed: false, step: 3 },
    { name: 'Service Details', completed: true, step: 4 },
    { name: 'Client Information', completed: false, step: 5 },
    { name: 'Documents', completed: false, step: 6 },
    { name: 'Payment Details', completed: false, step: 7 }
  ];

  const completedSections = profileSections.filter(section => section.completed).length;
  const profileCompletion = Math.round((completedSections / profileSections.length) * 100);

  const handleCompleteProfile = () => {
    // Find the first incomplete section
    const incompleteSection = profileSections.find(section => !section.completed);
    if (incompleteSection) {
      navigate(`/vendor/dashboard/listings?step=${incompleteSection.step}`);
    }
  };

  const resources: ResourceDetails[] = [
    { name: "John Doe", project: "Web App Development", hours: 120, progress: 75 },
    { name: "Jane Smith", project: "Mobile App", hours: 80, progress: 45 },
    { name: "Mike Johnson", project: "UI/UX Design", hours: 60, progress: 90 }
  ];

  return (
    <div className="p-6">
      {/* Profile Completion */}
      <motion.div 
        className="bg-white rounded-lg shadow p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Profile Completion</h2>
          <button 
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            onClick={handleCompleteProfile}
          >
            Complete Profile
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-primary-600 h-2.5 rounded-full" 
            style={{ width: `${profileCompletion}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {profileCompletion}% complete
        </p>
        
        {/* Section Status */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {profileSections.map((section, index) => (
            <div 
              key={index}
              className="flex items-center space-x-2"
            >
              {section.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className={section.completed ? 'text-gray-700' : 'text-gray-500'}>
                {section.name}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { title: 'Total Views', value: '1,234', icon: BarChart2, trend: '+12%' },
          { title: 'Pending Payments', value: '$5,400', icon: DollarSign, trend: 'Due in 7 days' },
          { title: 'Customer Inquiries', value: '28', icon: MessageSquare, trend: '+24%' },
          { title: 'Assigned Resources', value: '12', icon: Users, trend: '3 Projects', onClick: () => setShowResourceModal(true) },
          { title: 'Confirmed Contracts', value: '8', icon: FileCheck, trend: '2 Pending' },
          { title: 'Average Rating', value: '4.8', icon: Star, trend: '96 Reviews' },
          { title: 'Work Progress', value: '75%', icon: TrendingUp, trend: 'On Track' },
          { title: 'Upcoming Meetings', value: '3', icon: Calendar, trend: 'This Week' }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow ${metric.onClick ? 'cursor-pointer' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            onClick={metric.onClick}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <metric.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {metric.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {metric.value}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        {metric.trend}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Resource Details Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Resource Allocation</h3>
              <button 
                onClick={() => setShowResourceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {resources.map((resource, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{resource.name}</h4>
                    <span className="text-sm text-gray-500">{resource.hours} hours</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{resource.project}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${resource.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Progress</span>
                    <span className="text-xs font-medium">{resource.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Work Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div 
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h3 className="text-lg font-medium mb-4">Project Progress</h3>
          <div className="space-y-4">
            {[
              { name: 'Web App Development', progress: 75, status: 'On Track' },
              { name: 'Mobile App Design', progress: 45, status: 'Delayed' },
              { name: 'API Integration', progress: 90, status: 'Ahead' }
            ].map((project, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{project.name}</span>
                  <span className={`text-sm ${
                    project.status === 'On Track' ? 'text-green-600' :
                    project.status === 'Delayed' ? 'text-red-600' : 'text-blue-600'
                  }`}>{project.status}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      project.status === 'On Track' ? 'bg-green-600' :
                      project.status === 'Delayed' ? 'bg-red-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Ratings & Reviews</h3>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="flex items-center mb-6">
            <div className="text-4xl font-bold mr-4">4.8</div>
            <div>
              <div className="flex text-yellow-400 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-gray-600">Based on 96 reviews</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { client: 'Tech Corp', rating: 5, comment: 'Excellent work and communication' },
              { client: 'Digital Solutions', rating: 4, comment: 'Good quality deliverables' }
            ].map((review, index) => (
              <div key={index} className="border-t pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{review.client}</p>
                    <div className="flex text-yellow-400 my-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <button className="text-primary-600 text-sm">Respond</button>
                </div>
                <p className="text-sm text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Analytics Chart */}
      <motion.div 
        className="bg-white rounded-lg shadow p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Analytics</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="views" 
                stackId="1"
                stroke="#4b88ee" 
                fill="#c3e1fc" 
              />
              <Area 
                type="monotone" 
                dataKey="earnings" 
                stackId="1"
                stroke="#3669e3" 
                fill="#4b88ee" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHome;