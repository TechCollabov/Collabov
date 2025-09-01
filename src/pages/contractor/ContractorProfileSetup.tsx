import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, MapPin, Briefcase, DollarSign, FileText, 
  Upload, Globe, ArrowRight, ArrowLeft, Camera,
  Plus, X, Star, Calendar, Clock
} from 'lucide-react';

interface GoogleData {
  fullName: string;
  email: string;
  profilePicture: string;
  googleId: string;
}

interface ProfileData {
  // Personal Info
  profilePicture: File | null;
  title: string;
  bio: string;
  location: string;
  timezone: string;
  
  // Professional Info
  skills: string[];
  experience: string;
  hourlyRate: string;
  availability: string;
  
  // Portfolio
  portfolioItems: {
    title: string;
    description: string;
    image: File | null;
    url: string;
  }[];
  
  // Additional
  languages: string[];
  certifications: string[];
}

const ContractorProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const googleData = location.state?.googleData as GoogleData;
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newCertification, setNewCertification] = useState('');
  
  const [profileData, setProfileData] = useState<ProfileData>({
    profilePicture: null,
    title: '',
    bio: '',
    location: '',
    timezone: '',
    skills: [],
    experience: '',
    hourlyRate: '',
    availability: '',
    portfolioItems: [{ title: '', description: '', image: null, url: '' }],
    languages: ['English'],
    certifications: []
  });

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim() && !profileData.languages.includes(newLanguage.trim())) {
      setProfileData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (language: string) => {
    setProfileData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  const handleAddCertification = () => {
    if (newCertification.trim()) {
      setProfileData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setProfileData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert)
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

  const handleSubmit = () => {
    // Save profile data and redirect to dashboard
    console.log('Profile setup complete:', { googleData, profileData });
    navigate('/freelancer/dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
              <p className="text-gray-600">Let's start with your basic details</p>
            </div>

            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                  {googleData?.profilePicture ? (
                    <img 
                      src={googleData.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : profileData.profilePicture ? (
                    <img 
                      src={URL.createObjectURL(profileData.profilePicture)} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-[#0070F3] rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleInputChange('profilePicture', e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">Upload a professional photo</p>
            </div>

            {/* Pre-filled from Google */}
            {googleData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  </svg>
                  <span className="text-blue-800 font-medium">From your Google account</span>
                </div>
                <p className="text-sm text-blue-700">
                  <strong>Name:</strong> {googleData.fullName}<br />
                  <strong>Email:</strong> {googleData.email}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Title
              </label>
              <input
                type="text"
                value={profileData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                placeholder="e.g., Full Stack Developer, UI/UX Designer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Bio
              </label>
              <textarea
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                placeholder="Tell clients about your experience, expertise, and what makes you unique..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={profileData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                >
                  <option value="">Select timezone</option>
                  <option value="UTC-8">Pacific Time (UTC-8)</option>
                  <option value="UTC-5">Eastern Time (UTC-5)</option>
                  <option value="UTC+0">GMT (UTC+0)</option>
                  <option value="UTC+1">Central European Time (UTC+1)</option>
                  <option value="UTC+5:30">India Standard Time (UTC+5:30)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Skills & Experience</h2>
              <p className="text-gray-600">Showcase your expertise and set your rates</p>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                  placeholder="Add a skill"
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
                {profileData.skills.map((skill) => (
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

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                value={profileData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
              >
                <option value="">Select experience level</option>
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="intermediate">Intermediate (2-5 years)</option>
                <option value="expert">Expert (5+ years)</option>
              </select>
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={profileData.hourlyRate}
                  onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                  placeholder="25"
                  min="5"
                  max="500"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Set a competitive rate based on your skills and experience
              </p>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                value={profileData.availability}
                onChange={(e) => handleInputChange('availability', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
              >
                <option value="">Select availability</option>
                <option value="full-time">Full-time (40+ hours/week)</option>
                <option value="part-time">Part-time (20-40 hours/week)</option>
                <option value="project-based">Project-based</option>
                <option value="weekends">Weekends only</option>
              </select>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                  placeholder="Add a language"
                />
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="px-4 py-2 bg-[#0070F3] text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileData.languages.map((language) => (
                  <span
                    key={language}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {language}
                    {language !== 'English' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(language)}
                        className="ml-2 focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Portfolio & Work Samples</h2>
              <p className="text-gray-600">Show potential clients your best work</p>
            </div>

            {profileData.portfolioItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Project {index + 1}</h3>
                  {profileData.portfolioItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = profileData.portfolioItems.filter((_, i) => i !== index);
                        handleInputChange('portfolioItems', newItems);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const newItems = [...profileData.portfolioItems];
                        newItems[index].title = e.target.value;
                        handleInputChange('portfolioItems', newItems);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                      placeholder="Project name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project URL (optional)
                    </label>
                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) => {
                        const newItems = [...profileData.portfolioItems];
                        newItems[index].url = e.target.value;
                        handleInputChange('portfolioItems', newItems);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...profileData.portfolioItems];
                      newItems[index].description = e.target.value;
                      handleInputChange('portfolioItems', newItems);
                    }}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                    placeholder="Describe the project, your role, and technologies used..."
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const newItems = [...profileData.portfolioItems];
                          newItems[index].image = e.target.files[0];
                          handleInputChange('portfolioItems', newItems);
                        }
                      }}
                      className="hidden"
                      id={`portfolio-image-${index}`}
                    />
                    <label htmlFor={`portfolio-image-${index}`} className="cursor-pointer">
                      {item.image ? (
                        <div className="space-y-2">
                          <img 
                            src={URL.createObjectURL(item.image)} 
                            alt="Portfolio preview" 
                            className="mx-auto h-32 w-auto rounded-lg"
                          />
                          <p className="text-sm text-gray-600">Click to change image</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="text-sm text-gray-600">Upload project image</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                const newItems = [...profileData.portfolioItems, { title: '', description: '', image: null, url: '' }];
                handleInputChange('portfolioItems', newItems);
              }}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Another Project</span>
            </button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Certifications & Final Details</h2>
              <p className="text-gray-600">Add any relevant certifications and complete your profile</p>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications (optional)
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                  placeholder="e.g., AWS Certified Developer, Google Analytics Certified"
                />
                <button
                  type="button"
                  onClick={handleAddCertification}
                  className="px-4 py-2 bg-[#0070F3] text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileData.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                  >
                    {cert}
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(cert)}
                      className="ml-2 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Professional Title:</span>
                  <span className="font-medium">{profileData.title || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{profileData.location || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span className="font-medium">${profileData.hourlyRate || '0'}/hour</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skills:</span>
                  <span className="font-medium">{profileData.skills.length} skills</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Portfolio Items:</span>
                  <span className="font-medium">{profileData.portfolioItems.filter(item => item.title).length} projects</span>
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms-agreement"
                  className="mt-1 h-4 w-4 text-[#0070F3] focus:ring-[#0070F3] border-gray-300 rounded"
                  required
                />
                <label htmlFor="terms-agreement" className="text-sm text-gray-700">
                  I agree to Collabov's{' '}
                  <Link to="/terms" className="text-[#0070F3] hover:text-blue-600 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[#0070F3] hover:text-blue-600 underline">
                    Privacy Policy
                  </Link>
                  . I understand that my profile will be visible to potential clients.
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Globe className="h-8 w-8 text-[#0070F3]" />
            <span className="text-xl font-bold text-[#0B2D59]">Collabov</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#0B2D59] mb-2">
            Complete Your Professional Profile
          </h1>
          <p className="text-gray-600">
            Step {currentStep} of {totalSteps} - Let's make you stand out to potential clients
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
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

        {/* Form Content */}
        <motion.div 
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
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
              <button
                onClick={handleSubmit}
                className="inline-flex items-center px-8 py-3 bg-[#0070F3] text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Complete Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
