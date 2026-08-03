-- "Talk to an Expert" — buyer consultation request capture (no scheduling/calendar
-- integration in this pass; a human follows up manually via the raw data).
CREATE TABLE IF NOT EXISTS consultation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  topic text NOT NULL,
  preferred_time text,
  notes text,
  status text NOT NULL DEFAULT 'pending',  -- pending / contacted / completed
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can insert their own consultation requests"
  ON consultation_requests FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can view their own consultation requests"
  ON consultation_requests FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Admins can view all consultation requests"
  ON consultation_requests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all consultation requests"
  ON consultation_requests FOR UPDATE
  USING (public.is_admin());
