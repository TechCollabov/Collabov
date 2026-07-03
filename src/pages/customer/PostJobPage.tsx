import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Plus, X, DollarSign,
  Calendar, MapPin, Briefcase, FileText, Users,
  Clock, Target, Zap, Globe, User, ChevronDown,
  Upload, Eye, Edit, Save, Send, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { notify, logEvent } from '../../lib/workflows';

export interface JobData {
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: {
    type: 'fixed' | 'hourly';
    amount: string;
    currency: string;
  };
  timeline: string;
  experienceLevel: string;
  projectType: string;
  location: string;
  attachments: File[];
  visibility: 'public' | 'private';
  invitedVendors: string[];
}

const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isPrivate = searchParams.get('private') === 'true';
  const preSelectedVendors = searchParams.get('vendors')?.split(',').filter(Boolean) || [];
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [newSkill, setNewSkill] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isTender, setIsTender] = useState(searchParams.get('type') === 'tender');
  const [tenderData, setTenderData] = useState({
    tenderTitle: '',
    deadline: '',
    criteria: '',
    ndaRequired: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [profileGate, setProfileGate] = useState(false);

  const [jobData, setJobData] = useState<JobData>({
    title: '',
    description: '',
    category: '',
    skills: [],
    budget: {
      type: 'fixed',
      amount: '',
      currency: 'USD'
    },
    timeline: '',
    experienceLevel: '',
    projectType: '',
    location: '',
    attachments: [],
    visibility: isPrivate ? 'private' : 'public',
    invitedVendors: preSelectedVendors,
  });

  const categories = [
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Digital Marketing',
    'Content Writing',
    'Data Science',
    'DevOps',
    'Quality Assurance'
  ];

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level', description: '0-2 years experience' },
    { value: 'intermediate', label: 'Intermediate', description: '2-5 years experience' },
    { value: 'expert', label: 'Expert', description: '5+ years experience' }
  ];

  const projectTypes = [
    { value: 'one-time', label: 'One-time Project', description: 'Single project with defined scope' },
    { value: 'ongoing', label: 'Ongoing Work', description: 'Long-term collaboration' },
    { value: 'contract', label: 'Contract to Hire', description: 'Potential for full-time position' }
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setJobData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof JobData] as any,
          [child]: value
        }
      }));
    } else {
      setJobData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !jobData.skills.includes(newSkill.trim())) {
      setJobData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setJobData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) { navigate('/signin'); return; }
    if (isTender && !tenderData.deadline) {
      setSubmitError('A tender needs a submission deadline.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      // Hard gate: no spend before the business is identifiable.
      const { data: customer } = await supabase
        .from('customers')
        .select('company_name, country')
        .eq('id', user.id)
        .single();
      if (!customer?.company_name?.trim() || !customer?.country?.trim()) {
        setProfileGate(true);
        setSubmitting(false);
        return;
      }

      const { data: job, error } = await supabase.from('jobs').insert({
        customer_id: user.id,
        title: jobData.title,
        description: jobData.description,
        category: jobData.category || null,
        budget_type: jobData.budget.type,
        budget_amount: Number(jobData.budget.amount) || 0,
        currency: jobData.budget.currency,
        timeline: jobData.timeline || null,
        experience_level: (jobData.experienceLevel || 'intermediate') as 'entry' | 'intermediate' | 'expert',
        project_type: (jobData.projectType === 'contract' ? 'contract-to-hire' : jobData.projectType || 'one-time') as
          | 'one-time' | 'ongoing' | 'contract-to-hire',
        location: jobData.location || null,
        status: 'open',
        visibility: jobData.visibility,
        invited_vendor_ids: jobData.invitedVendors.length ? jobData.invitedVendors : null,
        job_kind: isTender ? 'tender' : 'job',
        tender_title: isTender ? (tenderData.tenderTitle.trim() || jobData.title) : null,
        nda_required: isTender ? tenderData.ndaRequired : false,
        submission_deadline: isTender && tenderData.deadline ? new Date(tenderData.deadline).toISOString() : null,
        evaluation_criteria: isTender && tenderData.criteria.trim()
          ? tenderData.criteria.split('\n').map(s => s.trim()).filter(Boolean)
          : null,
        tech_stack: jobData.skills.length ? jobData.skills : null,
        admin_status: 'pending_review',
      }).select().single();
      if (error) throw error;

      // Private job: notify the invited vendors directly.
      for (const vendorId of jobData.invitedVendors) {
        await notify(vendorId, 'enquiry', 'You were invited to a private job',
          `"${jobData.title}" — you were pre-selected by the buyer.`, '/vendor/dashboard/jobs');
      }
      await logEvent(isTender ? 'tender_posted' : 'job_posted', user.id, 'buyer', 'job', job.id, {
        visibility: jobData.visibility,
      });
      navigate('/customer/dashboard?success=job-posted');
    } catch (e) {
      console.error('Job post failed:', e);
      setSubmitError('Could not post the job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Details</h2>
              <p className="text-gray-600">Tell us about your project</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={jobData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                placeholder="e.g., Build a React E-commerce Website"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                value={jobData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                placeholder="Describe your project requirements, goals, and any specific details..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Be specific about what you need. Include features, functionality, and any technical requirements.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={jobData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills *
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                  placeholder="Add a required skill"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-[#0070F3] text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Budget & Timeline</h2>
              <p className="text-gray-600">Set your project budget and timeline</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Budget Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('budget.type', 'fixed')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    jobData.budget.type === 'fixed'
                      ? 'border-[#0070F3] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Target className={`h-6 w-6 mx-auto mb-2 ${
                    jobData.budget.type === 'fixed' ? 'text-[#0070F3]' : 'text-gray-400'
                  }`} />
                  <div className="font-medium">Fixed Price</div>
                  <div className="text-sm text-gray-600">One-time payment for the entire project</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleInputChange('budget.type', 'hourly')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    jobData.budget.type === 'hourly'
                      ? 'border-[#0070F3] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Clock className={`h-6 w-6 mx-auto mb-2 ${
                    jobData.budget.type === 'hourly' ? 'text-[#0070F3]' : 'text-gray-400'
                  }`} />
                  <div className="font-medium">Hourly Rate</div>
                  <div className="text-sm text-gray-600">Pay by the hour for ongoing work</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Amount *
              </label>
              <div className="flex space-x-2">
                <select
                  value={jobData.budget.currency}
                  onChange={(e) => handleInputChange('budget.currency', e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={jobData.budget.amount}
                    onChange={(e) => handleInputChange('budget.amount', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                    placeholder={jobData.budget.type === 'fixed' ? '5,000' : '50'}
                    required
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {jobData.budget.type === 'fixed' 
                  ? 'Enter your total project budget'
                  : 'Enter your maximum hourly rate'
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Timeline *
              </label>
              <select
                value={jobData.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                required
              >
                <option value="">Select timeline</option>
                <option value="Less than 1 week">Less than 1 week</option>
                <option value="1-2 weeks">1-2 weeks</option>
                <option value="2-4 weeks">2-4 weeks</option>
                <option value="1-2 months">1-2 months</option>
                <option value="2-3 months">2-3 months</option>
                <option value="3-6 months">3-6 months</option>
                <option value="More than 6 months">More than 6 months</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={jobData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                  placeholder="Remote, or specify location"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Requirements</h2>
              <p className="text-gray-600">Specify your requirements and preferences</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Experience Level Required *
              </label>
              <div className="space-y-3">
                {experienceLevels.map(level => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => handleInputChange('experienceLevel', level.value)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      jobData.experienceLevel === level.value
                        ? 'border-[#0070F3] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm text-gray-600">{level.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Project Type *
              </label>
              <div className="space-y-3">
                {projectTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('projectType', type.value)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      jobData.projectType === type.value
                        ? 'border-[#0070F3] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">
                  Upload project briefs, wireframes, or reference materials
                </p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => {
                    if (e.target.files) {
                      setJobData(prev => ({
                        ...prev,
                        attachments: Array.from(e.target.files!)
                      }));
                    }
                  }}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-[#0070F3] hover:text-blue-600 font-medium"
                >
                  Choose files
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  PDF, DOC, PNG, JPG up to 10MB each
                </p>
              </div>
              {jobData.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {jobData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setJobData(prev => ({
                            ...prev,
                            attachments: prev.attachments.filter((_, i) => i !== index)
                          }));
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Post</h2>
              <p className="text-gray-600">Review your job posting before publishing</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['public', 'Public', 'Any matching vendor can apply'],
                    ['private', 'Private', 'Only vendors you invite can see it'],
                  ] as const).map(([val, label, desc]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleInputChange('visibility', val)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        jobData.visibility === val ? 'border-[#0070F3] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 text-sm">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTender}
                  onChange={(e) => setIsTender(e.target.checked)}
                  className="rounded text-[#0070F3]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Run this as a formal tender (submission deadline + evaluation criteria)
                </span>
              </label>

              {isTender && (
                <div className="space-y-4 pl-1 border-l-2 border-blue-100 ml-1 pt-1">
                  <div className="pl-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tender title</label>
                    <input
                      type="text"
                      value={tenderData.tenderTitle}
                      onChange={(e) => setTenderData(p => ({ ...p, tenderTitle: e.target.value }))}
                      placeholder="Defaults to the job title"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                    />
                  </div>
                  <div className="pl-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Submission deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={tenderData.deadline}
                      onChange={(e) => setTenderData(p => ({ ...p, deadline: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                    />
                  </div>
                  <div className="pl-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Evaluation criteria <span className="text-gray-400 font-normal">(one per line)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={tenderData.criteria}
                      onChange={(e) => setTenderData(p => ({ ...p, criteria: e.target.value }))}
                      placeholder={'Technical approach\nPrice\nDelivery timeline'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pl-4">
                    <input
                      type="checkbox"
                      checked={tenderData.ndaRequired}
                      onChange={(e) => setTenderData(p => ({ ...p, ndaRequired: e.target.checked }))}
                      className="rounded text-[#0070F3]"
                    />
                    <span className="text-sm text-gray-700">Require NDA before vendors see the tender document</span>
                  </label>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Title:</span>
                  <p className="text-gray-900">{jobData.title}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Category:</span>
                  <p className="text-gray-900">{jobData.category}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Budget:</span>
                  <p className="text-gray-900">
                    {jobData.budget.currency} ${jobData.budget.amount} 
                    {jobData.budget.type === 'hourly' ? '/hour' : ' (fixed)'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Timeline:</span>
                  <p className="text-gray-900">{jobData.timeline}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Skills Required:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {jobData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Experience Level:</span>
                  <p className="text-gray-900 capitalize">{jobData.experienceLevel}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Project Type:</span>
                  <p className="text-gray-900 capitalize">{jobData.projectType?.replace('-', ' ')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Visibility:</span>
                  <p className="text-gray-900 capitalize">{jobData.visibility === 'private' ? 'Private — invite only' : 'Public'}</p>
                </div>
                {jobData.invitedVendors.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Invited Vendors:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {jobData.invitedVendors.map((id) => (
                        <span key={id} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          Vendor #{id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your job will be visible to relevant contractors and vendors</li>
                    <li>• You'll start receiving proposals within 24 hours</li>
                    <li>• Review proposals and interview candidates</li>
                    <li>• Award the project to your preferred candidate</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>{showPreview ? 'Hide' : 'Preview'} Job Post</span>
              </button>
            </div>

            {showPreview && (
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{jobData.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center space-x-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{jobData.category}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{jobData.budget.currency} ${jobData.budget.amount}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{jobData.timeline}</span>
                  </span>
                </div>
                <p className="text-gray-700 mb-4">{jobData.description}</p>
                <div className="flex flex-wrap gap-2">
                  {jobData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              <h1 className="text-2xl font-bold text-gray-900">Post a Job</h1>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Step {currentStep} of {totalSteps}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#0070F3] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {currentStep > 1 ? (
              <button
                onClick={handlePrevious}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center px-6 py-3 bg-[#0070F3] text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center px-8 py-3 bg-[#0070F3] text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? 'Posting…' : isTender ? 'Post Tender' : 'Post Job'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Company profile hard gate */}
      {profileGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Complete your company profile first</h2>
            <p className="text-sm text-gray-500 mb-5">
              You can't post a job until your company name and country are filled in. This keeps every
              engagement identifiable for tax and contract purposes.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/customer/dashboard?open=company-profile" className="px-5 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg">
                Complete Profile
              </Link>
              <button onClick={() => setProfileGate(false)} className="px-5 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg">
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostJobPage;