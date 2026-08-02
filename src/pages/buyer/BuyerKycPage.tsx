import React, { useEffect, useState } from 'react';
import { Upload, CheckCircle, Clock, FileText, AlertCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import BuyerLayout from '../../components/buyer/BuyerLayout';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BuyerProfile {
  company_name: string | null;
  legal_entity_name: string | null;
  trading_name: string | null;
  industry: string | null;
  headcount_band: string | null;
  country: string | null;
}

type DocType = 'company_registration' | 'proof_of_id' | 'proof_of_address';
type VerificationStatus = 'submitted' | 'valid' | 'invalid' | 'cannot_verify';

interface KycDocumentRow {
  document_type: DocType;
  document_url: string | null;
  verification_status: VerificationStatus;
  admin_notes: string | null;
}

const DOCUMENT_TYPES: { key: DocType; label: string; description: string }[] = [
  {
    key: 'company_registration',
    label: 'Company Registration Document',
    description: 'Certificate of incorporation or equivalent business registration record.',
  },
  {
    key: 'proof_of_id',
    label: 'Proof of ID (Director/Signatory)',
    description: 'Government-issued photo ID for a company director or authorised signatory.',
  },
  {
    key: 'proof_of_address',
    label: 'Proof of Business Address',
    description: 'Recent utility bill, bank statement, or lease agreement showing the business address.',
  },
];

const STATUS_MAP: Record<VerificationStatus, { label: string; className: string; icon: React.ReactNode }> = {
  submitted: {
    label: 'Submitted — pending review',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  valid: {
    label: 'Verified',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  invalid: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  cannot_verify: {
    label: 'Unable to verify',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: <HelpCircle className="h-3.5 w-3.5" />,
  },
};

// ─── Summary field ──────────────────────────────────────────────────────────

const SummaryField: React.FC<{ label: string; value: string | null | undefined }> = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-1">{label}</p>
    <p className="text-sm font-semibold text-[#0B2D59]">{value?.trim() || '—'}</p>
  </div>
);

// ─── Document upload row ────────────────────────────────────────────────────

interface DocRowProps {
  docType: DocType;
  label: string;
  description: string;
  existing: KycDocumentRow | undefined;
  uploading: boolean;
  onUpload: (docType: DocType, file: File) => void;
}

const DocumentRow: React.FC<DocRowProps> = ({ docType, label, description, existing, uploading, onUpload }) => {
  const inputId = `kyc-upload-${docType}`;
  const status = existing ? STATUS_MAP[existing.verification_status] : null;

  return (
    <div className="border border-gray-100 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl bg-[#0070F3]/10 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-[#0070F3]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#0B2D59]">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          {status && (
            <span
              className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${status.className}`}
            >
              {status.icon}
              {status.label}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <input
          id={inputId}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(docType, file);
            e.target.value = '';
          }}
        />
        <label
          htmlFor={inputId}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide cursor-pointer transition-colors ${
            uploading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#0070F3] text-white hover:bg-[#0060d3]'
          }`}
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading…' : existing?.document_url ? 'Replace' : 'Upload'}
        </label>
      </div>
    </div>
  );
};

// ─── Page ───────────────────────────────────────────────────────────────────

const BuyerKycPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [docs, setDocs] = useState<Record<string, KycDocumentRow>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<DocType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: buyer }, { data: kycDocs }] = await Promise.all([
        supabase
          .from('buyers')
          .select('company_name, legal_entity_name, trading_name, industry, headcount_band, country')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('buyer_kyc_documents')
          .select('document_type, document_url, verification_status, admin_notes')
          .eq('buyer_id', user.id),
      ]);
      setProfile(buyer as BuyerProfile | null);
      const map: Record<string, KycDocumentRow> = {};
      (kycDocs || []).forEach((d: any) => { map[d.document_type] = d; });
      setDocs(map);
      setLoading(false);
    })();
  }, [user]);

  const uploadDoc = async (docType: DocType, file: File) => {
    if (!user) return;
    setUploadingType(docType);
    setError(null);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${docType}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('buyer-documents').upload(path, file);
    if (uploadErr) {
      setUploadingType(null);
      setError(uploadErr.message);
      return;
    }
    const { error: dbErr } = await supabase.from('buyer_kyc_documents').upsert(
      { buyer_id: user.id, document_type: docType, document_url: path, verification_status: 'submitted' },
      { onConflict: 'buyer_id,document_type' }
    );
    setUploadingType(null);
    if (dbErr) {
      setError(dbErr.message);
      return;
    }
    setDocs((prev) => ({
      ...prev,
      [docType]: { document_type: docType, document_url: path, verification_status: 'submitted', admin_notes: null },
    }));
  };

  return (
    <BuyerLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B2D59]">KYC Information</h1>
        <p className="text-sm text-gray-400 mt-1">
          Review your company details and upload the verification documents required to complete your buyer profile.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Company details summary */}
      <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-8 mb-6">
        <h2 className="text-sm font-bold text-[#0B2D59] uppercase tracking-wide mb-6">Company Details</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SummaryField label="Company Name" value={profile?.company_name} />
            <SummaryField label="Legal Entity Name" value={profile?.legal_entity_name} />
            <SummaryField label="Trading Name" value={profile?.trading_name} />
            <SummaryField label="Industry" value={profile?.industry} />
            <SummaryField label="Headcount" value={profile?.headcount_band} />
            <SummaryField label="Country" value={profile?.country} />
          </div>
        )}
      </div>

      {/* Document upload */}
      <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-8">
        <h2 className="text-sm font-bold text-[#0B2D59] uppercase tracking-wide mb-2">Verification Documents</h2>
        <p className="text-xs text-gray-400 mb-6">
          PDF, JPEG or PNG, up to 10MB per file. Documents are kept private and only visible to you and Collabov admins.
        </p>
        <div className="space-y-4">
          {DOCUMENT_TYPES.map((doc) => (
            <DocumentRow
              key={doc.key}
              docType={doc.key}
              label={doc.label}
              description={doc.description}
              existing={docs[doc.key]}
              uploading={uploadingType === doc.key}
              onUpload={uploadDoc}
            />
          ))}
        </div>
      </div>
    </BuyerLayout>
  );
};

export default BuyerKycPage;
