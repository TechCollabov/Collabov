/*
  # Add UK verification-document values to document_type

  ## Problem
  vendor_documents.document_type is a Postgres enum seeded with an
  India-market document set (incorporation, pan, gst, msme, aoa, moa,
  director_details). AdminVerification.tsx already has label mappings for
  companies_house / address_proof / vat_certificate (the UK documents the
  vendor journey spec actually calls for), but the enum had no matching
  values — inserting a row with any of those would fail outright. This
  blocked wiring the vendor-side "My Listing" verification-docs step to
  real storage.

  ## Changes
  Adds the three UK document type values the admin side already expects.
  Existing India-market values are left in place (not removed) since
  altering/removing enum values in place is unsafe if any rows reference
  them.
*/

ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'companies_house';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'address_proof';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'vat_certificate';
