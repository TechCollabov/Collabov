import { supabase } from './supabase';

/*
 * Shared workflow rules and state-machine helpers for the vendor/customer
 * journeys. All money movement and signatures are simulated in-platform:
 * escrow_transactions rows record what Stripe would do, and signing is an
 * in-app action. Time-driven transitions ("crons" in the journey docs) are
 * applied lazily by sweep helpers that pages call on load.
 */

// ── Platform rules ────────────────────────────────────────────────────────────

export const PLATFORM_FEE_PCT = 10;
export const AUTO_RELEASE_DAYS = 7;
export const AUTO_RELEASE_WARNING_DAY = 5;
export const FLAG_RESPONSE_DAYS = 5;
export const CHANGE_REQUEST_RESPONSE_DAYS = 7;
export const DISPUTE_BILATERAL_HOURS = 72;
export const PROPOSAL_EXPIRY_DAYS = 30;
export const PROPOSAL_WARNING_DAY = 25;
export const INTERVIEW_RESPONSE_HOURS = 48;
export const REVIEW_WINDOW_DAYS = 14;
export const DEFECT_LIABILITY_DAYS = 30;
export const REPLACEMENT_SLA_BUSINESS_DAYS = 10;
export const REHIRE_PROMPT_DAYS = 30;
export const PARTNER_INVITE_EXPIRY_DAYS = 7;

export const NOTICE_PERIOD_DAYS: Record<string, number> = {
  msp: 30,
  agency: 14,
  staffaug: 28, // 4 weeks
};

export const VENDOR_CONTRACT_TEMPLATE: Record<string, string> = {
  msp: 'Managed Service Agreement + SLA Schedule',
  agency: 'Project Delivery Contract (defect liability + UAT)',
  staffaug: 'Resource Supply Agreement + IR35 SDS Schedule 2',
};

export const MSP_CHECKIN_CRITERIA = [
  'Uptime / availability',
  'Avg ticket response',
  'First-call resolution',
  'Patch compliance',
  'Overall satisfaction',
];

export const STAFFAUG_CHECKIN_CRITERIA = [
  'Performance',
  'Communication',
  'Task delivery',
  'Availability adherence',
  'Overall satisfaction',
];

export const BUYER_REVIEW_CRITERIA = [
  'Quality',
  'Communication',
  'Timeliness',
  'Professionalism',
  'Overall',
];

export const VENDOR_REVIEW_CRITERIA = [
  'Clarity of Brief',
  'Communication',
  'Payment Reliability',
  'Professionalism',
  'Overall',
];

export interface NotificationEventDef { key: string; label: string; forced: boolean }
export const NOTIFICATION_EVENTS: NotificationEventDef[] = [
  { key: 'dispute', label: 'Dispute opened / resolved', forced: true },
  { key: 'payment_failed', label: 'Payment failed', forced: true },
  { key: 'evidence_submitted', label: 'Evidence submitted', forced: true },
  { key: 'criteria_flagged', label: 'Criteria flagged', forced: true },
  { key: 'new_proposal', label: 'New proposal / enquiry', forced: false },
  { key: 'message', label: 'New message', forced: false },
  { key: 'milestone', label: 'Milestone status change', forced: false },
  { key: 'review', label: 'New review', forced: false },
];

export const DISPUTE_REASONS = [
  { value: 'scope_mismatch', label: 'Scope mismatch' },
  { value: 'delivery_quality', label: 'Delivery quality' },
  { value: 'payment', label: 'Payment dispute' },
  { value: 'timeline_breach', label: 'Timeline breach' },
  { value: 'non_delivery', label: 'Non-delivery' },
  { value: 'other', label: 'Other' },
];

// Personal email domains blocked at signup (business email rule)
export const PERSONAL_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

export function isBusinessEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return domain.length > 0 && !PERSONAL_EMAIL_DOMAINS.includes(domain);
}

/** Hard gate: the buyer can't spend (RFP, job, tender, BYOV, discovery,
 *  package purchase) until company name and country are filled in. */
