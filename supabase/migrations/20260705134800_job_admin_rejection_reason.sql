/*
  # Brief/tender review rejection reason

  Mirrors the vendor verification rejection UX: when an admin rejects a
  job/tender submission, the buyer should see why.
*/

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS admin_rejection_reason text;
