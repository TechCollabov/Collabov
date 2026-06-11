import React, { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';

const OUTPUT_OPTIONS = [
  { id: 'spec', label: 'Technical specification document' },
  { id: 'prototype', label: 'Prototype' },
  { id: 'feasibility', label: 'Feasibility report' },
  { id: 'all', label: 'All three' },
];

const VENDOR_NAME = 'TechForge Solutions';

const DiscoveryBriefPage: React.FC = () => {
  const [description, setDescription] = useState('');
  const [outputs, setOutputs] = useState<Set<string>>(new Set());
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleOutput = (id: string) => {
    setOutputs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const canSubmit = description.length >= 100 && outputs.size >= 1 && budget.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#0B2D59] mb-2">Discovery Brief Sent</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Discovery brief sent to <strong>{VENDOR_NAME}</strong>. You'll receive their proposal within 4 hours.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 text-sm text-[#0070F3] hover:text-blue-700 font-semibold"
          >
            Send another brief
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0B2D59] mb-2">Start with a Discovery</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Commission a technical specification from a verified IT agency.{' '}
            <span className="font-semibold text-gray-700">Typical cost: £1,500–£5,000.</span>{' '}
            Deliverable: full project specification.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Describe the project or problem you need scoped
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              placeholder="Explain what you're trying to build or solve. The more detail you provide, the more accurate the scoping will be."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none font-sans"
            />
            <div className={`text-xs mt-1 ${description.length < 100 ? 'text-red-500' : 'text-gray-400'}`}>
              {description.length} / 100 characters minimum
            </div>
          </div>

          {/* Output expected */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-3">
              Output expected <span className="font-normal text-gray-500">(select at least one)</span>
            </label>
            <div className="space-y-2">
              {OUTPUT_OPTIONS.map(opt => {
                const selected = outputs.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleOutput(opt.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left ${
                      selected
                        ? 'border-[#0070F3] bg-blue-50 text-[#0070F3]'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {selected ? (
                      <CheckSquare className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 flex-shrink-0 text-gray-300" />
                    )}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Budget for discovery (£)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">£</span>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="2500"
                min="0"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">Typical range: £1,500–£5,000</div>
          </div>

          {/* Start date */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Start date <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 bg-[#0070F3] text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            Send Discovery Brief
          </button>
        </form>
      </div>
    </div>
  );
};

export default DiscoveryBriefPage;