export async function hasCompanyProfile(customerId: string): Promise<boolean> {
  const { data } = await supabase
    .from('customers')
    .select('company_name, country')
    .eq('id', customerId)
    .maybeSingle();
  return !!(data?.company_name?.trim() && data?.country?.trim());
}

export async function isCustomerBlacklisted(customerId: string): Promise<boolean> {
  const { data } = await supabase.from('customers').select('is_blacklisted').eq('id', customerId).maybeSingle();
  return !!data?.is_blacklisted;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function addHours(base: Date, hours: number): Date {
  const d = new Date(base);
  d.setHours(d.getHours() + hours);
  return d;
}

export function addBusinessDays(base: Date, businessDays: number): Date {
  const d = new Date(base);
  let remaining = businessDays;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return d;
}

export function hoursLeft(deadline: string | Date): number {
  return (new Date(deadline).getTime() - Date.now()) / 36e5;
}

export function daysLeft(deadline: string | Date): number {
  return hoursLeft(deadline) / 24;
}

// ── Money ─────────────────────────────────────────────────────────────────────

export function platformFee(gross: number): number {
  return Math.round(gross * PLATFORM_FEE_PCT) / 100;
}

export function netToVendor(gross: number): number {
  return Math.round((gross - platformFee(gross)) * 100) / 100;
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function nextInvoiceNumber(): string {
  // Time-ordered, unique enough for the simulated flow.
  return `INV-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

// ── Buyer payment badge ───────────────────────────────────────────────────────

export type PaymentBadge = 'green' | 'amber' | 'red';

export function paymentBadge(onTimeRate: number): PaymentBadge {
  if (onTimeRate >= 95) return 'green';
  if (onTimeRate >= 80) return 'amber';
  return 'red';
}

export const PAYMENT_BADGE_LABEL: Record<PaymentBadge, string> = {
  green: 'Reliable Payer',
  amber: 'Generally Reliable',
  red: 'Review before engaging',
};

// ── Off-platform contact detection ────────────────────────────────────────────

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(?:\+?\d[\s-]?){10,}/;
const SORT_CODE_RE = /\b\d{2}-\d{2}-\d{2}\b/;
const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/;

export function detectOffPlatformContact(text: string): boolean {
  return EMAIL_RE.test(text) || PHONE_RE.test(text) || SORT_CODE_RE.test(text) || IBAN_RE.test(text);
}

export const OFF_PLATFORM_WARNING =
  'Sharing contact or payment details may void your escrow protection.';

// ── Match score (rules-based, 100 points) ─────────────────────────────────────

export interface MatchScoreInput {
  serviceOverlap: boolean;
  techOverlap: number; // 0..1
  caseStudyIndustryMatch: boolean;
  caseStudyTechMatch: boolean;
  keywordMatch: boolean;
}

export function matchScore(m: MatchScoreInput): number {
  let score = 0;
  if (m.serviceOverlap) score += 30;
  score += Math.round(20 * Math.min(1, Math.max(0, m.techOverlap)));
  if (m.caseStudyIndustryMatch) score += 25;
  if (m.caseStudyTechMatch) score += 15;
  if (m.keywordMatch) score += 10;
  return score;
}

export function matchBand(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

// ── Escrow state machine ──────────────────────────────────────────────────────

export type EscrowStatus =
  | 'unfunded'
  | 'funded'
  | 'in_progress'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'in_dispute'
  | 'released'
  | 'refunded';

interface EngagementParties {
  id: string;
  buyer_id: string;
  vendor_id: string;
}

/** Buyer funds a milestone: money "moves" into escrow (simulated charge). */
export async function fundMilestone(
  engagement: EngagementParties,
  milestoneId: string,
  amount: number,
  cardLast4?: string
) {
  const now = new Date().toISOString();
  const { error: msErr } = await supabase
    .from('project_milestones')
    .update({ escrow_status: 'funded', funded_at: now })
    .eq('id', milestoneId);
  if (msErr) throw msErr;

  const { error: txErr } = await supabase.from('escrow_transactions').insert({
    engagement_id: engagement.id,
    milestone_id: milestoneId,
    buyer_id: engagement.buyer_id,
    vendor_id: engagement.vendor_id,
    transaction_type: 'fund',
    amount,
    card_last4: cardLast4 ?? null,
    status: 'completed',
  });
  if (txErr) throw txErr;

  await logEvent('milestone_funded', engagement.buyer_id, 'buyer', 'milestone', milestoneId, { amount });
}

/** Release escrow to the vendor: transfer + invoice (gross to buyer, net to vendor). */
export async function releaseMilestone(
  engagement: EngagementParties,
  milestone: { id: string; title: string; amount: number | null },
  options?: { reason?: 'accepted' | 'auto_release' | 'flag_silence'; periodLabel?: string }
) {
  const now = new Date().toISOString();
  const gross = milestone.amount ?? 0;
  const fee = platformFee(gross);

  const { error: msErr } = await supabase
    .from('project_milestones')
    .update({
      escrow_status: 'released',
      accepted_at: now,
      released_at: now,
      completed: true,
      completed_at: now,
    })
    .eq('id', milestone.id);
  if (msErr) throw msErr;

  const { error: txErr } = await supabase.from('escrow_transactions').insert({
    engagement_id: engagement.id,
    milestone_id: milestone.id,
    buyer_id: engagement.buyer_id,
    vendor_id: engagement.vendor_id,
    transaction_type: 'release',
    amount: gross,
    platform_fee_amount: fee,
    net_amount: gross - fee,
    reference: options?.reason ?? 'accepted',
    status: 'completed',
  });
  if (txErr) throw txErr;

  const { error: invErr } = await supabase.from('invoices').insert({
    invoice_number: nextInvoiceNumber(),
    engagement_id: engagement.id,
    milestone_id: milestone.id,
    buyer_id: engagement.buyer_id,
    vendor_id: engagement.vendor_id,
    description: milestone.title,
    period_label: options?.periodLabel ?? null,
    gross_amount: gross,
    platform_fee_pct: PLATFORM_FEE_PCT,
    platform_fee_amount: fee,
    net_amount: gross - fee,
    status: 'paid',
  });
  if (invErr) throw invErr;

  await logEvent('milestone_accepted', engagement.buyer_id, 'buyer', 'milestone', milestone.id, {
    amount: gross,
    reason: options?.reason ?? 'accepted',
  });
}

/** Refund unfunded/held escrow back to the buyer (termination / expiry). */
export async function refundMilestone(engagement: EngagementParties, milestoneId: string, amount: number) {
  const { error: msErr } = await supabase
    .from('project_milestones')
    .update({ escrow_status: 'refunded' })
    .eq('id', milestoneId);
  if (msErr) throw msErr;

  const { error: txErr } = await supabase.from('escrow_transactions').insert({
    engagement_id: engagement.id,
    milestone_id: milestoneId,
    buyer_id: engagement.buyer_id,
    vendor_id: engagement.vendor_id,
    transaction_type: 'refund',
    amount,
    status: 'completed',
  });
  if (txErr) throw txErr;
}

/**
 * Lazy "cron": auto-release any submitted milestone past its 7-day review
 * window (blocked while a dispute is open on it). Call from dashboards and
 * detail pages; safe to call repeatedly.
 */
export async function sweepAutoReleases(engagement: EngagementParties) {
  const { data: due } = await supabase
    .from('project_milestones')
    .select('id, title, amount, auto_release_at, escrow_status')
    .eq('engagement_id', engagement.id)
    .eq('escrow_status', 'submitted')
    .lt('auto_release_at', new Date().toISOString());

  for (const ms of due ?? []) {
    const { data: openDisputes } = await supabase
      .from('disputes')
      .select('id')
      .eq('milestone_id', ms.id)
      .neq('status', 'resolved')
      .limit(1);
    if (openDisputes && openDisputes.length > 0) continue; // frozen

    await releaseMilestone(engagement, ms, { reason: 'auto_release' });
  }
  return (due ?? []).length;
}

// ── Proposal lifecycle sweeps ────────────────────────────────────────────────

/** Expire sent proposals older than 30 days (buyer never triaged). */
export async function sweepProposalExpiry(vendorOrCustomerFilter: { vendor_id?: string; customer_id?: string }) {
  let query = supabase
    .from('proposals')
    .update({ workflow_state: 'expired' })
    .in('workflow_state', ['sent', 'keep', 'maybe'])
    .lt('expires_at', new Date().toISOString());
  if (vendorOrCustomerFilter.vendor_id) query = query.eq('vendor_id', vendorOrCustomerFilter.vendor_id);
  if (vendorOrCustomerFilter.customer_id) query = query.eq('customer_id', vendorOrCustomerFilter.customer_id);
  await query;
}

// ── Dispute helpers ───────────────────────────────────────────────────────────

export async function openDispute(params: {
  engagement: EngagementParties;
  milestoneId?: string | null;
  flagId?: string | null;
  openedBy: string;
  openedByRole: 'buyer' | 'vendor' | 'system';
  reason: string;
  description: string;
  escrowAmount: number;
}) {
  const deadline = addHours(new Date(), DISPUTE_BILATERAL_HOURS).toISOString();
  const { data, error } = await supabase
    .from('disputes')
    .insert({
      engagement_id: params.engagement.id,
      milestone_id: params.milestoneId ?? null,
      flag_id: params.flagId ?? null,
      buyer_id: params.engagement.buyer_id,
      vendor_id: params.engagement.vendor_id,
      opened_by: params.openedBy,
      opened_by_role: params.openedByRole,
      reason: params.reason,
      description: params.description,
      escrow_amount: params.escrowAmount,
      status: 'bilateral',
      bilateral_deadline: deadline,
    })
    .select()
    .single();
  if (error) throw error;

  if (params.milestoneId) {
    await supabase
      .from('project_milestones')
      .update({ escrow_status: 'in_dispute' })
      .eq('id', params.milestoneId);
  }

  await logEvent('dispute_opened', params.openedBy, params.openedByRole, 'dispute', data.id, {
    reason: params.reason,
  });
  return data;
}

/** Move bilateral disputes past the 72hr window into admin review. */
export async function sweepDisputeEscalation(engagementId?: string) {
  let query = supabase
    .from('disputes')
    .update({ status: 'admin_review' })
    .eq('status', 'bilateral')
    .lt('bilateral_deadline', new Date().toISOString());
  if (engagementId) query = query.eq('engagement_id', engagementId);
  await query;
}

/**
 * Flag sweep: vendor silent 5 days -> auto-dispute; handled where the
 * engagement context (escrow amount) is available. Buyer-silence release is
 * also applied here.
 */
export async function sweepFlagDeadlines(engagement: EngagementParties) {
  const { data: overdue } = await supabase
    .from('milestone_flags')
    .select('*')
    .eq('engagement_id', engagement.id)
    .in('status', ['open', 'vendor_responded'])
    .lt('respond_by', new Date().toISOString());

  for (const flag of overdue ?? []) {
    if (flag.status === 'open') {
      // Vendor never responded: auto-dispute, non-response logged.
      const { data: ms } = flag.milestone_id
        ? await supabase.from('project_milestones').select('id, title, amount').eq('id', flag.milestone_id).single()
        : { data: null };
      await supabase.from('milestone_flags').update({ status: 'escalated', resolved_at: new Date().toISOString() }).eq('id', flag.id);
      await openDispute({
        engagement,
        milestoneId: flag.milestone_id,
        flagId: flag.id,
        openedBy: engagement.buyer_id,
        openedByRole: 'system',
        reason: 'delivery_quality',
        description:
          'Auto-escalated: the vendor did not respond to flagged acceptance criteria within the 5-day clarification window. ' +
          'Original flag note: ' + (flag.note ?? 'none provided') + '.',
        escrowAmount: ms?.amount ?? 0,
      });
    } else {
      // Vendor responded, buyer silent 5 days: payment releases, silence logged.
      await supabase.from('milestone_flags').update({ status: 'released_on_silence', resolved_at: new Date().toISOString() }).eq('id', flag.id);
      if (flag.milestone_id) {
        const { data: ms } = await supabase
          .from('project_milestones')
          .select('id, title, amount, escrow_status')
          .eq('id', flag.milestone_id)
          .single();
        if (ms && ms.escrow_status === 'submitted') {
          await releaseMilestone(engagement, ms, { reason: 'flag_silence' });
        }
      }
    }
  }
}

// ── Calendar booking → RFP conversion (T+1 follow-up) ─────────────────────────

/**
 * Lazy "cron": the day after a booked discovery call, nudge both sides.
 * MSP/Agency: vendor is prompted to submit a proposal, buyer to request one
 * (or drop the vendor from the shortlist). Staff Aug: vendor confirms team
 * availability, buyer is prompted to request an interview instead.
 */
export async function sweepPendingEngagementFollowups(partyId: string) {
  const { data: due } = await supabase
    .from('pending_engagement')
    .select('*')
    .eq('status', 'scheduled')
    .or(`buyer_id.eq.${partyId},vendor_id.eq.${partyId}`)
    .lt('meeting_datetime', new Date().toISOString());

  for (const pe of due ?? []) {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('business_type, company_name')
      .eq('id', pe.vendor_id)
      .maybeSingle();
    const isStaffAug = vendor?.business_type === 'staffaug';

    await supabase.from('pending_engagement').update({ status: 'followed_up' }).eq('id', pe.id);

    if (isStaffAug) {
      await notify(pe.vendor_id, 'system', 'Confirm team availability',
        'Yesterday\'s call is done — confirm which team members are available so the buyer can request an interview.',
        '/vendor/dashboard/employees');
      await notify(pe.buyer_id, 'system', 'Request an interview',
        `Your call with ${vendor?.company_name ?? 'the vendor'} is done. Request an interview with an available team member.`,
        `/vendor/profile/${pe.vendor_id}`);
    } else {
      await notify(pe.vendor_id, 'system', 'Submit a proposal for your meeting',
        'Yesterday\'s discovery call is done — submit a proposal while it\'s fresh.',
        '/vendor/dashboard/enquiries');
      await notify(pe.buyer_id, 'system', 'Request a proposal or remove from shortlist',
        `Your call with ${vendor?.company_name ?? 'the vendor'} is done. Request a proposal, or remove them from your shortlist.`,
        `/vendor/profile/${pe.vendor_id}`);
    }
    await logEvent('pending_engagement_followup', partyId, 'system', 'pending_engagement', pe.id, { isStaffAug });
  }
}

// ── Re-hire prompt (30 days after close) ─────────────────────────────────────

/** Lazy "cron": 30 days after a clean close (no disputes, vendor available),
 *  prompt the buyer to re-engage. Idempotent via platform_event. */
export async function sweepRehirePrompts(buyerId: string) {
  const cutoff = addDays(new Date(), -REHIRE_PROMPT_DAYS).toISOString();
  const { data: closed } = await supabase
    .from('engagements')
    .select('id, vendor_id, project_title, closed_at, status')
    .eq('buyer_id', buyerId)
    .in('status', ['closed', 'closing'])
    .lt('closed_at', cutoff);

  for (const eng of closed ?? []) {
    const { data: already } = await supabase
      .from('platform_event')
      .select('event_id')
      .eq('event_type', 'rehire_prompted')
      .eq('entity_id', eng.id)
      .limit(1);
    if (already && already.length > 0) continue;

    const { data: hadDispute } = await supabase
      .from('disputes').select('id').eq('engagement_id', eng.id).limit(1);
    if (hadDispute && hadDispute.length > 0) continue;

    const { data: vendor } = await supabase
      .from('vendors').select('availability_status, company_name').eq('id', eng.vendor_id).maybeSingle();
    if (vendor && vendor.availability_status !== 'available') continue;

    await notify(buyerId, 'system', 'Ready to re-engage?',
      `It's been 30 days since "${eng.project_title}" closed with ${vendor?.company_name ?? 'your vendor'}. Re-hire with a pre-filled proposal or re-use the previous SOW from My Vendors.`,
      '/customer/my-vendors');
    await logEvent('rehire_prompted', buyerId, 'system', 'engagement', eng.id, {});
  }
}

