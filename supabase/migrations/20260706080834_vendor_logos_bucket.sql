/*
  # Public bucket for vendor logos

  Logos need to be visible to any buyer browsing search results/profiles
  without a signed URL, unlike verification docs and engagement files
  (which must stay private). A separate public bucket keeps that
  distinction explicit rather than mixing public and private objects in
  one bucket.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('vendor-logos', 'vendor-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "vendor_logos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vendor-logos');

CREATE POLICY "vendor_logos_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vendor-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "vendor_logos_update_own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'vendor-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "vendor_logos_delete_own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vendor-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
