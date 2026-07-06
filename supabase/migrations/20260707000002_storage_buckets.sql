/*
  # Real file storage for vendor documents and engagement files

  ## Problem
  Every "file upload" in the app (verification docs at signup, delivery
  evidence attachments, discovery spec PDFs) is currently just a text input
  capturing a filename string — there is no actual file storage anywhere in
  the codebase. This adds two private Supabase Storage buckets and the RLS
  policies needed to scope access correctly, so the app code (Phase 1/4 work)
  has somewhere real to upload to.

  ## Buckets
  1. `vendor-documents` — verification docs (Companies House cert, address
     proof, VAT cert) collected during vendor signup / profile completion.
     Path convention: {vendor_id}/{filename}. Only the owning vendor and
     admin can read; only the owning vendor can write (matches "documents
     are kept confidential" from the verification spec).
  2. `engagement-files` — delivery evidence attachments and discovery spec
     PDFs, both scoped to a specific engagement. Path convention:
     {engagement_id}/{filename}. Both parties on the engagement (buyer and
     vendor) can read and upload; only admin can update/delete, matching the
     spec's "evidence LOCKED on submit — cannot edit" rule.

  Both buckets are private (public = false); the app must use signed URLs
  (createSignedUrl) rather than public URLs to read files.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('vendor-documents', 'vendor-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('engagement-files', 'engagement-files', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- ── vendor-documents ──────────────────────────────────────────────────────────
-- Path convention: {vendor_id}/{filename}. Owning vendor + admin only.

CREATE POLICY "vendor_documents_select_own_or_admin"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vendor-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin())
  );

CREATE POLICY "vendor_documents_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vendor-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "vendor_documents_update_own_or_admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vendor-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin())
  );

CREATE POLICY "vendor_documents_delete_own_or_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vendor-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin())
  );

-- ── engagement-files ──────────────────────────────────────────────────────────
-- Path convention: {engagement_id}/{filename}. Both parties on the
-- engagement can read/upload; only admin can modify/delete (locked on submit).

CREATE POLICY "engagement_files_select_parties_or_admin"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'engagement-files'
    AND (
      is_admin()
      OR EXISTS (
        SELECT 1 FROM engagements e
        WHERE e.id = (storage.foldername(name))[1]::uuid
          AND (e.buyer_id = auth.uid() OR e.vendor_id = auth.uid())
      )
    )
  );

CREATE POLICY "engagement_files_insert_parties"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'engagement-files'
    AND EXISTS (
      SELECT 1 FROM engagements e
      WHERE e.id = (storage.foldername(name))[1]::uuid
        AND (e.buyer_id = auth.uid() OR e.vendor_id = auth.uid())
    )
  );

CREATE POLICY "engagement_files_update_admin_only"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'engagement-files' AND is_admin());

CREATE POLICY "engagement_files_delete_admin_only"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'engagement-files' AND is_admin());
