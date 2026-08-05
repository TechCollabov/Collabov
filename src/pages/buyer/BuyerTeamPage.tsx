import React, { useEffect, useState, useCallback } from 'react';
import { Users, Star, X, UserPlus, Trash2, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import BuyerLayout from '../../components/buyer/BuyerLayout';

// ─── Types ──────────────────────────────────────────────────────────────────

interface EngagementRow {
  id: string;
  vendor_id: string;
  status: string;
  assigned_employee_id: string | null;
}

interface VendorEmployeeRow {
  id: string;
  vendor_id: string;
  name: string;
  job_title: string | null;
  seniority: string | null;
}

interface VendorRow {
  id: string;
  company_name: string;
}

interface InvitationRow {
  id: string;
  invited_name: string;
  invited_email: string;
  role: string;
  status: string;
  created_at: string;
}

interface ReviewRow {
  id: string;
  engagement_id: string;
  employee_id: string;
  buyer_id: string;
  rating: number;
  comment: string | null;
}

interface TeamMember {
  engagementId: string;
  engagementStatus: string;
  employee: VendorEmployeeRow;
  vendor: VendorRow | null;
  avgRating: number | null;
  reviewCount: number;
  myReview: ReviewRow | null;
}

const ACTIVE_STATUSES = new Set(['active', 'pending_signature', 'pending_ir35', 'closing']);
const FORMER_STATUSES = new Set(['closed', 'terminated']);

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  pending_signature: 'Pending Signature',
  pending_ir35: 'Pending IR35',
  closing: 'Closing',
  closed: 'Closed',
  terminated: 'Terminated',
};

// ─── Star rating display ────────────────────────────────────────────────────

const StarRating: React.FC<{ value: number; size?: number }> = ({ value, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        style={{ width: size, height: size }}
        className={n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
      />
    ))}
  </div>
);

// ─── Rate modal ─────────────────────────────────────────────────────────────

interface RateModalProps {
  member: TeamMember;
  onClose: () => void;
  onSaved: (review: ReviewRow) => void;
  buyerId: string;
}

