/*
  # Admin Journey Workflows

  Implements the data model for the Admin Journey PDF: login lockout,
  platform-wide settings, an admin audit log, editable site content, and
  extends verification/blacklist/dispute records for admin decisions.

  ## Important RLS fix (pre-existing bug)
  `vendors`, `customers`, `vendor_documents`, `jobs`, `contracts`,
  `engagements` and `project_milestones` had UPDATE policies scoped only to
  the owning party (`auth.uid() = id` etc.), with no admin bypass. This
  silently broke every admin write built so far — vendor verify/reject,
  IR35 stamping, blacklist, and restoration all executed successfully
  against zero rows under RLS. It also meant a vendor could never update
  `project_milestones` themselves (only the buyer could), which would have
  silently broken evidence submission. This migration adds a shared
  `is_admin()` helper and rewrites the affected policies.

  ## New tables
  - platform_settings   - singleton config row (fee %, timing windows, etc.)
  - admin_audit_log     - every manual override / blacklist / unlock, logged
  - site_content        - the four admin-editable content blocks

  ## Extended tables
  - profiles         - failed_login_attempts, locked_at (admin login lockout)
  - vendors          - company_registration_number, rejection_reason,
                       rejected_at, blacklist_pending
  - customers        - blacklist fields (buyers can now be blacklisted too)
  - vendor_documents - verification_status, admin_notes (per-document)
  - disputes         - merge_log (simultaneous-dispute merge audit trail)

  ## New RPCs (SECURITY DEFINER, pre-auth safe)
  - is_admin()                          - shared RLS helper
  - get_login_lock_status(email)        - checked before sign-in attempt
  - record_login_attempt(email, ok)     - increments/resets on admin logins
  - unlock_admin_account(target_id)     - requires a second, different admin
*/

-- =====================================================
-- SHARED HELPER
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'
  );
$$;

-- =====================================================
-- RLS FIX: admin bypass on party-scoped tables
-- =====================================================

DROP POLICY IF EXISTS "Vendors can update own profile" ON vendors;
CREATE POLICY "Vendors can update own profile" ON vendors FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Customers can update own profile" ON customers;
CREATE POLICY "Customers can update own profile" ON customers FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Vendors can manage own documents" ON vendor_documents;
CREATE POLICY "Vendors can manage own documents" ON vendor_documents FOR ALL TO authenticated
  USING (vendor_id = auth.uid() OR public.is_admin())
  WITH CHECK (vendor_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Customers can manage own jobs" ON jobs;
CREATE POLICY "Customers can manage own jobs" ON jobs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM customers WHERE customers.id = jobs.customer_id AND customers.id = auth.uid()) OR public.is_admin())
  WITH CHECK (EXISTS (SELECT 1 FROM customers WHERE customers.id = jobs.customer_id AND customers.id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Contract parties can update contracts" ON contracts;
CREATE POLICY "Contract parties can update contracts" ON contracts FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR contractor_id = auth.uid() OR vendor_id = auth.uid() OR public.is_admin())
  WITH CHECK (customer_id = auth.uid() OR contractor_id = auth.uid() OR vendor_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Parties can update own engagements" ON engagements;
CREATE POLICY "Parties can update own engagements" ON engagements FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid() OR public.is_admin())
  WITH CHECK (buyer_id = auth.uid() OR vendor_id = auth.uid() OR public.is_admin());

-- project_milestones: previously customer-only for ALL, meaning vendors could
-- never update their own milestone's escrow_status when submitting evidence.
-- Rewritten to cover buyer + vendor (via the parent project) + admin.
DROP POLICY IF EXISTS "Customers can manage project milestones" ON project_milestones;
DROP POLICY IF EXISTS "Project parties can view milestones" ON project_milestones;
CREATE POLICY "Project parties can view milestones" ON project_milestones FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id
            AND (projects.customer_id = auth.uid() OR projects.contractor_id = auth.uid() OR projects.vendor_id = auth.uid()))
    OR public.is_admin()
  );
CREATE POLICY "Project parties can manage milestones" ON project_milestones FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id
            AND (projects.customer_id = auth.uid() OR projects.contractor_id = auth.uid() OR projects.vendor_id = auth.uid()))
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id
            AND (projects.customer_id = auth.uid() OR projects.contractor_id = auth.uid() OR projects.vendor_id = auth.uid()))
    OR public.is_admin()
  );

-- =====================================================
-- EXTEND: profiles (admin login lockout)
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_attempts int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_at timestamptz;

-- =====================================================
-- EXTEND: vendors (re-registration block, deferred blacklist)
-- =====================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS company_registration_number text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS blacklist_pending boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_vendors_company_reg_number ON vendors(company_registration_number) WHERE company_registration_number IS NOT NULL;

-- =====================================================
-- EXTEND: customers (blacklist parity with vendors)
-- =====================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_blacklisted boolean DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS blacklist_reason text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS blacklisted_at timestamptz;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS blacklisted_by uuid;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS restoration_approvals jsonb DEFAULT '[]'::jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS blacklist_pending boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_customers_is_blacklisted ON customers(is_blacklisted) WHERE is_blacklisted = true;

-- =====================================================
-- EXTEND: vendor_documents (per-document admin decision)
-- =====================================================

ALTER TABLE vendor_documents ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending';
ALTER TABLE vendor_documents ADD COLUMN IF NOT EXISTS admin_notes text;

