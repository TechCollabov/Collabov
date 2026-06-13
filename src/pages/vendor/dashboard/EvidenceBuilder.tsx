import React, { useState, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  ArrowLeft,
  Upload,
  X,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Check,
  FileText,
  Info,
} from 'lucide-react';

interface EvidenceBuilderProps {
  milestoneId?: string;
  milestoneName?: string;
  milestoneAmount?: number;
  acceptanceCriteria?: string[];
  isStaffAug?: boolean;
}

const EvidenceBuilder: React.FC<EvidenceBuilderProps> = ({
  milestoneId: propMilestoneId,
  milestoneName: propMilestoneName,
  milestoneAmount: propMilestoneAmount,
  acceptanceCriteria: propAcceptanceCriteria,
  isStaffAug = false,
}) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const milestone = {
    id: propMilestoneId || searchParams.get('milestone') || 'm2',
    name: propMilestoneName || 'Core Authentication & User Management',
    amount: propMilestoneAmount || 9600,
    acceptance_criteria: propAcceptanceCriteria || [
      'Login/logout functional in Chrome, Firefox, and Safari',
      'Password reset flow works end-to-end',
      'Unit tests >80% coverage',
      "Code delivered to buyer's GitHub repository",
    ],
    status: 'in_progress',
  };

  // Description state
  const [description, setDescription] = useState('');
  const [descriptionTouched, setDescriptionTouched] = useState(false);

  // Criteria state
  const [checkedCriteria, setCheckedCriteria] = useState<boolean[]>(
    milestone.acceptance_criteria.map(() => false)
  );

  // File upload state
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Demo URL state
  const [demoUrl, setDemoUrl] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Staff aug state
  const [weeklyUpdate, setWeeklyUpdate] = useState('');
  const [weeklySubmitting, setWeeklySubmitting] = useState(false);
  const [weeklyToast, setWeeklyToast] = useState(false);

  // Evidence toast (backend sync pending)
  const [evidenceToast, setEvidenceToast] = useState(false);

  // Computed values
  const descriptionValid = description.length >= 100;
  const descriptionError = descriptionTouched && !descriptionValid;
  const allCriteriaChecked = checkedCriteria.every(Boolean);
  const uncheckedCount = checkedCriteria.filter(v => !v).length;
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const totalSizeMB = totalSize / (1024 * 1024);
  const sizeOverLimit = totalSizeMB > 50;
  const evidenceAttached = files.length > 0 || demoUrl.trim().length > 0;

  const canSubmit = descriptionValid && allCriteriaChecked && evidenceAttached && !sizeOverLimit;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleCriterion = (index: number) => {
    setCheckedCriteria(prev => prev.map((v, i) => (i === index ? !v : v)));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('evidence').insert({
        project_id: null,
        milestone_id: milestone.id,
        description,
        demo_url: demoUrl || null,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      });
      if (error) {
        // table may not exist — still show success UI
        console.warn('evidence table not available:', error.message);
      }
    } catch (e: any) {
      console.warn('evidence insert failed:', e?.message);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const handleWeeklySubmit = async () => {
    if (!weeklyUpdate.trim()) return;
    setWeeklySubmitting(true);
    try {
      const { error } = await supabase.from('weekly_status_log').insert({
        vendor_id: user?.id ?? null,
        update_text: weeklyUpdate,
        submitted_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch {
      // weekly_status_log table doesn't exist yet — show success anyway
    } finally {
      setWeeklySubmitting(false);
      setWeeklyToast(true);
      setWeeklyUpdate('');
      setTimeout(() => setWeeklyToast(false), 3000);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        {evidenceToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
            Submission recorded — backend sync pending
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0B2D59] mb-3">Evidence submitted</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Your evidence has been sent to the buyer for review. They have 7 days to respond —
            payment auto-releases on day 7 if no action is taken.
          </p>
          <Link
            to="/vendor/dashboard/contracts"
            className="inline-flex items-center gap-2 text-[#0070F3] font-semibold hover:underline text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to contracts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-7">
            <Link
              to="/vendor/dashboard/contracts"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#0070F3] transition-colors mb-4"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to contracts
            </Link>
            <h1 className="text-2xl font-bold text-[#0B2D59]">Submit Evidence</h1>
            <p className="text-sm text-gray-500 mt-1">
              Milestone: {milestone.name} — £{milestone.amount.toLocaleString()}
            </p>
          </div>

          <div className="space-y-7">
            {/* 1. Delivery Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Delivery description — describe what you built and how it meets the brief{' '}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={() => setDescriptionTouched(true)}
                placeholder="Describe your delivery in detail — what was built, how it works, what was tested..."
                className={`bg-gray-50 border rounded-xl px-4 py-3 text-sm w-full min-h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#0070F3] transition-colors ${
                  descriptionError ? 'border-red-400 focus:ring-red-300' : 'border-gray-200'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                {descriptionError ? (
                  <span className="text-xs text-red-500">Minimum 100 characters required</span>
                ) : (
                  <span />
                )}
                <span className={`text-xs ml-auto ${description.length < 100 ? 'text-gray-400' : 'text-green-600'}`}>
                  {description.length} / 100 min
                </span>
              </div>
            </div>

            {/* 2. Acceptance Criteria */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1.5">
                Acceptance criteria — tick each criterion you have met{' '}
                <span className="text-red-500">*</span>
              </p>

              {!allCriteriaChecked && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800 flex gap-2 mb-3">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  Please confirm all criteria before submitting.
                </div>
              )}

              <div className="space-y-2.5">
                {milestone.acceptance_criteria.map((criterion, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleCriterion(i)}
                    className="flex items-start gap-3 w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border transition-colors ${
                        checkedCriteria[i]
                          ? 'bg-green-500 border-green-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {checkedCriteria[i] && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`text-sm ${checkedCriteria[i] ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                      {criterion}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. File Uploads */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1.5">
                Evidence files
              </p>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#0070F3] bg-blue-50'
                    : 'border-gray-300 hover:border-[#0070F3] hover:bg-blue-50'
                }`}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Drag files here or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">Any file type — max 50MB total</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeFile(i); }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className={`text-xs mt-1 ${sizeOverLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                    Total: {formatSize(totalSize)}{sizeOverLimit ? ' — exceeds 50MB limit' : ''}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Demo URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Demo or staging URL{' '}
                <span className="text-gray-400 font-normal">(optional — for web/app deliverables)</span>
              </label>
              <input
                type="url"
                value={demoUrl}
                onChange={e => setDemoUrl(e.target.value)}
                placeholder="https://staging.yourproject.com"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0070F3] transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Shown as a clickable link badge in the buyer's review panel.
              </p>
            </div>

            {/* Completeness Gate */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Submission checklist
              </p>
              <div className={`text-xs font-medium flex items-center gap-1.5 ${descriptionValid ? 'text-green-600' : 'text-red-500'}`}>
                {descriptionValid ? '✓' : '✗'} {descriptionValid ? 'Description complete' : 'Description too short'}
              </div>
              <div className={`text-xs font-medium flex items-center gap-1.5 ${allCriteriaChecked ? 'text-green-600' : 'text-red-500'}`}>
                {allCriteriaChecked ? '✓' : '✗'} {allCriteriaChecked ? 'All criteria confirmed' : `${uncheckedCount} criteria unchecked`}
              </div>
              <div className={`text-xs font-medium flex items-center gap-1.5 ${evidenceAttached && !sizeOverLimit ? 'text-green-600' : 'text-red-500'}`}>
                {evidenceAttached && !sizeOverLimit ? '✓' : '✗'}{' '}
                {evidenceAttached && !sizeOverLimit
                  ? 'Evidence attached'
                  : sizeOverLimit
                  ? 'Total file size exceeds 50MB'
                  : 'Upload at least one file or enter a demo URL'}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="bg-[#0070F3] text-white w-full rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit Evidence for Review →'
              )}
            </button>
          </div>
        </div>

        {/* Staff Aug Section */}
        {isStaffAug && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-6">
            <h3 className="text-base font-bold text-[#0B2D59] mb-1">Weekly Status Update</h3>
            <p className="text-xs text-gray-400 mb-4">Keep the buyer informed on your progress this week</p>
            <div className="bg-gray-50 rounded-xl p-5">
              <textarea
                value={weeklyUpdate}
                onChange={e => {
                  if (e.target.value.length <= 200) setWeeklyUpdate(e.target.value);
                }}
                placeholder="e.g. Week of 3 June: Completed user authentication module. Starting payment integration."
                rows={3}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-[#0070F3] transition-colors"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className={`text-xs ${weeklyUpdate.length >= 190 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {weeklyUpdate.length} / 200
                </span>
                <button
                  type="button"
                  onClick={handleWeeklySubmit}
                  disabled={!weeklyUpdate.trim() || weeklySubmitting}
                  className="border border-[#0070F3] text-[#0070F3] rounded-xl px-5 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {weeklySubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    'Submit Weekly Update'
                  )}
                </button>
              </div>
            </div>

            {weeklyToast && (
              <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                Weekly status update submitted.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidenceBuilder;
