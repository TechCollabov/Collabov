import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart2, DollarSign, Users, MessageSquare,
  Clock, Star, TrendingUp, Calendar, FileCheck,
  AlertCircle, CheckCircle2, User, Circle, ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

/* No hardcoded chart data — will be loaded from the database */
const data: { name: string; views: number; earnings: number }[] = [];

interface ResourceDetails {
  name: string;
  project: string;
  hours: number;
  progress: number;
}

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [showResourceModal, setShowResourceModal] = useState(false);

  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set(['company_info', 'services']));
  const [submittedForVerification, setSubmittedForVerification] = useState(false);

  const checklistItems = [
    { id: 'company_info', label: 'Add company information', route: '/vendor/dashboard/listings' },
    { id: 'services', label: 'Add services and tech stack', route: '/vendor/dashboard/listings' },
    { id: 'case_study', label: 'Add at least one case study', route: '/vendor/dashboard/listings' },
    { id: 'referral', label: 'Submit at least one referral', route: '/vendor/dashboard/listings' },
    { id: 'documents', label: 'Upload verification documents', route: '/vendor/dashboard/listings' },
  ];

  const allComplete = checklistItems.every(item => completedItems.has(item.id));
  const completionPercent = Math.round((completedItems.size / checklistItems.length) * 100);

  /* No hardcoded resources — data will be loaded from the database */
  const resources: ResourceDetails[] = [];

  return (
    <div className="p-6">
      {/* Profile Completion Widget */}
      {completionPercent < 100 && !submittedForVerification && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0B2D59] rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-gray-900">PROFILE COMPLETION</p>
                <p className="text-xs text-gray-500 mt-0.5">{completionPercent}% complete — Complete your profile to go live</p>
              </div>
            </div>
            <span className="text-2xl font-black text-[#0070F3]">{completionPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
            <div
              className="bg-[#0070F3] h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2 mb-5">
            {checklistItems.map(item => {
              const done = completedItems.has(item.id);
              return (
                <Link key={item.id} to={item.route} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                  {done
                    ? <CheckCircle2 className="h-5 w-5 text-[#0E7C6A] flex-shrink-0" />
                    : <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                  }
                  <span className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-[#0070F3]'}`}>
                    {item.label}
                  </span>
                  {!done && <ArrowRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-[#0070F3]" />}
                </Link>
              );
            })}
          </div>

          {/* Submit for Verification button — only when all complete */}
          {allComplete && (
            <button
              onClick={() => setSubmittedForVerification(true)}
              className="w-full bg-[#0070F3] text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition-colors"
            >
              Submit for Verification →
            </button>
          )}
        </div>
      )}

      {/* Submitted for verification banner */}
      {submittedForVerification && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">Profile submitted for verification — we'll review within 2 business days.</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { title: 'Active Engagements', value: '—', icon: FileCheck, trend: '' },
          { title: 'Bench Capacity', value: '—', icon: Users, trend: '', onClick: () => setShowResourceModal(true) },
          { title: 'Profile Views (30d)', value: '—', icon: BarChart2, trend: '' },
          { title: 'Enquiries This Month', value: '—', icon: MessageSquare, trend: '' },
          { title: 'Gross Revenue MTD', value: '—', icon: DollarSign, trend: '' },
          { title: 'Pending Payouts', value: '—', icon: DollarSign, trend: '' },
          { title: 'Average Rating', value: '—', icon: Star, trend: '' },
          { title: 'Open Proposals', value: '—', icon: TrendingUp, trend: '' }
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