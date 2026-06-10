import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Globe, MapPin, Upload, Building2, ArrowRight, 
  Mail, Phone, User, ArrowLeft, Users, Briefcase, 
  FileText, CreditCard, CheckCircle, AlertCircle, X 
} from 'lucide-react';

interface FormData {
  // Company Information
  companyName: string;
  websiteUrl: string;
  address: string;
  city: string;
  state: string;
  country: string;
  logo: File | null;
  description: string;
  tagline: string;

  // Contact Information
  contactName: string;
  contactEmail: string;
  contactPhone: string;

  // Business Overview
  companySize: string;
  yearFounded: string;
  industries: string;

  // Service Details
  primaryCategory: string;
  servicesOffered: string;
  hourlyRate: string;
  monthlyRate: string;
  minimum_project_value: number;
  ir35_compliant: boolean;
  gdpr_ready: boolean;

  // Client Information
  clientTypes: string;
  notableProjects: string;
  clientReferences: string;

  // Documents
  documents: {
    companiesHouse: File | null;
    vatCert: File | null;
    addressProof: File | null;
  };

  // Payment Details
  registeredName: string;
  accountNumber: string;
  ifscCode: string;
  bankAddress: string;
  bankName: string;
  registeredEmail: string;
}

interface CaseStudyForm {
  project_title: string;
  industry: string;
  services_delivered: string | string[];
  tech_stack: string | string[];
  challenge: string;
  solution: string;
  outcomes: string | string[];
  key_result: string;
  ai_keyword_tags?: string[];
}

const extractCaseStudyKeywords = async (caseStudy: CaseStudyForm): Promise<string[]> => {
  // Only call if ANTHROPIC_API_KEY is configured
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('Claude API not configured — case study keywords skipped');
    return [];
  }

  try {
    const prompt = `Extract 3-5 keyword tags from this IT project case study. Return ONLY a JSON array of strings, no other text.

Project: ${caseStudy.project_title}
Industry: ${caseStudy.industry}
Services: ${Array.isArray(caseStudy.services_delivered) ? caseStudy.services_delivered.join(', ') : caseStudy.services_delivered}
Tech stack: ${Array.isArray(caseStudy.tech_stack) ? caseStudy.tech_stack.join(', ') : caseStudy.tech_stack}
Challenge: ${caseStudy.challenge}
Solution: ${caseStudy.solution}
Outcomes: ${Array.isArray(caseStudy.outcomes) ? caseStudy.outcomes.join('. ') : caseStudy.outcomes}

Return 3-5 specific keyword tags as a JSON array, e.g. ["fintech", "real-time-payments", "aws-lambda"]`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const tags = JSON.parse(text);
    return Array.isArray(tags) ? tags : [];
  } catch (err) {
    console.log('Case study keyword extraction failed — saving without tags');
    return [];
  }
};

