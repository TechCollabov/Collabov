/*
  # LLM Event Schema & Phase 2 Governance Field Migrations

  ## Overview
  This migration adds:
  1. platform_event       – immutable audit/event log for LLM context
  2. pending_engagement   – scheduled buyer/vendor meetings
  3. weekly_status_log    – vendor weekly progress updates
  4. evidence             – milestone delivery evidence
  5. case_studies         – vendor case study showcase
  6. engagements          – formal engagement records
  7. vendor_referrals     – vendor reference contacts

  ## Alterations to existing tables
  - project_milestones: adds acceptance_criteria, jira_epic_id, github_repo
  - contracts:          adds defect liability, termination, offboarding fields
  - vendors:            adds ~30 profile/marketplace/rate/compliance fields
*/

-- =====================================================
-- NEW TABLES
-- =====================================================

CREATE TABLE platform_event (
  event_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT NOT NULL,
  -- enum values: search, proposal_submitted, proposal_accepted, sow_generated,
  -- contract_signed, milestone_funded, evidence_submitted, milestone_accepted,
  -- milestone_flagged, dispute_opened, dispute_resolved, review_submitted,
  -- engagement_closed, profile_view
  actor_id     UUID NOT NULL,
  actor_role   TEXT NOT NULL, -- buyer / vendor / admin / anonymous
  entity_type  TEXT NOT NULL,
  entity_id    UUID NOT NULL,
  payload      JSONB,
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  outcome      TEXT -- NULL at creation, filled on resolution
);

CREATE TABLE pending_engagement (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         UUID NOT NULL,
  vendor_id        UUID NOT NULL,
  meeting_datetime TIMESTAMPTZ NOT NULL,
  search_query     TEXT,
  status           TEXT DEFAULT 'scheduled',
  proposal_id      UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE weekly_status_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id  UUID NOT NULL,
  vendor_id      UUID NOT NULL,
  week_of        DATE NOT NULL,
  status_text    TEXT NOT NULL CHECK (length(status_text) <= 200),
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- project_milestones: governance fields
-- =====================================================

ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS acceptance_criteria JSONB;
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS jira_epic_id TEXT;
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS github_repo TEXT;

-- =====================================================
-- evidence table (create if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID,
  vendor_id UUID,
  engagement_id UUID,
  delivery_description TEXT,
  demo_url TEXT,
  files JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'submitted'
);

-- =====================================================
-- case_studies table (create if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  project_title TEXT NOT NULL,
  industry TEXT,
  services_delivered JSONB,
  tech_stack JSONB,
  duration TEXT,
  team_size INT,
  challenge TEXT,
  solution TEXT,
  outcomes JSONB,
  client_quote TEXT,
  ai_keyword_tags JSONB,
  ai_generated_hash TEXT,
  user_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- engagements table (create if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  project_title TEXT,
  status TEXT DEFAULT 'active',
  engagement_type TEXT DEFAULT 'project',
  parent_engagement_id UUID,
  working_location TEXT,
  service_live_date DATE,
  replacement_sla_days INT DEFAULT 10,
  replacement_opened_at TIMESTAMPTZ,
  minimum_contract_months INT DEFAULT 12,
  minimum_engagement_months INT DEFAULT 3,
  equipment_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- contracts: defect liability, termination & offboarding
-- =====================================================

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS defect_liability_days INT DEFAULT 30;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS defect_liability_end_date DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS termination_status TEXT DEFAULT 'active';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS termination_date DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS notice_period_days INT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS credential_log JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS offboarding_checklist JSONB;

-- =====================================================
-- vendors: marketplace, compliance & rate fields
-- =====================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS profile_view_count INT DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ai_keyword_tags JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ir35_compliant BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gdpr_ready BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS minimum_project_value INT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS referral_count INT DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS monthly_rate_min INT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS monthly_rate_max INT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS hourly_rate_min INT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS hourly_rate_max INT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tech_stack JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS service_categories JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS engagement_models JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS availability_from DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS response_time_hours INT DEFAULT 4;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS languages JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS operating_locations JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS industry_focus JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS founded_year INT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS team_size_band TEXT;

-- =====================================================
-- vendor_referrals table (create if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS vendor_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  contact_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  work_email TEXT NOT NULL,
  project_vouched_for TEXT NOT NULL,
  project_duration TEXT,
  project_value_band TEXT,
  relationship_type TEXT,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  would_recommend BOOLEAN,
  specific_outcome TEXT,
  written_statement TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE platform_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_referrals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - platform_event
-- =====================================================

CREATE POLICY "Authenticated users can view platform events"
  ON platform_event FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert own platform events"
  ON platform_event FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- =====================================================
-- RLS POLICIES - pending_engagement
-- =====================================================

CREATE POLICY "Parties can view own pending engagements"
  ON pending_engagement FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid());

CREATE POLICY "Buyers can create pending engagements"
  ON pending_engagement FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Parties can update own pending engagements"
  ON pending_engagement FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR vendor_id = auth.uid());

CREATE POLICY "Parties can delete own pending engagements"
  ON pending_engagement FOR DELETE
  TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid());

-- =====================================================
-- RLS POLICIES - weekly_status_log
-- =====================================================

CREATE POLICY "Authenticated users can view weekly status logs"
  ON weekly_status_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can insert own weekly status logs"
  ON weekly_status_log FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update own weekly status logs"
  ON weekly_status_log FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete own weekly status logs"
  ON weekly_status_log FOR DELETE
  TO authenticated
  USING (vendor_id = auth.uid());

-- =====================================================
-- RLS POLICIES - evidence
-- =====================================================

CREATE POLICY "Authenticated users can view evidence"
  ON evidence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can insert own evidence"
  ON evidence FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update own evidence"
  ON evidence FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete own evidence"
  ON evidence FOR DELETE
  TO authenticated
  USING (vendor_id = auth.uid());

-- =====================================================
-- RLS POLICIES - case_studies
-- =====================================================

CREATE POLICY "Anyone can view case studies"
  ON case_studies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can insert own case studies"
  ON case_studies FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update own case studies"
  ON case_studies FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete own case studies"
  ON case_studies FOR DELETE
  TO authenticated
  USING (vendor_id = auth.uid());

-- =====================================================
-- RLS POLICIES - engagements
-- =====================================================

CREATE POLICY "Parties can view own engagements"
  ON engagements FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid());

CREATE POLICY "Buyers can create engagements"
  ON engagements FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Parties can update own engagements"
  ON engagements FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR vendor_id = auth.uid());

-- =====================================================
-- RLS POLICIES - vendor_referrals
-- =====================================================

CREATE POLICY "Anyone can view vendor referrals"
  ON vendor_referrals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can insert own referrals"
  ON vendor_referrals FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update own referrals"
  ON vendor_referrals FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete own referrals"
  ON vendor_referrals FOR DELETE
  TO authenticated
  USING (vendor_id = auth.uid());
