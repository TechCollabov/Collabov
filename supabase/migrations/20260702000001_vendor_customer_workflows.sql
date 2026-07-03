/*
  # Vendor & Customer Journey Workflows Schema

  Implements the data model for the complete vendor and customer (buyer)
  journeys: six engagement entry points, proposals + triage, SOW builder +
  e-signature, escrow + milestone delivery, MSP/staff-aug check-ins, hourly
  billing, disputes (flagged criteria -> 72hr bilateral -> admin resolution),
  change requests / amendments, terminations, two-way reviews with the buyer
  payment badge, re-hire, and settings-level records.

  ## New tables
  - sow_documents          - SOW wizard payload + generation/signing lifecycle
  - escrow_transactions    - simulated money movements (fund/release/refund/split)
  - invoices               - per-milestone / per-period invoices (gross + net)
  - disputes               - full dispute lifecycle incl. admin resolution
  - milestone_flags        - Path A "flagged criteria" clarification threads
  - change_requests        - post-signing amendments (scope/replacement/extension...)
  - check_ins              - MSP + staff-aug monthly check-ins (5 criteria)
  - hourly_logs            - staff-aug hourly billing entries
  - terminations           - formal termination flow with notice periods
  - interview_requests     - staff-aug employee interview scheduling
  - partner_invites        - BYOV (buyer invites vendor) + BYOC (vendor invites client)
  - payment_methods        - simulated saved cards
  - customer_team_members  - buyer team roles (admin/pm/finance/viewer)
  - notification_prefs     - per-user notification preference grid

  ## Extended tables
  - jobs               - visibility, tender fields, admin queue, structured budget
  - enquiries          - typed enquiries (rfp / discovery_brief / interview_request)
  - proposals          - vendor proposals, milestones payload, triage lifecycle
  - engagements        - source, payment model, lifecycle, IR35 stamping
  - project_milestones - escrow states + auto-release bookkeeping
  - messages           - engagement threads, off-platform flag, dispute tagging
  - reviews            - two-way criteria reviews + moderation
  - customers          - company profile fields + payment reliability badge
  - vendors            - stripe connect (simulated) + booking method
  - vendor_employees   - bench fields (seniority, skills, availability states)
  - evidence           - completeness fields, lock + review linkage
*/

