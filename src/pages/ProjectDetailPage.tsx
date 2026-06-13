import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Check,
  X,
  Download,
  ChevronLeft,
  AlertTriangle,
  Clock,
  Flag,
  MessageSquare,
  CreditCard,
  Activity,
  Users,
  ShieldCheck,
  RefreshCw,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Design tokens ─────────────────────────────────────────────────────────────
// navy: #0B2D59  blue: #0070F3  teal: #0E7C6A  amber: #B06000  red: #C0392B

// ─── Types ────────────────────────────────────────────────────────────────────

type EngagementType = 'staffaug' | 'itagency' | 'msp';
type MilestoneStatus = 'pending' | 'in_review' | 'approved' | 'disputed';
type EvidenceItemStatus = 'pending' | 'accepted' | 'rejected';

interface EvidenceItem {
  id: string;
  fileName: string;
  description: string;
  uploadedDate: string;
  status: EvidenceItemStatus;
}

interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
  status: MilestoneStatus;
  evidence?: EvidenceItem[];
}

interface WeeklyLog {
  id: string;
  week: string;
  hours: number;
  tasksCompleted: string;
  vendorNotes: string;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface ContractDocument {
  id: string;
  name: string;
  type: string;
  size: string;
}

interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
}

interface Engagement {
  id: string;
  projectName: string;
  vendorName: string;
  type: EngagementType;
  status: 'active' | 'notice_served' | 'completed' | 'terminated';
  startDate: string;
  budget: number;
  escrowBalance: number;
  nextMilestoneAmount: number;
  milestones: Milestone[];
  weeklyLogs: WeeklyLog[];
  messages: Message[];
  documents: ContractDocument[];
  activityLog: ActivityEntry[];
  replacementSlaDeadline: string;
  replacementSlaTriggered: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString('en-GB')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function businessDaysRemaining(deadlineStr: string): number {
  const today = new Date();
  const deadline = new Date(deadlineStr);
  let count = 0;
  const current = new Date(today);
  while (current < deadline) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

const TYPE_LABELS: Record<EngagementType, string> = {
  staffaug: 'Staff Aug',
  itagency: 'IT Agency',
  msp: 'MSP',
};

const TYPE_COLOURS: Record<EngagementType, string> = {
  staffaug: 'bg-teal-100 text-[#0E7C6A]',
  itagency: 'bg-blue-100 text-[#0070F3]',
  msp: 'bg-purple-100 text-purple-700',
};

const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  approved: 'Approved',
  disputed: 'Disputed',
};

const MILESTONE_STATUS_COLOURS: Record<MilestoneStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_review: 'bg-amber-100 text-[#B06000]',
  approved: 'bg-green-100 text-green-700',
  disputed: 'bg-red-100 text-[#C0392B]',
};

const MILESTONE_CIRCLE_COLOURS: Record<MilestoneStatus, string> = {
  pending: 'bg-gray-300',
  in_review: 'bg-[#B06000]',
  approved: 'bg-green-500',
  disputed: 'bg-[#C0392B]',
};

// ─── DB row types (minimal) ───────────────────────────────────────────────────

interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  budget: number | null;
  progress: number | null;
  status: string | null;
  start_date: string | null;
  deadline: string | null;
  customer_id: string | null;
  contractor_id: string | null;
  vendor_id: string | null;
  created_at: string;
}

interface MilestoneRow {
  id: string;
  title: string;
  description: string | null;
  amount: number | null;
  due_date: string | null;
  completed: boolean | null;
  display_order: number | null;
  created_at: string;
}

interface MessageRow {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

interface ContractRow {
  id: string;
  contract_number: string | null;
  status: string | null;
  total_value: number | null;
  start_date: string | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  onClose: () => void;
}

function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed bottom-6 right-6 z-50 bg-[#0B2D59] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-3"
    >
      <Check size={16} className="text-green-400 flex-shrink-0" />
      {message}
      <button onClick={onClose} className="ml-1 text-white/50 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </motion.div>
  );
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-[#0B2D59]">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

// ─── MSP checklist items (constant) ──────────────────────────────────────────

const MSP_CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: 'uptime', label: 'Uptime / availability SLA met (≥99.5%)' },
  { key: 'patching', label: 'All critical patches applied this month' },
  { key: 'backups', label: 'Backup verification tests completed' },
  { key: 'incidents', label: 'All incidents logged and resolved' },
  { key: 'sla_report', label: 'Monthly SLA report delivered' },
  { key: 'security_scan', label: 'Security scan completed with no critical findings' },
];

