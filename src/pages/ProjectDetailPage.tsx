import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Check,
  X,
  Download,
  ChevronLeft,
  AlertTriangle,
  Clock,
  Star,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Milestone {
  id: string;
  name: string;
  amount: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'accepted' | 'rejected' | 'flagged';
  due_date: string;
  evidence_submitted: boolean;
  acceptance_criteria: string[];
  demo_url?: string;
  evidence_description?: string;
}

interface Document {
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

interface Project {
  id: string;
  title: string;
  vendor_name: string;
  vendor_type: 'agency' | 'staffaug' | 'msp';
  buyer_company: string;
  status: string;
  contract_value: number;
  start_date: string;
  end_date: string;
  payment_model: string;
  defect_liability_days: number;
  termination_status: string;
  milestones: Milestone[];
  documents: Document[];
  activity_log: ActivityEntry[];
}

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface WeeklyLog {
  id: string;
  week: string;
  content: string;
  submitted_by: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROJECT: Project = {
  id: 'proj-1',
  title: 'Payment Gateway Rebuild',
  vendor_name: 'TechForge Solutions',
  vendor_type: 'agency',
  buyer_company: 'Paytrace Financial',
  status: 'active',
  contract_value: 32000,
  start_date: '2026-04-01',
  end_date: '2026-09-30',
  payment_model: 'milestone',
  defect_liability_days: 30,
  termination_status: 'active',
  milestones: [
    {
      id: 'm1',
      name: 'Discovery & Architecture',
      amount: 6400,
      status: 'accepted',
      due_date: '2026-04-30',
      evidence_submitted: true,
      acceptance_criteria: [
        'Architecture document delivered',
        'Tech stack confirmed',
        'Project plan approved',
      ],
    },
    {
      id: 'm2',
      name: 'Core Authentication & User Management',
      amount: 9600,
      status: 'submitted',
      due_date: '2026-05-31',
      evidence_submitted: true,
      acceptance_criteria: [
        'Login/logout functional in Chrome/Firefox/Safari',
        'Password reset flow works',
        'Unit tests >80% coverage',
      ],
      demo_url: 'https://staging.paytrace-dev.com/auth',
      evidence_description:
        'Authentication module is complete. All acceptance criteria have been tested in staging. Demo URL above shows the full login flow including 2FA.',
    },
    {
      id: 'm3',
      name: 'Payment Processing Engine',
      amount: 9600,
      status: 'in_progress',
      due_date: '2026-06-30',
      evidence_submitted: false,
      acceptance_criteria: [
        'Stripe integration working',
        'Transaction log populates correctly',
        'Error handling for declined cards',
      ],
    },
    {
      id: 'm4',
      name: 'Production Deployment & Go-Live',
      amount: 6400,
      status: 'not_started',
      due_date: '2026-09-30',
      evidence_submitted: false,
      acceptance_criteria: [
        'Production deployment complete',
        'Smoke tests passed',
        'Admin has credentials',
      ],
    },
  ],
  documents: [
    { name: 'Project_Delivery_Contract_v1.pdf', type: 'contract', size: '245 KB' },
    { name: 'IR35_SDS_TechForge.pdf', type: 'ir35', size: '89 KB' },
    { name: 'GDPR_DPA_Schedule3.pdf', type: 'gdpr', size: '112 KB' },
  ],
  activity_log: [
    { id: 'a1', timestamp: '2026-04-01 09:00', actor: 'System', action: 'Contract signed by both parties' },
    { id: 'a2', timestamp: '2026-04-02 10:30', actor: 'Paytrace Financial', action: 'Milestone 1 funded: £6,400' },
    { id: 'a3', timestamp: '2026-04-28 16:00', actor: 'TechForge Solutions', action: 'Evidence submitted for Milestone 1' },
    { id: 'a4', timestamp: '2026-04-29 11:00', actor: 'Paytrace Financial', action: 'Milestone 1 accepted — £6,400 released' },
    { id: 'a5', timestamp: '2026-05-01 09:00', actor: 'Paytrace Financial', action: 'Milestone 2 funded: £9,600' },
    { id: 'a6', timestamp: '2026-05-30 17:00', actor: 'TechForge Solutions', action: 'Evidence submitted for Milestone 2' },
  ],
};

const MOCK_MESSAGES: Message[] = [
  { id: 'msg1', sender: 'Paytrace Financial', text: 'Looking good on Milestone 1, well done team!', timestamp: '2026-04-29 11:30' },
  { id: 'msg2', sender: 'TechForge Solutions', text: 'Thank you! We are on track for Milestone 2.', timestamp: '2026-04-29 12:00' },
  { id: 'msg3', sender: 'Paytrace Financial', text: 'Please confirm the staging URL for Milestone 2 review.', timestamp: '2026-05-28 09:15' },
];

const MOCK_WEEKLY_LOGS: WeeklyLog[] = [
  { id: 'w1', week: 'Week of 2026-04-01', content: 'Completed initial setup and repository configuration. Team onboarded.', submitted_by: 'TechForge Solutions' },
  { id: 'w2', week: 'Week of 2026-04-08', content: 'Architecture document drafted. Awaiting client review.', submitted_by: 'TechForge Solutions' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString('en-GB')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(dueDateStr: string): boolean {
  return new Date(dueDateStr) < new Date('2026-06-10');
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const STATUS_COLOURS: Record<string, string> = {
  not_started: 'bg-gray-200 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  flagged: 'bg-orange-100 text-orange-700',
};

const STATUS_CIRCLE: Record<string, string> = {
  not_started: 'bg-gray-300',
  in_progress: 'bg-blue-500',
  submitted: 'bg-amber-400',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
  flagged: 'bg-orange-500',
};

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  flagged: 'Flagged',
};

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  onClose: () => void;
}

function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#0B2D59] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-3 animate-fade-in">
      <Check size={16} className="text-green-400" />
      {message}
      <button onClick={onClose} className="ml-2 text-white/60 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-bold text-[#0B2D59]">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { engagementId } = useParams<{ engagementId: string }>();
  const [searchParams] = useSearchParams();
  const role = (searchParams.get('role') as 'buyer' | 'vendor') || 'buyer';

  const [project, setProject] = useState<Project>(MOCK_PROJECT);
  const [toast, setToast] = useState<string | null>(null);

  // Milestone action state
  const [acceptConfirmMilestone, setAcceptConfirmMilestone] = useState<Milestone | null>(null);
  const [flagMilestone, setFlagMilestone] = useState<Milestone | null>(null);
  const [flagText, setFlagText] = useState('');
  const [disputeMilestone, setDisputeMilestone] = useState<Milestone | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [criteriaChecked, setCriteriaChecked] = useState<Record<string, boolean[]>>({});

  // Escrow state
  const [fundingMilestone, setFundingMilestone] = useState<Milestone | null>(null);

  // Termination modal
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [terminationNotice, setTerminationNotice] = useState('');
  const [terminationAck, setTerminationAck] = useState(false);
  const [terminationBanner, setTerminationBanner] = useState<string | null>(null);

  // Weekly log (staffaug)
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>(MOCK_WEEKLY_LOGS);
  const [newWeeklyLog, setNewWeeklyLog] = useState('');
  const [showReplacement, setShowReplacement] = useState(false);

  // MSP check-in
  const [showMspCheckin, setShowMspCheckin] = useState(false);
  const [mspRatings, setMspRatings] = useState({ uptime: 0, response: 0, fcr: 0, patch: 0, satisfaction: 0 });

  const showToast = (msg: string) => setToast(msg);

  // Initialise criteria checked state
  useEffect(() => {
    const init: Record<string, boolean[]> = {};
    project.milestones.forEach((m) => {
      init[m.id] = m.acceptance_criteria.map(() => false);
    });
    setCriteriaChecked(init);
  }, []);

  const updateMilestoneStatus = (milestoneId: string, status: Milestone['status']) => {
    setProject((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === milestoneId ? { ...m, status } : m
      ),
    }));
  };

