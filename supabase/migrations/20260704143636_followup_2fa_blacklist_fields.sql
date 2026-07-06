/*
  # Follow-up fields: simulated 2FA + vendor blacklist

  Applied directly to the live project via Supabase MCP; this file mirrors
  that change for local history and future environments.

  - profiles: two_factor_enabled/backup codes (simulated — no real TOTP
    secret or code verification, consistent with how Stripe/e-signature are
    simulated elsewhere in this build)
  - vendors: blacklist fields. Blacklisting takes effect after any open
    dispute resolves; restoration requires two distinct admin approvals
    (restoration_approvals holds the admin ids that have signed off).
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_backup_codes jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_enabled_at timestamptz;

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_blacklisted boolean DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS blacklist_reason text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS blacklisted_at timestamptz;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS blacklisted_by uuid;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS restoration_approvals jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_vendors_is_blacklisted ON vendors(is_blacklisted) WHERE is_blacklisted = true;
