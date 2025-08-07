import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Wand2, FileText, Send, Save, Edit3, Eye, 
  Lightbulb, CheckCircle, AlertCircle, Copy, 
  Download, RefreshCw, Sparkles, Target, Clock,
  DollarSign, User, Building2, Zap, Star, ArrowRight
} from 'lucide-react';

interface ProposalData {
  projectTitle: string;
  clientIndustry: string;
  budget: string;
  timeline: string;
  proposalType: string;
  toneOfVoice: string;
  strengths: string[];
  personalIntro: string;
  portfolioAttachment: string;
  callToAction: string;
}

interface JobContext {
  jobId: string;
  jobTitle: string;
  clientName: string;
  clientId: string;
  budget: string;
  description: string;
  deadline?: string;
  skills?: string[];
}

interface AIProposalGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  jobContext?: JobContext;
}

const AIProposalGenerator: React.FC<AIProposalGeneratorProps> = ({ isOpen, onClose, jobContext }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [proposalScore, setProposalScore] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState<ProposalData>({
    projectTitle: jobContext?.jobTitle || '',
    clientIndustry: 'retail',
    budget: jobContext?.budget || '',
    timeline: '4-6 weeks',
    proposalType: 'one-time',
    toneOfVoice: 'professional',
    strengths: ['fast-delivery', 'industry-experience'],
    personalIntro: '',
    portfolioAttachment: '',
    callToAction: 'call'
  });

  const totalSteps = 3;

  const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'education', label: 'Education' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'other', label: 'Other' }
  ];

  const proposalTypes = [
    { value: 'one-time', label: 'One-time Project', icon: Target },
    { value: 'long-term', label: 'Long-term Engagement', icon: Clock },
    { value: 'consultation', label: 'Consultation', icon: Lightbulb }
  ];

  const toneOptions = [
    { value: 'professional', label: 'Professional', description: 'Formal and business-focused' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
    { value: 'persuasive', label: 'Persuasive', description: 'Compelling and convincing' },
    { value: 'technical', label: 'Technical', description: 'Detail-oriented and precise' }
  ];

  const strengthOptions = [
    { value: 'fast-delivery', label: 'Fast Delivery', icon: Zap },
    { value: 'industry-experience', label: 'Industry Experience', icon: Star },
    { value: 'affordable-rates', label: 'Affordable Rates', icon: DollarSign },
    { value: 'strong-communication', label: 'Strong Communication', icon: User },
    { value: 'dedicated-team', label: 'Dedicated Team', icon: Building2 }
  ];

  const callToActionOptions = [
    { value: 'call', label: "Let's set up a call" },
    { value: 'message', label: 'Please message me for queries' },
    { value: 'discuss', label: "Let's discuss your requirements" },
    { value: 'schedule', label: 'Schedule a consultation' }
  ];

  const proposalTemplates = [
    { 
      name: 'Short & Punchy', 
      description: 'Ideal for urgent small tasks',
      style: 'Concise, direct, action-oriented'
    },
    { 
      name: 'Detailed Breakdown', 
      description: 'Perfect for complex projects',
      style: 'Comprehensive, methodical, thorough'
    },
    { 
      name: 'Corporate Style', 
      description: 'Suited for large businesses',
      style: 'Formal, structured, professional'
    },
    { 
      name: 'Startup Friendly', 
      description: 'Casual yet smart for founders',
      style: 'Innovative, flexible, growth-focused'
    }
  ];

  const handleInputChange = (field: keyof ProposalData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStrengthToggle = (strength: string) => {
    setFormData(prev => ({
      ...prev,
      strengths: prev.strengths.includes(strength)
        ? prev.strengths.filter(s => s !== strength)
        : [...prev.strengths, strength]
    }));
  };

  const generateProposal = async () => {
    setIsGenerating(true);
    
    // Use job context in proposal generation
    const contextualInfo = jobContext ? {
      jobTitle: jobContext.jobTitle,
      clientName: jobContext.clientName,
      projectDescription: jobContext.description,
      budget: jobContext.budget
    } : {};
    
    // Simulate AI generation
    setTimeout(() => {
      const proposal = `Dear ${jobContext?.clientName || 'Project Manager'},

I hope this message finds you well. I'm excited about the opportunity to work on your "${jobContext?.jobTitle || formData.projectTitle}" project.

**Understanding Your Needs:**
Based on your project description, I understand you're looking for a comprehensive solution that delivers both functionality and user experience. ${jobContext?.description ? `Specifically, I see that you need: "${jobContext.description.substring(0, 100)}..."` : ''} With my ${formData.strengths.includes('industry-experience') ? 'extensive experience in the ' + formData.clientIndustry + ' industry' : 'proven track record'}, I'm confident I can exceed your expectations.

**Why I'm the Right Fit:**
${formData.strengths.map(strength => {
  switch(strength) {
    case 'fast-delivery': return '• **Fast Delivery**: I prioritize efficient timelines without compromising quality';
    case 'industry-experience': return `• **Industry Expertise**: Deep understanding of ${formData.clientIndustry} best practices`;
    case 'affordable-rates': return '• **Competitive Pricing**: High-quality work at reasonable rates';
    case 'strong-communication': return '• **Clear Communication**: Regular updates and transparent collaboration';
    case 'dedicated-team': return '• **Dedicated Resources**: Focused team commitment to your project';
    default: return '';
  }
}).filter(Boolean).join('\n')}

**My Approach:**
1. **Discovery Phase**: Thorough requirement analysis and planning
2. **Development**: Agile methodology with regular milestone reviews
3. **Testing**: Comprehensive quality assurance
4. **Delivery**: Smooth handover with documentation and support

**Timeline & Investment:**
I can deliver this project within ${formData.timeline} for ${formData.budget}, which aligns perfectly with your requirements.

${jobContext?.skills && jobContext.skills.length > 0 ? `**Technical Expertise:**\nI have proven experience with the required technologies: ${jobContext.skills.join(', ')}.` : ''}

${formData.callToAction === 'call' ? "I'd love to schedule a call to discuss your vision in detail and answer any questions you might have." :
  formData.callToAction === 'message' ? "Please feel free to message me with any questions or to discuss the project requirements further." :
  formData.callToAction === 'discuss' ? "Let's discuss your specific requirements and how I can bring your vision to life." :
  "I'd be happy to schedule a consultation to explore how we can achieve your project goals together."}

Looking forward to collaborating with you!

Best regards,
John Doe
Full Stack Developer`;

      setGeneratedProposal(proposal);
      setProposalScore(Math.floor(Math.random() * 15) + 85); // Random score between 85-100
      setIsGenerating(false);
      setShowPreview(true);
    }, 3000);
  };

  const handleSendProposal = async () => {
    if (!jobContext) {
      alert('Error: No job context found. Please select a job before creating a proposal.');
      return;
    }

    setIsSubmitting(true);

    // Create proposal record
    const proposalData = {
      jobId: jobContext.jobId,
      clientId: jobContext.clientId,
      freelancerId: 'user_567', // This would come from auth context
      proposalContent: generatedProposal,
      status: 'submitted',
      timestamp: new Date().toISOString(),
      budget: formData.budget,
      timeline: formData.timeline,
      proposalScore: proposalScore
    };

    // Simulate API call to submit proposal
    setTimeout(() => {
      // Store in localStorage for demo (in production, this would be an API call)
      const existingProposals = JSON.parse(localStorage.getItem('userProposals') || '[]');
      existingProposals.push(proposalData);
      localStorage.setItem('userProposals', JSON.stringify(existingProposals));

      // Store notification for client (demo purposes)
      const clientNotifications = JSON.parse(localStorage.getItem(`client_notifications_${jobContext.clientId}`) || '[]');
      clientNotifications.push({
        id: Date.now().toString(),
        type: 'new_proposal',
        message: `You've received a new proposal from John Doe for "${jobContext.jobTitle}"`,
        jobId: jobContext.jobId,
        freelancerId: 'user_567',
        timestamp: new Date().toISOString(),
        read: false
      });
      localStorage.setItem(`client_notifications_${jobContext.clientId}`, JSON.stringify(clientNotifications));

      setIsSubmitting(false);
      onClose();
      
      // Redirect to proposals page with success message
      navigate('/freelancer/dashboard?tab=proposals&success=true&job=' + encodeURIComponent(jobContext.jobTitle));
    }, 2000);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      generateProposal();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Project Details</h3>
              <p className="text-gray-600">Let's start with the basic project information</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title
              </label>
              <input
                type="text"
                value={formData.projectTitle}
                onChange={(e) => handleInputChange('projectTitle', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter project title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client's Industry
              </label>
              <select
                value={formData.clientIndustry}
                onChange={(e) => handleInputChange('clientIndustry', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {industries.map(industry => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget
                </label>
                <input
                  type="text"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., $5,000 - $10,000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Timeline
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => handleInputChange('timeline', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="1-2 weeks">1-2 weeks</option>
                  <option value="2-4 weeks">2-4 weeks</option>
                  <option value="4-6 weeks">4-6 weeks</option>
                  <option value="6-8 weeks">6-8 weeks</option>
                  <option value="2-3 months">2-3 months</option>
                  <option value="3+ months">3+ months</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Proposal Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {proposalTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleInputChange('proposalType', type.value)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.proposalType === type.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`h-6 w-6 mx-auto mb-2 ${
                        formData.proposalType === type.value ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tone & Strengths</h3>
              <p className="text-gray-600">Customize how you want to present yourself</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tone of Voice
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {toneOptions.map(tone => (
                  <button
                    key={tone.value}
                    type="button"
                    onClick={() => handleInputChange('toneOfVoice', tone.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.toneOfVoice === tone.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{tone.label}</div>
                    <div className="text-sm text-gray-600">{tone.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Highlight Your Strengths
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {strengthOptions.map(strength => {
                  const Icon = strength.icon;
                  const isSelected = formData.strengths.includes(strength.value);
                  return (
                    <button
                      key={strength.value}
                      type="button"
                      onClick={() => handleStrengthToggle(strength.value)}
                      className={`p-4 border-2 rounded-lg transition-all flex items-center space-x-3 ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${
                        isSelected ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <span className="font-medium">{strength.label}</span>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call to Action
              </label>
              <select
                value={formData.callToAction}
                onChange={(e) => handleInputChange('callToAction', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {callToActionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Touch</h3>
              <p className="text-gray-600">Add your personal introduction and portfolio</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personal Introduction (Optional)
              </label>
              <textarea
                value={formData.personalIntro}
                onChange={(e) => handleInputChange('personalIntro', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Add a personal touch to your proposal..."
              />
              <p className="text-sm text-gray-500 mt-1">
                This will be added to your proposal introduction
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portfolio Attachment (Optional)
              </label>
              <input
                type="text"
                value={formData.portfolioAttachment}
                onChange={(e) => handleInputChange('portfolioAttachment', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Link to relevant portfolio item or case study"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">AI Smart Tips</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Mention specific technologies relevant to their industry</li>
                    <li>• Include a brief methodology or approach</li>
                    <li>• Reference similar successful projects</li>
                    <li>• Keep the proposal concise but comprehensive</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Proposal Template Style
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {proposalTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <p className="text-xs text-gray-500">{template.style}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  // Safety check - prevent generation without job context
  if (!jobContext) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div 
          className="bg-white rounded-2xl w-full max-w-md p-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Job Selected</h3>
          <p className="text-gray-600 mb-6">
            Please select a project before creating a proposal.
          </p>
          <button
            onClick={onClose}
            className="btn-primary w-full"
          >
            Go Back to Find Projects
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Wand2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Proposal Generator</h2>
                <p className="text-green-100">Create winning proposals in minutes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Form */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
            {/* Job Context Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">📋 Job Details</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Title:</strong> {jobContext.jobTitle}</p>
                <p><strong>Client:</strong> {jobContext.clientName}</p>
                <p><strong>Budget:</strong> {jobContext.budget}</p>
                {jobContext.deadline && <p><strong>Deadline:</strong> {jobContext.deadline}</p>}
                {jobContext.skills && jobContext.skills.length > 0 && (
                  <p><strong>Skills:</strong> {jobContext.skills.join(', ')}</p>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Form Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              {currentStep > 1 ? (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              ) : (
                <div></div>
              )}

              <button
                onClick={handleNext}
                disabled={isGenerating}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : currentStep === totalSteps ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Proposal</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/2 p-6 overflow-y-auto bg-gray-50">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Preview</h3>
              <p className="text-gray-600">See how your proposal will look</p>
            </div>

            {showPreview && generatedProposal ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Proposal Score */}
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Proposal Score</span>
                    <span className="text-2xl font-bold text-green-600">{proposalScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${proposalScore}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {proposalScore >= 90 ? 'Excellent proposal!' : 
                     proposalScore >= 80 ? 'Good proposal with room for improvement' : 
                     'Consider adding more details'}
                  </p>
                </div>

                {/* Generated Proposal */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Generated Proposal</h4>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                      {generatedProposal}
                    </pre>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                    <Send className="h-4 w-4" />
                    onClick={handleSendProposal}
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Proposal</span>
                      </>
                    )}
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                    <Edit3 className="h-4 w-4" />
                    <span>Edit First</span>
                  </button>
                  <button className="px-4 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-lg p-8 border-2 border-dashed border-gray-300 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Proposal Preview</h4>
                <p className="text-gray-600">
                  Complete the form to generate your AI-powered proposal
                </p>
                
                {/* Smart Tips */}
                <div className="mt-6 bg-blue-50 rounded-lg p-4 text-left">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Smart Tips</span>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Be specific about your relevant experience</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Mention similar projects you've completed</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Include a clear project timeline</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>End with a strong call-to-action</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AIProposalGenerator;