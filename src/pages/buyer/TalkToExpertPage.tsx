import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import BuyerLayout from '../../components/buyer/BuyerLayout';

const TOPICS = [
  'Choosing an engagement model',
  'Contract / IR35 question',
  'Vendor selection help',
  'Pricing & budgeting',
  'Other',
];

interface ConsultationRequest {
  id: string;
  topic: string;
  preferred_time: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-blue-50 text-[#0070F3] border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const TalkToExpertPage: React.FC = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoadingRequests(true);
    const { data } = await supabase
      .from('consultation_requests')
      .select('*')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });
    setRequests(data ?? []);
    setLoadingRequests(false);
  }, [user]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const resetForm = () => {
    setTopic(TOPICS[0]);
    setPreferredTime('');
    setNotes('');
    setSubmitted(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('consultation_requests').insert({
      buyer_id: user.id,
      topic,
      preferred_time: preferredTime.trim() || null,
      notes: notes.trim() || null,
    });

    setSubmitting(false);
    if (insertError) {
      setError('Something went wrong submitting your request. Please try again.');
      return;
    }
    setSubmitted(true);
    loadRequests();
  };

  return (
    <BuyerLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-5 w-5 text-blue-300" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B2D59]">Talk to an Expert</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8 ml-14">
          Tell us what you need help with and a Collabov specialist will reach out.
        </p>

        <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-8">
          {submitted ? (
            <div className="text-center py-8">
              <div className="bg-emerald-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-[#0B2D59] mb-2">Request received</h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                Thanks — a Collabov specialist will reach out within 1 business day.
              </p>
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0070F3] hover:underline"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold tracking-[0.1em] uppercase text-gray-500 mb-2">
                  Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                >
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold tracking-[0.1em] uppercase text-gray-500 mb-2">
                  Preferred time
                </label>
                <input
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="e.g. Weekday afternoons, GMT"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-[0.1em] uppercase text-gray-500 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Anything else that would help us prepare..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-[#0070F3] text-white text-sm font-semibold rounded-xl px-6 py-3 hover:bg-blue-600 transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send request
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {!loadingRequests && requests.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-gray-500 mb-3">
              Your past requests
            </h2>
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border-2 border-slate-100 p-5 flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0B2D59]">{r.topic}</p>
                    {r.preferred_time && (
                      <p className="text-xs text-gray-500 mt-1">Preferred time: {r.preferred_time}</p>
                    )}
                    {r.notes && <p className="text-xs text-gray-500 mt-1">{r.notes}</p>}
                    <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border whitespace-nowrap ${STATUS_STYLES[r.status] ?? STATUS_STYLES.pending}`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default TalkToExpertPage;