// ── Buyer payment reliability ────────────────────────────────────────────────

/** Record a payment event against the buyer's public reliability badge.
 *  On-time = buyer actively accepted/confirmed; late = auto-release fired on
 *  silence or a charge was held/disputed. */
export async function recordPaymentEvent(customerId: string, onTime: boolean) {
  const { data: c } = await supabase
    .from('customers')
    .select('payment_events_count, late_payment_count')
    .eq('id', customerId)
    .single();
  if (!c) return;
  const total = (c.payment_events_count ?? 0) + 1;
  const late = (c.late_payment_count ?? 0) + (onTime ? 0 : 1);
  await supabase.from('customers').update({
    payment_events_count: total,
    late_payment_count: late,
    on_time_payment_rate: Math.round(((total - late) / total) * 10000) / 100,
  }).eq('id', customerId);
}

// ── Vendor + buyer blacklist ──────────────────────────────────────────────────

async function hasOpenDispute(entityId: string, role: 'vendor' | 'buyer'): Promise<boolean> {
  const column = role === 'vendor' ? 'vendor_id' : 'buyer_id';
  const { data } = await supabase.from('disputes').select('id').eq(column, entityId).neq('status', 'resolved').limit(1);
  return !!data && data.length > 0;
}

/**
 * Blacklist a vendor. If a dispute is currently open on the vendor, the
 * blacklist takes effect only once every one of their open disputes
 * resolves — blacklisting never forces an escrow release/refund, and it
 * shouldn't retroactively colour a resolution still in progress. Until
 * then blacklist_pending records the decision without touching
 * is_blacklisted.
 */
