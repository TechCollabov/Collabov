import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2, CheckCircle, AlertTriangle, Clock, FileText, Shield, Star,
  Send, X, Flag, Scale, Ban, RefreshCw, PoundSterling, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  addDays, addHours, addBusinessDays, hoursLeft, formatGBP, platformFee,
  fundMilestone, releaseMilestone, refundMilestone, openDispute,
  sweepAutoReleases, sweepDisputeEscalation, sweepFlagDeadlines,
  notify, logEvent, sendEngagementMessage, recordPaymentEvent, getPlatformSettings,
  FLAG_RESPONSE_DAYS, CHANGE_REQUEST_RESPONSE_DAYS,
  REVIEW_WINDOW_DAYS, DEFECT_LIABILITY_DAYS, NOTICE_PERIOD_DAYS,
  MSP_CHECKIN_CRITERIA, STAFFAUG_CHECKIN_CRITERIA,
  BUYER_REVIEW_CRITERIA, VENDOR_REVIEW_CRITERIA, DISPUTE_REASONS,
  OFF_PLATFORM_WARNING,
} from '../lib/workflows';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'buyer' | 'vendor';

interface Engagement {
  id: string;
  buyer_id: string;
  vendor_id: string;
  project_title: string | null;
  status: string;
  engagement_type: string;
  payment_model: string;
  monthly_amount: number | null;
  total_value: number | null;
  start_date: string | null;
  end_date: string | null;
  contract_id: string | null;
  sow_id: string | null;
  working_location: string | null;
  ir35_status: string | null;
  assigned_employee_id: string | null;
  defect_liability_end_date: string | null;
  replacement_sla_days: number;
  replacement_opened_at: string | null;
  closed_at: string | null;
}

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  status: string;
  signed_by_customer: boolean;
  signed_by_vendor: boolean;
  total_value: number;
  notice_period_days: number | null;
  termination_status: string | null;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  amount: number | null;
  due_date: string | null;
  acceptance_criteria: string[] | null;
  milestone_type: string;
  escrow_status: string;
  funded_at: string | null;
  submitted_at: string | null;
  auto_release_at: string | null;
  rejection_reason: string | null;
  display_order: number;
}

