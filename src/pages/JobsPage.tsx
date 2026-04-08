import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Clock, MapPin, Briefcase, ChevronDown } from 'lucide-react';

const JOBS = [
  {
    id: '1',
    title: 'Senior Full-Stack Developer (React / Node.js)',
    company: 'PayFlow Technologies',
    companyType: 'Fintech',
    location: 'Remote (UK)',
    jobType: 'Contract',
    rate: '£550–£650/day',
    duration: '6 months',
    deadline: '25 Apr 2026',
    category: 'Software Development',
    description: 'We need a senior full-stack developer to build new features in our payment processing platform. You will work closely with product and design in an agile environment.',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
    applicants: 14,
    posted: '1 day ago',
  },
  {
    id: '2',
    title: 'Cybersecurity Analyst (SOC)',
    company: 'ShieldNet UK',
    companyType: 'Managed Security',
    location: 'London (Hybrid)',
    jobType: 'Contract',
    rate: '£450–£550/day',
    duration: '3 months',
    deadline: '30 Apr 2026',
    category: 'Cybersecurity',
    description: 'Joining our SOC team as an experienced security analyst. You will monitor SIEM alerts, triage incidents, perform threat hunting, and produce post-incident reports.',
    skills: ['SIEM', 'Splunk', 'ISO 27001', 'GDPR', 'Incident Response'],
    applicants: 8,
    posted: '2 days ago',
  },
  {
    id: '3',
    title: 'Azure DevOps Engineer',
    company: 'InfraCo UK',
    companyType: 'IT Services',
    location: 'Remote (UK)',
    jobType: 'Contract',
    rate: '£500–£600/day',
    duration: '4 months',
    deadline: '5 May 2026',
    category: 'DevOps',
    description: 'We need an Azure DevOps engineer to build and maintain our CI/CD pipelines, implement infrastructure-as-code, and support cloud cost optimisation across our Azure tenant.',
    skills: ['Azure DevOps', 'Terraform', 'Docker', 'Kubernetes', 'ARM Templates'],
    applicants: 5,
    posted: '3 days ago',
  },
  {
    id: '4',
    title: 'IT Support Engineer (1st/2nd Line)',
    company: 'BrightOffice MSP',
    companyType: 'Managed IT Services',
    location: 'Manchester (On-site)',
    jobType: 'Contract',
    rate: '£200–£280/day',
    duration: '2 months',
    deadline: '20 Apr 2026',
    category: 'Managed IT',
    description: 'Provide first and second line IT support to a portfolio of SME clients. Responsibilities include helpdesk ticketing, hardware setup, Microsoft 365 administration, and on-site visits.',
    skills: ['Microsoft 365', 'Active Directory', 'Windows 11', 'Azure AD', 'Teams'],
    applicants: 22,
    posted: '4 days ago',
  },
  {
    id: '5',
    title: 'QA Automation Engineer (Playwright)',
    company: 'DataSphere Analytics',
    companyType: 'SaaS',
    location: 'Remote (UK)',
    jobType: 'Contract',
    rate: '£400–£500/day',
    duration: '3 months',
    deadline: '8 May 2026',
    category: 'QA & Testing',
    description: 'Build and maintain an automated test suite using Playwright for our web application. You will define test strategy, write end-to-end tests, and integrate with our GitHub Actions pipeline.',
    skills: ['Playwright', 'TypeScript', 'CI/CD', 'GitHub Actions', 'API Testing'],
    applicants: 9,
    posted: '1 week ago',
  },
  {
    id: '6',
    title: 'Cloud Architect (AWS)',
    company: 'Retail Chain UK',
    companyType: 'Retail & E-commerce',
    location: 'Remote (UK)',
    jobType: 'Contract',
    rate: '£700–£850/day',
    duration: '5 months',
    deadline: '12 May 2026',
    category: 'Cloud & Infrastructure',
    description: 'Design and oversee the migration of our on-premise retail systems to AWS. You will produce architecture diagrams, lead a team of engineers, and work with third-party vendors.',
    skills: ['AWS', 'Terraform', 'CloudFormation', 'Microservices', 'RDS'],
    applicants: 6,
    posted: '5 days ago',
  },
];

const CATEGORIES = ['All', 'Software Development', 'Managed IT', 'Cybersecurity', 'Cloud & Infrastructure', 'DevOps', 'QA & Testing'];
const LOCATIONS = ['All', 'Remote (UK)', 'London', 'Manchester', 'Birmingham', 'On-site'];

const JobsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('All');

  const filtered = JOBS.filter(j =>
    (category === 'All' || j.category === category) &&
    (location === 'All' || j.location.includes(location)) &&
    (search === '' || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-[#0B2D59] text-white py-14">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-3">IT Contract Jobs</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">Browse contract roles from UK businesses. Day-rate contracts for IT professionals and vendor teams.</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0070F3] text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="appearance-none pl-3 pr-8 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0070F3] cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="appearance-none pl-3 pr-8 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0070F3] cursor-pointer"
              >
                {LOCATIONS.map(l => <option key={l} value={l}>{l === 'All' ? 'All Locations' : l}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-5">{filtered.length} job{filtered.length !== 1 ? 's' : ''} found</div>

        {/* List */}
        <div className="space-y-4">
          {filtered.map(job => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-50 text-[#0070F3] font-semibold px-2.5 py-1 rounded-full">{job.category}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{job.jobType}</span>
                    <span className="text-xs text-gray-400">{job.posted}</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#0B2D59] mb-1">{job.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.company} · {job.companyType}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map(s => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="lg:w-48 flex flex-col gap-4 lg:text-right">
                  <div className="space-y-1.5">
                    <div className="text-[#0070F3] font-bold text-sm">{job.rate}</div>
                    <div className="flex items-center lg:justify-end gap-1 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{job.duration}</span>
                    </div>
                    <div className="text-xs text-gray-400">Deadline: <span className="font-medium text-gray-600">{job.deadline}</span></div>
                    <div className="text-xs text-gray-400">{job.applicants} applicant{job.applicants !== 1 ? 's' : ''}</div>
                  </div>
                  <Link
                    to={`/signin?returnUrl=/jobs/${job.id}`}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply Now <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button className="py-2 px-4 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    Save Job
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">No jobs match your search.</div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