  // Escrow helpers
  const getEscrowStatus = (m: Milestone): 'unfunded' | 'funded' | 'released' | 'in_dispute' => {
    if (m.status === 'accepted') return 'released';
    if (m.status === 'submitted' || m.status === 'in_progress') return 'funded';
    return 'unfunded';
  };

  const escrowChipClass: Record<string, string> = {
    unfunded: 'bg-amber-100 text-amber-700',
    funded: 'bg-blue-100 text-blue-700',
    released: 'bg-green-100 text-green-700',
    in_dispute: 'bg-red-100 text-red-700',
  };

  const escrowChipLabel: Record<string, string> = {
    unfunded: 'Unfunded',
    funded: 'Funded',
    released: 'Released',
    in_dispute: 'In Dispute',
  };

  const totalFunded = project.milestones
    .filter((m) => getEscrowStatus(m) === 'funded')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalReleased = project.milestones
    .filter((m) => getEscrowStatus(m) === 'released')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalRemaining = project.contract_value - totalFunded - totalReleased;

  const allAccepted = project.milestones.every((m) => m.status === 'accepted');
  const defectLiabilityEnd = allAccepted
    ? addDays(project.milestones[project.milestones.length - 1].due_date, project.defect_liability_days)
    : null;

  const terminationNoticeEndDate = addDays('2026-06-10', 14);

