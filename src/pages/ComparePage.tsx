import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Check, X } from 'lucide-react';

const MOCK_VENDORS: Record<string, any> = {
  '1': { id: '1', name: 'TechPro Solutions', city: 'Warsaw', country: 'Poland', type: 'IT Agency', verified: true, rating: 4.8, reviewCount: 47, services: 'Software Development, Cloud & Infrastructure, QA & Testing', tech: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'TypeScript'], model: 'Long-term / Short-term', rateRange: '£3,200–£4,800/mo', teamSize: '24 people', timezone: '+1hr (CET)', ir35: true, available: true, responseTime: '4 hours', engagements: 23 },
  '2': { id: '2', name: 'CloudBridge MSP', city: 'London', country: 'UK', type: 'MSP', verified: true, rating: 4.6, reviewCount: 31, services: 'Managed IT, Cybersecurity, Cloud & Infrastructure', tech: ['Azure', 'Microsoft 365', 'Intune', 'Cisco'], model: 'Long-term', rateRange: '£2,800–£4,000/mo', teamSize: '18 people', timezone: 'Same (GMT)', ir35: true, available: true, responseTime: '2 hours', engagements: 15 },
  '3': { id: '3', name: 'DevForge Agency', city: 'Bucharest', country: 'Romania', type: 'IT Agency', verified: true, rating: 4.9, reviewCount: 62, services: 'Software Development, QA & Testing, DevOps', tech: ['Python', 'Django', 'React', 'AWS', 'Docker'], model: 'Long-term / Short-term', rateRange: '£2,400–£3,600/mo', teamSize: '31 people', timezone: '+2hrs (EET)', ir35: false, available: false, responseTime: '6 hours', engagements: 38 },
  '4': { id: '4', name: 'ScaleTeam UK', city: 'Manchester', country: 'UK', type: 'Dedicated Team', verified: true, rating: 4.7, reviewCount: 19, services: 'Staff Augmentation, Software Development', tech: ['Java', 'Spring Boot', 'Kubernetes', 'GCP'], model: 'Long-term', rateRange: '£4,500–£6,000/mo', teamSize: '42 people', timezone: 'Same (GMT)', ir35: true, available: true, responseTime: '3 hours', engagements: 11 },
};

const ROWS = [
  { key: 'type', label: 'Vendor Type' },
  { key: 'services', label: 'Service Categories' },
  { key: 'tech', label: 'Tech Stack', isTags: true },
  { key: 'model', label: 'Engagement Model' },
  { key: 'rateRange', label: 'Monthly Rate Range' },
  { key: 'teamSize', label: 'Team Size' },
  { key: 'timezone', label: 'Timezone (vs UK)' },
  { key: 'ir35', label: 'IR35 Compliant', isBool: true },
  { key: 'available', label: 'Available Now', isBool: true },
  { key: 'responseTime', label: 'Avg. Response Time' },
  { key: 'engagements', label: 'Engagements Completed' },
];

const TYPE_COLOURS: Record<string, string> = {
  'MSP': 'bg-blue-100 text-blue-700',
  'IT Agency': 'bg-green-100 text-green-700',
  'Dedicated Team': 'bg-purple-100 text-purple-700',
  'Staff Aug': 'bg-amber-100 text-amber-700',
};

const ComparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 4);
  const vendors = ids.map(id => MOCK_VENDORS[id]).filter(Boolean);

  if (vendors.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">No vendors to compare</h1>
          <p className="text-gray-500 mb-6">Select at least 2 vendors from the results page to compare them.</p>
          <Link to="/results" className="inline-flex items-center gap-2 text-[#0070F3] font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Search Results
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/results" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Back to results
          </Link>
          <h1 className="text-2xl font-bold text-[#0B2D59]">Compare Vendors</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-44 py-4 px-5 text-left text-sm font-semibold text-gray-400 bg-gray-50 border-b border-r border-gray-100">
                  Attribute
                </th>
                {vendors.map(v => (
                  <th key={v.id} className="py-5 px-5 border-b border-r last:border-r-0 border-gray-100 bg-white min-w-52">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-[#0070F3] font-bold text-sm flex-shrink-0">
                        {v.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-[#0B2D59] text-sm">{v.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {v.verified && <span className="flex items-center gap-0.5 text-xs text-[#0070F3]"><ShieldCheck className="h-3 w-3" /> Verified</span>}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOURS[v.type] || 'bg-gray-100 text-gray-600'}`}>{v.type}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <span>★ {v.rating}</span>
                          <span>({v.reviewCount})</span>
                        </div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ key, label, isTags, isBool }) => (
                <tr key={key} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-4 px-5 text-xs font-semibold text-gray-500 bg-gray-50 border-r border-gray-100 align-top">{label}</td>
                  {vendors.map(v => (
                    <td key={v.id} className="py-4 px-5 border-r last:border-r-0 border-gray-100 text-sm text-gray-700 align-top">
                      {isBool ? (
                        v[key]
                          ? <span className="flex items-center gap-1 text-green-600 font-medium"><Check className="h-4 w-4" /> Yes</span>
                          : <span className="flex items-center gap-1 text-gray-400"><X className="h-4 w-4" /> No</span>
                      ) : isTags ? (
                        <div className="flex flex-wrap gap-1">
                          {(v[key] as string[]).map((t: string) => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)}
                        </div>
                      ) : (
                        <span>{v[key]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Actions row */}
              <tr>
                <td className="py-5 px-5 bg-gray-50 border-r border-gray-100" />
                {vendors.map(v => (
                  <td key={v.id} className="py-5 px-5 border-r last:border-r-0 border-gray-100">
                    <div className="space-y-2">
                      <Link to={`/vendor/profile/${v.id}`} className="block w-full py-2 text-center bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        View Profile
                      </Link>
                      <Link to={`/vendor/profile/${v.id}`} className="block w-full py-2 text-center border border-[#0070F3] text-[#0070F3] text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                        Request Proposal
                      </Link>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;
