import React, { useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface RFP {
  title: string;
  description: string;
  budget_from: number;
  budget_to: number;
  service_type: string;
  buyer_type: string;
  buyer_location: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  amount: string;
  target_date: string;
}

interface ProposalFormProps {
  rfp: RFP;
  onSubmit: (proposal: any) => void;
  onCancel: () => void;
}

const ProposalForm: React.FC<ProposalFormProps> = ({ rfp, onSubmit, onCancel }) => {
  const [approach, setApproach] = useState('');
  const [team, setTeam] = useState('');
  const [assumptions, setAssumptions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', name: '', description: '', amount: '', target_date: '' },
    { id: '2', name: '', description: '', amount: '', target_date: '' },
  ]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const totalAmount = milestones.reduce((sum, m) => {
    const val = parseFloat(m.amount) || 0;
    return sum + val;
  }, 0);

  const budgetMid = (rfp.budget_from + rfp.budget_to) / 2;
  const variance = totalAmount - rfp.budget_to;
  const getBudgetVariance = () => {
    if (totalAmount === 0) return null;
    if (totalAmount <= rfp.budget_to) return { label: 'Within budget', color: 'text-green-600 bg-green-50' };
    if (totalAmount <= rfp.budget_to * 1.1) return { label: 'Slightly over budget', color: 'text-amber-600 bg-amber-50' };
    return { label: 'Over budget', color: 'text-red-600 bg-red-50' };
  };
  const budgetVariance = getBudgetVariance();

  const addMilestone = () => {
    setMilestones(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', description: '', amount: '', target_date: '' },
    ]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length <= 2) return;
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleAiDraft = async () => {
    setAiLoading(true);
    try {
      const prompt = `Write a professional 150-200 word proposal approach for this RFP: ${rfp.description}. Service: ${rfp.service_type}. Be specific and professional.`;
      const { data: envelope, error } = await supabase.functions.invoke('anthropic-generate', {
        body: { prompt, maxTokens: 400, model: 'claude-3-haiku-20240307', feature: 'proposal_draft' },
      });
      if (error) throw error;
      const text: string = envelope?.text || '';
      if (text) setApproach(text);
      else throw new Error('Empty response');
    } catch {
      showToast('AI suggestions unavailable — enter manually');
    } finally {
      setAiLoading(false);
    }
  };

  const canSubmit = approach.length >= 150 && milestones.filter(m => m.name.trim()).length >= 2;

  const handleSubmit = () => {
    onSubmit({
      approach,
      team,
      assumptions,
      exclusions,
      milestones,
      total: totalAmount,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-amber-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <h2 className="text-xl font-bold text-[#0B2D59] mb-6">Submit Proposal</h2>

      {/* RFP Summary */}
      <div className="bg-gray-50 rounded-xl p-5 mb-6">
        <div className="font-semibold text-gray-900 mb-1">RFP: {rfp.title}</div>
        <div className="text-sm text-gray-600 mb-2">
          Service: {rfp.service_type} · Budget: £{rfp.budget_from.toLocaleString()}–£{rfp.budget_to.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">{rfp.description}</div>
      </div>

      {/* Approach */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">
            Your approach — how will you deliver this?
          </label>
          <button
            onClick={handleAiDraft}
            disabled={aiLoading}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0070F3] border border-[#0070F3] px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {aiLoading ? 'Drafting...' : 'Draft with AI'}
          </button>
        </div>
        <textarea
          value={approach}
          onChange={e => setApproach(e.target.value)}
          rows={6}
          placeholder="Describe your approach in detail. Minimum 150 characters."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none font-sans"
        />
        <div className={`text-xs mt-1 ${approach.length < 150 ? 'text-red-500' : 'text-gray-400'}`}>
          {approach.length} / 150 characters minimum
        </div>
      </div>

      {/* Team */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-gray-700 block mb-2">
          Proposed team <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={team}
          onChange={e => setTeam(e.target.value)}
          rows={3}
          placeholder="Name team members who will work on this project, or describe your team composition"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
        />
      </div>

      {/* Milestones */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-gray-700 block mb-3">Milestone structure</label>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 font-semibold">
              <tr>
                <th className="text-left px-3 py-2">Milestone name</th>
                <th className="text-left px-3 py-2">Description</th>
                <th className="text-left px-3 py-2 w-28">Amount (£)</th>
                <th className="text-left px-3 py-2 w-36">Target date</th>
                <th className="px-3 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m, idx) => (
                <tr key={m.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={m.name}
                      onChange={e => updateMilestone(m.id, 'name', e.target.value)}
                      placeholder={`Milestone ${idx + 1}`}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0070F3]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={m.description}
                      onChange={e => updateMilestone(m.id, 'description', e.target.value)}
                      placeholder="Brief description"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0070F3]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={m.amount}
                      onChange={e => updateMilestone(m.id, 'amount', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0070F3]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={m.target_date}
                      onChange={e => updateMilestone(m.id, 'target_date', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0070F3]"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => removeMilestone(m.id)}
                      disabled={milestones.length <= 2}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={addMilestone}
          className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[#0070F3] hover:text-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add milestone
        </button>

        {/* Total */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm font-semibold text-gray-700">Total</div>
          <div className="flex items-center gap-3">
            {budgetVariance && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${budgetVariance.color}`}>
                {budgetVariance.label}
              </span>
            )}
            <span className="text-xl font-bold text-[#0B2D59]">
              £{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Total price (read-only) */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-gray-700 block mb-2">Total price</label>
        <div className="bg-gray-50 rounded-xl px-4 py-3 text-xl font-bold text-[#0070F3]">
          £{totalAmount.toLocaleString()}
        </div>
      </div>

      {/* Assumptions */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-gray-700 block mb-2">
          Assumptions <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={assumptions}
          onChange={e => setAssumptions(e.target.value)}
          rows={3}
          placeholder="List any assumptions your proposal is based on"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
        />
      </div>

      {/* Exclusions */}
      <div className="mb-8">
        <label className="text-sm font-semibold text-gray-700 block mb-2">
          Exclusions <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={exclusions}
          onChange={e => setExclusions(e.target.value)}
          rows={3}
          placeholder="What is specifically not included in this proposal"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-6 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send Proposal
        </button>
        <button
          onClick={() => onSubmit({ draft: true, approach, team, assumptions, exclusions, milestones, total: totalAmount })}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Save as Draft
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ProposalForm;
