-- Add per-package VAT treatment to vendor_packages.
-- This is distinct from vendor-level VAT registration status collected in
-- ManageListings.tsx step 8 — this is a per-package presentation concern.
--
-- Allowed values (by convention, no CHECK constraint):
--   'inclusive'      - the listed price already includes VAT
--   'exclusive'       - VAT will be added on top of the listed price
--   'not_applicable' - vendor is not VAT-registered / out of scope for VAT
ALTER TABLE vendor_packages
  ADD COLUMN IF NOT EXISTS vat_treatment text NOT NULL DEFAULT 'not_applicable';