-- =====================================================
-- NEW TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS sow_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid REFERENCES engagements(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  vendor_business_type text, -- msp / agency / staffaug
  -- wizard payload
  project_title text,
  service_type text,
  description text,
  start_date date,
  end_date date,
  total_budget numeric,
  milestones jsonb,            -- [{name, description, amount, due_date, acceptance_criteria[]}]
  payment_model text,          -- milestone / monthly / quarterly / hourly
  msp_onboarding jsonb,        -- {fee, go_live_date, deliverables[], min_contract_term}
  monthly_amount numeric,
  charge_day integer,
  min_term_months integer,
  equipment_provider text,     -- buyer / vendor
  ip_ownership text DEFAULT 'buyer', -- buyer / vendor / shared
  ip_shared_terms text,
  working_location text,       -- remote / onsite_uk / hybrid
  ir35_answers jsonb,
  vat_position text,
  obligations_summary text,
  -- lifecycle
  status text NOT NULL DEFAULT 'draft', -- draft / generated / signing / signed / void
  document_url text,
  generated_at timestamptz,
  buyer_signed_at timestamptz,
  vendor_signed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid REFERENCES engagements(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES project_milestones(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  transaction_type text NOT NULL, -- fund / release / refund / split_release / recurring_charge
  amount numeric NOT NULL,
  platform_fee_amount numeric DEFAULT 0,
  net_amount numeric,
  card_last4 text,
  reference text,
  status text NOT NULL DEFAULT 'completed', -- completed / failed / held
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  engagement_id uuid REFERENCES engagements(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES project_milestones(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  description text,
  period_label text,               -- e.g. "June 2026" for recurring
  gross_amount numeric NOT NULL,
  platform_fee_pct numeric DEFAULT 10,
  platform_fee_amount numeric DEFAULT 0,
  net_amount numeric,
  vat_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'issued', -- issued / paid / void
  issued_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid REFERENCES engagements(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES project_milestones(id) ON DELETE SET NULL,
  flag_id uuid,                       -- milestone_flags escalation source
  buyer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  opened_by uuid NOT NULL,
  opened_by_role text NOT NULL,       -- buyer / vendor / system
  reason text NOT NULL,               -- scope_mismatch / delivery_quality / payment / timeline_breach / non_delivery / other
  description text NOT NULL CHECK (length(description) >= 100),
  escrow_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'bilateral', -- bilateral / admin_review / resolved
  bilateral_deadline timestamptz NOT NULL,
  vendor_position text,
  buyer_position text,
  resolution text,                    -- full_vendor / full_buyer / split / settled_bilaterally
  split_vendor_pct numeric CHECK (split_vendor_pct >= 0 AND split_vendor_pct <= 100),
  resolution_notes text,
  resolved_by uuid,
  opened_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milestone_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid REFERENCES engagements(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES project_milestones(id) ON DELETE CASCADE,
  check_in_id uuid,
  hourly_log_ids jsonb,               -- staff-aug: specific flagged entries
  flagged_by uuid NOT NULL,
  flagged_criteria jsonb,             -- criteria texts the buyer flagged
  note text,
  status text NOT NULL DEFAULT 'open', -- open / vendor_responded / resolved / escalated / released_on_silence
  respond_by timestamptz NOT NULL,     -- +5 days
  vendor_response text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid REFERENCES engagements(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  requested_by uuid NOT NULL,
  requested_by_role text NOT NULL,      -- buyer / vendor
  request_type text NOT NULL,           -- scope / timeline / payment / milestones / replacement / extension / other
  description text NOT NULL,
  payload jsonb,                        -- e.g. replacement employee ids, new end date
  status text NOT NULL DEFAULT 'pending', -- pending / accepted / rejected / expired
  respond_by timestamptz NOT NULL,      -- +7 days
  response_note text,
  buyer_signed_at timestamptz,
  vendor_signed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  employee_id uuid,                     -- staff aug: the named person
  check_in_type text NOT NULL,          -- msp / staff_aug
  period_label text NOT NULL,           -- e.g. "June 2026"
  charge_date date,
  charge_amount numeric,
  opens_at timestamptz,
  scores jsonb,                         -- {criterion: 1..5} x 5 measures
  overall_score numeric,
  below_threshold boolean DEFAULT false,
  status text NOT NULL DEFAULT 'open',  -- open / confirmed / flagged / auto_confirmed
  flag_note text,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hourly_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL,
  employee_id uuid,
  log_date date NOT NULL,
  hours numeric NOT NULL CHECK (hours > 0 AND hours <= 24),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'logged', -- logged / submitted / approved / flagged / paid
  flag_note text,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS terminations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  initiated_by uuid NOT NULL,
  initiated_by_role text NOT NULL,       -- buyer / vendor
  reason text NOT NULL,
  notes text NOT NULL CHECK (length(notes) >= 50),
  notice_period_days integer NOT NULL,
  notice_end_date date NOT NULL,
  status text NOT NULL DEFAULT 'notice_period', -- notice_period / accepted_early / completed / held_dispute
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interview_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES vendor_employees(id) ON DELETE CASCADE,
  enquiry_id uuid REFERENCES enquiries(id) ON DELETE SET NULL,
  interview_type text NOT NULL DEFAULT 'interview', -- interview / discovery_call
  format text NOT NULL DEFAULT 'video',             -- video / phone / in_person
  proposed_times jsonb NOT NULL,                    -- buyer's proposed slots
  alternative_times jsonb,                          -- vendor counter-proposals (max 3)
  confirmed_time timestamptz,
  status text NOT NULL DEFAULT 'requested', -- requested / confirmed / completed / selected / declined / expired
  respond_by timestamptz NOT NULL,          -- +48 hours
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL,
  inviter_role text NOT NULL,            -- buyer (BYOV) / vendor (BYOC)
  company_name text NOT NULL,
  contact_name text,
  contact_email text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending', -- pending / accepted / expired / duplicate
  linked_profile_id uuid,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  brand text NOT NULL,
  last4 text NOT NULL,
  exp_month integer NOT NULL,
  exp_year integer NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'viewer',   -- admin / project_manager / finance / viewer
  status text NOT NULL DEFAULT 'invited', -- invited / active / removed
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, email)
);

CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  prefs jsonb NOT NULL DEFAULT '{}'::jsonb, -- {event_type: 'realtime'|'digest'|'off'}
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- EXTEND: jobs (Post a Job + Tender)
-- =====================================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public';           -- public / private
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invited_vendor_ids jsonb;                   -- private: pre-added vendors
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_kind text DEFAULT 'job';                -- job / tender
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tender_title text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS nda_required boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS submission_deadline timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tender_document_url text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS evaluation_criteria jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS admin_status text DEFAULT 'pending_review'; -- pending_review / live / rejected
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS service_type text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS engagement_model text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tech_stack jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS team_size text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS budget_from numeric;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS budget_to numeric;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS end_date date;

-- =====================================================
-- EXTEND: enquiries (RFP / Discovery Brief / Interview Request)
-- =====================================================

ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS enquiry_type text DEFAULT 'rfp';        -- rfp / discovery_brief / interview_request / general
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS service_type text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS budget_from numeric;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS budget_to numeric;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS tech_stack jsonb;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS team_size text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS engagement_model text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS expected_output text;                   -- discovery: spec / prototype / feasibility
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS pending_engagement_id uuid;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- =====================================================
-- EXTEND: proposals (vendor proposals + triage lifecycle)
-- =====================================================

ALTER TABLE proposals ALTER COLUMN contractor_id DROP NOT NULL;
ALTER TABLE proposals ALTER COLUMN job_id DROP NOT NULL;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS enquiry_id uuid REFERENCES enquiries(id) ON DELETE SET NULL;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS pending_engagement_id uuid;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS proposal_kind text DEFAULT 'standard';  -- standard / discovery
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS approach_summary text;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS proposed_team jsonb;                    -- staff aug: employee ids; others: free text
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS milestones jsonb;                       -- [{name, description, amount, due_date}]
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS assumptions text;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS exclusions text;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS spec_structure jsonb;                   -- discovery: proposed spec bullets
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS discovery_fee numeric;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS timeline_days integer;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS workflow_state text DEFAULT 'sent';
  -- draft / sent / keep / maybe / declined / accepted / unsuccessful / withdrawn / expired
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS expires_at timestamptz;                 -- +30 days from send
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- =====================================================
-- EXTEND: engagements (lifecycle spine)
-- =====================================================

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS contract_id uuid;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS sow_id uuid;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS proposal_id uuid;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS package_id uuid;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS job_id uuid;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS source text DEFAULT 'rfp';            -- rfp / job / tender / byov / discovery / package / rehire
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS payment_model text DEFAULT 'milestone'; -- milestone / monthly / quarterly / hourly
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS monthly_amount numeric;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS charge_day integer;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS total_value numeric;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS ir35_status text;                     -- pending / inside / outside
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS ir35_stamped_by uuid;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS ir35_stamped_at timestamptz;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS assigned_employee_id uuid;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS defect_liability_end_date date;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS closed_at timestamptz;
-- status values used: pending_signature / pending_ir35 / active / closing / closed / terminated

-- =====================================================
-- EXTEND: project_milestones (escrow state machine)
-- =====================================================

ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS engagement_id uuid;
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS milestone_type text DEFAULT 'standard'; -- standard / onboarding / discovery / recurring_period
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS escrow_status text DEFAULT 'unfunded';
  -- unfunded / funded / in_progress / submitted / accepted / rejected / in_dispute / released / refunded
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS funded_at timestamptz;
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS released_at timestamptz;
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS auto_release_at timestamptz;   -- submitted_at + 7 days
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS rejection_reason text;

-- =====================================================
-- EXTEND: messages (threads + off-platform detection)
-- =====================================================

ALTER TABLE messages ADD COLUMN IF NOT EXISTS engagement_id uuid;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS enquiry_id uuid;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_type text DEFAULT 'pre_engagement'; -- pre_engagement / pre_proposal / engagement
ALTER TABLE messages ADD COLUMN IF NOT EXISTS flagged_off_platform boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS dispute_id uuid;

-- =====================================================
-- EXTEND: reviews (two-way, 5 criteria, moderation)
-- =====================================================

ALTER TABLE reviews ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS engagement_id uuid;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_id uuid;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS direction text DEFAULT 'buyer_of_vendor'; -- buyer_of_vendor / vendor_of_buyer
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS criteria_scores jsonb;                    -- {criterion: 1..5} x 5
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'published'; -- pending / published / rejected
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS window_closes_at timestamptz;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_check;

-- =====================================================
-- EXTEND: customers (company profile + payment badge)
-- =====================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS legal_entity_name text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trading_name text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS headcount_band text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS billing_address text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS vat_number text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS companies_house_number text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS on_time_payment_rate numeric DEFAULT 100; -- drives badge: >=95 green / 80-94 amber / <80 red
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_events_count integer DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS late_payment_count integer DEFAULT 0;

-- =====================================================
-- EXTEND: vendors (stripe simulation + booking method)
-- =====================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS stripe_connect_status text DEFAULT 'disconnected'; -- disconnected / connected
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS stripe_connected_at timestamptz;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS booking_method text DEFAULT 'manual';              -- manual / calendly / google
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS calendly_url text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS dispute_outcome_count integer DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS non_response_count integer DEFAULT 0;

-- =====================================================
-- EXTEND: vendor_employees (staff-aug bench)
-- =====================================================

ALTER TABLE vendor_employees ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE vendor_employees ADD COLUMN IF NOT EXISTS seniority text;                  -- junior / mid / senior / lead / principal
ALTER TABLE vendor_employees ADD COLUMN IF NOT EXISTS core_domain text;
ALTER TABLE vendor_employees ADD COLUMN IF NOT EXISTS secondary_skills text[];
ALTER TABLE vendor_employees ADD COLUMN IF NOT EXISTS years_experience integer;
ALTER TABLE vendor_employees ADD COLUMN IF NOT EXISTS languages text[];
ALTER TABLE vendor_employees ADD COLUMN IF NOT EXISTS monthly_rate numeric;
ALTER TABLE vendor_employees ADD COLUMN IF NOT EXISTS engagement_type text;
ALTER TABLE vendor_employees ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available'; -- available / available_from / engaged
ALTER TABLE vendor_employees ADD COLUMN IF NOT EXISTS available_from date;
ALTER TABLE vendor_employees ADD COLUMN IF NOT EXISTS engaged_until date;
ALTER TABLE vendor_employees ADD COLUMN IF NOT EXISTS photo_url text;

-- =====================================================
-- EXTEND: evidence (completeness + review linkage)
-- =====================================================

ALTER TABLE evidence ADD COLUMN IF NOT EXISTS criteria_checklist jsonb;    -- [{text, checked}]
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS executive_summary text;      -- discovery deliverable
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS approach text;               -- discovery deliverable
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS locked boolean DEFAULT true;
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS review_outcome text;         -- accepted / revision_requested / disputed

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sow_documents_engagement ON sow_documents(engagement_id);
CREATE INDEX IF NOT EXISTS idx_sow_documents_buyer ON sow_documents(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sow_documents_vendor ON sow_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_escrow_tx_engagement ON escrow_transactions(engagement_id);
CREATE INDEX IF NOT EXISTS idx_invoices_engagement ON invoices(engagement_id);
CREATE INDEX IF NOT EXISTS idx_invoices_buyer ON invoices(buyer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_disputes_engagement ON disputes(engagement_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_milestone_flags_milestone ON milestone_flags(milestone_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_engagement ON change_requests(engagement_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_engagement ON check_ins(engagement_id);
CREATE INDEX IF NOT EXISTS idx_hourly_logs_engagement ON hourly_logs(engagement_id);
CREATE INDEX IF NOT EXISTS idx_terminations_engagement ON terminations(engagement_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_vendor ON interview_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_buyer ON interview_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_partner_invites_inviter ON partner_invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_customer ON payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_vendor ON proposals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_proposals_customer ON proposals(customer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_workflow_state ON proposals(workflow_state);
CREATE INDEX IF NOT EXISTS idx_milestones_engagement ON project_milestones(engagement_id);
CREATE INDEX IF NOT EXISTS idx_messages_engagement ON messages(engagement_id);
CREATE INDEX IF NOT EXISTS idx_reviews_engagement ON reviews(engagement_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE sow_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;

-- helper predicate used inline: admins are profiles.user_type = 'admin'

-- sow_documents: parties + admin
CREATE POLICY "Parties view own SOWs" ON sow_documents FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));
CREATE POLICY "Buyers create SOWs" ON sow_documents FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Parties update own SOWs" ON sow_documents FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR vendor_id = auth.uid());

-- escrow_transactions: parties view; buyer funds; vendor/buyer never update (immutable)
CREATE POLICY "Parties view own escrow tx" ON escrow_transactions FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));
CREATE POLICY "Parties create escrow tx" ON escrow_transactions FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR vendor_id = auth.uid()
              OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));

-- invoices
CREATE POLICY "Parties view own invoices" ON invoices FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));
CREATE POLICY "Parties create invoices" ON invoices FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR vendor_id = auth.uid());

-- disputes: parties + admin; either party opens; parties update positions; admin resolves
CREATE POLICY "Parties and admin view disputes" ON disputes FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));
CREATE POLICY "Parties open disputes" ON disputes FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR vendor_id = auth.uid());
CREATE POLICY "Parties and admin update disputes" ON disputes FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'))
  WITH CHECK (buyer_id = auth.uid() OR vendor_id = auth.uid()
              OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));

-- milestone_flags
CREATE POLICY "Engagement parties view flags" ON milestone_flags FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM engagements e WHERE e.id = milestone_flags.engagement_id
                 AND (e.buyer_id = auth.uid() OR e.vendor_id = auth.uid()))
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));
CREATE POLICY "Engagement parties create flags" ON milestone_flags FOR INSERT TO authenticated
  WITH CHECK (flagged_by = auth.uid());
