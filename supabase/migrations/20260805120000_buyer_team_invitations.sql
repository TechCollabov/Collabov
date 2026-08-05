-- Lets a buyer invite a colleague to join their company's Collabov account.
-- Capture-only for this pass: no email delivery/accept flow yet, just a
-- persisted pending-invite record the buyer can see and revoke, mirroring
-- the "capture the request" pattern used for Talk to an Expert.
CREATE TABLE IF NOT EXISTS buyer_team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  invited_name text NOT NULL,
  invited_email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending', -- pending / revoked
  created_at timestamptz DEFAULT now()
);

ALTER TABLE buyer_team_invitations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'buyer_team_invitations' AND policyname = 'Buyers can insert their own invitations'
  ) THEN
    CREATE POLICY "Buyers can insert their own invitations"
      ON buyer_team_invitations FOR INSERT
      WITH CHECK (buyer_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'buyer_team_invitations' AND policyname = 'Buyers can view their own invitations'
  ) THEN
    CREATE POLICY "Buyers can view their own invitations"
      ON buyer_team_invitations FOR SELECT
      USING (buyer_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'buyer_team_invitations' AND policyname = 'Buyers can update their own invitations'
  ) THEN
    CREATE POLICY "Buyers can update their own invitations"
      ON buyer_team_invitations FOR UPDATE
      USING (buyer_id = auth.uid());
  END IF;
END $$;
