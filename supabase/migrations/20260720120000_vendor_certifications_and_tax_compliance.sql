/*
  # Vendor certifications + country-aware bank/tax compliance

  ## Problem
  The vendor "My Listing" flow has no way to record professional
  certifications (Microsoft Certified Partner, SOC 2, ISO 27001, etc.) —
  these are open-ended (custom names, multiple per vendor, each with its
  own issue/expiry dates) so they don't fit the existing single-row-per-type
  vendor_documents mechanism. Bank details (step 7) also have no
  international wire field, and there's no dedicated tax/compliance step.

  ## Changes
  1. New `vendor_certifications` table — one row per certification per
     vendor, admin-reviewable via the same submitted/valid/invalid/
     cannot_verify status vocabulary already used by vendor_documents.
  2. RLS mirroring vendor_documents: vendor manages own rows, admin
     manages all.
  3. `vendors.swift_code` — optional SWIFT/BIC for international wires,
     relevant regardless of country (step 7).
  4. `vendors.tax_id_primary` / `vendors.tax_id_secondary` — generic
     storage for country-specific tax IDs (VAT/UTR, EIN, PAN/GST, etc.),
     labelled per-country in the UI (new step 8, Tax & Compliance).
*/

CREATE TABLE IF NOT EXISTS vendor_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  cert_type text NOT NULL,
  issuer text,
  issue_date date,
  expiry_date date,
  document_url text,
  verification_status text NOT NULL DEFAULT 'submitted',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_certifications_vendor_id ON vendor_certifications(vendor_id);

ALTER TABLE vendor_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage own certifications"
  ON vendor_certifications
  FOR ALL
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Admins manage all certifications"
  ON vendor_certifications
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS swift_code text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tax_id_primary text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tax_id_secondary text;