// ─── Map DB project status to Engagement status ───────────────────────────────

function mapProjectStatus(dbStatus: string | null): Engagement['status'] {
  if (!dbStatus) return 'active';
  if (dbStatus === 'completed') return 'completed';
  if (dbStatus === 'terminated') return 'terminated';
  if (dbStatus === 'notice_served') return 'notice_served';
  return 'active';
}

function mapMilestoneStatus(row: MilestoneRow): MilestoneStatus {
  if (row.completed) return 'approved';
  return 'pending';
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { engagementId } = useParams<{ engagementId: string }>();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Milestone actions
  const [acceptMilestoneId, setAcceptMilestoneId] = useState<string | null>(null);
  const [flagMilestoneId, setFlagMilestoneId] = useState<string | null>(null);
  const [disputeMilestoneId, setDisputeMilestoneId] = useState<string | null>(null);
  const [flagText, setFlagText] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  // Escrow / Stripe
  const [showStripeModal, setShowStripeModal] = useState(false);

  // Evidence items
  const [evidenceStatuses, setEvidenceStatuses] = useState<Record<string, EvidenceItemStatus>>({});

  // Staff Aug: replacement SLA
  const [slaTriggered, setSlaTriggered] = useState(false);

  // MSP check-in
  const [showMspCheckin, setShowMspCheckin] = useState(false);
  const [mspChecklist, setMspChecklist] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    MSP_CHECKLIST_ITEMS.forEach((item) => { init[item.key] = false; });
    return init;
  });

  // Termination
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [terminationAck, setTerminationAck] = useState(false);

  const showToast = (msg: string) => setToast(msg);

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!engagementId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', engagementId)
        .maybeSingle();

      if (projectError) throw projectError;
      if (!projectData) {
        setNotFound(true);
        return;
      }

      const project = projectData as ProjectRow;

      // 2. Fetch milestones
      const { data: milestonesData } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', engagementId)
        .order('display_order', { ascending: true });

      const milestones: Milestone[] = (milestonesData ?? []).map((row: MilestoneRow) => ({
        id: row.id,
        name: row.title,
        dueDate: row.due_date ?? '',
        amount: row.amount ?? 0,
        status: mapMilestoneStatus(row),
      }));

      // 3. Fetch last 3 messages with sender profile
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at, profiles(full_name)')
        .eq('project_id', engagementId)
        .order('created_at', { ascending: false })
        .limit(3);

      const messages: Message[] = ((messagesData ?? []) as unknown as MessageRow[]).map((row) => ({
        id: row.id,
        sender: row.profiles?.full_name ?? 'Unknown',
        text: row.content,
        timestamp: new Date(row.created_at).toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })).reverse();

      // 4. Fetch contracts
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('id, contract_number, status, total_value, start_date')
        .eq('project_id', engagementId);

      const contracts = (contractsData ?? []) as ContractRow[];

      // 5. Sprint 3 tables — try, fallback to []
      let weeklyLogs: WeeklyLog[] = [];
      try {
        const { data: wlData, error: wlError } = await supabase
          .from('weekly_status_log')
          .select('*')
          .eq('project_id', engagementId)
          .order('created_at', { ascending: false });
        if (!wlError && wlData) {
          weeklyLogs = wlData.map((row: Record<string, unknown>, idx: number) => ({
            id: String(row.id ?? idx),
            week: String(row.week_label ?? row.week ?? ''),
            hours: Number(row.hours ?? 0),
            tasksCompleted: String(row.tasks_completed ?? row.tasksCompleted ?? ''),
            vendorNotes: String(row.vendor_notes ?? row.vendorNotes ?? ''),
          }));
        }
      } catch {
        // Sprint 3 table not yet available
      }

      // Build engagement object
      const nextMilestone = milestones.find((m) => m.status === 'pending');
      const firstContract = contracts[0];

      const eng: Engagement = {
        id: project.id,
        projectName: project.title,
        vendorName: 'Vendor',
        type: 'itagency',
        status: mapProjectStatus(project.status),
        startDate: project.start_date ?? project.created_at,
        budget: project.budget ?? (firstContract?.total_value ?? 0),
        escrowBalance: 0,
        nextMilestoneAmount: nextMilestone?.amount ?? 0,
        milestones,
        weeklyLogs,
        messages,
        documents: firstContract
          ? [
              {
                id: firstContract.id,
                name: `Contract_${firstContract.contract_number ?? firstContract.id}.pdf`,
                type: 'Contract',
                size: '—',
              },
            ]
          : [],
        activityLog: [],
        replacementSlaDeadline: project.deadline ?? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        replacementSlaTriggered: false,
      };

      setEngagement(eng);

      // Init evidence statuses
      const evInit: Record<string, EvidenceItemStatus> = {};
      milestones.forEach((m) => {
        (m.evidence ?? []).forEach((ev) => { evInit[ev.id] = ev.status; });
      });
      setEvidenceStatuses(evInit);
    } catch (err) {
      console.error('ProjectDetailPage fetch error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [engagementId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────

  if (notFound || !engagement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <AlertTriangle size={40} className="text-[#B06000] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#0B2D59] mb-2">Project not found</h2>
          <p className="text-sm text-gray-500 mb-6">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-[#0070F3] font-medium hover:underline"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const updateMilestoneStatus = (milestoneId: string, status: MilestoneStatus) => {
    setEngagement((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        milestones: prev.milestones.map((m) => (m.id === milestoneId ? { ...m, status } : m)),
      };
    });
  };

  const inReviewMilestone = engagement.milestones.find((m) => m.status === 'in_review') ?? null;
  const slaBusinessDays = businessDaysRemaining(engagement.replacementSlaDeadline);
  const slaProgress = Math.max(0, Math.min(100, ((5 - slaBusinessDays) / 5) * 100));

  // ── 1. Header ──────────────────────────────────────────────────────────────

  const renderHeader = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center text-sm text-gray-500 hover:text-[#0B2D59] mb-4 transition-colors"
      >
        <ChevronLeft size={16} className="mr-0.5" />
        Back to Dashboard
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-[#0B2D59]">{engagement.projectName}</h1>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLOURS[engagement.type]}`}
            >
              {TYPE_LABELS[engagement.type]}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                engagement.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : engagement.status === 'notice_served'
                  ? 'bg-red-100 text-[#C0392B]'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {engagement.status === 'active'
                ? 'Active'
                : engagement.status === 'notice_served'
                ? 'Notice Served'
                : engagement.status === 'completed'
                ? 'Completed'
                : 'Terminated'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold text-gray-800">{engagement.vendorName}</span>
          </p>
          <p className="text-sm text-gray-500">
            Started {formatDate(engagement.startDate)}
            <span className="mx-2 text-gray-300">·</span>
            Budget:{' '}
            <span className="font-semibold text-[#0B2D59]">{formatCurrency(engagement.budget)}</span>
          </p>
        </div>
        {engagement.status === 'active' && (
          <button
            onClick={() => setShowTerminationModal(true)}
            className="flex items-center gap-2 border border-[#C0392B] text-[#C0392B] rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-red-50 transition-colors flex-shrink-0"
          >
            <X size={15} />
            Initiate Termination
          </button>
        )}
      </div>
    </div>
  );

  // ── 2. Milestone tracker ───────────────────────────────────────────────────

  const renderMilestoneTracker = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl font-bold text-[#0B2D59] mb-6 flex items-center gap-2">
        <Activity size={20} className="text-[#0070F3]" />
        Milestone Tracker
      </h2>
      {engagement.milestones.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No milestones yet.</p>
      ) : (
        <div className="relative">
          {engagement.milestones.map((milestone, idx) => {
            const isLast = idx === engagement.milestones.length - 1;
            return (
              <div key={milestone.id} className="flex gap-4">
                {/* Stepper circle + connector */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${MILESTONE_CIRCLE_COLOURS[milestone.status]}`}
                  >
                    {milestone.status === 'approved' ? (
                      <Check size={18} />
                    ) : milestone.status === 'disputed' ? (
                      <AlertTriangle size={16} />
                    ) : milestone.status === 'in_review' ? (
                      <Clock size={16} />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 my-1 ${
                        milestone.status === 'approved' ? 'bg-green-300' : 'bg-gray-200'
                      }`}
                      style={{ minHeight: '24px' }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-[#0B2D59] text-sm">{milestone.name}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${MILESTONE_STATUS_COLOURS[milestone.status]}`}
                    >
                      {MILESTONE_STATUS_LABELS[milestone.status]}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mb-2">
                    {milestone.dueDate && <span>Due {formatDate(milestone.dueDate)}</span>}
                    <span className="font-semibold text-gray-700">{formatCurrency(milestone.amount)}</span>
                  </div>

                  {/* Disputed amber banner */}
                  {milestone.status === 'disputed' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-start gap-2 mb-3"
                    >
                      <AlertTriangle size={16} className="text-[#B06000] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#B06000]">Milestone under dispute</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Escrow is frozen pending resolution. Both parties have 72 hours to resolve
                          bilaterally before Collabov mediation begins.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* In review action buttons */}
                  {milestone.status === 'in_review' && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => setAcceptMilestoneId(milestone.id)}
                        className="flex items-center gap-1.5 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-700 transition-colors"
                      >
                        <Check size={14} />
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          setFlagMilestoneId(milestone.id);
                          setFlagText('');
                        }}
                        className="flex items-center gap-1.5 border border-[#B06000] text-[#B06000] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-50 transition-colors"
                      >
                        <Flag size={14} />
                        Flag
                      </button>
                      <button
                        onClick={() => {
                          setDisputeMilestoneId(milestone.id);
                          setDisputeReason('');
                        }}
                        className="flex items-center gap-1.5 border border-[#C0392B] text-[#C0392B] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-red-50 transition-colors"
                      >
                        <AlertTriangle size={14} />
                        Dispute
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── 3. Escrow panel ────────────────────────────────────────────────────────

  const renderEscrowPanel = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl font-bold text-[#0B2D59] mb-4 flex items-center gap-2">
        <CreditCard size={20} className="text-[#0070F3]" />
        Escrow
      </h2>
      <div className="bg-gradient-to-br from-[#0B2D59] to-[#0070F3] rounded-xl p-5 text-white mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">
          Escrow Balance
        </p>
        <p className="text-4xl font-black">{formatCurrency(engagement.escrowBalance)}</p>
        <p className="text-xs opacity-60 mt-1">Funds held securely until milestone approval</p>
      </div>
      <button
        onClick={() => setShowStripeModal(true)}
        className="w-full flex items-center justify-center gap-2 bg-[#0070F3] text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 transition-colors"
      >
        <CreditCard size={16} />
        Fund Next Milestone — {formatCurrency(engagement.nextMilestoneAmount)}
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">
        Funds held in escrow until you approve the work
      </p>
    </div>
  );

  // ── 4. Evidence review ─────────────────────────────────────────────────────

  const renderEvidenceReview = () => {
    if (!inReviewMilestone || !inReviewMilestone.evidence?.length) return null;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-[#0B2D59] mb-2 flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#0E7C6A]" />
          Evidence Review
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Milestone:{' '}
          <span className="font-semibold text-gray-700">{inReviewMilestone.name}</span>
        </p>
        <div className="space-y-4">
          {inReviewMilestone.evidence.map((item) => {
            const status = evidenceStatuses[item.id] ?? 'pending';
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 transition-colors ${
                  status === 'accepted'
                    ? 'border-green-200 bg-green-50'
                    : status === 'rejected'
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <FileText size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {item.fileName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Uploaded {formatDate(item.uploadedDate)}
                      </p>
                    </div>
                  </div>
                  {status !== 'pending' && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                        status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-[#C0392B]'
                      }`}
                    >
                      {status === 'accepted' ? 'Accepted' : 'Rejected'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                {status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEvidenceStatuses((prev) => ({ ...prev, [item.id]: 'accepted' }));
                        showToast(`"${item.fileName}" accepted.`);
                      }}
                      className="flex items-center gap-1.5 bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-green-700 transition-colors"
                    >
                      <Check size={12} />
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        setEvidenceStatuses((prev) => ({ ...prev, [item.id]: 'rejected' }));
                        showToast(`"${item.fileName}" rejected.`);
                      }}
                      className="flex items-center gap-1.5 border border-[#C0392B] text-[#C0392B] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-red-50 transition-colors"
                    >
                      <X size={12} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── 5. IT Agency — defect liability notice ─────────────────────────────────

  const renderDefectLiability = () => {
    if (engagement.type !== 'itagency') return null;
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="text-[#B06000] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#B06000] text-sm mb-1">
              Defect Liability Period — 30 Days Post-Delivery
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Once all milestones are approved, the vendor is contractually obliged to fix any
              defects reported within 30 days at no additional charge. Document any issues in the
              Messages thread with a clear description and screenshot.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ── 6. Staff Aug — weekly log table + replacement SLA countdown ────────────

  const renderWeeklyStatusLog = () => {
    if (engagement.type !== 'staffaug') return null;
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-[#0B2D59] mb-4 flex items-center gap-2">
          <Users size={20} className="text-[#0E7C6A]" />
          Weekly Status Log
        </h2>
        {engagement.weeklyLogs.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No weekly logs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                    Week
                  </th>
                  <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    Hours
                  </th>
                  <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    Tasks Completed
                  </th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    Vendor Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {engagement.weeklyLogs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={idx % 2 === 0 ? 'bg-gray-50/60' : ''}
                  >
                    <td className="py-3 pr-4 text-[#0B2D59] font-medium whitespace-nowrap">
                      {log.week}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`font-semibold ${
                          log.hours < 40 ? 'text-[#B06000]' : 'text-green-700'
                        }`}
                      >
                        {log.hours}h
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 max-w-xs">{log.tasksCompleted}</td>
                    <td className="py-3 text-gray-500 italic max-w-xs">{log.vendorNotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderReplacementSLA = () => {
    if (engagement.type !== 'staffaug') return null;
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#0B2D59] flex items-center gap-2">
            <RefreshCw size={20} className="text-[#0070F3]" />
            Replacement SLA
          </h2>
          {!slaTriggered && (
            <button
              onClick={() => {
                setSlaTriggered(true);
                showToast('Replacement SLA triggered. Vendor has 5 business days.');
              }}
              className="text-xs border border-[#B06000] text-[#B06000] rounded-lg px-3 py-1.5 font-semibold hover:bg-amber-50 transition-colors"
            >
              Trigger SLA
            </button>
          )}
        </div>
        {slaTriggered ? (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
              <Clock size={15} className="text-[#B06000] flex-shrink-0" />
              <p className="text-sm text-[#B06000] font-medium">
                Replacement SLA active —{' '}
                <strong>{slaBusinessDays} business days remaining</strong> (deadline{' '}
                {formatDate(engagement.replacementSlaDeadline)})
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-[#0070F3] h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${slaProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-gray-400">
              <span>0 days</span>
              <span>5 business days</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            If the current contractor is unable to continue, you can trigger the 5-business-day
            replacement SLA. The vendor must provide a suitable replacement within this window.
          </p>
        )}
      </div>
    );
  };

  // ── 7. MSP — monthly check-in trigger ─────────────────────────────────────

  const renderMspCheckinTrigger = () => {
    if (engagement.type !== 'msp') return null;
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-[#0B2D59] mb-3 flex items-center gap-2">
          <CheckSquare size={20} className="text-purple-600" />
          Monthly Service Check-in
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Complete your monthly check-in to confirm service levels and flag any issues.
        </p>
        <button
          onClick={() => setShowMspCheckin(true)}
          className="flex items-center gap-2 bg-purple-600 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          <CheckSquare size={16} />
          Start Monthly Check-in
        </button>
      </div>
    );
  };

  // ── 8. Messages preview ────────────────────────────────────────────────────

  const renderMessages = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#0B2D59] flex items-center gap-2">
          <MessageSquare size={20} className="text-[#0070F3]" />
          Messages
        </h2>
        <Link to="/messages" className="text-sm text-[#0070F3] font-medium hover:underline">
          View All Messages →
        </Link>
      </div>
      {engagement.messages.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No messages yet.</p>
      ) : (
        <div className="space-y-3">
          {engagement.messages.map((msg) => (
            <div key={msg.id} className="bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#0B2D59]">{msg.sender}</span>
                <span className="text-xs text-gray-400">{msg.timestamp}</span>
              </div>
              <p className="text-sm text-gray-700">{msg.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── 9. Documents ───────────────────────────────────────────────────────────

  const renderDocuments = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl font-bold text-[#0B2D59] mb-4 flex items-center gap-2">
        <FileText size={20} className="text-[#0070F3]" />
        Documents
      </h2>
      {engagement.documents.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No documents attached.</p>
      ) : (
        <div className="space-y-3">
          {engagement.documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={18} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded uppercase ${
                        doc.type === 'IR35 SDS'
                          ? 'bg-teal-100 text-[#0E7C6A]'
                          : doc.type === 'NDA'
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-blue-100 text-[#0070F3]'
                      }`}
                    >
                      {doc.type}
                    </span>
                    {doc.size !== '—' && <span className="text-xs text-gray-400">{doc.size}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => showToast(`Downloading ${doc.name}…`)}
                className="flex items-center gap-1.5 border border-blue-200 text-[#0070F3] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-blue-50 transition-colors flex-shrink-0"
              >
                <Download size={12} />
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── 10. Activity log ───────────────────────────────────────────────────────

  const renderActivityLog = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl font-bold text-[#0B2D59] mb-4 flex items-center gap-2">
        <Activity size={20} className="text-[#0070F3]" />
        Activity Log
      </h2>
      {engagement.activityLog.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No activity yet.</p>
      ) : (
        <div className="space-y-1">
          {engagement.activityLog.map((entry, idx) => (
            <div
              key={entry.id}
              className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${idx % 2 === 0 ? 'bg-gray-50' : ''}`}
            >
              <div className="w-2 h-2 rounded-full bg-[#0070F3] flex-shrink-0 mt-2" />
              <span className="text-xs text-gray-400 w-36 flex-shrink-0 pt-0.5 leading-relaxed">
                {entry.timestamp}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[#0B2D59] text-sm">{entry.actor}</span>
                <span className="text-sm text-gray-600"> — {entry.action}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Modals ─────────────────────────────────────────────────────────────────

  const renderStripeModal = () => (
    <Modal title="Fund Next Milestone" onClose={() => setShowStripeModal(false)}>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
        <p className="text-sm text-blue-800">
          You are about to fund the next milestone of{' '}
          <strong>{formatCurrency(engagement.nextMilestoneAmount)}</strong>. Funds are held in
          escrow by Collabov and released only when you approve the work.
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 mb-5 flex items-center justify-between">
        <span className="text-sm text-gray-600">Amount</span>
        <span className="text-lg font-bold text-[#0B2D59]">
          {formatCurrency(engagement.nextMilestoneAmount)}
        </span>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => {
            setEngagement((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                escrowBalance: prev.escrowBalance + prev.nextMilestoneAmount,
              };
            });
            showToast(
              `Milestone funded — ${formatCurrency(engagement.nextMilestoneAmount)} added to escrow.`
            );
            setShowStripeModal(false);
          }}
          className="flex-1 bg-[#0070F3] text-white rounded-xl py-3 font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <CreditCard size={16} />
          Pay via Stripe
        </button>
        <button
          onClick={() => setShowStripeModal(false)}
          className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );

  const renderAcceptModal = () => {
    const milestone = engagement.milestones.find((m) => m.id === acceptMilestoneId);
    if (!milestone) return null;
    return (
      <Modal title="Accept Milestone" onClose={() => setAcceptMilestoneId(null)}>
        <p className="text-gray-700 mb-6 text-sm">
          Release <strong>{formatCurrency(milestone.amount)}</strong> to{' '}
          <strong>{engagement.vendorName}</strong> for milestone{' '}
          <em>{milestone.name}</em>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              updateMilestoneStatus(milestone.id, 'approved');
              showToast(`Milestone approved — ${formatCurrency(milestone.amount)} released.`);
              setAcceptMilestoneId(null);
            }}
            className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold hover:bg-green-700 transition-colors"
          >
            Confirm &amp; Release
          </button>
          <button
            onClick={() => setAcceptMilestoneId(null)}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    );
  };

  const renderFlagModal = () => {
    const milestone = engagement.milestones.find((m) => m.id === flagMilestoneId);
    if (!milestone) return null;
    return (
      <Modal title="Flag Milestone" onClose={() => setFlagMilestoneId(null)}>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Describe the issue (min 50 characters)
        </label>
        <textarea
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300 mb-1"
          rows={4}
          value={flagText}
          onChange={(e) => setFlagText(e.target.value)}
          placeholder="Explain which criteria have not been met…"
        />
        <p className="text-xs text-gray-400 mb-4">{flagText.length} / 50 minimum</p>
        <div className="flex gap-3">
          <button
            disabled={flagText.length < 50}
            onClick={() => {
              showToast('Milestone flagged. Vendor has 5 business days to respond.');
              setFlagMilestoneId(null);
            }}
            className="flex-1 bg-[#B06000] text-white rounded-xl py-3 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-800 transition-colors"
          >
            Send Flag
          </button>
          <button
            onClick={() => setFlagMilestoneId(null)}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    );
  };

  const renderDisputeModal = () => {
    const milestone = engagement.milestones.find((m) => m.id === disputeMilestoneId);
    if (!milestone) return null;
    return (
      <Modal title="Open Dispute" onClose={() => setDisputeMilestoneId(null)}>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
        <select
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 mb-4 focus:outline-none focus:ring-2 focus:ring-red-200"
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
        >
          <option value="">Select a reason…</option>
          <option value="scope">Scope mismatch</option>
          <option value="quality">Quality below standard</option>
          <option value="nondelivery">Non-delivery</option>
          <option value="timeline">Timeline breach</option>
          <option value="other">Other</option>
        </select>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-[#C0392B] mb-5">
          <AlertTriangle size={13} className="inline mr-1.5 mb-0.5" />
          Opening a dispute freezes escrow and notifies the vendor immediately. Collabov will
          mediate if not resolved within 72 hours.
        </div>
        <div className="flex gap-3">
          <button
            disabled={!disputeReason}
            onClick={() => {
              updateMilestoneStatus(milestone.id, 'disputed');
              showToast('Dispute opened. Escrow frozen. 72 hours for bilateral resolution.');
              setDisputeMilestoneId(null);
            }}
            className="flex-1 bg-[#C0392B] text-white rounded-xl py-3 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
          >
            Open Dispute
          </button>
          <button
            onClick={() => setDisputeMilestoneId(null)}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    );
  };

  const renderMspCheckinModal = () => {
    if (!showMspCheckin) return null;
    const allChecked = MSP_CHECKLIST_ITEMS.every((item) => mspChecklist[item.key]);
    return (
      <Modal title="Monthly Service Check-in" onClose={() => setShowMspCheckin(false)}>
        <p className="text-sm text-gray-600 mb-5">
          Confirm the following service items for{' '}
          <strong>
            {new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
          </strong>
          .
        </p>
        <div className="space-y-3 mb-6">
          {MSP_CHECKLIST_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() =>
                setMspChecklist((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
              }
              className="flex items-center gap-3 w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {mspChecklist[item.key] ? (
                <CheckSquare size={18} className="text-[#0E7C6A] flex-shrink-0" />
              ) : (
                <Square size={18} className="text-gray-300 flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  mspChecklist[item.key] ? 'text-[#0E7C6A] font-medium' : 'text-gray-700'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
        {!allChecked && (
          <p className="text-xs text-[#B06000] mb-4">
            Please confirm all items before submitting.
          </p>
        )}
        <button
          disabled={!allChecked}
          onClick={() => {
            showToast('Monthly check-in submitted.');
            setShowMspCheckin(false);
          }}
          className="w-full bg-purple-600 text-white rounded-xl py-3 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
        >
          Submit Check-in
        </button>
      </Modal>
    );
  };

  const renderTerminationModal = () => {
    if (!showTerminationModal) return null;
    return (
      <Modal title="Initiate Termination" onClose={() => setShowTerminationModal(false)}>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
          <AlertTriangle size={15} className="text-[#C0392B] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#C0392B]">
            Initiating termination serves a formal notice period. The contract remains active until
            the notice period expires.
          </p>
        </div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Reason for termination
        </label>
        <select
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 mb-5 focus:outline-none focus:ring-2 focus:ring-red-200"
          value={terminationReason}
          onChange={(e) => setTerminationReason(e.target.value)}
        >
          <option value="">Select a reason…</option>
          <option value="scope_complete">Scope complete early</option>
          <option value="budget">Budget constraints</option>
          <option value="performance">Vendor performance</option>
          <option value="mutual">Mutual agreement</option>
          <option value="other">Other</option>
        </select>
        <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={terminationAck}
            onChange={(e) => setTerminationAck(e.target.checked)}
            className="rounded border-gray-300 text-[#C0392B] focus:ring-red-300"
          />
          I understand the notice period and consequences of termination
        </label>
        <div className="flex gap-3">
          <button
            disabled={!terminationReason || !terminationAck}
            onClick={() => {
              setEngagement((prev) => {
                if (!prev) return prev;
                return { ...prev, status: 'notice_served' };
              });
              showToast('Termination notice served.');
              setShowTerminationModal(false);
            }}
            className="flex-1 bg-[#C0392B] text-white rounded-xl py-3 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
          >
            Serve Termination Notice
          </button>
          <button
            onClick={() => setShowTerminationModal(false)}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. Header */}
        {renderHeader()}

        {/* Main layout: main content + sidebar */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: main sections */}
          <div className="flex-1 min-w-0">
            {/* 2. Milestone tracker */}
            {renderMilestoneTracker()}

            {/* 4. Evidence review (only when a milestone is in_review) */}
            {renderEvidenceReview()}

            {/* 5. IT Agency — defect liability */}
            {renderDefectLiability()}

            {/* 6. Staff Aug — weekly log + replacement SLA */}
            {renderWeeklyStatusLog()}
            {renderReplacementSLA()}

            {/* 7. MSP — monthly check-in trigger */}
            {renderMspCheckinTrigger()}

            {/* 8. Messages preview */}
            {renderMessages()}

            {/* 9. Documents */}
            {renderDocuments()}

            {/* 10. Activity log */}
            {renderActivityLog()}
          </div>

          {/* Right: sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 lg:sticky lg:top-8">
            {/* 3. Escrow panel */}
            {renderEscrowPanel()}

            {/* Contract summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-bold text-[#0B2D59] uppercase tracking-widest mb-4">
                Contract Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Type</span>
                  <span
                    className={`font-semibold text-xs px-2 py-0.5 rounded-full ${TYPE_COLOURS[engagement.type]}`}
                  >
                    {TYPE_LABELS[engagement.type]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`font-semibold capitalize ${
                      engagement.status === 'active'
                        ? 'text-green-600'
                        : engagement.status === 'notice_served'
                        ? 'text-[#C0392B]'
                        : 'text-gray-600'
                    }`}
                  >
                    {engagement.status === 'notice_served' ? 'Notice Served' : engagement.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Start Date</span>
                  <span className="font-medium">{formatDate(engagement.startDate)}</span>
                </div>
                <div className="flex justify-between border-t pt-3 mt-1">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-bold text-[#0B2D59]">
                    {formatCurrency(engagement.budget)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Milestones</span>
                  <span className="font-medium">
                    {engagement.milestones.filter((m) => m.status === 'approved').length} /{' '}
                    {engagement.milestones.length} approved
                  </span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-bold text-[#0B2D59] uppercase tracking-widest mb-4">
                Quick Actions
              </h3>
              <div className="space-y-1">
                <Link
                  to="/messages"
                  className="flex items-center gap-2 w-full text-sm text-gray-700 hover:text-[#0070F3] py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <MessageSquare size={15} className="text-[#0070F3]" />
                  Open Messages
                </Link>
                <button
                  onClick={() => showToast('SOW download started…')}
                  className="flex items-center gap-2 w-full text-sm text-gray-700 hover:text-[#0070F3] py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <FileText size={15} className="text-[#0070F3]" />
                  Download SOW
                </button>
                {engagement.type === 'msp' && (
                  <button
                    onClick={() => setShowMspCheckin(true)}
                    className="flex items-center gap-2 w-full text-sm text-gray-700 hover:text-purple-600 py-2 px-3 rounded-lg hover:bg-purple-50 transition-colors text-left"
                  >
                    <CheckSquare size={15} className="text-purple-600" />
                    Monthly Check-in
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showStripeModal && renderStripeModal()}
        {acceptMilestoneId && renderAcceptModal()}
        {flagMilestoneId && renderFlagModal()}
        {disputeMilestoneId && renderDisputeModal()}
        {showMspCheckin && renderMspCheckinModal()}
        {showTerminationModal && renderTerminationModal()}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
