import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Download,
  FileText,
  MessageSquare,
  Activity,
  Shield,
  RefreshCw,
  CreditCard,
  X,
  Check,
  ChevronRight,
  User,
  Calendar,
  DollarSign,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const NAVY   = '#0B2D59';
const BLUE   = '#0070F3';
const TEAL   = '#0E7C6A';
const AMBER  = '#B06000';
const RED    = '#C0392B';

// ─── Types ────────────────────────────────────────────────────────────────────

type VendorType  = 'msp' | 'it_agency' | 'staffaug';
type MilestoneStatus = 'pending' | 'in_review' | 'approved' | 'disputed';

interface EvidenceItem {
  id: string;
  fileName: string;
  description: string;
  uploadedDate: string;
  accepted?: boolean | null; // null = not yet actioned
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
  avatar: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
}

interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: string;
  event: string;
  icon: 'check' | 'payment' | 'submit' | 'dispute' | 'contract' | 'flag';
}

interface Engagement {
  id: string;
  projectName: string;
  vendorName: string;
  type: VendorType;
  status: 'active' | 'on_hold' | 'completed' | 'terminated';
  startDate: string;
  budget: number;
  escrowBalance: number;
  nextMilestoneAmount: number;
  milestones: Milestone[];
  weeklyLogs: WeeklyLog[];
  messages: Message[];
  documents: Document[];
  activityLog: ActivityEvent[];
  mspServiceItems: string[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ENGAGEMENT: Engagement = {
  id: 'eng-001',
  projectName: 'Enterprise Infrastructure Modernisation',
  vendorName: 'Nexus Talent Solutions Ltd',
  type: 'staffaug',
  status: 'active',
  startDate: '2026-02-01',
  budget: 96000,
  escrowBalance: 18400,
  nextMilestoneAmount: 8000,
  milestones: [
    {
      id: 'ms-1',
      name: 'Discovery & Requirements Gathering',
      dueDate: '2026-02-28',
      amount: 8000,
      status: 'approved',
    },
    {
      id: 'ms-2',
      name: 'Infrastructure Audit & Architecture Design',
      dueDate: '2026-03-31',
      amount: 12000,
      status: 'approved',
    },
    {
      id: 'ms-3',
      name: 'Cloud Migration — Phase 1 (Dev & Staging)',
      dueDate: '2026-05-15',
      amount: 18000,
      status: 'in_review',
      evidence: [
        {
          id: 'ev-1',
          fileName: 'Phase1_Migration_Report.pdf',
          description: 'Comprehensive report covering all Dev and Staging environment migrations, including rollback procedures.',
          uploadedDate: '2026-05-12',
          accepted: null,
        },
        {
          id: 'ev-2',
          fileName: 'Cloud_Architecture_Diagram_v3.png',
          description: 'Updated architecture diagram reflecting actual deployed topology.',
          uploadedDate: '2026-05-12',
          accepted: null,
        },
        {
          id: 'ev-3',
          fileName: 'Smoke_Test_Results_May2026.xlsx',
          description: 'End-to-end smoke test results across 47 test cases — all passing.',
          uploadedDate: '2026-05-13',
          accepted: null,
        },
      ],
    },
    {
      id: 'ms-4',
      name: 'Cloud Migration — Phase 2 (Production)',
      dueDate: '2026-07-31',
      amount: 22000,
      status: 'disputed',
    },
    {
      id: 'ms-5',
      name: 'Performance Optimisation & Handover',
      dueDate: '2026-09-30',
      amount: 18000,
      status: 'pending',
    },
    {
      id: 'ms-6',
      name: 'Final Sign-off & Documentation',
      dueDate: '2026-10-31',
      amount: 18000,
      status: 'pending',
    },
  ],
  weeklyLogs: [
    {
      id: 'wl-1',
      week: '2026-05-26',
      hours: 37.5,
      tasksCompleted: 'Completed networking config for 3 prod subnets; resolved DNS propagation issue on eu-west-2.',
      vendorNotes: 'All tasks on track. No blockers this week.',
    },
    {
      id: 'wl-2',
      week: '2026-06-02',
      hours: 40,
      tasksCompleted: 'Deployed Terraform modules for prod VPCs; conducted security group audit.',
      vendorNotes: 'IAM permission issue flagged — awaiting client IT admin access. ETA: 2 days.',
    },
    {
      id: 'wl-3',
      week: '2026-06-09',
      hours: 35,
      tasksCompleted: 'Resolved IAM issue; began load balancer configuration for prod tier.',
      vendorNotes: 'On schedule. Milestone 4 target date remains 31 July.',
    },
  ],
  messages: [
    {
      id: 'msg-1',
      sender: 'Priya Sharma (Collabov)',
      text: 'Milestone 3 evidence has been submitted for your review. Please action within 5 business days.',
      timestamp: '2026-05-13 09:41',
      avatar: 'PS',
    },
    {
      id: 'msg-2',
      sender: 'James Whitfield (Nexus)',
      text: 'All three evidence documents are uploaded. Happy to schedule a walkthrough call if helpful.',
      timestamp: '2026-05-13 10:05',
      avatar: 'JW',
    },
    {
      id: 'msg-3',
      sender: 'You',
      text: 'Thanks James — reviewing now. Will revert by end of week.',
      timestamp: '2026-05-14 14:22',
      avatar: 'YO',
    },
  ],
  documents: [
    { id: 'doc-1', name: 'Statement_of_Work_v2.pdf', type: 'SOW', size: '312 KB' },
    { id: 'doc-2', name: 'NDA_Collabov_Nexus_2026.pdf', type: 'NDA', size: '88 KB' },
    { id: 'doc-3', name: 'IR35_SDS_Nexus_Talent_Feb2026.pdf', type: 'IR35 SDS', size: '145 KB' },
    { id: 'doc-4', name: 'GDPR_DPA_Schedule_B.pdf', type: 'DPA', size: '204 KB' },
  ],
  activityLog: [
    { id: 'al-1', timestamp: '2026-02-01 08:00', actor: 'System', event: 'Contract signed by both parties. Engagement activated.', icon: 'contract' },
    { id: 'al-2', timestamp: '2026-02-02 09:15', actor: 'Collabov', event: 'Milestone 1 funded — £8,000 held in escrow.', icon: 'payment' },
    { id: 'al-3', timestamp: '2026-02-27 17:30', actor: 'Nexus Talent Solutions', event: 'Evidence submitted for Milestone 1.', icon: 'submit' },
    { id: 'al-4', timestamp: '2026-03-01 11:00', actor: 'Collabov', event: 'Milestone 1 approved — £8,000 released to vendor.', icon: 'check' },
    { id: 'al-5', timestamp: '2026-03-03 09:00', actor: 'Collabov', event: 'Milestone 2 funded — £12,000 held in escrow.', icon: 'payment' },
    { id: 'al-6', timestamp: '2026-03-30 16:45', actor: 'Nexus Talent Solutions', event: 'Evidence submitted for Milestone 2.', icon: 'submit' },
    { id: 'al-7', timestamp: '2026-04-02 10:30', actor: 'Collabov', event: 'Milestone 2 approved — £12,000 released to vendor.', icon: 'check' },
    { id: 'al-8', timestamp: '2026-04-05 09:00', actor: 'Collabov', event: 'Milestone 3 funded — £18,000 held in escrow.', icon: 'payment' },
    { id: 'al-9', timestamp: '2026-05-13 09:38', actor: 'Nexus Talent Solutions', event: 'Evidence submitted for Milestone 3 — under review.', icon: 'submit' },
    { id: 'al-10', timestamp: '2026-05-20 14:10', actor: 'Collabov', event: 'Dispute raised on Milestone 4 — escrow frozen pending resolution.', icon: 'dispute' },
  ],
  mspServiceItems: [
    'Network uptime ≥ 99.9%',
    'Mean time to respond (P1) < 15 minutes',
    'Patch compliance > 95% of endpoints',
    'Monthly security scan completed',
    'Backup verification completed',
    'Capacity report submitted',
    'Incident summary reviewed',
    'SLA scorecard signed off',
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  `£${n.toLocaleString('en-GB')}`;

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const MILESTONE_STATUS_CONFIG: Record<
  MilestoneStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pending:   { label: 'Pending',   color: '#6B7280', bg: '#F3F4F6', icon: <Clock size={12} /> },
  in_review: { label: 'In Review', color: AMBER,     bg: '#FEF3C7', icon: <Clock size={12} /> },
  approved:  { label: 'Approved',  color: TEAL,      bg: '#D1FAE5', icon: <CheckCircle2 size={12} /> },
  disputed:  { label: 'Disputed',  color: RED,       bg: '#FEE2E2', icon: <AlertTriangle size={12} /> },
};

const TYPE_BADGE: Record<VendorType, { label: string; color: string }> = {
  msp:       { label: 'MSP',        color: TEAL  },
  it_agency: { label: 'IT Agency',  color: BLUE  },
  staffaug:  { label: 'Staff Aug',  color: NAVY  },
};

const ACTIVITY_ICON_MAP: Record<ActivityEvent['icon'], React.ReactNode> = {
  check:    <CheckCircle2 size={14} className="text-green-600" />,
  payment:  <CreditCard   size={14} className="text-blue-600"  />,
  submit:   <FileText     size={14} className="text-amber-600" />,
  dispute:  <AlertTriangle size={14} className="text-red-500"  />,
  contract: <Shield       size={14} className="text-purple-600"/>,
  flag:     <AlertCircle  size={14} className="text-orange-500"/>,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
  maxWidth = 'max-w-lg',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold" style={{ color: NAVY }}>{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium"
    >
      <Check size={16} className="text-green-400 flex-shrink-0" />
      {message}
      <button onClick={onClose} className="ml-1 text-white/50 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </motion.div>
  );
}

function SectionCard({ title, icon, children, className = '' }: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-2 mb-5">
          {icon && <span className="text-gray-400">{icon}</span>}
          <h2 className="text-lg font-bold" style={{ color: NAVY }}>{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { engagementId } = useParams<{ engagementId: string }>();
  const engagement = MOCK_ENGAGEMENT;

  const [toast, setToast]     = useState<string | null>(null);
  const showToast = (msg: string) => setToast(msg);

  // Milestone evidence item accept/reject state
  const [evidenceState, setEvidenceState] = useState<Record<string, boolean | null>>(() => {
    const init: Record<string, boolean | null> = {};
    engagement.milestones.forEach((m) => {
      (m.evidence ?? []).forEach((ev) => { init[ev.id] = null; });
    });
    return init;
  });

  // Stripe funding modal
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundAmount]    = useState(engagement.nextMilestoneAmount);

  // Termination modal
  const [terminationOpen, setTerminationOpen]       = useState(false);
  const [terminationReason, setTerminationReason]   = useState('');
  const [terminationAck, setTerminationAck]         = useState(false);

  // MSP monthly check-in modal
  const [mspCheckinOpen, setMspCheckinOpen] = useState(false);
  const [mspChecked, setMspChecked]         = useState<boolean[]>(
    () => engagement.mspServiceItems.map(() => false)
  );

  // Milestone in-review actions (per milestone)
  const [milestoneActions, setMilestoneActions] = useState<Record<string, 'accepted' | 'flagged' | 'disputed' | null>>({});

  const handleMilestoneAccept = (milestoneId: string, name: string) => {
    setMilestoneActions((prev) => ({ ...prev, [milestoneId]: 'accepted' }));
    showToast(`Milestone "${name}" accepted — payment released.`);
  };

  const handleMilestoneFlag = (milestoneId: string) => {
    setMilestoneActions((prev) => ({ ...prev, [milestoneId]: 'flagged' }));
    showToast('Milestone flagged. Vendor has been notified.');
  };

  const handleMilestoneDispute = (milestoneId: string) => {
    setMilestoneActions((prev) => ({ ...prev, [milestoneId]: 'disputed' }));
    showToast('Dispute raised. Escrow frozen pending resolution.');
  };

  const handleEvidenceAction = (evidenceId: string, accepted: boolean) => {
    setEvidenceState((prev) => ({ ...prev, [evidenceId]: accepted }));
    showToast(accepted ? 'Evidence item accepted.' : 'Evidence item rejected.');
  };

  // ── Header ─────────────────────────────────────────────────────────────────

  const typeBadge = TYPE_BADGE[engagement.type];
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    on_hold: 'bg-amber-100 text-amber-700',
    completed: 'bg-blue-100 text-blue-700',
    terminated: 'bg-red-100 text-red-700',
  };

  const renderHeader = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
              {engagement.projectName}
            </h1>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: typeBadge.color }}
            >
              {typeBadge.label}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[engagement.status]}`}>
              {engagement.status.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            <span className="font-medium text-gray-800">{engagement.vendorName}</span>
            <span className="mx-2 text-gray-300">·</span>
            Engagement <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{engagementId ?? engagement.id}</span>
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" />
              Started {formatDate(engagement.startDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign size={14} className="text-gray-400" />
              Budget: <strong className="text-gray-800 ml-1">{formatCurrency(engagement.budget)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase size={14} className="text-gray-400" />
              <strong style={{ color: typeBadge.color }}>{typeBadge.label}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={() => setTerminationOpen(true)}
          className="flex-shrink-0 flex items-center gap-2 border-2 text-sm font-semibold px-4 py-2 rounded-xl transition-colors hover:opacity-90"
          style={{ borderColor: RED, color: RED }}
        >
          <XCircle size={16} />
          Initiate Termination
        </button>
      </div>
    </div>
  );

  // ── Milestone Tracker ──────────────────────────────────────────────────────

  const renderMilestoneTracker = () => (
    <SectionCard title="Milestone Tracker" icon={<Activity size={18} />}>
      <div className="space-y-0">
        {engagement.milestones.map((ms, idx) => {
          const cfg    = MILESTONE_STATUS_CONFIG[ms.status];
          const action = milestoneActions[ms.id];
          const isLast = idx === engagement.milestones.length - 1;
          const effectiveStatus = action === 'accepted' ? 'approved'
                                : action === 'disputed' ? 'disputed'
                                : ms.status;
          const effectiveCfg = MILESTONE_STATUS_CONFIG[effectiveStatus as MilestoneStatus] ?? cfg;

          return (
            <div key={ms.id} className="flex gap-4">
              {/* Stepper line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                  style={{ backgroundColor: effectiveCfg.color }}
                >
                  {effectiveStatus === 'approved' ? <Check size={16} /> : idx + 1}
                </div>
                {!isLast && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[20px]" />}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-6 ${isLast ? '' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">{ms.name}</span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500">Due {formatDate(ms.dueDate)}</span>
                      <span className="text-xs font-semibold text-gray-800">{formatCurrency(ms.amount)}</span>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                    style={{ backgroundColor: effectiveCfg.bg, color: effectiveCfg.color }}
                  >
                    {effectiveCfg.icon}
                    {effectiveCfg.label}
                  </span>
                </div>

                {/* in_review: action buttons */}
                {ms.status === 'in_review' && !action && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => handleMilestoneAccept(ms.id, ms.name)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
                      style={{ backgroundColor: TEAL }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleMilestoneFlag(ms.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
                      style={{ borderColor: AMBER, color: AMBER }}
                    >
                      Flag
                    </button>
                    <button
                      onClick={() => handleMilestoneDispute(ms.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
                      style={{ borderColor: RED, color: RED }}
                    >
                      Dispute
                    </button>
                  </div>
                )}

                {/* disputed: amber banner */}
                {(ms.status === 'disputed' || action === 'disputed') && (
                  <div
                    className="mt-3 flex items-start gap-2 text-xs px-4 py-3 rounded-xl"
                    style={{ backgroundColor: '#FEF3C7', color: AMBER }}
                  >
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Dispute active.</strong> Escrow is frozen. Collabov dispute resolution will mediate within 5 business days.
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );

  // ── Escrow Panel ───────────────────────────────────────────────────────────

  const renderEscrowPanel = () => (
    <SectionCard title="Escrow" icon={<Shield size={18} />}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 mb-5">
        <div>
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-0.5">Current Escrow Balance</p>
          <p className="text-3xl font-extrabold" style={{ color: NAVY }}>
            {formatCurrency(engagement.escrowBalance)}
          </p>
          <p className="text-xs text-blue-600 mt-1">Held securely by Collabov</p>
        </div>
        <button
          onClick={() => setFundModalOpen(true)}
          className="flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-xl text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: BLUE }}
        >
          <CreditCard size={16} />
          Fund Next Milestone
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Budget',    value: formatCurrency(engagement.budget),              color: NAVY  },
          { label: 'In Escrow',       value: formatCurrency(engagement.escrowBalance),       color: BLUE  },
          { label: 'Next Milestone',  value: formatCurrency(engagement.nextMilestoneAmount), color: TEAL  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-base font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );

  // ── Evidence Review ────────────────────────────────────────────────────────

  const inReviewMilestones = engagement.milestones.filter((m) => m.status === 'in_review' && m.evidence?.length);

  const renderEvidenceReview = () => {
    if (inReviewMilestones.length === 0) return null;

    return (
      <SectionCard title="Evidence Review" icon={<FileText size={18} />}>
        {inReviewMilestones.map((ms) => (
          <div key={ms.id} className="mb-6 last:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-gray-800">{ms.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: MILESTONE_STATUS_CONFIG.in_review.bg, color: MILESTONE_STATUS_CONFIG.in_review.color }}>
                In Review
              </span>
            </div>
            <div className="space-y-3">
              {(ms.evidence ?? []).map((ev) => {
                const evState = evidenceState[ev.id];
                return (
                  <div
                    key={ev.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-xl px-4 py-3 transition-colors ${
                      evState === true  ? 'border-green-300 bg-green-50'  :
                      evState === false ? 'border-red-300 bg-red-50'      :
                                         'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <FileText size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800 truncate">{ev.fileName}</span>
                      </div>
                      <p className="text-xs text-gray-500 pl-5">{ev.description}</p>
                      <p className="text-xs text-gray-400 pl-5 mt-0.5">Uploaded {formatDate(ev.uploadedDate)}</p>
                    </div>
                    {evState === null ? (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEvidenceAction(ev.id, true)}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
                          style={{ backgroundColor: TEAL }}
                        >
                          <Check size={12} /> Accept
                        </button>
                        <button
                          onClick={() => handleEvidenceAction(ev.id, false)}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
                          style={{ backgroundColor: RED }}
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs font-bold flex-shrink-0 ${evState ? 'text-green-700' : 'text-red-700'}`}>
                        {evState ? '✓ Accepted' : '✗ Rejected'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </SectionCard>
    );
  };

  // ── IT Agency: Defect Liability ────────────────────────────────────────────

  const renderDefectLiability = () => {
    if (engagement.type !== 'it_agency') return null;
    return (
      <div
        className="rounded-2xl border px-5 py-4 mb-6 flex items-start gap-3"
        style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}
      >
        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: AMBER }} />
        <div>
          <p className="text-sm font-bold" style={{ color: AMBER }}>Defect Liability Period — 30 Days Post-Delivery</p>
          <p className="text-xs text-amber-800 mt-1">
            Following final milestone approval, the vendor is contractually liable for defects raised within 30 days at no additional charge. Ensure thorough acceptance testing before approving final milestone.
          </p>
        </div>
      </div>
    );
  };

  // ── Staff Aug: Weekly Status Log ───────────────────────────────────────────

  const renderWeeklyStatusLog = () => {
    if (engagement.type !== 'staffaug') return null;
    return (
      <SectionCard title="Weekly Status Log" icon={<Calendar size={18} />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Week', 'Hours', 'Tasks Completed', 'Vendor Notes'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4 last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {engagement.weeklyLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 pr-4 text-gray-800 font-medium whitespace-nowrap">
                    w/c {formatDate(log.week)}
                  </td>
                  <td className="py-3 pr-4 font-bold" style={{ color: NAVY }}>
                    {log.hours}h
                  </td>
                  <td className="py-3 pr-4 text-gray-700 max-w-xs">
                    {log.tasksCompleted}
                  </td>
                  <td className="py-3 text-gray-600 max-w-xs">
                    {log.vendorNotes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    );
  };

  // ── Staff Aug: Replacement SLA countdown ──────────────────────────────────

  const renderReplacementSLA = () => {
    if (engagement.type !== 'staffaug') return null;
    const totalDays = 5;
    const remainingDays = 5; // mock: no replacement triggered
    const pct = (remainingDays / totalDays) * 100;

    return (
      <div
        className="rounded-2xl border px-5 py-4 mb-6"
        style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
      >
        <div className="flex items-start gap-3 mb-3">
          <RefreshCw size={18} className="flex-shrink-0 mt-0.5 text-blue-500" />
          <div>
            <p className="text-sm font-bold text-blue-800">Replacement SLA — 5 Business Days</p>
            <p className="text-xs text-blue-600 mt-0.5">
              If a contractor is unavailable or removed, the vendor must provide a qualified replacement within 5 business days.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-blue-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: BLUE }}
            />
          </div>
          <span className="text-xs font-bold text-blue-700 whitespace-nowrap">{remainingDays}/{totalDays} days</span>
        </div>
        <p className="text-xs text-blue-500 mt-2">No active replacement SLA triggered.</p>
      </div>
    );
  };

  // ── MSP: Monthly Check-in Button ───────────────────────────────────────────

  const renderMspCheckinButton = () => {
    if (engagement.type !== 'msp') return null;
    return (
      <div className="mb-6">
        <button
          onClick={() => setMspCheckinOpen(true)}
          className="flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-xl text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: TEAL }}
        >
          <CheckCircle2 size={16} />
          Conduct Monthly Service Check-in
        </button>
      </div>
    );
  };

  // ── Messages Preview ───────────────────────────────────────────────────────

  const renderMessages = () => (
    <SectionCard title="Messages" icon={<MessageSquare size={18} />}>
      <div className="space-y-3 mb-4">
        {engagement.messages.slice(0, 3).map((msg) => (
          <div key={msg.id} className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: msg.sender === 'You' ? NAVY : BLUE }}
            >
              {msg.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-gray-800 truncate">{msg.sender}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{msg.timestamp}</span>
              </div>
              <p className="text-sm text-gray-700">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      <Link
        to="/messages"
        className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
        style={{ color: BLUE }}
      >
        View All Messages
        <ChevronRight size={14} />
      </Link>
    </SectionCard>
  );

  // ── Documents ──────────────────────────────────────────────────────────────

  const renderDocuments = () => (
    <SectionCard title="Documents" icon={<FileText size={18} />}>
      <div className="space-y-2">
        {engagement.documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={16} className="text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}
                  >
                    {doc.type}
                  </span>
                  <span className="text-xs text-gray-400">{doc.size}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => showToast(`Downloading ${doc.name}…`)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80 flex-shrink-0 ml-3"
              style={{ borderColor: BLUE, color: BLUE }}
            >
              <Download size={12} />
              Download
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );

  // ── Activity Log ───────────────────────────────────────────────────────────

  const renderActivityLog = () => (
    <SectionCard title="Activity Log" icon={<Activity size={18} />}>
      <div className="space-y-0">
        {[...engagement.activityLog].reverse().map((ev, idx) => (
          <div key={ev.id} className={`flex items-start gap-3 py-3 ${idx !== 0 ? 'border-t border-gray-50' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              {ACTIVITY_ICON_MAP[ev.icon]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">
                <span className="font-semibold">{ev.actor}</span>
                {' — '}
                {ev.event}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{ev.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );

  // ── Termination section at the bottom ─────────────────────────────────────

  const renderTerminationSection = () => (
    <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-2xl px-6 py-4">
      <div>
        <p className="text-sm font-bold text-red-700">Terminate Engagement</p>
        <p className="text-xs text-red-500 mt-0.5">
          Initiating termination will serve formal notice. Escrow funds will be held pending final review.
        </p>
      </div>
      <button
        onClick={() => setTerminationOpen(true)}
        className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl text-white flex-shrink-0 ml-4 transition-colors hover:opacity-90"
        style={{ backgroundColor: RED }}
      >
        <XCircle size={16} />
        Initiate Termination
      </button>
    </div>
  );

  // ── Modals ─────────────────────────────────────────────────────────────────

  const renderFundModal = () => {
    if (!fundModalOpen) return null;
    return (
      <Modal title="Fund Next Milestone via Stripe" onClose={() => setFundModalOpen(false)}>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
          <p className="text-sm text-blue-800">
            You are about to fund <strong className="text-blue-900">{formatCurrency(fundAmount)}</strong> into escrow for the next milestone. Funds are held securely and only released upon your approval.
          </p>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount</span>
            <span className="font-bold" style={{ color: NAVY }}>{formatCurrency(fundAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment method</span>
            <span className="font-medium text-gray-800">Stripe Secure Checkout</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Escrow provider</span>
            <span className="font-medium text-gray-800">Collabov Escrow</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setFundModalOpen(false);
              showToast(`£${fundAmount.toLocaleString()} funded via Stripe. Held in escrow.`);
            }}
            className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl transition-colors hover:opacity-90"
            style={{ backgroundColor: BLUE }}
          >
            <CreditCard size={16} />
            Pay via Stripe
          </button>
          <button
            onClick={() => setFundModalOpen(false)}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    );
  };

  const renderTerminationModal = () => {
    if (!terminationOpen) return null;
    const canSubmit = terminationReason.trim().length >= 20 && terminationAck;
    return (
      <Modal title="Initiate Engagement Termination" onClose={() => setTerminationOpen(false)}>
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ backgroundColor: '#FEE2E2', color: RED }}
        >
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>This action is irreversible.</strong> Serving termination notice will freeze active escrow and notify the vendor immediately.
          </span>
        </div>

        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Reason for termination <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300 mb-4 resize-none"
          rows={4}
          placeholder="Provide a clear reason (minimum 20 characters)…"
          value={terminationReason}
          onChange={(e) => setTerminationReason(e.target.value)}
        />
        <p className="text-xs text-gray-400 -mt-3 mb-4">{terminationReason.length}/20 minimum</p>

        <label className="flex items-start gap-2.5 cursor-pointer mb-6">
          <input
            type="checkbox"
            className="mt-0.5 rounded"
            checked={terminationAck}
            onChange={(e) => setTerminationAck(e.target.checked)}
          />
          <span className="text-sm text-gray-700">
            I confirm this termination is in accordance with the contract terms and that a 14-day notice period will apply.
          </span>
        </label>

        <div className="flex gap-3">
          <button
            disabled={!canSubmit}
            onClick={() => {
              setTerminationOpen(false);
              showToast('Termination notice served. Vendor has been notified.');
            }}
            className="flex-1 font-bold text-sm py-3 rounded-xl text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: RED }}
          >
            Confirm Termination
          </button>
          <button
            onClick={() => setTerminationOpen(false)}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </Modal>
    );
  };

  const renderMspCheckinModal = () => {
    if (!mspCheckinOpen) return null;
    const allChecked = mspChecked.every(Boolean);
    const checkedCount = mspChecked.filter(Boolean).length;

    return (
      <Modal title="Monthly Service Check-in" onClose={() => setMspCheckinOpen(false)} maxWidth="max-w-md">
        <p className="text-sm text-gray-600 mb-4">
          Confirm that all contracted service items have been delivered this month.
        </p>
        <div className="space-y-2.5 mb-6">
          {engagement.mspServiceItems.map((item, idx) => (
            <label key={idx} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                  mspChecked[idx]
                    ? 'border-teal-500 bg-teal-500'
                    : 'border-gray-300 group-hover:border-teal-400'
                }`}
                onClick={() => setMspChecked((prev) => prev.map((v, i) => (i === idx ? !v : v)))}
              >
                {mspChecked[idx] && <Check size={12} className="text-white" />}
              </div>
              <span
                className={`text-sm transition-colors ${mspChecked[idx] ? 'text-teal-700 line-through' : 'text-gray-700'}`}
                onClick={() => setMspChecked((prev) => prev.map((v, i) => (i === idx ? !v : v)))}
              >
                {item}
              </span>
            </label>
          ))}
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 flex items-center justify-between text-sm">
          <span className="text-gray-600">Items confirmed</span>
          <span className="font-bold" style={{ color: TEAL }}>
            {checkedCount} / {engagement.mspServiceItems.length}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            disabled={!allChecked}
            onClick={() => {
              setMspCheckinOpen(false);
              showToast('Monthly check-in submitted successfully.');
            }}
            className="flex-1 font-bold text-sm py-3 rounded-xl text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: TEAL }}
          >
            Submit Check-in
          </button>
          <button
            onClick={() => setMspCheckinOpen(false)}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        {renderHeader()}

        {/* Type-specific notices above main content */}
        {renderDefectLiability()}
        {renderMspCheckinButton()}

        {/* Milestone Tracker */}
        {renderMilestoneTracker()}

        {/* Escrow Panel */}
        {renderEscrowPanel()}

        {/* Evidence Review (only shown when milestones are in_review) */}
        {renderEvidenceReview()}

        {/* Staff Aug sections */}
        {renderWeeklyStatusLog()}
        {renderReplacementSLA()}

        {/* Messages Preview */}
        {renderMessages()}

        {/* Documents */}
        {renderDocuments()}

        {/* Activity Log */}
        {renderActivityLog()}

        {/* Termination */}
        {renderTerminationSection()}

      </div>

      {/* Modals */}
      {renderFundModal()}
      {renderTerminationModal()}
      {renderMspCheckinModal()}

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