export async function blacklistVendor(vendorId: string, reason: string, adminId: string) {
  const deferred = await hasOpenDispute(vendorId, 'vendor');
  const patch = deferred
    ? { blacklist_pending: true, blacklist_reason: reason, blacklisted_by: adminId }
    : { is_blacklisted: true, blacklist_pending: false, blacklist_reason: reason, blacklisted_at: new Date().toISOString(), blacklisted_by: adminId, restoration_approvals: [] };
  await supabase.from('vendors').update(patch).eq('id', vendorId);
  await logEvent(deferred ? 'vendor_blacklist_deferred' : 'vendor_blacklisted', adminId, 'admin', 'vendor', vendorId, { reason });
}

/**
 * Restoration requires two distinct admin approvals. Returns the approval
 * count after this call; restoration only completes once two different
 * admin ids have signed off.
 */
export async function approveVendorRestoration(vendorId: string, adminId: string): Promise<number> {
  const { data: v } = await supabase.from('vendors').select('restoration_approvals').eq('id', vendorId).single();
  const approvals: string[] = Array.isArray(v?.restoration_approvals) ? v!.restoration_approvals : [];
  if (approvals.includes(adminId)) return approvals.length;
  const next = [...approvals, adminId];
  if (next.length >= 2) {
    await supabase.from('vendors').update({
      is_blacklisted: false,
      blacklist_pending: false,
      blacklist_reason: null,
      blacklisted_at: null,
      blacklisted_by: null,
      restoration_approvals: [],
    }).eq('id', vendorId);
    await logEvent('vendor_restored', adminId, 'admin', 'vendor', vendorId, { approvedBy: next });
  } else {
    await supabase.from('vendors').update({ restoration_approvals: next }).eq('id', vendorId);
  }
  return next.length;
}