const RateModal: React.FC<RateModalProps> = ({ member, onClose, onSaved, buyerId }) => {
  const [rating, setRating] = useState(member.myReview?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(member.myReview?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating < 1) {
      setError('Please select a star rating.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data, error: upsertError } = await supabase
        .from('employee_reviews')
        .upsert(
          {
            engagement_id: member.engagementId,
            employee_id: member.employee.id,
            buyer_id: buyerId,
            rating,
            comment: comment.trim() || null,
          },
          { onConflict: 'engagement_id,employee_id,buyer_id' }
        )
        .select()
        .single();

      if (upsertError) throw upsertError;
      onSaved(data as ReviewRow);
      onClose();
    } catch (err) {
      console.error('Failed to save review', err);
      setError('Could not save your review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#0B2D59]">Rate {member.employee.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(n)}
              className="p-0.5"
            >
              <Star
                className={`h-7 w-7 ${
                  n <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] mb-3"
        />

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-[#0070F3] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

// ─── Team member card ───────────────────────────────────────────────────────

const TeamMemberCard: React.FC<{ member: TeamMember; onRate: () => void }> = ({ member, onRate }) => (
  <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#0B2D59] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
        {getInitials(member.employee.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{member.employee.name}</p>
        <p className="text-xs text-gray-400 truncate">
          {[member.employee.job_title, member.employee.seniority].filter(Boolean).join(' · ') || 'No title on file'}
        </p>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
        {STATUS_LABELS[member.engagementStatus] ?? member.engagementStatus}
      </span>
    </div>

    <p className="text-xs text-gray-500">{member.vendor?.company_name ?? 'Unknown vendor'}</p>

    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
      {member.reviewCount > 0 ? (
        <div className="flex items-center gap-2">
          <StarRating value={member.avgRating ?? 0} />
          <span className="text-xs text-gray-400">
            {member.avgRating?.toFixed(1)} ({member.reviewCount})
          </span>
        </div>
      ) : (
        <span className="text-xs text-gray-400">No reviews yet</span>
      )}
      <button
        onClick={onRate}
        className="text-xs font-semibold text-[#0070F3] hover:underline"
      >
        {member.myReview ? 'Edit Rating' : 'Rate'}
      </button>
    </div>
  </div>
);

// ─── Page ───────────────────────────────────────────────────────────────────

const BuyerTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [rateTarget, setRateTarget] = useState<TeamMember | null>(null);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);

  const loadInvitations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('buyer_team_invitations')
      .select('id, invited_name, invited_email, role, status, created_at')
      .eq('buyer_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setInvitations(data || []);
  }, [user]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const revokeInvitation = async (id: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== id));
    await supabase.from('buyer_team_invitations').update({ status: 'revoked' }).eq('id', id);
  };

  const loadTeam = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: engagements, error: engError } = await supabase
        .from('engagements')
        .select('id, vendor_id, status, assigned_employee_id')
        .eq('buyer_id', user.id);

      if (engError) throw engError;

      const assigned = (engagements ?? []).filter(
        (e): e is EngagementRow & { assigned_employee_id: string } => !!e.assigned_employee_id
      );

      if (assigned.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const employeeIds = Array.from(new Set(assigned.map((e) => e.assigned_employee_id)));
      const vendorIds = Array.from(new Set(assigned.map((e) => e.vendor_id)));

      const [{ data: employees, error: empError }, { data: vendors, error: vendorError }, { data: myReviews, error: reviewError }] =
        await Promise.all([
          supabase.from('vendor_employees').select('id, vendor_id, name, job_title, seniority').in('id', employeeIds),
          supabase.from('vendors').select('id, company_name').in('id', vendorIds),
          supabase.from('employee_reviews').select('id, engagement_id, employee_id, buyer_id, rating, comment').eq('buyer_id', user.id),
        ]);

      if (empError) throw empError;
      if (vendorError) throw vendorError;
      if (reviewError) throw reviewError;

      const { data: allReviews, error: allReviewsError } = await supabase
        .from('employee_reviews')
        .select('employee_id, rating')
        .in('employee_id', employeeIds);

      if (allReviewsError) throw allReviewsError;

      const employeeMap = new Map<string, VendorEmployeeRow>((employees ?? []).map((e) => [e.id, e]));
      const vendorMap = new Map<string, VendorRow>((vendors ?? []).map((v) => [v.id, v]));
      const myReviewMap = new Map<string, ReviewRow>(
        (myReviews ?? []).map((r) => [`${r.engagement_id}:${r.employee_id}`, r as ReviewRow])
      );

      const ratingsByEmployee = new Map<string, number[]>();
      (allReviews ?? []).forEach((r: { employee_id: string; rating: number }) => {
        const list = ratingsByEmployee.get(r.employee_id) ?? [];
        list.push(r.rating);
        ratingsByEmployee.set(r.employee_id, list);
      });

      const built: TeamMember[] = assigned
        .map((eng) => {
          const employee = employeeMap.get(eng.assigned_employee_id);
          if (!employee) return null;
          const ratings = ratingsByEmployee.get(employee.id) ?? [];
          const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
          return {
            engagementId: eng.id,
            engagementStatus: eng.status,
            employee,
            vendor: vendorMap.get(eng.vendor_id) ?? null,
            avgRating,
            reviewCount: ratings.length,
            myReview: myReviewMap.get(`${eng.id}:${employee.id}`) ?? null,
          } as TeamMember;
        })
        .filter((m): m is TeamMember => m !== null);

      setMembers(built);
    } catch (err) {
      console.error('Failed to load team', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleReviewSaved = (review: ReviewRow) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.engagementId !== review.engagement_id || m.employee.id !== review.employee_id) return m;
        const hadMine = !!m.myReview;
        // Recompute average locally: replace/add this buyer's rating in the running count.
        const priorCount = hadMine ? m.reviewCount - 1 : m.reviewCount;
        const priorSum = (m.avgRating ?? 0) * priorCount - (hadMine && m.myReview ? m.myReview.rating : 0);
        const newSum = priorSum + review.rating;
        const newCount = priorCount + 1;
        return {
          ...m,
          myReview: review,
          reviewCount: newCount,
          avgRating: newCount > 0 ? newSum / newCount : null,
        };
      })
    );
  };

  const activeMembers = members.filter((m) => ACTIVE_STATUSES.has(m.engagementStatus));
  const formerMembers = members.filter((m) => FORMER_STATUSES.has(m.engagementStatus));

  return (
    <BuyerLayout>
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
          <Users className="h-5 w-5 text-blue-300" />
        </div>
        <div>
          <h1 className="text-2xl font-black italic text-[#0B2D59]">My Team</h1>
          <p className="text-xs text-gray-400">Vendor employees assigned across your engagements</p>
        </div>
      </div>

      {invitations.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-gray-400 mb-4">
            Pending Invitations ({invitations.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitations.map((inv) => (
              <div key={inv.id} className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 p-5 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{inv.invited_name}</p>
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {inv.invited_email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-100">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 capitalize">
                    {inv.role} · Pending
                  </span>
                  <button
                    onClick={() => revokeInvitation(inv.id)}
                    className="text-xs font-semibold text-red-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Loading your team...</p>
      ) : members.length === 0 && invitations.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-12 text-center">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-400">
            No team members assigned yet — once a vendor assigns staff to your engagement, they'll show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-gray-400 mb-4">
              Active Team ({activeMembers.length})
            </h2>
            {activeMembers.length === 0 ? (
              <p className="text-sm text-gray-400">No active team members.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMembers.map((m) => (
                  <TeamMemberCard key={`${m.engagementId}-${m.employee.id}`} member={m} onRate={() => setRateTarget(m)} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-gray-400 mb-4">
              Former Team ({formerMembers.length})
            </h2>
            {formerMembers.length === 0 ? (
              <p className="text-sm text-gray-400">No former team members.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {formerMembers.map((m) => (
                  <TeamMemberCard key={`${m.engagementId}-${m.employee.id}`} member={m} onRate={() => setRateTarget(m)} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {rateTarget && user && (
        <RateModal
          member={rateTarget}
          buyerId={user.id}
          onClose={() => setRateTarget(null)}
          onSaved={handleReviewSaved}
        />
      )}
    </BuyerLayout>
  );
};

export default BuyerTeamPage;