CREATE POLICY "Engagement parties update flags" ON milestone_flags FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM engagements e WHERE e.id = milestone_flags.engagement_id
                 AND (e.buyer_id = auth.uid() OR e.vendor_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM engagements e WHERE e.id = milestone_flags.engagement_id
                      AND (e.buyer_id = auth.uid() OR e.vendor_id = auth.uid())));

-- change_requests
CREATE POLICY "Engagement parties view change requests" ON change_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM engagements e WHERE e.id = change_requests.engagement_id
                 AND (e.buyer_id = auth.uid() OR e.vendor_id = auth.uid()))
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));
CREATE POLICY "Engagement parties create change requests" ON change_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Engagement parties update change requests" ON change_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM engagements e WHERE e.id = change_requests.engagement_id
                 AND (e.buyer_id = auth.uid() OR e.vendor_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM engagements e WHERE e.id = change_requests.engagement_id
                      AND (e.buyer_id = auth.uid() OR e.vendor_id = auth.uid())));

-- check_ins
CREATE POLICY "Parties view check-ins" ON check_ins FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));
CREATE POLICY "Parties create check-ins" ON check_ins FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR vendor_id = auth.uid());
CREATE POLICY "Parties update check-ins" ON check_ins FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR vendor_id = auth.uid());

-- hourly_logs
CREATE POLICY "Engagement parties view hourly logs" ON hourly_logs FOR SELECT TO authenticated
  USING (vendor_id = auth.uid()
         OR EXISTS (SELECT 1 FROM engagements e WHERE e.id = hourly_logs.engagement_id AND e.buyer_id = auth.uid())
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));
CREATE POLICY "Vendors create hourly logs" ON hourly_logs FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());
CREATE POLICY "Engagement parties update hourly logs" ON hourly_logs FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid()
         OR EXISTS (SELECT 1 FROM engagements e WHERE e.id = hourly_logs.engagement_id AND e.buyer_id = auth.uid()))
  WITH CHECK (vendor_id = auth.uid()
              OR EXISTS (SELECT 1 FROM engagements e WHERE e.id = hourly_logs.engagement_id AND e.buyer_id = auth.uid()));