/** Same deferred-effect rule as vendors, extended to buyers. */
export async function blacklistCustomer(customerId: string, reason: string, adminId: string) {
  const deferred = await hasOpenDispute(customerId, 'buyer');
  const patch = deferred
    ? { blacklist_pending: true, blacklist_reason: reason, blacklisted_by: adminId }
    : { is_blacklisted: true, blacklist_pending: false, blacklist_reason: reason, blacklisted_at: new Date().toISOString(), blacklisted_by: adminId, restoration_approvals: [] };
  await supabase.from('customers').update(patch).eq('id', customerId);
  await logEvent(deferred ? 'customer_blacklist_deferred' : 'customer_blacklisted', adminId, 'admin', 'customer', customerId, { reason });
}

export async function approveCustomerRestoration(customerId: string, adminId: string): Promise<number> {
  const { data: c } = await supabase.from('customers').select('restoration_approvals').eq('id', customerId).single();
  const approvals: string[] = Array.isArray(c?.restoration_approvals) ? c!.restoration_approvals : [];
  if (approvals.includes(adminId)) return approvals.length;
  const next = [...approvals, adminId];
  if (next.length >= 2) {
    await supabase.from('customers').update({
      is_blacklisted: false,
      blacklist_pending: false,
      blacklist_reason: null,
      blacklisted_at: null,
      blacklisted_by: null,
      restoration_approvals: [],
    }).eq('id', customerId);
    await logEvent('customer_restored', adminId, 'admin', 'customer', customerId, { approvedBy: next });
  } else {
    await supabase.from('customers').update({ restoration_approvals: next }).eq('id', customerId);
  }
  return next.length;
}

