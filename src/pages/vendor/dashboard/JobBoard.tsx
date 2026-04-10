import React, { useState } from 'react';
import { Search, MapPin, Clock, Briefcase, ChevronDown, Star, ArrowRight } from 'lucide-react';

const JOBS = [
  {
    id: '1',
    title: 'Senior Full-Stack Developer (React / Node.js)',
    company: 'PayFlow Technologies',
    companyType: 'Fintech',
    location: 'Remote (UK)',
    rate: '£550–£650/day',
    duration: '6 months',
    deadline: '25 Apr 2026',
    category: 'Software Development',
    description: 'Build new features for a payment processing platform. Agile environment, close work with product and design.',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
    applicants: 14,
    matchScore: 94,
    posted: '1 day ago',
  },
  {
    id: '2',
    title: 'Azure DevOps Engineer',
    company: 'InfraCo UK',
    companyType: 'IT Services',
    location: 'Remote (UK)',
    rate: '£500–£600/day',
    duration: '4 months',
    deadline: '5 May 2026',
    category: 'DevOps',
    description: 'Build and maintain CI/CD pipelines, IaC, and support cloud cost optimisation across Azure.',
    skills: ['Azure DevOps', 'Terraform', 'Docker', 'Kubernetes'],
    applicants: 5,
    matchScore: 87,
    posted: '3 days ago',
  },
  {
    id: '3',
    title: 'Cloud Architect (AWS)',
    company: 'Retail Chain UK',
    companyType: 'Retail & E-commerce',
    location: 'Remote (UK)',
    rate: '£700–£850/day',
    duration: '5 months',
    deadline: '12 May 2026',
    category: 'Cloud & Infrastructure',
    description: 'Design and oversee migration of on-premise retail systems to AWS. Lead a team of engineers.',
    skills: ['AWS', 'Terraform', 'CloudFormation', 'Microservices'],
    applicants: 6,
    matchScore: 79,
    posted: '5 days ago',
  },
  {
    id: '4',
    title: 'Cybersecurity Analyst (SOC)',
    company: 'ShieldNet UK',
    companyType: 'Managed Security',
    location: 'London (Hybrid)',
    rate: '£450–£550/day',
    duration: '3 months',
    deadline: '30 Apr 2026',
    category: 'Cybersecurity',
    description: 'Monitor SIEM alerts, triage incidents, perform threat hunting, produce post-incident reports.',
    skills: ['SIEM', 'Splunk', 'ISO 27001', 'Incident Response'],
    applicants: 8,
    matchScore: 65,
    posted: '2 days ago',
  },
  {
    id: '5',
    title: 'QA Automation Engineer (Playwright)',
    company: 'DataSphere Analytics',
    companyType: 'SaaS',
    location: 'Remote (UK)',
    rate: '£400–£500/day',
    duration: '3 months',
    deadline: '8 May 2026',
    category: 'QA & Testing',
    description: 'Build and maintain automated test suites using Playwright. Define test strategy and CI/CD integration.',
    skills: ['Playwright', 'TypeScript', 'CI/CD', 'GitHub Actions'],
    applicants: 9,
    matchScore: 58,
    posted: '1 week ago',
  },
];

const CATEGORIES = ['All', 'Software Development', 'Managed IT', 'Cybersecurity', 'Cloud & Infrastructure', 'DevOps', 'QA & Testing'];

const getMatchColor = (score: number) => {
  if (score >= 85) return 'bg-green-100 text-green-700';
  if (score >= 70) return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
};

const JobBoard: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [proposal, setProposal] = useState('');

  const filtered = JOBS.filter(j =>
    (category === 'All' || j.category === category) &&
    (search === '' || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2D59]">Job Board</h1>
        <p className="text-sm text-gray-500 mt-1">Browse contract opportunities matched to your profile</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0070F3] text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0070F3] cursor-pointer"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-4">{filtered.length} opportunit{filtered.length !== 1 ? 'ies' : 'y'} found</div>

      {/* Job list */}
      <div className="space-y-4">
        {filtered.map(job => (
          <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-50 text-[#0070F3] font-semibold px-2.5 py-1 rounded-full">{job.category}</span>
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${getMatchColor(job.matchScore)}`}>
                    <Star className="h-3 w-3" />{job.matchScore}% match
                  </span>
                  <span className="text-xs text-gray-400">{job.posted}</span>
                </div>
                <h3 className="font-bold text-[#0B2D59] mb-1">{job.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.company} · {job.companyType}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{job.duration}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map(s => (
                    <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>

              <div className="lg:w-44 flex flex-col gap-3 lg:text-right">
                <div>
                  <div className="text-[#0070F3] font-bold text-sm">{job.rate}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Deadline: {job.deadline}</div>
                  <div className="text-xs text-gray-400">{job.applicants} applicants</div>
                </div>
                <button
                  onClick={() => setApplyingTo(job.id)}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Inline proposal form */}
            {applyingTo === job.id && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Proposal</h4>
                <textarea
                  value={proposal}
                  onChange={e => setProposal(e.target.value)}
                  rows={4}
                  placeholder="Briefly describe why you're a great fit for this role and your relevant experience..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => { setApplyingTo(null); setProposal(''); }}
                    className="py-2 px-4 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { alert('Proposal submitted!'); setApplyingTo(null); setProposal(''); }}
                    className="py-2 px-4 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit Proposal
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">No jobs match your search.</div>
      )}
    </div>
  );
};

export default JobBoard;