-- =====================================================
-- EXTEND: disputes (simultaneous-dispute merge trail)
-- =====================================================

ALTER TABLE disputes ADD COLUMN IF NOT EXISTS merge_log jsonb DEFAULT '[]'::jsonb;

-- =====================================================
-- NEW TABLE: platform_settings (singleton)
-- =====================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  platform_fee_pct numeric NOT NULL DEFAULT 10,
  auto_release_days int NOT NULL DEFAULT 7,
  auto_release_warning_days int NOT NULL DEFAULT 5,
  hourly_invoice_window_days int NOT NULL DEFAULT 5,
  minimum_project_value numeric NOT NULL DEFAULT 500,
  byov_invite_expiry_days int NOT NULL DEFAULT 7,
  referral_confirmation_days int NOT NULL DEFAULT 14,
  vendor_verification_sla_days int NOT NULL DEFAULT 2,
  admin_alert_email text,
  maintenance_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);
INSERT INTO platform_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read platform settings" ON platform_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin can update platform settings" ON platform_settings FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================
-- NEW TABLE: admin_audit_log
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view audit log" ON admin_audit_log FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can write audit log" ON admin_audit_log FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- =====================================================
-- NEW TABLE: site_content (the four editable things)
-- =====================================================

CREATE TABLE IF NOT EXISTS site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site content" ON site_content FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Only admin can write site content" ON site_content FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO site_content (key, value) VALUES
  ('market_insight_table', '{
    "msp": {"rate": "£1,200–£3,500/month", "demand": "High demand — 847 active searches this month", "tip": "MSPs with SLA guarantees and sub-4hr response times receive 3× more enquiries."},
    "agency": {"rate": "£8,000–£45,000/project", "demand": "High demand — 1,203 active searches this month", "tip": "Agencies with case studies in your industry receive 4× higher proposal acceptance rates."},
    "staffaug": {"rate": "£2,800–£6,500/month per person", "demand": "Growing demand — 634 active searches this month", "tip": "Staff aug providers with 3+ verified referrals win contracts 60% faster."},
    "software+development": {"rate": "£350–£650/day or £8,500+ project", "demand": "Very high demand — 1,847 searches this month", "tip": "React and Node.js skills are most requested by UK SMEs right now."},
    "cybersecurity": {"rate": "£3,500–£15,000/engagement", "demand": "Growing demand — 421 searches this month", "tip": "Vendors with ISO 27001 certification convert enquiries at 2× the platform average."},
    "managed+it": {"rate": "£800–£2,400/month", "demand": "Steady demand — 398 searches this month", "tip": "Buyers in this category prioritise response time guarantees above price."}
  }'::jsonb),
  ('homepage_stats', '[
    {"value": "$650B+", "label": "Global IT outsourcing market in 2024", "source": ""},
    {"value": "$214B+", "label": "Underserved SME and mid-market opportunity", "source": ""},
    {"value": "63%", "label": "of UK businesses planning to increase outsourcing", "source": ""},
    {"value": "40%", "label": "Average cost reduction vs equivalent UK hire", "source": ""}
  ]'::jsonb),
  ('homepage_testimonials', '[
    {"quote": "We found a React development team in Poland within three days. The contract was signed on the platform, milestones tracked automatically, and we paid only when each piece of work was delivered. First time outsourcing has ever felt completely under control.", "name": "James Whitfield", "role": "CTO — Paytrace Financial, London", "type": "buyer"},
    {"quote": "As a 12-person agency in Krakow, getting in front of UK clients used to take months of sales effort. Collabov gave us a verified profile and we received our first RFP within two weeks. The escrow payment system means we never have to chase invoices.", "name": "Marta Kowalska", "role": "MD — CodeForge Solutions, Krakow", "type": "vendor"}
  ]'::jsonb),
  ('coming_soon_flags', '{"market_insight": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- RPCs: admin login lockout (pre-auth safe, SECURITY DEFINER)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_login_lock_status(p_email text)
RETURNS TABLE(is_locked boolean, is_admin_account boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT (p.locked_at IS NOT NULL), (p.user_type = 'admin')
  FROM profiles p WHERE p.email = p_email LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_login_attempt(p_email text, p_success boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_type user_type;
  v_attempts int;
BEGIN
  SELECT id, user_type, failed_login_attempts INTO v_id, v_type, v_attempts
  FROM profiles WHERE email = p_email;

  IF v_id IS NULL OR v_type IS DISTINCT FROM 'admin' THEN
    RETURN; -- only admin logins are hardened per the journey spec
  END IF;

  IF p_success THEN
    UPDATE profiles SET failed_login_attempts = 0 WHERE id = v_id;
  ELSE
    UPDATE profiles
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_at = CASE WHEN failed_login_attempts + 1 >= 3 THEN now() ELSE locked_at END
      WHERE id = v_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.unlock_admin_account(p_target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_type user_type;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() = p_target_id THEN
    RETURN false;
  END IF;

  SELECT user_type INTO v_caller_type FROM profiles WHERE id = auth.uid();
  IF v_caller_type IS DISTINCT FROM 'admin' THEN
    RETURN false;
  END IF;

  UPDATE profiles SET locked_at = NULL, failed_login_attempts = 0 WHERE id = p_target_id;

  INSERT INTO admin_audit_log (admin_id, action_type, target_type, target_id, reason)
    VALUES (auth.uid(), 'unlock_admin', 'profile', p_target_id, 'Second-admin unlock');

  RETURN true;
END;
$$;