-- terminations
CREATE POLICY "Engagement parties view terminations" ON terminations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM engagements e WHERE e.id = terminations.engagement_id
                 AND (e.buyer_id = auth.uid() OR e.vendor_id = auth.uid()))
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));
CREATE POLICY "Engagement parties create terminations" ON terminations FOR INSERT TO authenticated
  WITH CHECK (initiated_by = auth.uid());
CREATE POLICY "Engagement parties update terminations" ON terminations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM engagements e WHERE e.id = terminations.engagement_id
                 AND (e.buyer_id = auth.uid() OR e.vendor_id = auth.uid()))
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'))
  WITH CHECK (true);

-- interview_requests
CREATE POLICY "Parties view interview requests" ON interview_requests FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid());
CREATE POLICY "Buyers create interview requests" ON interview_requests FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Parties update interview requests" ON interview_requests FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR vendor_id = auth.uid());

-- partner_invites
CREATE POLICY "Inviter views own invites" ON partner_invites FOR SELECT TO authenticated
  USING (inviter_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'));
CREATE POLICY "Users create own invites" ON partner_invites FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid());
CREATE POLICY "Inviter updates own invites" ON partner_invites FOR UPDATE TO authenticated
  USING (inviter_id = auth.uid())
  WITH CHECK (inviter_id = auth.uid());

-- payment_methods
CREATE POLICY "Customers manage own payment methods" ON payment_methods FOR ALL TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- customer_team_members
CREATE POLICY "Customers manage own team" ON customer_team_members FOR ALL TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- notification_prefs
CREATE POLICY "Users manage own notification prefs" ON notification_prefs FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- RLS additions for tables that gained party columns
-- =====================================================

-- proposals now used by vendors: allow vendor + customer access
DROP POLICY IF EXISTS "Vendors manage own proposals" ON proposals;
CREATE POLICY "Vendors manage own proposals" ON proposals FOR ALL TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());
DROP POLICY IF EXISTS "Customers view and triage own proposals" ON proposals;
CREATE POLICY "Customers view and triage own proposals" ON proposals FOR SELECT TO authenticated
  USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Customers update triage state" ON proposals;
CREATE POLICY "Customers update triage state" ON proposals FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());
