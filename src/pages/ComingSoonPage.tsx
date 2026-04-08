import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';

const pageTitles: Record<string, { title: string; subtitle: string; launch: string }> = {
  '/freelancers': {
    title: 'Freelancer Marketplace',
    subtitle: 'Individual freelancer marketplace for short-term and task-based work.',
    launch: 'Launching Q3 2026',
  },
  '/market-insight': {
    title: 'Market Insight',
    subtitle: 'Live market data, rate benchmarks, and demand signals across all IT outsourcing categories.',
    launch: 'Launching Q2 2026',
  },
  '/ai-services': {
    title: 'AI Services',
    subtitle: 'Discover AI-powered service packages and automation solutions from verified vendors.',
    launch: 'Launching Q4 2026',
  },
};

const ComingSoonPage: React.FC = () => {
  const location = useLocation();
  const meta = pageTitles[location.pathname] ?? {
    title: 'Coming Soon',
    subtitle: 'This feature is currently in development.',
    launch: 'Launching soon',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="h-8 w-8 text-[#0070F3]" />
        </div>
        <h1 className="text-3xl font-bold text-[#0B2D59] mb-3">{meta.title}</h1>
        <p className="text-gray-500 text-lg mb-4">{meta.subtitle}</p>
        <span className="inline-block bg-blue-50 text-[#0070F3] text-sm font-semibold px-4 py-2 rounded-full mb-8">
          {meta.launch}
        </span>
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-[#0070F3] font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
