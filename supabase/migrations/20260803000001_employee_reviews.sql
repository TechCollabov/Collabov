-- Employee reviews: buyers rate individual vendor employees assigned to their engagements.
CREATE TABLE IF NOT EXISTS employee_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES vendor_employees(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(engagement_id, employee_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_reviews_employee_id ON employee_reviews(employee_id);

ALTER TABLE employee_reviews ENABLE ROW LEVEL SECURITY;

-- Buyers can manage (insert/select/update) their own reviews.
CREATE POLICY "Buyers can insert own employee reviews"
  ON employee_reviews FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can view own employee reviews"
  ON employee_reviews FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can update own employee reviews"
  ON employee_reviews FOR UPDATE
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- Vendors can view reviews left for their own employees.
CREATE POLICY "Vendors can view reviews for their employees"
  ON employee_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendor_employees ve
      WHERE ve.id = employee_reviews.employee_id
        AND ve.vendor_id = auth.uid()
    )
  );

-- Admins can view all reviews.
CREATE POLICY "Admins can view all employee reviews"
  ON employee_reviews FOR SELECT
  USING (public.is_admin());