/**
 * Call after a dispute resolves (or is merged/closed). If the vendor and/or
 * buyer on that dispute have no other open disputes and a blacklist is
 * pending, the blacklist now takes effect.
 */
export async function finalizeDeferredBlacklists(vendorId: string, buyerId: string) {
  const [{ data: vendor }, { data: customer }] = await Promise.all([
    supabase.from('vendors').select('blacklist_pending, blacklist_reason, blacklisted_by').eq('id', vendorId).maybeSingle(),
    supabase.from('customers').select('blacklist_pending, blacklist_reason, blacklisted_by').eq('id', buyerId).maybeSingle(),
  ]);

  if (vendor?.blacklist_pending && !(await hasOpenDispute(vendorId, 'vendor'))) {
    await supabase.from('vendors').update({ is_blacklisted: true, blacklist_pending: false, blacklisted_at: new Date().toISOString() }).eq('id', vendorId);
    await notify(vendorId, 'system', 'Account blacklisted', `Your account has been blacklisted now that all open disputes are resolved: ${vendor.blacklist_reason ?? ''}`);
    await logEvent('vendor_blacklist_finalized', vendor.blacklisted_by, 'admin', 'vendor', vendorId, {});
  }

  if (customer?.blacklist_pending && !(await hasOpenDispute(buyerId, 'buyer'))) {
    await supabase.from('customers').update({ is_blacklisted: true, blacklist_pending: false, blacklisted_at: new Date().toISOString() }).eq('id', buyerId);
    await notify(buyerId, 'system', 'Account blacklisted', `Your account has been blacklisted now that all open disputes are resolved: ${customer.blacklist_reason ?? ''}`);
    await logEvent('customer_blacklist_finalized', customer.blacklisted_by, 'admin', 'customer', buyerId, {});
  }
}

