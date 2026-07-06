-- Real e-signature via OpenSign, replacing the "simulated in-platform signing"
-- flow where clicking Sign just flipped signed_by_customer/signed_by_vendor
-- directly with no actual signature ceremony. These track the real OpenSign
-- document + each party's real signing link; the signed_at/signed_by columns
-- are now only ever written by the opensign-webhook Edge Function once
-- OpenSign reports a real completed signature.
ALTER TABLE public.sow_documents ADD COLUMN IF NOT EXISTS opensign_document_id text;
ALTER TABLE public.sow_documents ADD COLUMN IF NOT EXISTS opensign_buyer_sign_url text;
ALTER TABLE public.sow_documents ADD COLUMN IF NOT EXISTS opensign_vendor_sign_url text;
