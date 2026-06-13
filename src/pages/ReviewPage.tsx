import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, Star, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange: (val: number) => void;
}

// ─── Star Rating Component ─────────────────────────────────────────────────────

function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-7 w-7 cursor-pointer transition-transform hover:scale-110 ${
            star <= (hovered || value)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        />
      ))}
    </div>
  );
}

// ─── Buyer Criteria ───────────────────────────────────────────────────────────

const BUYER_CRITERIA = [
  'Quality of work',
  'Communication',
  'Timeliness',
  'Professionalism',
  'Overall',
];

// ─── Vendor Criteria ──────────────────────────────────────────────────────────

const VENDOR_CRITERIA = [
  { key: 'Clarity of Brief', label: 'Clarity of Brief' },
  { key: 'Communication', label: 'Communication' },
  {
    key: 'Payment Reliability',
    label: 'Payment Reliability',
    sublabel: "Payment Reliability — this feeds the buyer's public payment badge",
  },
  { key: 'Professionalism', label: 'Professionalism' },
  { key: 'Overall', label: 'Overall' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') ?? 'buyer';
  const engagement = searchParams.get('engagement') ?? '';
  const counterparty = searchParams.get('counterparty') ?? 'the counterparty';

  const { user } = useAuth();

  const criteriaKeys =
    role === 'buyer'
      ? BUYER_CRITERIA
      : VENDOR_CRITERIA.map((c) => c.key);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const allRated = criteriaKeys.every((k) => (ratings[k] ?? 0) > 0);
  const canSubmit = allRated && reviewText.trim().length >= 50 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !user) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const ratingValues = criteriaKeys.map((k) => ratings[k] ?? 0);
      const avgRating = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;

      const reviewRecord: Record<string, unknown> = {
        rating: Math.round(avgRating * 10) / 10,
        comment: reviewText,
        would_recommend: true,
        project_id: engagement || null,
      };

      if (role === 'buyer') {
        reviewRecord.customer_id = user.id;
        reviewRecord.vendor_id = counterparty || null;
      } else {
        reviewRecord.vendor_id = user.id;
        reviewRecord.customer_id = counterparty || null;
      }

      const { error } = await supabase.from('reviews').insert(reviewRecord);

      if (error) throw error;

      setSubmitted(true);
    } catch (err) {
      console.error('ReviewPage submit error:', err);
      setErrorMsg('Failed to submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-xl w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0B2D59] mb-2">Review submitted</h2>
          <p className="text-gray-600 mb-6">
            Thank you. Your review will be published on{' '}
            <span className="font-medium">{counterparty}</span>'s profile.
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-[#0070F3] text-white rounded-xl px-6 py-3 font-medium hover:bg-blue-600 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Review form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-xl w-full">
        {/* Header */}
        <h1 className="text-2xl font-bold text-[#0B2D59] mb-1">Leave a Review</h1>
        <p className="text-sm text-gray-500 mb-4">
          {counterparty}
        </p>

        {/* 14-day window notice */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-start gap-2 mb-6">
          <Clock className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            You have 12 days remaining to leave a review. After 14 days, this window closes
            automatically.
          </p>
        </div>

        {/* Error toast */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Star criteria */}
          <div className="space-y-5 mb-6">
            {role === 'buyer'
              ? BUYER_CRITERIA.map((criterion) => (
                  <div key={criterion} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-gray-700 w-40 shrink-0">
                      {criterion}
                    </span>
                    <StarRating
                      value={ratings[criterion] ?? 0}
                      onChange={(val) =>
                        setRatings((prev) => ({ ...prev, [criterion]: val }))
                      }
                    />
                  </div>
                ))
              : VENDOR_CRITERIA.map((criterion) => (
                  <div key={criterion.key}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-gray-700 w-48 shrink-0">
                        {criterion.sublabel ?? criterion.label}
                      </span>
                      <StarRating
                        value={ratings[criterion.key] ?? 0}
                        onChange={(val) =>
                          setRatings((prev) => ({ ...prev, [criterion.key]: val }))
                        }
                      />
                    </div>
                  </div>
                ))}
          </div>

          {/* Written review */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {role === 'buyer'
                ? 'Your review (minimum 50 characters)'
                : 'Your review of this buyer (shown on their public profile)'}
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {role === 'buyer'
                ? 'Visible to vendor and shown on their public profile'
                : undefined}
            </p>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
              rows={5}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience..."
              required
            />
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs ${
                  reviewText.trim().length >= 50 ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {reviewText.trim().length} / 50 characters minimum
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-[#0070F3] text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Review →'}
          </button>
        </form>

        {/* Skip */}
        <Link
          to="/dashboard"
          className="text-sm text-gray-400 hover:text-gray-600 text-center block mt-4 transition-colors"
        >
          Skip — I don't want to leave a review
        </Link>
      </div>
    </div>
  );
}
