-- Case studies become upload-only (title + a file) instead of a full form.
-- Adds file_url and a public bucket to hold the uploaded documents/images,
-- matching the vendor-logos bucket pattern since these are public marketing
-- material, not private verification docs.

ALTER TABLE public.case_studies ADD COLUMN IF NOT EXISTS file_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('case-study-files', 'case-study-files', true, 20971520, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "case_study_files_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'case-study-files');

CREATE POLICY "case_study_files_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'case-study-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "case_study_files_update_own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'case-study-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "case_study_files_delete_own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'case-study-files' AND (storage.foldername(name))[1] = auth.uid()::text);