const ESCROW_BADGE: Record<string, { label: string; cls: string }> = {
  unfunded: { label: 'Unfunded', cls: 'bg-gray-100 text-gray-600' },
  funded: { label: 'Funded — in escrow', cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In progress', cls: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Submitted — in review', cls: 'bg-amber-100 text-amber-700' },
  accepted: { label: 'Accepted', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Revision requested', cls: 'bg-red-100 text-red-600' },
  in_dispute: { label: 'In dispute — frozen', cls: 'bg-red-100 text-red-700' },
  released: { label: 'Released — paid', cls: 'bg-green-100 text-green-700' },
  refunded: { label: 'Refunded', cls: 'bg-gray-100 text-gray-600' },
};

const monthLabel = (d = new Date()) =>
  d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EngagementWorkspacePage() {
  const { engagementId } = useParams<{ engagementId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [eng, setEng] = useState<Engagement | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [sow, setSow] = useState<{ id: string; opensign_vendor_sign_url: string | null; vendor_signed_at: string | null } | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [hourlyLogs, setHourlyLogs] = useState<any[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [evidenceByMilestone, setEvidenceByMilestone] = useState<Record<string, any>>({});
  const [termination, setTermination] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [counterparty, setCounterparty] = useState<string>('');
  const [employees, setEmployees] = useState<any[]>([]);

  const [tab, setTab] = useState<'delivery' | 'payments' | 'messages' | 'governance'>('delivery');
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Modals
  const [fundTarget, setFundTarget] = useState<Milestone | null>(null);
  const [evidenceTarget, setEvidenceTarget] = useState<Milestone | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Milestone | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<{ milestone: Milestone | null } | null>(null);
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const role: Role | null = useMemo(() => {
    if (!user || !eng) return null;
    if (user.id === eng.buyer_id) return 'buyer';
    if (user.id === eng.vendor_id) return 'vendor';
    return null;
  }, [user, eng]);

  const vendorType = eng?.engagement_type === 'managed_service' ? 'msp'
    : eng?.engagement_type === 'staff_aug' ? 'staffaug' : 'agency';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // ── Load + lazy sweeps ───────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!engagementId || !user) return;
    const { data: e } = await supabase.from('engagements').select('*').eq('id', engagementId).maybeSingle();
    if (!e) { setNotFoundFlag(true); setLoading(false); return; }
    const engagement = e as Engagement;

    // Time-driven transitions applied lazily.
    await sweepAutoReleases(engagement);
    await sweepDisputeEscalation(engagement.id);
    await sweepFlagDeadlines(engagement);

    const [conRes, sowRes, msRes, dRes, fRes, crRes, ciRes, hlRes, wlRes, invRes, evRes, termRes, revRes, msgRes] =
      await Promise.all([
        engagement.contract_id
          ? supabase.from('contracts').select('*').eq('id', engagement.contract_id).maybeSingle()
          : Promise.resolve({ data: null } as any),
        engagement.sow_id
          ? supabase.from('sow_documents').select('id, opensign_vendor_sign_url, vendor_signed_at').eq('id', engagement.sow_id).maybeSingle()
          : Promise.resolve({ data: null } as { data: null }),
        supabase.from('project_milestones').select('*').eq('engagement_id', engagement.id).order('display_order'),
        supabase.from('disputes').select('*').eq('engagement_id', engagement.id).order('opened_at', { ascending: false }),
        supabase.from('milestone_flags').select('*').eq('engagement_id', engagement.id).order('created_at', { ascending: false }),
        supabase.from('change_requests').select('*').eq('engagement_id', engagement.id).order('created_at', { ascending: false }),
        supabase.from('check_ins').select('*').eq('engagement_id', engagement.id).order('created_at', { ascending: false }),
        supabase.from('hourly_logs').select('*').eq('engagement_id', engagement.id).order('log_date', { ascending: false }),
        supabase.from('weekly_status_log').select('*').eq('engagement_id', engagement.id).order('week_of', { ascending: false }),
        supabase.from('invoices').select('*').eq('engagement_id', engagement.id).order('issued_at', { ascending: false }),
        supabase.from('evidence').select('*').eq('engagement_id', engagement.id).order('submitted_at', { ascending: false }),
        supabase.from('terminations').select('*').eq('engagement_id', engagement.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('reviews').select('*').eq('engagement_id', engagement.id),
        supabase.from('messages').select('*').eq('engagement_id', engagement.id).order('created_at', { ascending: true }).limit(100),
      ]);

    // Contract activation: both signatures in -> active (staff aug waits for IR35 stamp).
    const con = conRes.data as Contract | null;
    if (con && con.signed_by_customer && con.signed_by_vendor && con.status === 'pending') {
      const isStaffAug = engagement.engagement_type === 'staff_aug';
      if (isStaffAug && engagement.ir35_status === 'pending') {
        if (engagement.status !== 'pending_ir35') {
          await supabase.from('engagements').update({ status: 'pending_ir35' }).eq('id', engagement.id);
          engagement.status = 'pending_ir35';
        }
      } else {
        await supabase.from('contracts').update({ status: 'active' }).eq('id', con.id);
        await supabase.from('engagements').update({ status: 'active' }).eq('id', engagement.id);
        con.status = 'active';
        engagement.status = 'active';
        await notify(engagement.buyer_id, 'contract', 'Contract active',
          `"${engagement.project_title}" is now active. Fund the first milestone to start work.`, `/engagement/${engagement.id}`);
        await notify(engagement.vendor_id, 'contract', 'Contract active',
          `"${engagement.project_title}" is now active. Work begins when the buyer funds the first milestone.`, `/engagement/${engagement.id}`);
      }
    }
    // Staff aug: IR35 stamped -> activate.
    if (con && con.signed_by_customer && con.signed_by_vendor && engagement.status === 'pending_ir35'
        && engagement.ir35_status && engagement.ir35_status !== 'pending') {
      await supabase.from('contracts').update({ status: 'active' }).eq('id', con.id);
      await supabase.from('engagements').update({ status: 'active' }).eq('id', engagement.id);
      con.status = 'active';
      engagement.status = 'active';
    }

    // Termination completion: notice period expired.
    const term = (termRes.data ?? [])[0] ?? null;
    if (term && term.status === 'notice_period' && new Date(term.notice_end_date) < new Date()) {
      const stillDisputed = (dRes.data ?? []).find((d: any) => d.status !== 'resolved');
      if (!stillDisputed) {
        await supabase.from('terminations').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', term.id);
        await supabase.from('engagements').update({ status: 'terminated', closed_at: new Date().toISOString() }).eq('id', engagement.id);
        if (engagement.contract_id) {
          await supabase.from('contracts').update({ status: 'cancelled', termination_status: 'terminated' }).eq('id', engagement.contract_id);
        }
        // Unfunded/funded-but-unstarted escrow auto-returns to the buyer.
        for (const ms of (msRes.data ?? []) as Milestone[]) {
          if (ms.escrow_status === 'funded') await refundMilestone(engagement, ms.id, ms.amount ?? 0);
        }
        engagement.status = 'terminated';
        term.status = 'completed';
      }
    }

    // Agency close trigger: final milestone released -> closing + defect liability.
    const msList = (msRes.data ?? []) as Milestone[];
    if (engagement.status === 'active' && msList.length > 0 && msList.every(m => ['released', 'refunded'].includes(m.escrow_status))) {
      const updates: any = { status: 'closing' };
      if (vendorTypeOf(engagement) === 'agency') {
        updates.defect_liability_end_date = addDays(new Date(), DEFECT_LIABILITY_DAYS).toISOString().slice(0, 10);
      }
      await supabase.from('engagements').update(updates).eq('id', engagement.id);
      Object.assign(engagement, updates);
      await notify(engagement.buyer_id, 'review', 'Engagement complete — leave a review',
        `All milestones on "${engagement.project_title}" are complete. You have 14 days to review the vendor.`, `/engagement/${engagement.id}`);
      await notify(engagement.vendor_id, 'review', 'Engagement complete — rate the buyer',
        `"${engagement.project_title}" is complete. Rate the buyer within 14 days — Payment Reliability feeds their public badge.`, `/engagement/${engagement.id}`);
    }

    // Counterparty display name.
    const counterId = user.id === engagement.buyer_id ? engagement.vendor_id : engagement.buyer_id;
    const { data: cp } = await supabase.from('profiles').select('full_name').eq('id', counterId).maybeSingle();
    const { data: cpVendor } = await supabase.from('vendors').select('company_name').eq('id', counterId).maybeSingle();
    const { data: cpCustomer } = await supabase.from('customers').select('company_name').eq('id', counterId).maybeSingle();
    setCounterparty(cpVendor?.company_name ?? cpCustomer?.company_name ?? cp?.full_name ?? 'Counterparty');

    // Staff-aug bench for replacement flow.
    if (engagement.engagement_type === 'staff_aug' && user.id === engagement.vendor_id) {
      const { data: emp } = await supabase.from('vendor_employees').select('id, name, job_title, role, availability_status').eq('vendor_id', user.id);
      setEmployees(emp ?? []);
    }

    const evMap: Record<string, any> = {};
    for (const ev of evRes.data ?? []) if (ev.milestone_id) evMap[ev.milestone_id] = ev;

    setEng(engagement);
    setContract(con);
    setSow(sowRes.data as { id: string; opensign_vendor_sign_url: string | null; vendor_signed_at: string | null } | null);
    setMilestones(msList.map(m => ({ ...m, acceptance_criteria: Array.isArray(m.acceptance_criteria) ? m.acceptance_criteria : [] })));
    setDisputes(dRes.data ?? []);
    setFlags(fRes.data ?? []);
    setChangeRequests(crRes.data ?? []);
    setCheckIns(ciRes.data ?? []);
    setHourlyLogs(hlRes.data ?? []);
    setWeeklyLogs(wlRes.data ?? []);
    setInvoices(invRes.data ?? []);
    setEvidenceByMilestone(evMap);
    setTermination(term);
    setReviews(revRes.data ?? []);
    setMessages(msgRes.data ?? []);
    setLoading(false);
  }, [engagementId, user]);

  useEffect(() => { load(); }, [load]);

  // 30-second polling for the message thread.
  useEffect(() => {
    if (!engagementId) return;
    const t = setInterval(async () => {
      const { data } = await supabase.from('messages').select('*').eq('engagement_id', engagementId).order('created_at', { ascending: true }).limit(100);
      if (data) setMessages(data);
    }, 30000);
    return () => clearInterval(t);
  }, [engagementId]);

  function vendorTypeOf(e: Engagement) {
    return e.engagement_type === 'managed_service' ? 'msp' : e.engagement_type === 'staff_aug' ? 'staffaug' : 'agency';
  }

  const openDisputeOnEngagement = disputes.find(d => d.status !== 'resolved') ?? null;

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Opens the real OpenSign signing page — signed_by_vendor is only ever set
   *  by the opensign-webhook Edge Function once OpenSign reports completion. */
  const vendorSign = () => {
    if (!sow?.opensign_vendor_sign_url) {
      showToast('Signing link not ready yet — refresh in a moment.');
      return;
    }
    window.open(sow.opensign_vendor_sign_url, '_blank', 'noopener,noreferrer');
  };

  const refreshSignatureStatus = async () => {
    setBusy(true);
    try {
      await load();
      showToast(contract?.signed_by_vendor ? 'Signature recorded.' : 'Not signed yet — sign in the OpenSign tab, then refresh again.');
    } finally { setBusy(false); }
  };

  const doFund = async (ms: Milestone, cardLast4: string) => {
    if (!eng) return;
    setBusy(true);
    try {
      await fundMilestone(eng, ms.id, ms.amount ?? 0, cardLast4);
      await notify(eng.vendor_id, 'payment', 'Milestone funded',
        `"${ms.title}" (${formatGBP(ms.amount ?? 0)}) is funded and held in escrow. You can start work and submit evidence.`,
        `/engagement/${eng.id}`);
      setFundTarget(null);
      showToast('Milestone funded — money is held in escrow, not yet paid to the vendor.');
      await load();
    } catch (e) {
      console.error(e);
      showToast('Funding failed.');
    } finally { setBusy(false); }
  };

  const submitEvidence = async (ms: Milestone, payload: { description: string; checklist: { text: string; checked: boolean }[]; demoUrl: string; files: string[] }) => {
    if (!eng || !user) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('evidence').insert({
        milestone_id: ms.id,
        engagement_id: eng.id,
        vendor_id: user.id,
        delivery_description: payload.description,
        criteria_checklist: payload.checklist,
        demo_url: payload.demoUrl || null,
        files: payload.files,
        status: 'submitted',
        locked: true,
      });
      if (error) throw error;
      await supabase.from('project_milestones').update({
        escrow_status: 'submitted',
        submitted_at: new Date().toISOString(),
        auto_release_at: addDays(new Date(), getPlatformSettings().autoReleaseDays).toISOString(),
      }).eq('id', ms.id);
      await notify(eng.buyer_id, 'milestone', 'Evidence submitted — review within 7 days',
        `The vendor submitted delivery evidence for "${ms.title}". Silence releases payment automatically on day 7.`,
        `/engagement/${eng.id}`);
      await logEvent('evidence_submitted', user.id, 'vendor', 'milestone', ms.id, {});
      setEvidenceTarget(null);
      showToast('Evidence submitted and locked. The buyer has 7 days to review.');
      await load();
    } catch (e) {
      console.error(e);
      showToast('Evidence submission failed.');
    } finally { setBusy(false); }
  };

  const buyerAccept = async (ms: Milestone) => {
    if (!eng || !user) return;
    setBusy(true);
    try {
      await releaseMilestone(eng, { id: ms.id, title: ms.title, amount: ms.amount }, { reason: 'accepted' });
      await recordPaymentEvent(eng.buyer_id, true);
      const ev = evidenceByMilestone[ms.id];
      if (ev) await supabase.from('evidence').update({ review_outcome: 'accepted', reviewed_at: new Date().toISOString() }).eq('id', ev.id);
      await notify(eng.vendor_id, 'payment', 'Milestone accepted — payment released',
        `"${ms.title}" was accepted. ${formatGBP((ms.amount ?? 0) - platformFee(ms.amount ?? 0))} (net of platform fee) is on its way.`,
        `/engagement/${eng.id}`);
      setReviewTarget(null);
      showToast('Accepted — payment released from escrow.');
      await load();
    } finally { setBusy(false); }
  };

  const buyerRequestRevision = async (ms: Milestone, flaggedCriteria: string[], note: string) => {
    if (!eng || !user) return;
    setBusy(true);
    try {
      const { data: flag, error } = await supabase.from('milestone_flags').insert({
        engagement_id: eng.id,
        milestone_id: ms.id,
        flagged_by: user.id,
        flagged_criteria: flaggedCriteria,
        note,
        status: 'open',
        respond_by: addDays(new Date(), FLAG_RESPONSE_DAYS).toISOString(),
      }).select().single();
      if (error) throw error;
      await supabase.from('project_milestones').update({ escrow_status: 'rejected', rejection_reason: note, auto_release_at: null }).eq('id', ms.id);
      const ev = evidenceByMilestone[ms.id];
      if (ev) await supabase.from('evidence').update({ review_outcome: 'revision_requested', reviewed_at: new Date().toISOString() }).eq('id', ev.id);
      await notify(eng.vendor_id, 'milestone', `Buyer flagged ${flaggedCriteria.length} criteria`,
        `Respond within 5 days to avoid an automatic dispute on "${ms.title}".`, `/engagement/${eng.id}`);
      await logEvent('milestone_flagged', user.id, 'buyer', 'milestone', ms.id, { flag_id: flag.id });
      setReviewTarget(null);
      showToast('Revision requested. The vendor has 5 days to respond.');
      await load();
    } finally { setBusy(false); }
  };

  const raiseDispute = async (ms: Milestone | null, reason: string, description: string) => {
    if (!eng || !user || !role) return;
    setBusy(true);
    try {
      await openDispute({
        engagement: eng,
        milestoneId: ms?.id ?? null,
        openedBy: user.id,
        openedByRole: role,
        reason,
        description,
        escrowAmount: ms?.amount ?? 0,
      });
      if (ms) {
        const ev = evidenceByMilestone[ms.id];
        if (ev) await supabase.from('evidence').update({ review_outcome: 'disputed', reviewed_at: new Date().toISOString() }).eq('id', ev.id);
      }
      const other = role === 'buyer' ? eng.vendor_id : eng.buyer_id;
      await notify(other, 'system', 'Dispute opened — escrow frozen',
        'A dispute was opened. You have a 72-hour bilateral window to resolve it in the engagement thread before admin review.',
        `/engagement/${eng.id}`);
      if (role === 'buyer') await recordPaymentEvent(eng.buyer_id, false);
      setDisputeTarget(null);
      setReviewTarget(null);
      showToast('Dispute opened. Escrow frozen; 72-hour bilateral window started.');
      await load();
    } finally { setBusy(false); }
  };

  const vendorRespondToFlag = async (flag: any, response: string, acceptFlag: boolean) => {
    if (!eng || !user) return;
    setBusy(true);
    try {
      await supabase.from('milestone_flags').update({
        status: 'vendor_responded',
        vendor_response: `${acceptFlag ? '[Accepted flag — will fix] ' : '[Disputes flag — evidence provided] '}${response}`,
        respond_by: addDays(new Date(), FLAG_RESPONSE_DAYS).toISOString(), // buyer now has 5 days
      }).eq('id', flag.id);
      if (acceptFlag && flag.milestone_id) {
        // Vendor will resubmit: reopen the evidence builder path.
        await supabase.from('project_milestones').update({ escrow_status: 'funded' }).eq('id', flag.milestone_id);
      }
      await notify(eng.buyer_id, 'milestone', 'Vendor responded to your flag',
        acceptFlag ? 'The vendor accepted the flag and will fix the issues.' : 'The vendor disputes the flag and provided evidence. Silence for 5 days releases payment.',
        `/engagement/${eng.id}`);
      showToast('Response sent.');
      await load();
    } finally { setBusy(false); }
  };

  const buyerResolveFlag = async (flag: any, satisfied: boolean) => {
    if (!eng) return;
    setBusy(true);
    try {
      if (satisfied) {
        await supabase.from('milestone_flags').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', flag.id);
        if (flag.milestone_id) {
          const ms = milestones.find(m => m.id === flag.milestone_id);
          if (ms && ['submitted', 'rejected'].includes(ms.escrow_status)) {
            await releaseMilestone(eng, { id: ms.id, title: ms.title, amount: ms.amount }, { reason: 'accepted' });
            await recordPaymentEvent(eng.buyer_id, true);
          }
        }
        showToast('Flag resolved — payment released.');
      } else {
        const ms = milestones.find(m => m.id === flag.milestone_id) ?? null;
        await supabase.from('milestone_flags').update({ status: 'escalated', resolved_at: new Date().toISOString() }).eq('id', flag.id);
        await raiseDispute(ms, 'delivery_quality',
          `Escalated from flagged criteria after vendor response did not resolve the issue. Flagged: ${(flag.flagged_criteria ?? []).join('; ')}. Original note: ${flag.note ?? ''}`.padEnd(100, ' '),
        );
        return;
      }
      await load();
    } finally { setBusy(false); }
  };

  const submitBilateralPosition = async (dispute: any, position: string) => {
    if (!role) return;
    const field = role === 'buyer' ? 'buyer_position' : 'vendor_position';
    await supabase.from('disputes').update({ [field]: position }).eq('id', dispute.id);
    showToast('Position recorded for admin review.');
    await load();
  };

  const settleBilaterally = async (dispute: any) => {
    if (!eng) return;
    setBusy(true);
    try {
      await supabase.from('disputes').update({
        status: 'resolved', resolution: 'settled_bilaterally', resolved_at: new Date().toISOString(),
      }).eq('id', dispute.id);
      if (dispute.milestone_id) {
        await supabase.from('project_milestones').update({ escrow_status: 'submitted', auto_release_at: addDays(new Date(), getPlatformSettings().autoReleaseDays).toISOString() }).eq('id', dispute.milestone_id);
      }
      const other = role === 'buyer' ? eng.vendor_id : eng.buyer_id;
      await notify(other, 'system', 'Dispute settled', 'The dispute was marked settled bilaterally. Escrow is unfrozen.', `/engagement/${eng.id}`);
      showToast('Dispute settled — escrow unfrozen.');
      await load();
    } finally { setBusy(false); }
  };

  const raiseChangeRequest = async (type: string, description: string, payload?: any) => {
    if (!eng || !user || !role) return;
    setBusy(true);
    try {
      await supabase.from('change_requests').insert({
        engagement_id: eng.id,
        contract_id: eng.contract_id,
        requested_by: user.id,
        requested_by_role: role,
        request_type: type,
        description,
        payload: payload ?? null,
        status: 'pending',
        respond_by: addDays(new Date(), CHANGE_REQUEST_RESPONSE_DAYS).toISOString(),
      });
      const other = role === 'buyer' ? eng.vendor_id : eng.buyer_id;
      await notify(other, 'contract', 'Change request received',
        `A ${type} change was requested on "${eng.project_title}". You have 7 days to accept or reject.`, `/engagement/${eng.id}`);
      if (type === 'replacement') {
        await supabase.from('engagements').update({ replacement_opened_at: new Date().toISOString() }).eq('id', eng.id);
      }
      setShowChangeRequest(false);
      showToast('Change request sent — the other party has 7 days to respond.');
      await load();
    } finally { setBusy(false); }
  };

  const respondChangeRequest = async (cr: any, accept: boolean, note: string) => {
    if (!eng || !user || !role) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const signatures = accept
        ? role === 'buyer'
          ? { buyer_signed_at: now, vendor_signed_at: cr.requested_by_role === 'vendor' ? now : null }
          : { vendor_signed_at: now, buyer_signed_at: cr.requested_by_role === 'buyer' ? now : null }
        : {};
      await supabase.from('change_requests').update({
        status: accept ? 'accepted' : 'rejected',
        response_note: note || null,
        resolved_at: now,
        ...signatures,
      }).eq('id', cr.id);

      if (accept) {
        // Accepted change becomes a signed amendment; apply structural effects.
        if (cr.request_type === 'replacement' && cr.payload?.employee_id) {
          await supabase.from('engagements').update({
            assigned_employee_id: cr.payload.employee_id,
            replacement_opened_at: null,
          }).eq('id', eng.id);
        }
        if (cr.request_type === 'extension' && cr.payload?.new_end_date) {
          await supabase.from('engagements').update({ end_date: cr.payload.new_end_date }).eq('id', eng.id);
        }
        await logEvent('amendment_signed', user.id, role, 'change_request', cr.id, { type: cr.request_type });
      }
      await notify(cr.requested_by, 'contract', accept ? 'Change request accepted' : 'Change request rejected',
        accept ? 'The amendment is agreed and stored alongside the original contract.' : `Rejected: ${note || 'original terms unchanged.'}`,
        `/engagement/${eng.id}`);
      showToast(accept ? 'Amendment accepted and signed.' : 'Change request rejected — original terms unchanged.');
      await load();
    } finally { setBusy(false); }
  };

  const initiateTermination = async (reason: string, notes: string) => {
    if (!eng || !user || !role || !contract) return;
    if (openDisputeOnEngagement) { showToast('An open dispute must resolve before termination.'); return; }
    setBusy(true);
    try {
      const noticeDays = contract.notice_period_days ?? NOTICE_PERIOD_DAYS[vendorType] ?? 14;
      const endDate = addDays(new Date(), noticeDays).toISOString().slice(0, 10);
      await supabase.from('terminations').insert({
        engagement_id: eng.id,
        contract_id: contract.id,
        initiated_by: user.id,
        initiated_by_role: role,
        reason,
        notes,
        notice_period_days: noticeDays,
        notice_end_date: endDate,
        status: 'notice_period',
      });
      await supabase.from('contracts').update({ termination_status: 'notice_period', termination_date: endDate }).eq('id', contract.id);
      const other = role === 'buyer' ? eng.vendor_id : eng.buyer_id;
      await notify(other, 'contract', 'Contract termination notice',
        `${role === 'buyer' ? 'The buyer' : 'The vendor'} served notice on "${eng.project_title}". Notice period: ${noticeDays} days (ends ${endDate}). You can accept early termination to waive it.`,
        `/engagement/${eng.id}`);
      setShowTerminate(false);
      showToast(`Termination notice served — ${noticeDays} day notice period started.`);
      await load();
    } finally { setBusy(false); }
  };

  const acceptEarlyTermination = async () => {
    if (!eng || !termination) return;
    setBusy(true);
    try {
      await supabase.from('terminations').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', termination.id);
      await supabase.from('engagements').update({ status: 'terminated', closed_at: new Date().toISOString() }).eq('id', eng.id);
      if (eng.contract_id) await supabase.from('contracts').update({ status: 'cancelled', termination_status: 'terminated' }).eq('id', eng.contract_id);
      for (const ms of milestones) {
        if (ms.escrow_status === 'funded') await refundMilestone(eng, ms.id, ms.amount ?? 0);
      }
      showToast('Early termination accepted — notice waived, unfunded escrow returned.');
      await load();
    } finally { setBusy(false); }
  };

  const submitReview = async (scores: Record<string, number>, comment: string) => {
    if (!eng || !user || !role) return;
    setBusy(true);
    try {
      const overall = scores['Overall'] ?? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length);
      const { error } = await supabase.from('reviews').insert({
        engagement_id: eng.id,
        reviewer_id: user.id,
        direction: role === 'buyer' ? 'buyer_of_vendor' : 'vendor_of_buyer',
        customer_id: eng.buyer_id,
        vendor_id: eng.vendor_id,
        rating: overall,
        comment,
        criteria_scores: scores,
        // Buyer reviews of vendors get light moderation; vendor reviews of
        // buyers publish immediately.
        moderation_status: role === 'buyer' ? 'pending' : 'published',
        window_closes_at: addDays(new Date(), REVIEW_WINDOW_DAYS).toISOString(),
      });
      if (error) throw error;
      await logEvent('review_submitted', user.id, role, 'engagement', eng.id, { overall });
      const other = role === 'buyer' ? eng.vendor_id : eng.buyer_id;
      await notify(other, 'review', 'You received a review', `A review was submitted on "${eng.project_title}".`);
      setShowReviewForm(false);
      showToast(role === 'buyer' ? 'Review submitted — published after moderation.' : 'Review published on the buyer profile.');
      await load();
    } finally { setBusy(false); }
  };

  const confirmCheckIn = async (ci: any, scores: Record<string, number>) => {
    if (!eng) return;
    setBusy(true);
    try {
      const values = Object.values(scores);
      const overall = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const below = overall > 0 && overall < 3;
      await supabase.from('check_ins').update({
        scores, overall_score: overall, below_threshold: below,
        status: 'confirmed', confirmed_at: new Date().toISOString(),
      }).eq('id', ci.id);

      // Charge fires: simulated recurring charge -> immediate payout + invoice.
      const amount = ci.charge_amount ?? eng.monthly_amount ?? 0;
      const fee = platformFee(amount);
      await supabase.from('escrow_transactions').insert({
        engagement_id: eng.id, buyer_id: eng.buyer_id, vendor_id: eng.vendor_id,
        transaction_type: 'recurring_charge', amount, platform_fee_amount: fee,
        net_amount: amount - fee, reference: ci.period_label, status: 'completed',
      });
      await supabase.from('invoices').insert({
        invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
        engagement_id: eng.id, buyer_id: eng.buyer_id, vendor_id: eng.vendor_id,
        description: `${vendorType === 'msp' ? 'Managed service' : 'Staff augmentation'} — ${ci.period_label}`,
        period_label: ci.period_label, gross_amount: amount,
        platform_fee_amount: fee, net_amount: amount - fee, status: 'paid',
      });
      await recordPaymentEvent(eng.buyer_id, true);

      // Two consecutive below-threshold months -> service credit / replacement guarantee.
      if (below) {
        const prev = checkIns.filter(c => c.id !== ci.id && c.status === 'confirmed').sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
        if (prev?.below_threshold) {
          await notify(eng.buyer_id, 'system',
            vendorType === 'msp' ? 'Service credit clause activated' : 'Replacement guarantee activated',
            vendorType === 'msp'
              ? 'Two consecutive months below threshold — a service credit is due (admin will apply it).'
              : 'Two consecutive months below threshold — you may request a replacement at no cost.',
            `/engagement/${eng.id}`);
        }
      }
      await notify(eng.vendor_id, 'payment', `Monthly charge fired — ${ci.period_label}`,
        `The buyer confirmed the ${ci.period_label} check-in. ${formatGBP(amount - fee)} net is on its way.`, `/engagement/${eng.id}`);
      showToast('Check-in confirmed — monthly charge fired.');
      await load();
    } finally { setBusy(false); }
  };

  const flagCheckIn = async (ci: any, note: string) => {
    if (!eng || !user) return;
    setBusy(true);
    try {
      await supabase.from('check_ins').update({ status: 'flagged', flag_note: note }).eq('id', ci.id);
      await supabase.from('milestone_flags').insert({
        engagement_id: eng.id,
        check_in_id: ci.id,
        flagged_by: user.id,
        flagged_criteria: [],
        note: `Monthly check-in flagged (${ci.period_label}): ${note}`,
        status: 'open',
        respond_by: addDays(new Date(), FLAG_RESPONSE_DAYS).toISOString(),
      });
      await notify(eng.vendor_id, 'milestone', 'Monthly check-in flagged — charge held',
        `The buyer flagged the ${ci.period_label} check-in. Respond within 5 days. The charge holds until resolved.`, `/engagement/${eng.id}`);
      showToast('Check-in flagged — charge held, clarification thread opened.');
      await load();
    } finally { setBusy(false); }
  };

  const generateCurrentCheckIn = async () => {
    if (!eng || !user) return;
    const label = monthLabel();
    if (checkIns.some(c => c.period_label === label)) { showToast(`The ${label} check-in already exists.`); return; }
    await supabase.from('check_ins').insert({
      engagement_id: eng.id,
      buyer_id: eng.buyer_id,
      vendor_id: eng.vendor_id,
      employee_id: eng.assigned_employee_id,
      check_in_type: vendorType === 'msp' ? 'msp' : 'staff_aug',
      period_label: label,
      charge_amount: eng.monthly_amount ?? 0,
      charge_date: addBusinessDays(new Date(), 5).toISOString().slice(0, 10),
      opens_at: new Date().toISOString(),
      status: 'open',
    });
    await notify(eng.buyer_id, 'payment', `Monthly check-in open — ${label}`,
      'Rate the service before the charge date. Confirm fires the charge; flag holds it.', `/engagement/${eng.id}`);
    showToast(`Check-in for ${label} opened.`);
    await load();
  };

  const logHours = async (date: string, hours: number, description: string) => {
    if (!eng || !user) return;
    await supabase.from('hourly_logs').insert({
      engagement_id: eng.id, vendor_id: user.id, employee_id: eng.assigned_employee_id,
      log_date: date, hours, description, status: 'logged',
    });
    showToast('Hours logged — visible to the buyer in real time.');
    await load();
  };

  const buyerHourlyAction = async (logIds: string[], action: 'approve_all' | 'flag', flagIds?: string[], note?: string) => {
    if (!eng) return;
    setBusy(true);
    try {
      if (action === 'approve_all') {
        await supabase.from('hourly_logs').update({ status: 'approved' }).in('id', logIds);
        showToast('All hours approved.');
      } else if (flagIds && flagIds.length) {
        // Disputed hours held, the rest paid.
        await supabase.from('hourly_logs').update({ status: 'flagged', flag_note: note ?? null }).in('id', flagIds);
        const rest = logIds.filter(id => !flagIds.includes(id));
        if (rest.length) await supabase.from('hourly_logs').update({ status: 'approved' }).in('id', rest);
        await notify(eng.vendor_id, 'payment', 'Hour entries flagged',
          `The buyer flagged ${flagIds.length} entr${flagIds.length === 1 ? 'y' : 'ies'}. Disputed hours are held; the rest are approved. You have 3 days to respond.`,
          `/engagement/${eng.id}`);
        showToast('Flagged entries held; remaining hours approved.');
      }
      await load();
    } finally { setBusy(false); }
  };

  const submitWeeklyLog = async (text: string) => {
    if (!eng || !user) return;
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    await supabase.from('weekly_status_log').insert({
      engagement_id: eng.id, vendor_id: user.id,
      week_of: monday.toISOString().slice(0, 10), status_text: text.slice(0, 200),
    });
    showToast('Weekly status posted — the buyer sees it in real time.');
    await load();
  };

  const sendMessage = async (content: string) => {
    if (!eng || !user || !role) return { flagged: false };
    const recipient = role === 'buyer' ? eng.vendor_id : eng.buyer_id;
    const res = await sendEngagementMessage({
      engagementId: eng.id,
      senderId: user.id,
      recipientId: recipient,
      content,
      threadType: 'engagement',
      disputeId: openDisputeOnEngagement?.id ?? null,
    });
    const { data } = await supabase.from('messages').select('*').eq('engagement_id', eng.id).order('created_at', { ascending: true }).limit(100);
    if (data) setMessages(data);
    return res;
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-8 w-8 text-[#0070F3] animate-spin" /></div>;
  }
  if (notFoundFlag || !eng || !role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900 mb-1">Engagement not found</h1>
          <p className="text-sm text-gray-500 mb-4">It may not exist, or you're not a party to it.</p>
          <Link to="/" className="text-[#0070F3] font-semibold text-sm">Go home</Link>
        </div>
      </div>
    );
  }

  const myReview = reviews.find(r => r.reviewer_id === user!.id);
  const canReview = ['closing', 'closed', 'terminated'].includes(eng.status) && !myReview;
  const bothSigned = !!contract?.signed_by_customer && !!contract?.signed_by_vendor;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-md">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-[#0B2D59]">{eng.project_title ?? 'Engagement'}</h1>
                <StatusBadge status={eng.status} />
              </div>
              <p className="text-sm text-gray-500">
                {role === 'buyer' ? 'Vendor' : 'Buyer'}: <span className="font-medium text-gray-700">{counterparty}</span>
                {contract && <> · Contract {contract.contract_number}</>}
                {' · '}{vendorType === 'msp' ? 'Managed IT' : vendorType === 'staffaug' ? 'Staff Augmentation' : 'Project Agency'}
                {eng.ir35_status && <> · IR35: <span className="font-medium">{eng.ir35_status}</span></>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {eng.total_value != null && (
                <div className="text-right">
                  <div className="text-xs text-gray-400">Total value</div>
                  <div className="text-lg font-bold text-[#0B2D59]">{formatGBP(eng.total_value)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Signing banner */}
          {contract && !bothSigned && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-blue-800">
                <span className="font-semibold">Signatures:</span>{' '}
                Buyer {contract.signed_by_customer ? '✓ signed' : 'pending'} · Vendor {contract.signed_by_vendor ? '✓ signed' : 'pending'}.
                {vendorType === 'staffaug' && ' Staff aug contracts also need an admin IR35 stamp before activating.'}
              </div>
              {role === 'vendor' && !contract.signed_by_vendor && (
                <div className="flex items-center gap-2">
                  <button onClick={vendorSign} disabled={busy || !sow?.opensign_vendor_sign_url} className="px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                    Sign with OpenSign →
                  </button>
                  <button onClick={refreshSignatureStatus} disabled={busy} className="px-3 py-2 border border-blue-300 text-blue-700 text-sm font-medium rounded-lg disabled:opacity-50">
                    I've signed — refresh status
                  </button>
                </div>
              )}
              {role === 'buyer' && !contract.signed_by_customer && (
                <span className="text-xs text-blue-700">Sign from the SOW wizard's signature step.</span>
              )}
            </div>
          )}

          {eng.status === 'pending_ir35' && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
              Both parties signed. A Collabov admin is stamping the IR35 status determination — the contract activates right after.
            </div>
          )}

          {/* Dispute banner */}
          {openDisputeOnEngagement && (
            <DisputeBanner
              dispute={openDisputeOnEngagement}
              role={role}
              onPosition={submitBilateralPosition}
              onSettle={settleBilaterally}
            />
          )}

          {/* Termination banner */}
          {termination && termination.status === 'notice_period' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-red-800">
                <span className="font-semibold">Termination notice served</span> by the {termination.initiated_by_role} — notice period ends {termination.notice_end_date}.
                Funded work continues; no new milestones.
              </div>
              {termination.initiated_by !== user!.id && (
                <button onClick={acceptEarlyTermination} disabled={busy} className="px-4 py-2 border border-red-300 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-100">
                  Accept early termination (waive notice)
                </button>
              )}
            </div>
          )}

          {/* Defect liability (agency) */}
          {vendorType === 'agency' && eng.defect_liability_end_date && new Date(eng.defect_liability_end_date) > new Date() && (
            <div className="mt-4 bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm text-teal-800 flex items-center gap-2">
              <Shield className="h-4 w-4 flex-shrink-0" />
              Defect liability window: bugs reported before {eng.defect_liability_end_date} are fixed free of charge. Raise them via Messages, not as a new dispute.
            </div>
          )}

          {/* Review prompt */}
          {canReview && (
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-purple-800">
                <span className="font-semibold">Engagement {eng.status === 'terminated' ? 'terminated' : 'complete'}.</span>{' '}
                You have 14 days to {role === 'buyer' ? 'review the vendor' : 'rate the buyer (Payment Reliability feeds their public badge)'}.
              </div>
              <button onClick={() => setShowReviewForm(true)} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg">
                <Star className="h-4 w-4 inline mr-1" /> Leave review
              </button>
            </div>
          )}

          {/* Discovery conversion CTAs — agency only, once the spec milestone is accepted */}
          {role === 'buyer' && eng.engagement_type === 'discovery' &&
            milestones.length > 0 && milestones.every(m => ['released', 'accepted'].includes(m.escrow_status)) && (
            <DiscoveryConversionCard
              evidence={evidenceByMilestone[milestones[0].id]}
              counterparty={counterparty}
              onBuildWith={() => navigate(
                `/sow-wizard?discoveryFrom=${eng.id}&vendorId=${eng.vendor_id}` +
                `&vendor=${encodeURIComponent(counterparty)}&type=agency&project=${encodeURIComponent(eng.project_title ?? 'Project')}`
              )}
              onTakeToMarketplace={() => navigate(`/customer/post-job?fromDiscovery=${eng.id}`)}
            />
          )}

          {/* Tabs */}
          <div className="mt-6 flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {([
              ['delivery', 'Delivery'],
              ['payments', 'Payments & Escrow'],
              ['messages', 'Messages'],
              ['governance', 'Governance'],
            ] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key ? 'bg-white text-[#0070F3] shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {tab === 'delivery' && (
          <DeliveryTab
            role={role}
            vendorType={vendorType}
            eng={eng}
            milestones={milestones}
            evidenceByMilestone={evidenceByMilestone}
            flags={flags}
            checkIns={checkIns}
            hourlyLogs={hourlyLogs}
            weeklyLogs={weeklyLogs}
            busy={busy}
            engagementActive={eng.status === 'active'}
            onFund={setFundTarget}
            onSubmitEvidence={setEvidenceTarget}
            onReview={setReviewTarget}
            onVendorRespondFlag={vendorRespondToFlag}
            onBuyerResolveFlag={buyerResolveFlag}
            onGenerateCheckIn={generateCurrentCheckIn}
            onConfirmCheckIn={confirmCheckIn}
            onFlagCheckIn={flagCheckIn}
            onLogHours={logHours}
            onHourlyAction={buyerHourlyAction}
            onWeeklyLog={submitWeeklyLog}
          />
        )}

        {tab === 'payments' && (
          <PaymentsTab role={role} milestones={milestones} invoices={invoices} eng={eng} />
        )}

        {tab === 'messages' && (
          <MessagesTab
            messages={messages}
            meId={user!.id}
            counterparty={counterparty}
            onSend={sendMessage}
            disputeActive={!!openDisputeOnEngagement}
          />
        )}

        {tab === 'governance' && (
          <GovernanceTab
            role={role}
            eng={eng}
            contract={contract}
            disputes={disputes}
            changeRequests={changeRequests}
            termination={termination}
            reviews={reviews}
            meId={user!.id}
            employees={employees}
            busy={busy}
            onRaiseChange={() => setShowChangeRequest(true)}
            onRespondChange={respondChangeRequest}
            onOpenDispute={() => setDisputeTarget({ milestone: null })}
            onTerminate={() => setShowTerminate(true)}
            hasOpenDispute={!!openDisputeOnEngagement}
          />
        )}
      </div>

      {/* ── Modals ── */}
      {fundTarget && (
        <FundModal milestone={fundTarget} busy={busy} onConfirm={(last4) => doFund(fundTarget, last4)} onClose={() => setFundTarget(null)} />
      )}
      {evidenceTarget && (
        <EvidenceModal milestone={evidenceTarget} engagementId={eng.id} isDiscovery={eng.engagement_type === 'discovery'} busy={busy}
          onSubmit={(p) => submitEvidence(evidenceTarget, p)} onClose={() => setEvidenceTarget(null)} />
      )}
      {reviewTarget && (
        <BuyerReviewModal
          milestone={reviewTarget}
          evidence={evidenceByMilestone[reviewTarget.id]}
          busy={busy}
          onAccept={() => buyerAccept(reviewTarget)}
          onRevision={(criteria, note) => buyerRequestRevision(reviewTarget, criteria, note)}
          onDispute={() => { setDisputeTarget({ milestone: reviewTarget }); }}
          onClose={() => setReviewTarget(null)}
        />
      )}
      {disputeTarget && (
        <DisputeModal
          milestone={disputeTarget.milestone}
          busy={busy}
          onSubmit={(reason, desc) => raiseDispute(disputeTarget.milestone, reason, desc)}
          onClose={() => setDisputeTarget(null)}
        />
      )}
      {showChangeRequest && (
        <ChangeRequestModal
          role={role}
          vendorType={vendorType}
          employees={employees}
          busy={busy}
          onSubmit={raiseChangeRequest}
          onClose={() => setShowChangeRequest(false)}
        />
      )}
      {showTerminate && contract && (
        <TerminateModal
          vendorType={vendorType}
          noticeDays={contract.notice_period_days ?? NOTICE_PERIOD_DAYS[vendorType] ?? 14}
          busy={busy}
          onSubmit={initiateTermination}
          onClose={() => setShowTerminate(false)}
        />
      )}
      {showReviewForm && (
        <ReviewFormModal
          criteria={role === 'buyer' ? BUYER_REVIEW_CRITERIA : VENDOR_REVIEW_CRITERIA}
          counterparty={counterparty}
          role={role}
          busy={busy}
          onSubmit={submitReview}
          onClose={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending_signature: 'bg-amber-100 text-amber-700',
    pending_ir35: 'bg-amber-100 text-amber-700',
    active: 'bg-green-100 text-green-700',
    closing: 'bg-purple-100 text-purple-700',
    closed: 'bg-gray-100 text-gray-600',
    terminated: 'bg-red-100 text-red-600',
  };
  const label: Record<string, string> = {
    pending_signature: 'Awaiting signatures',
    pending_ir35: 'Awaiting IR35 stamp',
    active: 'Active',
    closing: 'Closing — reviews open',
    closed: 'Closed',
    terminated: 'Terminated',
  };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>{label[status] ?? status}</span>;
}

function DisputeBanner({ dispute, role, onPosition, onSettle }: {
  dispute: any; role: Role;
  onPosition: (d: any, position: string) => void;
  onSettle: (d: any) => void;
}) {
  const [position, setPosition] = useState('');
  const hrs = Math.max(0, hoursLeft(dispute.bilateral_deadline));
  const inBilateral = dispute.status === 'bilateral';
  const myPosition = role === 'buyer' ? dispute.buyer_position : dispute.vendor_position;

  return (
    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-red-800">
          <span className="font-semibold">Dispute open ({dispute.reason?.replace(/_/g, ' ')})</span> — escrow frozen, auto-release blocked.
        </div>
        {inBilateral ? (
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${hrs > 24 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            <Clock className="h-3 w-3 inline mr-1" />{Math.floor(hrs)}h left in bilateral window
          </span>
        ) : (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700">Admin reviewing — decision is final</span>
        )}
      </div>
      <p className="text-xs text-red-700">{dispute.description}</p>
      {inBilateral && (
        <div className="space-y-2">
          <p className="text-xs text-red-700">
            Try to settle directly in the Messages tab. Record your written position below — the admin sees it if the window expires.
          </p>
          {myPosition ? (
            <p className="text-xs text-gray-600 bg-white rounded-lg p-2 border border-red-100"><span className="font-semibold">Your position:</span> {myPosition}</p>
          ) : (
            <div className="flex gap-2">
              <input value={position} onChange={e => setPosition(e.target.value)} placeholder="Your written position…"
                className="flex-1 border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              <button onClick={() => position.trim() && onPosition(dispute, position.trim())} className="px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg">Record</button>
            </div>
          )}
          <button onClick={() => onSettle(dispute)} className="text-xs font-semibold text-green-700 underline">
            We settled it between us — close the dispute and unfreeze escrow
          </button>
        </div>
      )}
    </div>
  );
}

function DiscoveryConversionCard({ evidence, counterparty, onBuildWith, onTakeToMarketplace }: {
  evidence: any; counterparty: string;
  onBuildWith: () => void; onTakeToMarketplace: () => void;
}) {
  const downloadSpec = async () => {
    const filePaths: string[] = Array.isArray(evidence?.files) ? evidence.files.map(String) : [];
    if (filePaths.length === 0) return;
    const { data } = await supabase.storage.from('engagement-files').createSignedUrl(filePaths[0], 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-blue-800">
        <span className="font-semibold">Discovery complete.</span> Build the full project with {counterparty}, or take the spec to the open marketplace.
      </div>
      <div className="flex gap-2">
        <button onClick={async () => { await downloadSpec(); onTakeToMarketplace(); }} className="px-4 py-2 border border-blue-300 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-100">
          Take to marketplace
        </button>
        <button onClick={onBuildWith} className="px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
          Build with {counterparty}
        </button>
      </div>
    </div>
  );
}

// ─── Delivery tab ─────────────────────────────────────────────────────────────

function DeliveryTab(props: {
  role: Role; vendorType: string; eng: Engagement;
  milestones: Milestone[]; evidenceByMilestone: Record<string, any>;
  flags: any[]; checkIns: any[]; hourlyLogs: any[]; weeklyLogs: any[];
  busy: boolean; engagementActive: boolean;
  onFund: (m: Milestone) => void;
  onSubmitEvidence: (m: Milestone) => void;
  onReview: (m: Milestone) => void;
  onVendorRespondFlag: (flag: any, response: string, accept: boolean) => void;
  onBuyerResolveFlag: (flag: any, satisfied: boolean) => void;
  onGenerateCheckIn: () => void;
  onConfirmCheckIn: (ci: any, scores: Record<string, number>) => void;
  onFlagCheckIn: (ci: any, note: string) => void;
  onLogHours: (date: string, hours: number, description: string) => void;
  onHourlyAction: (logIds: string[], action: 'approve_all' | 'flag', flagIds?: string[], note?: string) => void;
  onWeeklyLog: (text: string) => void;
}) {
  const { role, vendorType, milestones, evidenceByMilestone, flags, engagementActive } = props;
  const openFlags = flags.filter(f => ['open', 'vendor_responded'].includes(f.status));

  return (
    <div className="space-y-6">
      {/* Open flags (Path A clarification) */}
      {openFlags.map(flag => (
        <FlagCard key={flag.id} flag={flag} role={role} busy={props.busy}
          onVendorRespond={props.onVendorRespondFlag} onBuyerResolve={props.onBuyerResolveFlag} />
      ))}

      {/* Milestone stepper */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-[#0B2D59] mb-1">Milestones & Escrow</h2>
        <p className="text-xs text-gray-400 mb-4">
          {role === 'buyer'
            ? 'Money only moves when you approve. Fund a milestone to start work; silence for 7 days after submission auto-releases payment.'
            : 'Work starts once the buyer funds. Submit evidence when done — payment releases on acceptance or after 7 days of buyer silence.'}
        </p>
        <div className="space-y-3">
          {milestones.length === 0 && <p className="text-sm text-gray-400">No milestones on this engagement.</p>}
          {milestones.map((ms, idx) => {
            const badge = ESCROW_BADGE[ms.escrow_status] ?? ESCROW_BADGE.unfunded;
            const ev = evidenceByMilestone[ms.id];
            return (
              <div key={ms.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-[#0070F3] text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                    <span className="font-semibold text-gray-900 text-sm">{ms.title}</span>
                    {ms.milestone_type === 'onboarding' && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Onboarding</span>}
                    {ms.milestone_type === 'discovery' && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Discovery</span>}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <span className="font-bold text-[#0B2D59] text-sm">{formatGBP(ms.amount ?? 0)}</span>
                </div>
                {ms.description && <p className="text-xs text-gray-500 mb-2 ml-8">{ms.description}</p>}
                {(ms.acceptance_criteria ?? []).length > 0 && (
                  <ul className="ml-8 mb-2 space-y-0.5">
                    {(ms.acceptance_criteria ?? []).map((c, i) => (
                      <li key={i} className="text-xs text-gray-500 flex gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />{String(c)}</li>
                    ))}
                  </ul>
                )}
                {ms.escrow_status === 'submitted' && ms.auto_release_at && (() => {
                  const daysLeft = Math.ceil((new Date(ms.auto_release_at).getTime() - Date.now()) / 86_400_000);
                  const urgent = daysLeft <= getPlatformSettings().autoReleaseWarningDays;
                  return (
                    <p className={`ml-8 text-xs mb-2 ${urgent ? 'text-amber-700 bg-amber-50 rounded-lg px-2 py-1 font-medium w-fit' : 'text-gray-400'}`}>
                      <Clock className="h-3 w-3 inline mr-1" />
                      Auto-release {new Date(ms.auto_release_at).toLocaleDateString('en-GB')}{urgent ? ` — ${Math.max(daysLeft, 0)}d left, act now` : ''} — silence equals acceptance.
                    </p>
                  );
                })()}
                {ms.escrow_status === 'rejected' && ms.rejection_reason && (
                  <p className="ml-8 text-xs text-red-600 bg-red-50 rounded-lg p-2 mb-2">Revision requested: {ms.rejection_reason}</p>
                )}

                <div className="ml-8 flex flex-wrap gap-2">
                  {role === 'buyer' && ms.escrow_status === 'unfunded' && engagementActive && (
                    <button onClick={() => props.onFund(ms)} className="px-3 py-1.5 bg-[#0070F3] text-white text-xs font-semibold rounded-lg">
                      <PoundSterling className="h-3 w-3 inline mr-1" />Fund this milestone — {formatGBP(ms.amount ?? 0)}
                    </button>
                  )}
                  {role === 'vendor' && ['funded', 'in_progress', 'rejected'].includes(ms.escrow_status) && (
                    <button onClick={() => props.onSubmitEvidence(ms)} className="px-3 py-1.5 bg-[#0070F3] text-white text-xs font-semibold rounded-lg">
                      {ms.escrow_status === 'rejected' ? 'Resubmit evidence' : 'Submit evidence'}
                    </button>
                  )}
                  {role === 'buyer' && ms.escrow_status === 'submitted' && (
                    <button onClick={() => props.onReview(ms)} className="px-3 py-1.5 bg-[#0070F3] text-white text-xs font-semibold rounded-lg">
                      Review evidence
                    </button>
                  )}
                  {ev && ms.escrow_status !== 'unfunded' && (
                    <span className="text-xs text-gray-400 self-center">Evidence submitted {new Date(ev.submitted_at).toLocaleDateString('en-GB')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MSP / Staff aug: monthly check-ins */}
      {(vendorType === 'msp' || vendorType === 'staffaug') && (
        <CheckInSection {...props} />
      )}

      {/* Staff aug: weekly status + hourly */}
      {vendorType === 'staffaug' && (
        <>
          <WeeklyLogSection role={role} weeklyLogs={props.weeklyLogs} onSubmit={props.onWeeklyLog} active={engagementActive} />
          <HourlySection role={role} hourlyLogs={props.hourlyLogs} onLog={props.onLogHours} onAction={props.onHourlyAction} active={engagementActive} />
        </>
      )}
    </div>
  );
}

function FlagCard({ flag, role, busy, onVendorRespond, onBuyerResolve }: {
  flag: any; role: Role; busy: boolean;
  onVendorRespond: (flag: any, response: string, accept: boolean) => void;
  onBuyerResolve: (flag: any, satisfied: boolean) => void;
}) {
  const [response, setResponse] = useState('');
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Flag className="h-4 w-4 text-amber-600" />
        <span className="font-semibold text-amber-800 text-sm">
          Flagged criteria — clarification window (respond by {new Date(flag.respond_by).toLocaleDateString('en-GB')})
        </span>
      </div>
      {(flag.flagged_criteria ?? []).length > 0 && (
        <ul className="mb-2 space-y-0.5">
          {(flag.flagged_criteria ?? []).map((c: string, i: number) => (
            <li key={i} className="text-xs text-amber-800 flex gap-1.5"><X className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />{c}</li>
          ))}
        </ul>
      )}
      {flag.note && <p className="text-xs text-amber-700 mb-2">Buyer note: {flag.note}</p>}
      {flag.vendor_response && <p className="text-xs text-gray-700 bg-white rounded-lg p-2 mb-2 border border-amber-100">Vendor response: {flag.vendor_response}</p>}

      {role === 'vendor' && flag.status === 'open' && (
        <div className="space-y-2">
          <textarea value={response} onChange={e => setResponse(e.target.value)} rows={2}
            placeholder="Respond: accept the flag and describe the fix, or dispute it with evidence (files/logs/demo URL in Messages)…"
            className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
          <div className="flex gap-2">
            <button disabled={!response.trim() || busy} onClick={() => onVendorRespond(flag, response.trim(), true)}
              className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50">Accept flag — will fix</button>
            <button disabled={!response.trim() || busy} onClick={() => onVendorRespond(flag, response.trim(), false)}
              className="px-3 py-1.5 border border-amber-400 text-amber-700 text-xs font-semibold rounded-lg disabled:opacity-50">Dispute flag with evidence</button>
          </div>
          <p className="text-xs text-amber-600">No response in 5 days auto-raises a dispute and is logged on your profile permanently.</p>
        </div>
      )}
      {role === 'buyer' && flag.status === 'vendor_responded' && (
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => onBuyerResolve(flag, true)}
            className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg">Satisfied — release payment</button>
          <button disabled={busy} onClick={() => onBuyerResolve(flag, false)}
            className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-semibold rounded-lg">Still disputed — escalate to full dispute</button>
        </div>
      )}
    </div>
  );
}

function CheckInSection(props: any) {
  const { role, vendorType, checkIns, engagementActive } = props;
  const criteria = vendorType === 'msp' ? MSP_CHECKIN_CRITERIA : STAFFAUG_CHECKIN_CRITERIA;
  const [scoresById, setScoresById] = useState<Record<string, Record<string, number>>>({});
  const [flagNote, setFlagNote] = useState('');
  const [flaggingId, setFlaggingId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-[#0B2D59]">Monthly Check-ins</h2>
        {engagementActive && (
          <button onClick={props.onGenerateCheckIn} className="text-xs font-semibold text-[#0070F3] flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Open {monthLabel()} check-in
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Opens 5 business days before each charge. {role === 'buyer'
          ? 'Confirm fires the charge; flag holds it. Two bad months in a row activate the ' + (vendorType === 'msp' ? 'service credit clause.' : 'replacement guarantee.')
          : 'The buyer rates 5 measures. Confirmed check-ins fire the monthly charge.'}
      </p>
      <div className="space-y-3">
        {checkIns.length === 0 && <p className="text-sm text-gray-400">No check-ins yet.</p>}
        {checkIns.map((ci: any) => (
          <div key={ci.id} className="border border-gray-100 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="font-semibold text-sm text-gray-900">{ci.period_label}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                ci.status === 'confirmed' || ci.status === 'auto_confirmed' ? 'bg-green-100 text-green-700'
                : ci.status === 'flagged' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
              }`}>
                {ci.status === 'open' ? `Open — charge ${ci.charge_date ?? 'pending'}` : ci.status}
              </span>
            </div>
            {ci.status === 'open' && role === 'buyer' && (
              <div className="space-y-2">
                {criteria.map((c: string) => (
                  <div key={c} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{c}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n}
                          onClick={() => setScoresById(prev => ({ ...prev, [ci.id]: { ...(prev[ci.id] ?? {}), [c]: n } }))}
                          className={`w-6 h-6 rounded text-xs font-bold ${((scoresById[ci.id] ?? {})[c] ?? 0) >= n ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {flaggingId === ci.id ? (
                  <div className="flex gap-2 pt-1">
                    <input value={flagNote} onChange={e => setFlagNote(e.target.value)} placeholder="What went wrong this month?"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs" />
                    <button onClick={() => { props.onFlagCheckIn(ci, flagNote); setFlaggingId(null); setFlagNote(''); }}
                      disabled={!flagNote.trim()}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50">Flag — hold charge</button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => props.onConfirmCheckIn(ci, scoresById[ci.id] ?? {})}
                      disabled={Object.keys(scoresById[ci.id] ?? {}).length < criteria.length}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                      Confirm — charge fires
                    </button>
                    <button onClick={() => setFlaggingId(ci.id)} className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-semibold rounded-lg">
                      Flag criteria — hold charge
                    </button>
                  </div>
                )}
              </div>
            )}
            {ci.status !== 'open' && ci.scores && (
              <div className="flex flex-wrap gap-3">
                {Object.entries(ci.scores as Record<string, number>).map(([k, v]) => (
                  <span key={k} className="text-xs text-gray-500">{k}: <span className="font-semibold text-gray-700">{v}/5</span></span>
                ))}
                {ci.below_threshold && <span className="text-xs text-red-600 font-semibold">Below threshold</span>}
              </div>
            )}
            {ci.status === 'flagged' && ci.flag_note && <p className="text-xs text-red-600 mt-1">Flag: {ci.flag_note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyLogSection({ role, weeklyLogs, onSubmit, active }: {
  role: Role; weeklyLogs: any[]; onSubmit: (text: string) => void; active: boolean;
}) {
  const [text, setText] = useState('');
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-bold text-[#0B2D59] mb-1">Weekly Status Log</h2>
      <p className="text-xs text-gray-400 mb-4">Max 200 characters. Visible to the buyer in real time — a paper trail for disputes.</p>
      {role === 'vendor' && active && (
        <div className="flex gap-2 mb-4">
          <input value={text} onChange={e => setText(e.target.value.slice(0, 200))}
            placeholder='e.g. "Week 3 Jun: Completed auth module. Starting payments."'
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <button onClick={() => { if (text.trim()) { onSubmit(text.trim()); setText(''); } }}
            disabled={!text.trim()}
            className="px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg disabled:opacity-50">Post</button>
        </div>
      )}
      <div className="space-y-2">
        {weeklyLogs.length === 0 && <p className="text-sm text-gray-400">No weekly updates yet.</p>}
        {weeklyLogs.map((wl: any) => (
          <div key={wl.id} className="border border-gray-100 rounded-lg p-3 text-sm text-gray-700">
            <span className="text-xs text-gray-400 mr-2">{wl.week_of}</span>{wl.status_text}
          </div>
        ))}
      </div>
    </div>
  );
}

function HourlySection({ role, hourlyLogs, onLog, onAction, active }: {
  role: Role; hourlyLogs: any[];
  onLog: (date: string, hours: number, description: string) => void;
  onAction: (logIds: string[], action: 'approve_all' | 'flag', flagIds?: string[], note?: string) => void;
  active: boolean;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState('');
  const [desc, setDesc] = useState('');
  const [flagIds, setFlagIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');

  const pending = hourlyLogs.filter((l: any) => ['logged', 'submitted'].includes(l.status));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-bold text-[#0B2D59] mb-1">Hourly Log</h2>
      <p className="text-xs text-gray-400 mb-4">
        {role === 'vendor' ? 'Log hours daily — the buyer sees them in real time. Month-end invoice, 5-day review window.'
          : 'Hour log in real time. Approve all, or flag specific entries (disputed held, rest paid). No action = auto-approved after 5 days.'}
      </p>
      {role === 'vendor' && active && (
        <div className="flex flex-wrap gap-2 mb-4">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input type="number" min="0.5" max="24" step="0.5" value={hours} onChange={e => setHours(e.target.value)} placeholder="Hours"
            className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was done"
            className="flex-1 min-w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <button onClick={() => { if (Number(hours) > 0 && desc.trim()) { onLog(date, Number(hours), desc.trim()); setHours(''); setDesc(''); } }}
            disabled={!(Number(hours) > 0 && desc.trim())}
            className="px-4 py-2 bg-[#0070F3] text-white text-sm font-semibold rounded-lg disabled:opacity-50">Log</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500">
            <tr className="border-b border-gray-100 text-left">
              {role === 'buyer' && <th className="py-2 pr-2">Flag</th>}
              <th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Hours</th><th className="py-2 pr-4">Description</th><th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {hourlyLogs.length === 0 && <tr><td colSpan={5} className="py-4 text-gray-400 text-sm">No hours logged yet.</td></tr>}
            {hourlyLogs.map((l: any) => (
              <tr key={l.id} className="border-b border-gray-50">
                {role === 'buyer' && (
                  <td className="py-2 pr-2">
                    {['logged', 'submitted'].includes(l.status) && (
                      <input type="checkbox" checked={flagIds.has(l.id)}
                        onChange={() => setFlagIds(prev => { const n = new Set(prev); n.has(l.id) ? n.delete(l.id) : n.add(l.id); return n; })} />
                    )}
                  </td>
                )}
                <td className="py-2 pr-4 text-gray-600">{l.log_date}</td>
                <td className="py-2 pr-4 font-semibold">{l.hours}</td>
                <td className="py-2 pr-4 text-gray-600">{l.description}</td>
                <td className="py-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    l.status === 'approved' || l.status === 'paid' ? 'bg-green-100 text-green-700'
                    : l.status === 'flagged' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{l.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {role === 'buyer' && pending.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <button onClick={() => onAction(pending.map((l: any) => l.id), 'approve_all')}
            className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg">Approve all pending</button>
          {flagIds.size > 0 && (
            <>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Why are these entries disputed?"
                className="flex-1 min-w-40 border border-gray-200 rounded-lg px-3 py-1.5 text-xs" />
              <button onClick={() => { onAction(pending.map((l: any) => l.id), 'flag', Array.from(flagIds), note); setFlagIds(new Set()); setNote(''); }}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg">
                Flag {flagIds.size} — hold disputed, pay rest
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Payments tab ─────────────────────────────────────────────────────────────

function PaymentsTab({ role, milestones, invoices, eng }: { role: Role; milestones: Milestone[]; invoices: any[]; eng: Engagement }) {
  const escrowed = milestones.filter(m => ['funded', 'in_progress', 'submitted', 'rejected'].includes(m.escrow_status)).reduce((s, m) => s + (m.amount ?? 0), 0);
  const released = milestones.filter(m => m.escrow_status === 'released').reduce((s, m) => s + (m.amount ?? 0), 0);
  const pendingReview = milestones.filter(m => m.escrow_status === 'submitted').reduce((s, m) => s + (m.amount ?? 0), 0);
  const disputed = milestones.filter(m => m.escrow_status === 'in_dispute').reduce((s, m) => s + (m.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['In escrow', escrowed, 'text-blue-600'],
          ['Released', released, 'text-green-600'],
          ['Pending approval', pendingReview, 'text-amber-600'],
          ['Frozen (dispute)', disputed, 'text-red-600'],
        ].map(([label, value, cls]) => (
          <div key={label as string} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-xl font-bold ${cls}`}>{formatGBP(value as number)}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-[#0B2D59] mb-4">Invoices</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500">
              <tr className="border-b border-gray-100 text-left">
                <th className="py-2 pr-4">Number</th><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">{role === 'vendor' ? 'Gross' : 'Amount'}</th>
                {role === 'vendor' && <th className="py-2 pr-4">Platform fee</th>}
                {role === 'vendor' && <th className="py-2 pr-4">Net payout</th>}
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && <tr><td colSpan={7} className="py-4 text-gray-400">No invoices yet.</td></tr>}
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="py-2 pr-4 text-gray-600">{new Date(inv.issued_at).toLocaleDateString('en-GB')}</td>
                  <td className="py-2 pr-4 text-gray-600">{inv.description}{inv.period_label ? ` (${inv.period_label})` : ''}</td>
                  {/* Buyers always see gross; the platform fee is never shown to buyers. */}
                  <td className="py-2 pr-4 font-semibold">{formatGBP(inv.gross_amount)}</td>
                  {role === 'vendor' && <td className="py-2 pr-4 text-gray-500">−{formatGBP(inv.platform_fee_amount ?? 0)}</td>}
                  {role === 'vendor' && <td className="py-2 pr-4 font-bold text-green-700">{formatGBP(inv.net_amount ?? inv.gross_amount)}</td>}
                  <td className="py-2"><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {role === 'buyer' && eng.payment_model !== 'milestone' && (
          <p className="text-xs text-gray-400 mt-3">
            Recurring engagements charge automatically after each confirmed check-in. You can't cancel the
            subscription at the card level — use the formal termination flow in Governance.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Messages tab ─────────────────────────────────────────────────────────────

function MessagesTab({ messages, meId, counterparty, onSend, disputeActive }: {
  messages: any[]; meId: string; counterparty: string;
  onSend: (content: string) => Promise<{ flagged: boolean }>;
  disputeActive: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [offPlatformWarned, setOffPlatformWarned] = useState(false);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const { flagged } = await onSend(draft.trim());
      if (flagged) setOffPlatformWarned(true);
      setDraft('');
    } finally { setSending(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[560px]">
      <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <div className="font-semibold text-[#0B2D59] text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Engagement thread with {counterparty}
        </div>
        {disputeActive && <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Dispute window — settle here</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && <p className="text-sm text-gray-400 text-center mt-10">No messages yet — scope clarifications, support issues and dispute resolution all happen in this one thread.</p>}
        {messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.sender_id === meId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-xl px-3.5 py-2 text-sm ${m.sender_id === meId ? 'bg-[#0070F3] text-white' : 'bg-gray-100 text-gray-800'}`}>
              {m.content}
              <div className={`text-[10px] mt-1 ${m.sender_id === meId ? 'text-blue-100' : 'text-gray-400'}`}>
                {new Date(m.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Off-platform warning: non-dismissible once triggered; message still sends. */}
      {offPlatformWarned && (
        <div className="mx-5 mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {OFF_PLATFORM_WARNING} Your message was delivered; this notice has been logged for admin visibility.
        </div>
      )}
      <div className="border-t border-gray-100 p-4 flex gap-2">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1}
          placeholder="Type a message… (Enter to send, Shift+Enter for a new line)"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3] resize-none"
        />
        <button onClick={send} disabled={!draft.trim() || sending} className="px-4 py-2 bg-[#0070F3] text-white rounded-xl disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Governance tab ───────────────────────────────────────────────────────────

function GovernanceTab({ role, eng, contract, disputes, changeRequests, termination, reviews, meId, busy, onRaiseChange, onRespondChange, onOpenDispute, onTerminate, hasOpenDispute }: {
  role: Role; eng: Engagement; contract: Contract | null;
  disputes: any[]; changeRequests: any[]; termination: any | null; reviews: any[];
  meId: string; employees: any[]; busy: boolean;
  onRaiseChange: () => void;
  onRespondChange: (cr: any, accept: boolean, note: string) => void;
  onOpenDispute: () => void;
  onTerminate: () => void;
  hasOpenDispute: boolean;
}) {
  const [responseNote, setResponseNote] = useState('');
  const engActive = ['active', 'closing'].includes(eng.status);
  const replacementDeadline = eng.replacement_opened_at
    ? addBusinessDays(new Date(eng.replacement_opened_at), eng.replacement_sla_days || 10)
    : null;

  return (
    <div className="space-y-6">
      {/* Contract & SOW */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-[#0B2D59] mb-3">Contract & SOW</h2>
        {contract ? (
          <div className="text-sm text-gray-600 space-y-1">
            <p><FileText className="h-4 w-4 inline mr-1 text-gray-400" />{contract.title}</p>
            <p className="text-xs text-gray-400">
              {contract.contract_number} · Status: {contract.status} · Value {formatGBP(contract.total_value)} ·
              Notice period {contract.notice_period_days ?? '—'} days
            </p>
            <p className="text-xs text-gray-400">
              Signatures: buyer {contract.signed_by_customer ? '✓' : '—'} · vendor {contract.signed_by_vendor ? '✓' : '—'}
            </p>
          </div>
        ) : <p className="text-sm text-gray-400">No contract linked.</p>}
        {eng.working_location && (
          <p className="text-xs text-gray-500 mt-2">Working location: {eng.working_location} · IR35: {eng.ir35_status ?? 'n/a'}</p>
        )}
      </div>

      {/* Staff aug replacement SLA */}
      {eng.replacement_opened_at && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-semibold text-amber-800 text-sm mb-1">Employee replacement in progress</h3>
          <p className="text-xs text-amber-700">
            Opened {new Date(eng.replacement_opened_at).toLocaleDateString('en-GB')} — SLA deadline{' '}
            {replacementDeadline?.toLocaleDateString('en-GB')} ({eng.replacement_sla_days || 10} business days).
            {role === 'buyer' && ' If it expires without a replacement, you may withhold the next charge.'}
          </p>
        </div>
      )}

      {/* Change requests */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#0B2D59]">Change Requests & Amendments</h2>
          {engActive && (
            <button onClick={onRaiseChange} className="px-3 py-1.5 bg-[#0070F3] text-white text-xs font-semibold rounded-lg">Request a Change</button>
          )}
        </div>
        <div className="space-y-3">
          {changeRequests.length === 0 && <p className="text-sm text-gray-400">No change requests. Either side can request scope, timeline, payment or milestone changes after signing.</p>}
          {changeRequests.map((cr: any) => (
            <div key={cr.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-900 capitalize">{cr.request_type} change <span className="text-xs text-gray-400 font-normal">by {cr.requested_by_role}</span></span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  cr.status === 'accepted' ? 'bg-green-100 text-green-700'
                  : cr.status === 'rejected' ? 'bg-red-100 text-red-600'
                  : cr.status === 'expired' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>
                  {cr.status === 'pending' ? `Pending — respond by ${new Date(cr.respond_by).toLocaleDateString('en-GB')}` : cr.status}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{cr.description}</p>
              {cr.status === 'accepted' && (
                <p className="text-xs text-green-600">Signed amendment stored alongside the original contract.</p>
              )}
              {cr.status === 'pending' && cr.requested_by !== meId && (
                <div className="flex flex-wrap gap-2">
                  <input value={responseNote} onChange={e => setResponseNote(e.target.value)} placeholder="Optional note…"
                    className="flex-1 min-w-40 border border-gray-200 rounded-lg px-3 py-1.5 text-xs" />
                  <button disabled={busy} onClick={() => onRespondChange(cr, true, responseNote)}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg">Accept & sign amendment</button>
                  <button disabled={busy} onClick={() => onRespondChange(cr, false, responseNote)}
                    className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-semibold rounded-lg">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dispute history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#0B2D59]">Dispute Centre</h2>
          {engActive && !hasOpenDispute && (
            <button onClick={onOpenDispute} className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-semibold rounded-lg">
              <Scale className="h-3.5 w-3.5 inline mr-1" />Raise a dispute
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-3">Request a revision on the milestone first — most issues should end there. A formal dispute freezes escrow immediately.</p>
        <div className="space-y-3">
          {disputes.length === 0 && <p className="text-sm text-gray-400">No disputes on this engagement.</p>}
          {disputes.map((d: any) => (
            <div key={d.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-900 capitalize">{d.reason?.replace(/_/g, ' ')} <span className="text-xs font-normal text-gray-400">opened by {d.opened_by_role}</span></span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  d.status === 'resolved' ? 'bg-green-100 text-green-700' : d.status === 'admin_review' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-600'}`}>
                  {d.status}
                </span>
              </div>
              <p className="text-xs text-gray-600">{d.description}</p>
              {d.status === 'resolved' && (
                <p className="text-xs text-green-700 mt-1">
                  Resolution: {d.resolution?.replace(/_/g, ' ')}{d.resolution === 'split' && d.split_vendor_pct != null ? ` (${d.split_vendor_pct}% vendor / ${100 - d.split_vendor_pct}% buyer)` : ''}
                  {d.resolution_notes ? ` — ${d.resolution_notes}` : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-[#0B2D59] mb-3">Reviews</h2>
          <div className="space-y-3">
            {reviews.map((r: any) => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{r.direction === 'buyer_of_vendor' ? 'Buyer → Vendor' : 'Vendor → Buyer'}</span>
                  <span className="flex">{[1, 2, 3, 4, 5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />)}</span>
                  {r.moderation_status === 'pending' && <span className="text-xs text-amber-600">awaiting moderation</span>}
                </div>
                <p className="text-xs text-gray-600">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Termination */}
      {engActive && !termination && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
          <h2 className="font-bold text-red-700 mb-1">Terminate Contract</h2>
          <p className="text-xs text-gray-500 mb-3">
            Formal flow with a notice period ({contract?.notice_period_days ?? '—'} days for this contract type). Unfunded escrow returns to the buyer.
            {hasOpenDispute && ' An open dispute must resolve first.'}
          </p>
          <button onClick={onTerminate} disabled={hasOpenDispute}
            className="px-4 py-2 border border-red-300 text-red-600 text-sm font-semibold rounded-lg disabled:opacity-40">
            <Ban className="h-4 w-4 inline mr-1" />Start termination
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0B2D59]">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FundModal({ milestone, busy, onConfirm, onClose }: {
  milestone: Milestone; busy: boolean; onConfirm: (last4: string) => void; onClose: () => void;
}) {
  const [card, setCard] = useState('4242');
  return (
    <ModalShell title={`Fund this milestone — ${formatGBP(milestone.amount ?? 0)}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          The money goes into escrow — held by Collabov via Stripe, <span className="font-semibold">not paid to the vendor yet</span>.
          The vendor only starts once funded, and payment releases only when you accept (or after 7 days of silence).
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card (last 4 digits — simulated)</label>
          <input value={card} onChange={e => setCard(e.target.value.slice(0, 4))} className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={() => onConfirm(card)} disabled={busy}
          className="w-full py-3 bg-[#0070F3] text-white font-semibold rounded-xl disabled:opacity-50">
          {busy ? 'Processing…' : `Fund ${formatGBP(milestone.amount ?? 0)} into escrow`}
        </button>
      </div>
    </ModalShell>
  );
}

function EvidenceModal({ milestone, engagementId, isDiscovery, busy, onSubmit, onClose }: {
  milestone: Milestone; engagementId: string; isDiscovery: boolean; busy: boolean;
  onSubmit: (p: { description: string; checklist: { text: string; checked: boolean }[]; demoUrl: string; files: string[] }) => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState(
    (milestone.acceptance_criteria ?? []).map(c => ({ text: String(c), checked: false }))
  );

  const minDesc = isDiscovery ? 200 : 100;
  const complete = description.trim().length >= minDesc && (files.length > 0 || demoUrl.trim().length > 0);
  const unchecked = checklist.filter(c => !c.checked).length;

  const fileDisplayName = (path: string) => path.split('/').pop()?.replace(/^\d+-/, '') ?? path;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const path = `${engagementId}/${milestone.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const { error } = await supabase.storage.from('engagement-files').upload(path, file);
      if (error) throw error;
      setFiles(prev => [...prev, path]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ModalShell title={`Evidence — ${milestone.title}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery description <span className="text-gray-400 font-normal">(min {minDesc} chars)</span>
          </label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            placeholder={isDiscovery ? 'Executive summary of the specification (min 200 chars)…' : 'What was delivered and how it meets the criteria…'}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none" />
          <p className={`text-xs mt-1 ${description.trim().length < minDesc ? 'text-red-500' : 'text-gray-400'}`}>{description.trim().length}/{minDesc}</p>
        </div>
        {checklist.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acceptance criteria checklist</label>
            <div className="space-y-1.5">
              {checklist.map((c, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer text-sm text-gray-600">
                  <input type="checkbox" checked={c.checked}
                    onChange={() => setChecklist(prev => prev.map((x, j) => j === i ? { ...x, checked: !x.checked } : x))}
                    className="mt-0.5 rounded" />
                  {c.text}
                </label>
              ))}
            </div>
            {unchecked > 0 && <p className="text-xs text-amber-600 mt-1"><AlertTriangle className="h-3 w-3 inline mr-1" />{unchecked} criteria unchecked — the buyer will see this.</p>}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Files {isDiscovery && <span className="text-red-500">(spec PDF required)</span>}</label>
          <label className={`flex items-center justify-center gap-2 border border-dashed rounded-lg px-3 py-3 text-sm cursor-pointer ${uploading ? 'border-gray-200 text-gray-400' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
            <input type="file" onChange={handleFileSelect} disabled={uploading} className="hidden" />
            {uploading ? 'Uploading…' : 'Click to upload a file'}
          </label>
          {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5 mt-1">
              {fileDisplayName(f)}<button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-red-400"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Demo / staging URL <span className="text-gray-400 font-normal">(optional)</span></label>
          <input value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder="https://staging.example.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <p className="text-xs text-gray-400">Evidence locks on submit — it cannot be edited. The buyer has 7 days to review.</p>
        <button
          onClick={() => onSubmit({ description: description.trim(), checklist, demoUrl: demoUrl.trim(), files })}
          disabled={!complete || busy || uploading}
          className="w-full py-3 bg-[#0070F3] text-white font-semibold rounded-xl disabled:opacity-40">
          {busy ? 'Submitting…' : 'Submit evidence (locks on submit)'}
        </button>
      </div>
    </ModalShell>
  );
}

function BuyerReviewModal({ milestone, evidence, busy, onAccept, onRevision, onDispute, onClose }: {
  milestone: Milestone; evidence: any; busy: boolean;
  onAccept: () => void;
  onRevision: (criteria: string[], note: string) => void;
  onDispute: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'view' | 'revision'>('view');
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [signedFileUrls, setSignedFileUrls] = useState<Record<string, string>>({});
  const criteria = (milestone.acceptance_criteria ?? []).map(String);
  const checklist: { text: string; checked: boolean }[] = Array.isArray(evidence?.criteria_checklist) ? evidence.criteria_checklist : [];

  useEffect(() => {
    const paths: string[] = Array.isArray(evidence?.files) ? evidence.files.map(String) : [];
    if (paths.length === 0) { setSignedFileUrls({}); return; }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(paths.map(async (path) => {
        const { data } = await supabase.storage.from('engagement-files').createSignedUrl(path, 3600);
        return [path, data?.signedUrl ?? ''] as const;
      }));
      if (!cancelled) setSignedFileUrls(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [evidence]);

  return (
    <ModalShell title={`Review delivery — ${milestone.title}`} onClose={onClose}>
      <div className="space-y-4">
        {evidence ? (
          <>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Delivery description</div>
              <p className="text-sm text-gray-700">{evidence.delivery_description}</p>
            </div>
            {checklist.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Vendor's criteria checklist</div>
                {checklist.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {c.checked ? <CheckCircle className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-400" />}
                    <span className={c.checked ? 'text-gray-700' : 'text-red-600'}>{c.text}</span>
                  </div>
                ))}
              </div>
            )}
            {Array.isArray(evidence.files) && evidence.files.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Files:</span>
                <div className="space-y-1">
                  {evidence.files.map(String).map((f: string, i: number) => (
                    <a key={i} href={signedFileUrls[f] || '#'} target="_blank" rel="noreferrer"
                      className="block text-xs text-[#0070F3] hover:underline truncate">
                      📎 {f.split('/').pop()?.replace(/^\d+-/, '') ?? f}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {evidence.demo_url && (
              <a href={evidence.demo_url} target="_blank" rel="noreferrer" className="inline-block text-xs font-semibold bg-blue-50 text-[#0070F3] px-3 py-1.5 rounded-full">
                🔗 Demo / staging URL
              </a>
            )}
          </>
        ) : <p className="text-sm text-gray-400">Evidence record not found.</p>}

        {mode === 'view' ? (
          <div className="space-y-2 pt-2">
            <button onClick={onAccept} disabled={busy} className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl disabled:opacity-50">
              Accept — release {formatGBP(milestone.amount ?? 0)} from escrow
            </button>
            <button onClick={() => setMode('revision')} className="w-full py-3 border border-amber-400 text-amber-700 font-semibold rounded-xl">
              Request revision (vendor gets 5 days)
            </button>
            <button onClick={onDispute} className="w-full py-3 border border-red-300 text-red-600 font-semibold rounded-xl">
              Raise a dispute — freeze escrow
            </button>
            <p className="text-xs text-gray-400 text-center">Doing nothing releases payment automatically on day 7 — silence equals acceptance.</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Which criteria are unmet?</label>
              {criteria.map((c, i) => (
                <label key={i} className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={flagged.has(c)}
                    onChange={() => setFlagged(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; })}
                    className="mt-0.5 rounded" />
                  {c}
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-gray-400 font-normal">(min 50 chars)</span></label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
              <p className={`text-xs ${note.trim().length < 50 ? 'text-red-500' : 'text-gray-400'}`}>{note.trim().length}/50</p>
            </div>
            <button
              onClick={() => onRevision(Array.from(flagged), note.trim())}
              disabled={flagged.size === 0 || note.trim().length < 50 || busy}
              className="w-full py-3 bg-amber-500 text-white font-semibold rounded-xl disabled:opacity-40">
              Send revision request
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function DisputeModal({ milestone, busy, onSubmit, onClose }: {
  milestone: Milestone | null; busy: boolean;
  onSubmit: (reason: string, description: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  return (
    <ModalShell title={milestone ? `Dispute — ${milestone.title}` : 'Raise a dispute'} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
          Escrow freezes immediately and auto-release stops. You then have a 72-hour window to settle directly in
          the engagement thread; unresolved disputes go to admin review whose decision is final.
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <select value={reason} onChange={e => setReason(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Select a reason</option>
            {DISPUTE_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Written detail <span className="text-gray-400 font-normal">(min 100 chars)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
          <p className={`text-xs ${description.trim().length < 100 ? 'text-red-500' : 'text-gray-400'}`}>{description.trim().length}/100</p>
        </div>
        <button onClick={() => onSubmit(reason, description.trim())}
          disabled={!reason || description.trim().length < 100 || busy}
          className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl disabled:opacity-40">
          {busy ? 'Opening…' : 'Open dispute — freeze escrow'}
        </button>
      </div>
    </ModalShell>
  );
}

function ChangeRequestModal({ role, vendorType, employees, busy, onSubmit, onClose }: {
  role: Role; vendorType: string; employees: any[]; busy: boolean;
  onSubmit: (type: string, description: string, payload?: any) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState('scope');
  const [description, setDescription] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  const types = [
    ['scope', 'Scope'], ['timeline', 'Timeline'], ['payment', 'Payment'], ['milestones', 'Milestones'],
    ...(vendorType === 'staffaug' && role === 'vendor' ? [['replacement', 'Employee replacement']] : []),
    ...(vendorType === 'staffaug' ? [['extension', 'Extend engagement']] : []),
    ['other', 'Other'],
  ];

  return (
    <ModalShell title="Request a Change" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-gray-400">The other party has 7 days to accept or reject. Accepted changes become a signed amendment stored alongside the original contract.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {types.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {type === 'replacement' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proposed replacement (from your bench)</label>
            <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select an employee</option>
              {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name} — {e.job_title ?? e.role}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">Same terms apply; the buyer accepts and both sign the amendment. SLA: 10 business days.</p>
          </div>
        )}
        {type === 'extension' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New end date</label>
            <input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
        </div>
        <button
          onClick={() => onSubmit(type, description.trim(), {
            ...(employeeId ? { employee_id: employeeId } : {}),
            ...(newEndDate ? { new_end_date: newEndDate } : {}),
          })}
          disabled={!description.trim() || busy || (type === 'replacement' && !employeeId) || (type === 'extension' && !newEndDate)}
          className="w-full py-3 bg-[#0070F3] text-white font-semibold rounded-xl disabled:opacity-40">
          Send change request
        </button>
      </div>
    </ModalShell>
  );
}

function TerminateModal({ vendorType, noticeDays, busy, onSubmit, onClose }: {
  vendorType: string; noticeDays: number; busy: boolean;
  onSubmit: (reason: string, notes: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [ack, setAck] = useState(false);
  const reasons = ['No longer needed', 'Budget change', 'Vendor performance', 'Project cancelled', 'Moving in-house', 'Other'];
  const typeNote = vendorType === 'msp'
    ? 'Managed IT: minimum 30 days. Charges continue; the final charge is pro-rated by admin.'
    : vendorType === 'staffaug'
    ? 'Staff aug: minimum 4 weeks, and at least the remaining minimum engagement period. Current month charge continues.'
    : 'Agency: minimum 14 days. Funded milestones continue; no new milestones.';

  return (
    <ModalShell title="Terminate Contract" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">{typeNote}</div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <select value={reason} onChange={e => setReason(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Select a reason</option>
            {reasons.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Written notice <span className="text-gray-400 font-normal">(min 50 chars)</span></label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
          <p className={`text-xs ${notes.trim().length < 50 ? 'text-red-500' : 'text-gray-400'}`}>{notes.trim().length}/50</p>
        </div>
        <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={ack} onChange={() => setAck(!ack)} className="mt-0.5 rounded" />
          I acknowledge the {noticeDays}-day notice period applies and unfunded escrow returns to the buyer.
        </label>
        <button onClick={() => onSubmit(reason, notes.trim())}
          disabled={!reason || notes.trim().length < 50 || !ack || busy}
          className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl disabled:opacity-40">
          Serve termination notice
        </button>
      </div>
    </ModalShell>
  );
}

function ReviewFormModal({ criteria, counterparty, role, busy, onSubmit, onClose }: {
  criteria: string[]; counterparty: string; role: Role; busy: boolean;
  onSubmit: (scores: Record<string, number>, comment: string) => void;
  onClose: () => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const complete = criteria.every(c => scores[c]) && comment.trim().length >= 50;

  return (
    <ModalShell title={`Review ${counterparty}`} onClose={onClose}>
      <div className="space-y-4">
        {role === 'vendor' && (
          <p className="text-xs text-gray-500 bg-blue-50 rounded-lg p-2">
            Your Payment Reliability rating feeds the buyer's public payment badge — other vendors see it before deciding to work with them.
          </p>
        )}
        {criteria.map(c => (
          <div key={c} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{c}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setScores(prev => ({ ...prev, [c]: n }))}>
                  <Star className={`h-5 w-5 ${(scores[c] ?? 0) >= n ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Written review <span className="text-gray-400 font-normal">(min 50 chars)</span></label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
          <p className={`text-xs ${comment.trim().length < 50 ? 'text-red-500' : 'text-gray-400'}`}>{comment.trim().length}/50</p>
        </div>
        <button onClick={() => onSubmit(scores, comment.trim())} disabled={!complete || busy}
          className="w-full py-3 bg-[#0070F3] text-white font-semibold rounded-xl disabled:opacity-40">
          Submit review
        </button>
      </div>
    </ModalShell>
  );
}