  // ── Milestone stepper ──────────────────────────────────────────────────────

  const renderMilestoneTracker = () => (
    <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-[#0B2D59] mb-6">Milestone Tracker</h2>

      <div className="flex flex-col md:flex-row md:items-start gap-0 md:gap-0">
        {project.milestones.map((milestone, idx) => {
          const overdue = isOverdue(milestone.due_date) && milestone.status !== 'accepted';
          const isLast = idx === project.milestones.length - 1;

          return (
            <div key={milestone.id} className="flex flex-col md:flex-row flex-1">
              {/* Step + content */}
              <div className="flex flex-col flex-1">
                {/* Circle + connector */}
                <div className="flex md:flex-col items-center md:items-center mb-2 md:mb-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${STATUS_CIRCLE[milestone.status]}`}>
                    {milestone.status === 'accepted' ? (
                      <Check size={18} />
                    ) : milestone.status === 'rejected' || milestone.status === 'flagged' ? (
                      <X size={18} />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  {/* Connector line */}
                  {!isLast && (
                    <div className="flex-1 md:hidden h-px bg-gray-200 mx-2" />
                  )}
                </div>

                {/* Card */}
                <div className="flex-1 pt-3 pb-2 md:px-2">
                  <div className="font-semibold text-[#0B2D59] text-sm">{milestone.name}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{formatCurrency(milestone.amount)}</div>
                  <div className={`text-xs mt-0.5 ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                    {overdue ? '⚠ ' : ''}Due {formatDate(milestone.due_date)}
                  </div>
                  <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOURS[milestone.status]}`}>
                    {STATUS_LABELS[milestone.status]}
                  </span>
                </div>

                {/* Evidence review panel for buyer on submitted milestones */}
                {milestone.status === 'submitted' && role === 'buyer' && renderEvidencePanel(milestone)}
              </div>

              {/* Horizontal connector (desktop) */}
              {!isLast && (
                <div className="hidden md:flex items-start pt-5 flex-shrink-0">
                  <div className="w-8 h-px bg-gray-300 mt-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Defect liability notice */}
      {allAccepted && defectLiabilityEnd && (
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-3">
          <FileText size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Your defect liability period runs until <strong>{formatDate(defectLiabilityEnd)}</strong>. If you discover bugs before this date, raise them via the Messages tab. The vendor is contractually obliged to fix defects at no additional charge.
          </p>
        </div>
      )}
    </div>
  );

  // ── Evidence panel ─────────────────────────────────────────────────────────

  const renderEvidencePanel = (milestone: Milestone) => {
    const checked = criteriaChecked[milestone.id] || [];
    const toggleCriterion = (i: number) => {
      setCriteriaChecked((prev) => ({
        ...prev,
        [milestone.id]: prev[milestone.id].map((v, idx) => (idx === i ? !v : v)),
      }));
    };

    // Mock: submitted 3 days ago → 2 days remaining
    const daysRemaining = 2;

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-4">
        <div className="flex items-start justify-between mb-3">
          <span className="font-semibold text-amber-900 text-sm">Evidence submitted — review required</span>
          <span className="text-xs text-gray-500">Auto-releases in 5 days if no action</span>
        </div>

        {/* Auto-release warning */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800 mb-4 flex items-center gap-2">
          <Clock size={14} />
          <span>{daysRemaining} days remaining before auto-release</span>
        </div>

        {milestone.evidence_description && (
          <div className="bg-white rounded-lg p-4 text-sm text-gray-700 mb-4">
            {milestone.evidence_description}
          </div>
        )}

        {milestone.demo_url && (
          <a
            href={milestone.demo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-blue-100 text-blue-700 rounded-lg px-3 py-1.5 text-xs font-medium mb-4 hover:bg-blue-200 transition-colors"
          >
            View staging environment →
          </a>
        )}

        {/* Acceptance criteria */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Acceptance Criteria</p>
          <ul className="space-y-2">
            {milestone.acceptance_criteria.map((criterion, i) => (
              <li
                key={i}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => toggleCriterion(i)}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${checked[i] ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                  {checked[i] ? <Check size={12} className="text-white" /> : <X size={12} className="text-gray-300" />}
                </div>
                <span className={`text-sm ${checked[i] ? 'text-green-700' : 'text-gray-700'}`}>{criterion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* File downloads */}
        <div className="mb-5">
          {project.documents.slice(0, 1).map((doc) => (
            <div key={doc.name} className="flex items-center gap-2 text-sm text-gray-600">
              <FileText size={14} />
              <span>{doc.name}</span>
              <button className="text-blue-600 underline text-xs">Download</button>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setAcceptConfirmMilestone(milestone)}
            className="bg-green-600 text-white rounded-xl px-6 py-3 font-semibold text-sm hover:bg-green-700 transition-colors"
          >
            Accept &amp; Release Payment — {formatCurrency(milestone.amount)}
          </button>
          <button
            onClick={() => { setFlagMilestone(milestone); setFlagText(''); }}
            className="border border-amber-500 text-amber-700 rounded-xl px-6 py-3 text-sm font-medium hover:bg-amber-50 transition-colors"
          >
            Flag Criteria
          </button>
          <button
            onClick={() => { setDisputeMilestone(milestone); setDisputeReason(''); setDisputeDescription(''); }}
            className="border border-red-500 text-red-600 rounded-xl px-6 py-3 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Open Dispute
          </button>
        </div>
      </div>
    );
  };

  // ── Escrow section ─────────────────────────────────────────────────────────

  const renderEscrowSection = () => (
    <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Escrow Status</h2>

      <div className="space-y-3 mb-5">
        {project.milestones.map((m) => {
          const escrow = getEscrowStatus(m);
          return (
            <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{m.name}</p>
                <p className="text-xs text-gray-500">{formatCurrency(m.amount)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${escrowChipClass[escrow]}`}>
                  {escrowChipLabel[escrow]}
                </span>
                {escrow === 'unfunded' && role === 'buyer' && (
                  <button
                    onClick={() => setFundingMilestone(m)}
                    className="bg-[#0070F3] text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Fund this milestone
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-6 text-sm pt-4 border-t border-gray-100">
        <div>
          <span className="text-gray-500">Total funded</span>
          <span className="ml-2 font-semibold text-blue-700">{formatCurrency(totalFunded)}</span>
        </div>
        <div>
          <span className="text-gray-500">Total released</span>
          <span className="ml-2 font-semibold text-green-700">{formatCurrency(totalReleased)}</span>
        </div>
        <div>
          <span className="text-gray-500">Remaining</span>
          <span className="ml-2 font-semibold text-gray-700">{formatCurrency(totalRemaining)}</span>
        </div>
      </div>
    </div>
  );

  // ── Staff Aug sections ─────────────────────────────────────────────────────

  const renderWeeklyStatusLog = () => {
    if (project.vendor_type !== 'staffaug') return null;
    return (
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Weekly Status Updates</h2>

        {role === 'vendor' && (
          <div className="mb-4">
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              rows={3}
              placeholder="Submit your weekly status update..."
              value={newWeeklyLog}
              onChange={(e) => setNewWeeklyLog(e.target.value)}
            />
            <button
              onClick={() => {
                if (!newWeeklyLog.trim()) return;
                setWeeklyLogs((prev) => [
                  { id: `w${prev.length + 1}`, week: `Week of 2026-06-08`, content: newWeeklyLog, submitted_by: project.vendor_name },
                  ...prev,
                ]);
                setNewWeeklyLog('');
                showToast('Weekly status update submitted.');
              }}
              className="mt-2 bg-[#0B2D59] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#0a2550] transition-colors"
            >
              Submit Update
            </button>
          </div>
        )}

        <div className="space-y-3">
          {weeklyLogs.map((log) => (
            <div key={log.id} className="bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-[#0B2D59]">{log.week}</span>
                <span className="text-xs text-gray-400">{log.submitted_by}</span>
              </div>
              <p className="text-sm text-gray-700">{log.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReplacementSLA = () => {
    if (project.vendor_type !== 'staffaug' || !showReplacement) return null;
    const remaining = 7;
    const total = 10;
    return (
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Replacement SLA</h2>
        <p className="text-sm text-gray-600 mb-3">
          Replacement SLA: <strong>{remaining} of {total} business days remaining</strong>
        </p>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full"
            style={{ width: `${(remaining / total) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">{remaining} days remaining to provide a replacement candidate.</p>
      </div>
    );
  };

  // ── Messages ───────────────────────────────────────────────────────────────

  const renderMessages = () => (
    <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#0B2D59]">Messages</h2>
        <Link to="/messages" className="text-sm text-blue-600 hover:underline">
          Open full messages →
        </Link>
      </div>
      <div className="space-y-3">
        {MOCK_MESSAGES.map((msg) => (
          <div key={msg.id} className="flex gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-[#0B2D59]">{msg.sender}</span>
                <span className="text-xs text-gray-400">{msg.timestamp}</span>
              </div>
              <p className="text-sm text-gray-700">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Documents ──────────────────────────────────────────────────────────────

  const renderDocuments = () => (
    <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Documents</h2>
      <div className="space-y-3">
        {project.documents.map((doc) => (
          <div key={doc.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs bg-gray-200 text-gray-600 rounded px-1.5 py-0.5 uppercase">{doc.type}</span>
                  <span className="text-xs text-gray-400">{doc.size}</span>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-1.5 border border-blue-300 text-blue-600 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-blue-50 transition-colors">
              <Download size={12} />
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Activity log ───────────────────────────────────────────────────────────

  const renderActivityLog = () => (
    <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-[#0B2D59] mb-4">Activity Log</h2>
      <div className="space-y-1">
        {project.activity_log.map((entry, idx) => (
          <div
            key={entry.id}
            className={`flex items-start gap-3 rounded-lg px-3 py-2 ${idx % 2 === 0 ? 'bg-gray-50' : ''}`}
          >
            <span className="text-xs text-gray-400 w-32 flex-shrink-0 pt-0.5">{entry.timestamp}</span>
            <div className="flex-1">
              <span className="font-medium text-[#0B2D59] text-sm">{entry.actor}</span>
              <span className="text-sm text-gray-700"> — {entry.action}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Sidebar ────────────────────────────────────────────────────────────────

  const renderSidebar = () => (
    <div className="w-full md:w-72 flex flex-col gap-4 md:sticky md:top-24">
      {/* Contract info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-[#0B2D59] uppercase tracking-wide mb-3">Contract Info</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className={`font-semibold capitalize ${project.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
              {project.termination_status === 'notice_served' ? 'Notice Served' : project.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment model</span>
            <span className="font-medium capitalize">{project.payment_model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Vendor type</span>
            <span className="font-medium capitalize">{project.vendor_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Start date</span>
            <span className="font-medium">{formatDate(project.start_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">End date</span>
            <span className="font-medium">{formatDate(project.end_date)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-1">
            <span className="text-gray-500">Contract value</span>
            <span className="font-bold text-[#0B2D59]">{formatCurrency(project.contract_value)}</span>
          </div>
        </div>
      </div>

      {/* MSP check-in toggle */}
      {project.vendor_type === 'msp' && (
        <button
          onClick={() => setShowMspCheckin(true)}
          className="bg-[#0B2D59] text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#0a2550] transition-colors"
        >
          Start Monthly Check-in
        </button>
      )}

      {/* Staff aug replacement toggle */}
      {project.vendor_type === 'staffaug' && !showReplacement && (
        <button
          onClick={() => setShowReplacement(true)}
          className="border border-orange-300 text-orange-700 rounded-xl px-4 py-3 text-sm font-medium hover:bg-orange-50 transition-colors"
        >
          Trigger Replacement SLA
        </button>
      )}
    </div>
  );

  // ── Modals ─────────────────────────────────────────────────────────────────

  const renderAcceptModal = () => {
    if (!acceptConfirmMilestone) return null;
    return (
      <Modal title="Confirm Payment Release" onClose={() => setAcceptConfirmMilestone(null)}>
        <p className="text-gray-700 mb-6">
          Release <strong>{formatCurrency(acceptConfirmMilestone.amount)}</strong> to <strong>{project.vendor_name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              updateMilestoneStatus(acceptConfirmMilestone.id, 'accepted');
              showToast(`Payment of ${formatCurrency(acceptConfirmMilestone.amount)} released.`);
              setAcceptConfirmMilestone(null);
            }}
            className="flex-1 bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 transition-colors"
          >
            Confirm Release
          </button>
          <button
            onClick={() => setAcceptConfirmMilestone(null)}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    );
  };

  const renderFlagModal = () => {
    if (!flagMilestone) return null;
    return (
      <Modal title="Flag Acceptance Criteria" onClose={() => setFlagMilestone(null)}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe which criteria are not met and why (min 50 chars)
        </label>
        <textarea
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300 mb-4"
          rows={4}
          value={flagText}
          onChange={(e) => setFlagText(e.target.value)}
          placeholder="Please explain which criteria have not been met..."
        />
        <p className="text-xs text-gray-400 mb-4">{flagText.length}/50 minimum characters</p>
        <div className="flex gap-3">
          <button
            disabled={flagText.length < 50}
            onClick={() => {
              updateMilestoneStatus(flagMilestone.id, 'flagged');
              showToast('Criteria flagged. Vendor has 5 days to respond.');
              setFlagMilestone(null);
            }}
            className="flex-1 bg-amber-500 text-white rounded-xl py-3 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors"
          >
            Send Flag
          </button>
          <button
            onClick={() => setFlagMilestone(null)}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    );
  };

  const renderDisputeModal = () => {
    if (!disputeMilestone) return null;
    return (
      <Modal title="Open Dispute" onClose={() => setDisputeMilestone(null)}>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for dispute</label>
        <select
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 mb-4 focus:outline-none focus:ring-2 focus:ring-red-300"
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
        >
          <option value="">Select a reason...</option>
          <option value="scope">Scope mismatch</option>
          <option value="quality">Delivery quality</option>
          <option value="nondelivery">Non-delivery</option>
          <option value="timeline">Timeline breach</option>
          <option value="other">Other</option>
        </select>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (min 100 chars)
        </label>
        <textarea
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300 mb-1"
          rows={5}
          value={disputeDescription}
          onChange={(e) => setDisputeDescription(e.target.value)}
          placeholder="Provide a detailed description of the dispute..."
        />
        <p className="text-xs text-gray-400 mb-4">{disputeDescription.length}/100 minimum characters</p>

        <div className="flex gap-3">
          <button
            disabled={!disputeReason || disputeDescription.length < 100}
            onClick={() => {
              showToast('Dispute opened. Escrow frozen. 72 hours for bilateral resolution.');
              setDisputeMilestone(null);
            }}
            className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
          >
            Open Dispute
          </button>
          <button
            onClick={() => setDisputeMilestone(null)}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    );
  };

  const renderFundingModal = () => {
    if (!fundingMilestone) return null;
    return (
      <Modal title="Fund Milestone via Stripe" onClose={() => setFundingMilestone(null)}>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-sm text-blue-800">
          Secure payment of <strong>{formatCurrency(fundingMilestone.amount)}</strong> via Stripe. Funds held in escrow until you approve the work.
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              showToast('Milestone funded.');
              setFundingMilestone(null);
            }}
            className="flex-1 bg-[#0070F3] text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition-colors"
          >
            Fund Escrow
          </button>
          <button
            onClick={() => setFundingMilestone(null)}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    );
  };

  const renderTerminationModal = () => {
    if (!showTerminationModal) return null;
    return (
      <Modal title="Terminate Contract" onClose={() => setShowTerminationModal(false)}>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for termination</label>
        <select
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 mb-4 focus:outline-none focus:ring-2 focus:ring-red-300"
          value={terminationReason}
          onChange={(e) => setTerminationReason(e.target.value)}
        >
          <option value="">Select a reason...</option>
          <option value="scope_complete">Scope complete early</option>
          <option value="budget">Budget constraints</option>
          <option value="performance">Vendor performance</option>
          <option value="mutual">Mutual agreement</option>
          <option value="other">Other</option>
        </select>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Written notice (min 50 chars)
        </label>
        <textarea
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300 mb-1"
          rows={4}
          value={terminationNotice}
          onChange={(e) => setTerminationNotice(e.target.value)}
          placeholder="Provide written notice of termination..."
        />
        <p className="text-xs text-gray-400 mb-4">{terminationNotice.length}/50 minimum characters</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-4">
          <AlertTriangle size={14} className="inline mr-1" />
          Your notice period is <strong>14 days</strong> (IT Agency standard). Contract remains active until <strong>{formatDate(terminationNoticeEndDate)}</strong>.
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={terminationAck}
            onChange={(e) => setTerminationAck(e.target.checked)}
            className="rounded"
          />
          I acknowledge the notice period
        </label>

        <div className="flex gap-3">
          <button
            disabled={!terminationReason || terminationNotice.length < 50 || !terminationAck}
            onClick={() => {
              setProject((prev) => ({ ...prev, termination_status: 'notice_served' }));
              setTerminationBanner(`Termination notice served. Contract active until ${formatDate(terminationNoticeEndDate)}.`);
              setShowTerminationModal(false);
            }}
            className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
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

  const renderMspCheckinModal = () => {
    if (!showMspCheckin) return null;
    const criteria = [
      { key: 'uptime', label: 'Uptime / Availability %' },
      { key: 'response', label: 'Avg ticket response hours' },
      { key: 'fcr', label: 'First-call resolution %' },
      { key: 'patch', label: 'Patch compliance %' },
      { key: 'satisfaction', label: 'Overall satisfaction (1-5)' },
    ] as const;

    return (
      <Modal title="Monthly Check-in" onClose={() => setShowMspCheckin(false)}>
        <div className="space-y-5 mb-6">
          {criteria.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setMspRatings((prev) => ({ ...prev, [key]: star }))}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${mspRatings[key] >= star ? 'text-amber-400' : 'text-gray-300'}`}
                  >
                    <Star size={18} fill={mspRatings[key] >= star ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            showToast('Check-in submitted.');
            setShowMspCheckin(false);
          }}
          className="w-full bg-[#0B2D59] text-white rounded-xl py-3 font-semibold hover:bg-[#0a2550] transition-colors"
        >
          Submit Check-in
        </button>
      </Modal>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  void engagementId; // used via route param for future API call

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Termination banner */}
        {terminationBanner && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
              <Check size={16} />
              {terminationBanner}
            </div>
            <button onClick={() => setTerminationBanner(null)} className="text-green-500 hover:text-green-700">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <Link
                to="/dashboard"
                className="inline-flex items-center text-sm text-gray-500 hover:text-[#0B2D59] mb-3 transition-colors"
              >
                <ChevronLeft size={16} />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-[#0B2D59]">{project.title}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {project.termination_status === 'notice_served' ? 'Notice Served' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                <strong className="text-gray-800">{project.vendor_name}</strong>
                <span className="mx-1.5 text-gray-300">·</span>
                <span className="capitalize">{project.vendor_type}</span>
                <span className="mx-1.5 text-gray-300">·</span>
                {project.buyer_company}
              </p>
              <p className="text-sm text-gray-500 mt-1.5">
                {formatCurrency(project.contract_value)} contract
                <span className="mx-1.5 text-gray-300">·</span>
                {formatDate(project.start_date)} – {formatDate(project.end_date)}
              </p>
            </div>

            {project.termination_status === 'active' && (
              <button
                onClick={() => setShowTerminationModal(true)}
                className="border border-red-400 text-red-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors flex-shrink-0"
              >
                Terminate Contract
              </button>
            )}
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Left: main content */}
          <div className="flex-1 min-w-0">
            {renderMilestoneTracker()}
            {renderEscrowSection()}
            {renderWeeklyStatusLog()}
            {renderReplacementSLA()}
            {renderMessages()}
            {renderDocuments()}
            {renderActivityLog()}
          </div>

          {/* Right: sidebar */}
          {renderSidebar()}
        </div>
      </div>

      {/* Modals */}
      {renderAcceptModal()}
      {renderFlagModal()}
      {renderDisputeModal()}
      {renderFundingModal()}
      {renderTerminationModal()}
      {renderMspCheckinModal()}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
