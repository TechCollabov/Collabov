-- Track when a vendor explicitly submits their listing for admin review,
-- separate from verification_status (which reflects the admin's decision).
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS listing_submitted_at timestamptz;
