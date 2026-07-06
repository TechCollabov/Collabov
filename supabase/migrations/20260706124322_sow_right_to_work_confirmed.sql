-- SOWWizardPage already shows a "Right to Work Check Required" notice to the
-- buyer for on-site/hybrid staff-aug engagements, but never captured whether
-- the buyer actually confirmed it. Add a real column to record that attestation
-- so admin's IR35 stamp queue can show it instead of stamping blind.
ALTER TABLE public.sow_documents ADD COLUMN IF NOT EXISTS right_to_work_confirmed boolean DEFAULT false;
