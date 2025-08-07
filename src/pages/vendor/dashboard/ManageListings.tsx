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

  // Client Information
  clientTypes: string;
  notableProjects: string;
  clientReferences: string;

  // Documents
  documents: {
    incorporation: File | null;
    pan: File | null;
    gst: File | null;
    msme: File | null;
    aoa: File | null;
    moa: File | null;
    directorDetails: File | null;
  };

  // Payment Details
  registeredName: string;
  accountNumber: string;
  ifscCode: string;
  bankAddress: string;
  bankName: string;
  registeredEmail: string;
}

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
    clientTypes: '',
    notableProjects: '',
    clientReferences: '',
    documents: {
      incorporation: null,
      pan: null,
      gst: null,
      msme: null,
      aoa: null,
      moa: null,
      directorDetails: null
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
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Client and Project Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Types of Clients Served
              </label>
              <textarea
                name="clientTypes"
                value={formData.clientTypes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., SMBs, Enterprises, Startups..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notable Projects
              </label>
              <textarea
                name="notableProjects"
                value={formData.notableProjects}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe your most significant projects..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client References
              </label>
              <textarea
                name="clientReferences"
                value={formData.clientReferences}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Provide details of 2 client references..."
                required
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'incorporation', label: 'Company Incorporation Certificate' },
                { key: 'pan', label: 'Copy of PAN' },
                { key: 'gst', label: 'Copy of GST Certificate' },
                { key: 'msme', label: 'Copy of MSME (if available)', required: false },
                { key: 'aoa', label: 'Article of Association' },
                { key: 'moa', label: 'Memorandum of Association' },
                { key: 'directorDetails', label: 'Director Details (PAN & Aadhar)' }
              ].map(doc => (
                <div key={doc.key} className="border rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {doc.label}
                    {doc.required !== false && <span className="text-red-500">*</span>}
                  </label>
                  <div className="mt-2">
                    <label className="btn-secondary cursor-pointer inline-flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange(doc.key)}
                        required={doc.required !== false}
                      />
                    </label>
                    {formData.documents[doc.key as keyof typeof formData.documents] && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ File uploaded
                      </p>
                    )}
                  </div>
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