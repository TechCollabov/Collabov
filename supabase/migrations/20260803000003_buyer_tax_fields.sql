-- Buyer "Tax" page: country-aware tax ID storage, mirroring the
-- vendor tax_id_primary/tax_id_secondary columns added for vendors'
-- Tax & Compliance step (see 20260720103309_vendor_certifications_and_tax_compliance.sql).
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS tax_id_primary text;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS tax_id_secondary text;