// ── Notifications + audit trail ───────────────────────────────────────────────

export async function notify(
  userId: string,
  type: 'new_proposal' | 'message' | 'milestone' | 'payment' | 'review' | 'contract' | 'enquiry' | 'system',
  title: string,
  message: string,
  linkUrl?: string
) {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    link_url: linkUrl ?? null,
  });
}

export async function logEvent(
  eventType: string,
  actorId: string,
  actorRole: string,
  entityType: string,
  entityId: string,
  payload?: Record<string, unknown>
) {
  await supabase.from('platform_event').insert({
    event_type: eventType,
    actor_id: actorId,
    actor_role: actorRole,
    entity_type: entityType,
    entity_id: entityId,
    payload: payload ?? null,
  });
}

// ── Engagement thread helper ──────────────────────────────────────────────────

/** Post a message into the engagement thread, applying off-platform detection. */
export async function sendEngagementMessage(params: {
  engagementId: string;
  senderId: string;
  recipientId: string;
  content: string;
  threadType?: 'pre_engagement' | 'pre_proposal' | 'engagement';
  disputeId?: string | null;
}) {
  const flagged = detectOffPlatformContact(params.content);
  const { error } = await supabase.from('messages').insert({
    sender_id: params.senderId,
    recipient_id: params.recipientId,
    content: params.content,
    engagement_id: params.engagementId,
    thread_type: params.threadType ?? 'engagement',
    flagged_off_platform: flagged,
    dispute_id: params.disputeId ?? null,
  });
  if (error) throw error;
  return { flagged };
}