const ManageListings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    websiteUrl: '',
    address: '',
    city: '',
    state: '',
    country: '',
    logo: null,
    description: '',
    tagline: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companySize: '',
    yearFounded: '',
    industries: '',
    primaryCategory: '',
    servicesOffered: '',
    hourlyRate: '',
    monthlyRate: '',
    minimum_project_value: 0,
    ir35_compliant: false,
    gdpr_ready: false,
    clientTypes: '',
    notableProjects: '',
    clientReferences: '',
    documents: {
      companiesHouse: null,
      vatCert: null,
      addressProof: null,
    },
    registeredName: '',
    accountNumber: '',
    ifscCode: '',
    bankAddress: '',
    bankName: '',
    registeredEmail: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const step = params.get('step');
    if (step) {
      const stepNumber = parseInt(step, 10);
      if (!isNaN(stepNumber) && stepNumber >= 1 && stepNumber <= totalSteps) {
        setCurrentStep(stepNumber);
      }
    }
  }, [location.search]);

  // Add new state for service keywords
  const [serviceKeyword, setServiceKeyword] = useState('');
  const [serviceKeywords, setServiceKeywords] = useState<string[]>([]);

  // Case studies state
  const [caseStudies, setCaseStudies] = useState<CaseStudyForm[]>([]);
  const [caseStudyForms, setCaseStudyForms] = useState<CaseStudyForm[]>([
    { project_title: '', industry: '', services_delivered: '', tech_stack: '', challenge: '', solution: '', outcomes: '', key_result: '' },
    { project_title: '', industry: '', services_delivered: '', tech_stack: '', challenge: '', solution: '', outcomes: '', key_result: '' },
    { project_title: '', industry: '', services_delivered: '', tech_stack: '', challenge: '', solution: '', outcomes: '', key_result: '' },
  ]);

  const handleSaveCaseStudy = async (index: number) => {
    const caseStudyData = caseStudyForms[index];
    // Save case study to state
    setCaseStudies(prev => {
      const updated = [...prev];
      updated[index] = caseStudyData;
      return updated;
    });
    // Extract AI keyword tags asynchronously and update
    const keywords = await extractCaseStudyKeywords(caseStudyData);
    setCaseStudies(prev => {
      const updated = [...prev];
      updated[index] = { ...caseStudyData, ai_keyword_tags: keywords };
      return updated;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (field === 'logo') {
        setFormData(prev => ({
          ...prev,
          logo: e.target.files![0]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [field]: e.target.files![0]
          }
        }));
      }
    }
  };

  // Add handler for adding keywords
  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && serviceKeyword.trim()) {
      e.preventDefault();
      if (!serviceKeywords.includes(serviceKeyword.trim())) {
        setServiceKeywords([...serviceKeywords, serviceKeyword.trim()]);
      }
      setServiceKeyword('');
    }
  };

  // Add handler for removing keywords
  const handleRemoveKeyword = (keyword: string) => {
    setServiceKeywords(serviceKeywords.filter(k => k !== keyword));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === totalSteps) {
      // Handle final form submission
      console.log('Form submitted:', formData);
    } else {
      handleNext();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={(e) => {
                      let url = e.target.value;
                      // Add https:// if no protocol is specified
                      if (url && !url.match(/^https?:\/\//)) {
                        url = `https://${url}`;
                      }
                      setFormData(prev => ({
                        ...prev,
                        websiteUrl: url
                      }));
                    }}
                    placeholder="e.g., https://example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    pattern="https?://.+"
                    title="Please include http:// or https://"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Include https:// in your URL (it will be added automatically if missing)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {formData.logo ? (
                    <img 
                      src={URL.createObjectURL(formData.logo)} 
                      alt="Company logo preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div>
                  <label className="btn-primary cursor-pointer inline-flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange('logo')}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: 400x400px, Max 2MB
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tagline
              </label>
              <input
                type="text"
                name="tagline"
                value={formData.tagline}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person's Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Business Overview</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Size
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501+">501+ employees</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Founded
              </label>
              <input
                type="number"
                name="yearFounded"
                value={formData.yearFounded}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Industries Served
              </label>
              <textarea
                name="industries"
                value={formData.industries}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="List the key industries you serve..."
                required
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Service Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Service Category
              </label>
              <select
                name="primaryCategory"
                value={formData.primaryCategory}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select category</option>
                <option value="development">Development</option>
                <option value="it-services">IT Services</option>
                <option value="marketing">Marketing</option>
                <option value="design">Design</option>
                <option value="consulting">Consulting</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Keywords
              </label>
              <div className="mb-2">
                <input
                  type="text"
                  value={serviceKeyword}
                  onChange={(e) => setServiceKeyword(e.target.value)}
                  onKeyDown={handleAddKeyword}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Type a service and press Enter to add..."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {serviceKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-2 focus:outline-none"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Add keywords that describe your specific services (e.g., React, Node.js, UI Design)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services Description
              </label>
              <textarea
                name="servicesOffered"
                value={formData.servicesOffered}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe your services in detail..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate (USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rate (USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="monthlyRate"
                    value={formData.monthlyRate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 8000"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum Project Value (£)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">£</span>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={formData.minimum_project_value || ''}
                  onChange={e => setFormData(prev => ({ ...prev, minimum_project_value: parseInt(e.target.value) || 0 }))}
                  placeholder="5000"
                  className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Shown in your public profile sidebar. Min £500.</p>
            </div>

            {/* IR35 Compliant toggle */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div>
                <p className="font-semibold text-[#0B2D59] text-sm">IR35 Compliant</p>
                <p className="text-xs text-gray-500 mt-0.5">Shows IR35 badge on your profile and search cards. Only enable if you have obtained a favourable SDS determination.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, ir35_compliant: !prev.ir35_compliant }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${formData.ir35_compliant ? 'bg-[#0070F3]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.ir35_compliant ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* GDPR Ready toggle */}
            <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl border border-teal-100 mt-3">
              <div>
                <p className="font-semibold text-[#0B2D59] text-sm">GDPR Ready</p>
                <p className="text-xs text-gray-500 mt-0.5">Shows GDPR-Ready badge on your profile. Only enable if you have appropriate data processing agreements and procedures in place.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, gdpr_ready: !prev.gdpr_ready }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${formData.gdpr_ready ? 'bg-[#0E7C6A]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.gdpr_ready ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Portfolio & Case Studies</h2>
            <p className="text-sm text-gray-500">Add up to 3 case studies that showcase your work. These appear on your public vendor profile.</p>

            {[0, 1, 2].map(idx => {
              const n = idx + 1;
              const cs = caseStudyForms[idx];
              const saved = caseStudies[idx];
              return (
                <div key={n} className="border border-gray-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-700">
                      Case Study {n} {n === 1 && <span className="text-red-500">*</span>}
                    </div>
                    {saved && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Saved
                        {saved.ai_keyword_tags && saved.ai_keyword_tags.length > 0 && (
                          <span className="ml-2 text-gray-400">· Tags: {saved.ai_keyword_tags.join(', ')}</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                    <input
                      type="text"
                      value={cs.project_title}
                      onChange={e => setCaseStudyForms(prev => prev.map((f, i) => i === idx ? { ...f, project_title: e.target.value } : f))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="e.g., Cloud Migration for NHS Trust"
                      required={n === 1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Industry</label>
                    <input
                      type="text"
                      value={cs.industry}
                      onChange={e => setCaseStudyForms(prev => prev.map((f, i) => i === idx ? { ...f, industry: e.target.value } : f))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="e.g., Healthcare, Financial Services, Retail"
                      required={n === 1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Challenge</label>
                    <textarea
                      rows={2}
                      value={cs.challenge}
                      onChange={e => setCaseStudyForms(prev => prev.map((f, i) => i === idx ? { ...f, challenge: e.target.value } : f))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="What was the client's problem or challenge?"
                      required={n === 1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Solution</label>
                    <textarea
                      rows={2}
                      value={cs.solution}
                      onChange={e => setCaseStudyForms(prev => prev.map((f, i) => i === idx ? { ...f, solution: e.target.value } : f))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="Describe your approach and solution..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Outcomes</label>
                    <textarea
                      rows={2}
                      value={cs.outcomes as string}
                      onChange={e => setCaseStudyForms(prev => prev.map((f, i) => i === idx ? { ...f, outcomes: e.target.value } : f))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="What were the measurable results?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Result</label>
                    <input
                      type="text"
                      value={cs.key_result}
                      onChange={e => setCaseStudyForms(prev => prev.map((f, i) => i === idx ? { ...f, key_result: e.target.value } : f))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="e.g., Reduced infrastructure costs by 35%"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveCaseStudy(idx)}
                      className="inline-flex items-center px-4 py-2 bg-[#0070F3] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Case Study {n}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Verification Documents</h2>
            <p className="text-sm text-gray-500">Upload your UK company documents. These are reviewed by the Collabov team and are not shown publicly.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'companiesHouse', label: 'Companies House Registration Certificate', required: true, hint: 'Certificate of Incorporation from Companies House' },
                { key: 'vatCert', label: 'VAT Registration Certificate', required: false, hint: 'HMRC VAT certificate (if VAT registered)' },
                { key: 'addressProof', label: 'Proof of Business Address', required: false, hint: 'e.g. utility bill or bank statement (within 3 months)' },
              ].map(doc => (
                <div key={doc.key} className="border border-gray-200 rounded-xl p-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {doc.label}
                    {doc.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <p className="text-xs text-gray-400 mb-3">{doc.hint}</p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Upload className="h-4 w-4" />
                    Upload File
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange(doc.key)}
                      required={doc.required}
                    />
                  </label>
                  {formData.documents[doc.key as keyof typeof formData.documents] && (
                    <p className="text-sm text-green-600 mt-2">✓ File uploaded</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Payment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registered Name
                </label>
                <input
                  type="text"
                  name="registeredName"
                  value={formData.registeredName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Address
                </label>
                <textarea
                  name="bankAddress"
                  value={formData.bankAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registered Email
                </label>
                <input
                  type="email"
                  name="registeredEmail"
                  value={formData.registeredEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Manage Listings</h1>
          <p className="text-gray-600 mt-1">Step {currentStep} of {totalSteps}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <span>Profile Completion: {Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
      </div>

      <motion.div 
        className="bg-white rounded-lg shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <form onSubmit={handleSubmit} className="p-6">
          {renderStep()}

          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="btn-secondary inline-flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </button>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                className="btn-primary inline-flex items-center"
              >
                {currentStep === totalSteps ? 'Submit' : 'Next'}
                {currentStep !== totalSteps && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ManageListings;