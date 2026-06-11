import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<Props> = ({ title, description }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Clock className="h-8 w-8 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-[#0B2D59] mb-3">{title}</h1>
      <p className="text-gray-500 mb-6">{description || 'This page is coming soon. Check back shortly.'}</p>
      <Link to="/" className="inline-block px-6 py-3 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
        Back to Home
      </Link>
    </div>
  </div>
);

export default PlaceholderPage;
