/*
  # Buyer KYC documents

  ## Problem
  The buyer-facing "KYC Information" page (/buyer/kyc) is currently a
  ComingSoonPage stub. This adds the storage + table needed for buyers to
  upload verification documents (company registration, proof of ID, proof
  of business address), mirroring the existing vendor_documents /
  vendor-documents pattern.

  This pass is upload + status display only ("Submitted — pending review").
  Admin review/verification UI is a deliberate follow-up, not built here.

  ## Table
  buyer_kyc_documents — one row per (buyer_id, document_type), same
  verification_status vocabulary as vendor_documents (submitted / valid /
  invalid / cannot_verify).

  ## Storage
  buyer-documents — private bucket, same size/MIME constraints as
  vendor-documents. Path convention: {buyer_id}/{filename}. Only the owning
  buyer and admin can read/write, matching the vendor-documents policies.
*/

CREATE TABLE IF NOT EXISTS buyer_kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_url text,
  verification_status text NOT NULL DEFAULT 'submitted',
  admin_notes text,
  uploaded_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, document_type)
);

ALTER TABLE buyer_kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can manage own kyc documents"
  ON buyer_kyc_documents FOR ALL TO authenticated
  USING (buyer_id = auth.uid() OR public.is_admin())
  WITH CHECK (buyer_id = auth.uid() OR public.is_admin());

-- ── Storage: buyer-documents ────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('buyer-documents', 'buyer-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "buyer_documents_select_own_or_admin"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'buyer-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin())
  );

CREATE POLICY "buyer_documents_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'buyer-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "buyer_documents_update_own_or_admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'buyer-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin())
  );

CREATE POLICY "buyer_documents_delete_own_or_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'buyer-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin())
  );
