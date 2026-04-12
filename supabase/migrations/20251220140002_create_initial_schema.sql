/*
  # Initial Database Schema for Contractor/Vendor Marketplace Platform

  ## Overview
  This migration creates the complete database structure for a multi-sided marketplace
  connecting customers, contractors (freelancers), and vendors (companies) for outsourcing services.

  ## User Types & Roles
  1. **Customers**: Businesses posting jobs and hiring contractors/vendors
  2. **Contractors**: Independent freelancers bidding on projects
  3. **Vendors**: Service companies offering outsourcing solutions
  4. **Admins**: Platform administrators

  ## New Tables

  ### Authentication & Profiles
  - `profiles` - Base user profiles linked to Supabase auth.users
  - `customers` - Customer-specific profile data
  - `contractors` - Contractor/freelancer profile data
  - `vendors` - Vendor/company profile data

  ### Jobs & Projects
  - `jobs` - Job postings created by customers
  - `job_skills` - Skills required for jobs (many-to-many)
  - `job_attachments` - File attachments for job postings
  - `proposals` - Contractor bids/proposals for jobs
  - `projects` - Active projects with progress tracking
  - `project_milestones` - Project milestone tracking

  ### Contracts & Services
  - `contracts` - Legal contracts between parties
  - `contract_services` - Services included in contracts
  - `contract_deliverables` - Contract deliverables tracking

  ### Communication
  - `messages` - Direct messages between users
  - `message_attachments` - File attachments in messages
  - `notifications` - User notifications

  ### Reviews & Ratings
  - `reviews` - Customer reviews for contractors/vendors

  ### Skills & Taxonomy
  - `skills` - Master list of skills/technologies
  - `industries` - Industry categories
  - `service_categories` - Service classification

  ### Contractor Features
  - `portfolio_items` - Contractor portfolio showcase
  - `certifications` - Contractor certifications

  ### Vendor Features
  - `vendor_documents` - Vendor legal documents (PAN, GST, etc.)
  - `vendor_employees` - Vendor employee/resource management
  - `vendor_packages` - Vendor service packages

  ### User Interactions
  - `saved_vendors` - Customers' saved vendor list
  - `enquiries` - Customer enquiries to vendors

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies restrict access based on user role and ownership
  - Multi-tenant architecture with proper data isolation

  ## Key Features Supported
  - AI proposal generation with scoring
  - Vendor comparison and matching
  - Multi-step profile onboarding
  - Document management
  - Real-time messaging
  - Contract generation
  - Payment tracking
  - Review system
*/

-- Enable UUID extension


-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_type AS ENUM ('customer', 'contractor', 'vendor', 'admin');
CREATE TYPE experience_level AS ENUM ('entry', 'intermediate', 'expert');
CREATE TYPE budget_type AS ENUM ('fixed', 'hourly');
CREATE TYPE project_type AS ENUM ('one-time', 'ongoing', 'contract-to-hire');
CREATE TYPE availability_type AS ENUM ('full-time', 'part-time', 'project-based', 'weekends');
CREATE TYPE proposal_status AS ENUM ('submitted', 'interviewing', 'accepted', 'rejected');
CREATE TYPE project_status AS ENUM ('in-progress', 'review', 'completed', 'on-hold', 'cancelled');
CREATE TYPE contract_status AS ENUM ('active', 'pending', 'completed', 'cancelled');
CREATE TYPE job_status AS ENUM ('open', 'in-progress', 'closed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('new_proposal', 'message', 'milestone', 'payment', 'review', 'contract', 'enquiry', 'system');
CREATE TYPE document_type AS ENUM ('incorporation', 'pan', 'gst', 'msme', 'aoa', 'moa', 'director_details');

-- =====================================================
-- CORE USER TABLES
-- =====================================================

-- Base profiles table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  profile_picture_url text,
  profile_completed boolean DEFAULT false,
  onboarding_step integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customer profiles
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_website text,
  phone text,
  address text,
  city text,
  state text,
  country text DEFAULT 'India',
  timezone text,
  total_spent numeric DEFAULT 0,
  active_projects_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contractor/Freelancer profiles
CREATE TABLE IF NOT EXISTS contractors (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  bio text,
  location text,
  timezone text,
  hourly_rate numeric,
  experience_level experience_level DEFAULT 'intermediate',
  availability availability_type DEFAULT 'full-time',
  languages text[] DEFAULT ARRAY['English'],
  completed_projects integer DEFAULT 0,
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  response_rate numeric(3,2) DEFAULT 0,
  profile_views integer DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  available_earnings numeric DEFAULT 0,
  escrow_earnings numeric DEFAULT 0,
  is_available boolean DEFAULT true,
  google_oauth_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vendor/Company profiles
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  tagline text,
  description text,
  website_url text,
  logo_url text,
  address text,
  city text,
  state text,
  country text DEFAULT 'India',
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  company_size text,
  year_founded integer,
  employee_count integer DEFAULT 0,
  projects_completed integer DEFAULT 0,
  years_in_business integer DEFAULT 0,
  hourly_rate numeric,
  monthly_rate numeric,
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  response_time text DEFAULT '24 hours',
  total_revenue numeric DEFAULT 0,
  active_contracts_count integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  bank_name text,
  account_number text,
  ifsc_code text,
  bank_address text,
  registered_email text,
  registered_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SKILLS & TAXONOMY
-- =====================================================

CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  parent_id uuid REFERENCES service_categories(id),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- CONTRACTOR FEATURES
-- =====================================================

-- Contractor skills (many-to-many)
CREATE TABLE IF NOT EXISTS contractor_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contractor_id, skill_id)
);

-- Portfolio items
CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  project_url text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuing_organization text,
  issue_date date,
  expiry_date date,
  credential_id text,
  credential_url text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- VENDOR FEATURES
-- =====================================================

-- Vendor industries (many-to-many)
CREATE TABLE IF NOT EXISTS vendor_industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  industry_id uuid NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, industry_id)
);

-- Vendor services
CREATE TABLE IF NOT EXISTS vendor_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  service_category_id uuid REFERENCES service_categories(id),
  name text NOT NULL,
  description text,
  keywords text[],
  pricing_model text,
  base_price numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vendor documents
CREATE TABLE IF NOT EXISTS vendor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  document_url text NOT NULL,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES profiles(id),
  uploaded_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, document_type)
);

-- Vendor employees/resources
CREATE TABLE IF NOT EXISTS vendor_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  email text,
  phone text,
  skills text[],
  hourly_rate numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vendor packages/subscriptions
CREATE TABLE IF NOT EXISTS vendor_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  billing_period text DEFAULT 'monthly',
  features jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- JOBS & PROPOSALS
-- =====================================================

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text,
  budget_type budget_type NOT NULL,
  budget_amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  timeline text,
  experience_level experience_level DEFAULT 'intermediate',
  project_type project_type NOT NULL,
  location text,
  status job_status DEFAULT 'open',
  proposals_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  posted_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job skills (many-to-many)
CREATE TABLE IF NOT EXISTS job_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, skill_id)
);

-- Job attachments
CREATE TABLE IF NOT EXISTS job_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  file_type text,
  uploaded_at timestamptz DEFAULT now()
);

-- Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  proposal_content text NOT NULL,
  cover_letter text,
  proposed_budget numeric NOT NULL,
  proposed_timeline text NOT NULL,
  proposal_score integer CHECK (proposal_score >= 0 AND proposal_score <= 100),
  status proposal_status DEFAULT 'submitted',
  ai_generated boolean DEFAULT false,
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, contractor_id)
);

-- =====================================================
-- PROJECTS & CONTRACTS
-- =====================================================

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES contractors(id) ON DELETE SET NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  budget numeric NOT NULL,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status project_status DEFAULT 'in-progress',
  start_date date NOT NULL,
  deadline date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (
    (contractor_id IS NOT NULL AND vendor_id IS NULL) OR
    (contractor_id IS NULL AND vendor_id IS NOT NULL)
  )
);

-- Project milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  amount numeric,
  due_date date,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text UNIQUE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES contractors(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  total_value numeric NOT NULL,
  payment_terms text,
  status contract_status DEFAULT 'pending',
  terms_and_conditions text,
  signed_by_customer boolean DEFAULT false,
  signed_by_vendor boolean DEFAULT false,
  customer_signature_date timestamptz,
  vendor_signature_date timestamptz,
  document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (
    (contractor_id IS NOT NULL AND vendor_id IS NULL) OR
    (contractor_id IS NULL AND vendor_id IS NOT NULL)
  )
);

-- Contract services
CREATE TABLE IF NOT EXISTS contract_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  description text,
  price numeric NOT NULL,
  quantity integer DEFAULT 1,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Contract deliverables
CREATE TABLE IF NOT EXISTS contract_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- COMMUNICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  parent_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  file_type text,
  uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link_url text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  related_job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  related_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  related_proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- REVIEWS & RATINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES contractors(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  would_recommend boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (
    (contractor_id IS NOT NULL AND vendor_id IS NULL) OR
    (contractor_id IS NULL AND vendor_id IS NOT NULL)
  )
);

-- =====================================================
-- USER INTERACTIONS
-- =====================================================

-- Saved vendors (customer wishlist)
CREATE TABLE IF NOT EXISTS saved_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES contractors(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (contractor_id IS NOT NULL AND vendor_id IS NULL) OR
    (contractor_id IS NULL AND vendor_id IS NOT NULL)
  ),
  UNIQUE(customer_id, vendor_id, contractor_id)
);

-- Enquiries (customer to vendor)
CREATE TABLE IF NOT EXISTS enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  status text DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_job_id ON proposals(job_id);
CREATE INDEX IF NOT EXISTS idx_proposals_contractor_id ON proposals(contractor_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_reviews_contractor_id ON reviews(contractor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_contractor_id ON portfolio_items(contractor_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PROFILES
-- =====================================================

-- Profiles: Users can read all profiles (for matching/search)
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Profiles: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- RLS POLICIES - CUSTOMERS
-- =====================================================

CREATE POLICY "Anyone can view customer profiles"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can update own profile"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers can insert own profile"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- RLS POLICIES - CONTRACTORS
-- =====================================================

CREATE POLICY "Anyone can view contractor profiles"
  ON contractors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Contractors can update own profile"
  ON contractors FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Contractors can insert own profile"
  ON contractors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- RLS POLICIES - VENDORS
-- =====================================================

CREATE POLICY "Anyone can view vendor profiles"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can update own profile"
  ON vendors FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Vendors can insert own profile"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- RLS POLICIES - SKILLS & TAXONOMY (Public Read)
-- =====================================================

CREATE POLICY "Anyone can view skills"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view industries"
  ON industries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view service categories"
  ON service_categories FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- RLS POLICIES - CONTRACTOR FEATURES
-- =====================================================

CREATE POLICY "Anyone can view contractor skills"
  ON contractor_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Contractors can manage own skills"
  ON contractor_skills FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contractors
      WHERE contractors.id = contractor_skills.contractor_id
      AND contractors.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contractors
      WHERE contractors.id = contractor_skills.contractor_id
      AND contractors.id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view portfolio items"
  ON portfolio_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Contractors can manage own portfolio"
  ON portfolio_items FOR ALL
  TO authenticated
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Anyone can view certifications"
  ON certifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Contractors can manage own certifications"
  ON certifications FOR ALL
  TO authenticated
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

-- =====================================================
-- RLS POLICIES - VENDOR FEATURES
-- =====================================================

CREATE POLICY "Anyone can view vendor industries"
  ON vendor_industries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can manage own industries"
  ON vendor_industries FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Anyone can view vendor services"
  ON vendor_services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can manage own services"
  ON vendor_services FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can view own documents"
  ON vendor_documents FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can manage own documents"
  ON vendor_documents FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can manage own employees"
  ON vendor_employees FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Anyone can view vendor packages"
  ON vendor_packages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can manage own packages"
  ON vendor_packages FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- =====================================================
-- RLS POLICIES - JOBS
-- =====================================================

CREATE POLICY "Anyone can view open jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (status = 'open' OR customer_id = auth.uid());

CREATE POLICY "Customers can manage own jobs"
  ON jobs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = jobs.customer_id
      AND customers.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = jobs.customer_id
      AND customers.id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view job skills"
  ON job_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can manage job skills"
  ON job_skills FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN customers ON customers.id = jobs.customer_id
      WHERE jobs.id = job_skills.job_id
      AND customers.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN customers ON customers.id = jobs.customer_id
      WHERE jobs.id = job_skills.job_id
      AND customers.id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view job attachments"
  ON job_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can manage job attachments"
  ON job_attachments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN customers ON customers.id = jobs.customer_id
      WHERE jobs.id = job_attachments.job_id
      AND customers.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN customers ON customers.id = jobs.customer_id
      WHERE jobs.id = job_attachments.job_id
      AND customers.id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - PROPOSALS
-- =====================================================

CREATE POLICY "Customers and contractors can view relevant proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    contractor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = proposals.job_id
      AND jobs.customer_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can create proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Contractors can update own proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Contractors can delete own proposals"
  ON proposals FOR DELETE
  TO authenticated
  USING (contractor_id = auth.uid());

-- =====================================================
-- RLS POLICIES - PROJECTS
-- =====================================================

CREATE POLICY "Project parties can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    contractor_id = auth.uid() OR
    vendor_id = auth.uid()
  );

CREATE POLICY "Customers can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Project parties can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    contractor_id = auth.uid() OR
    vendor_id = auth.uid()
  )
  WITH CHECK (
    customer_id = auth.uid() OR
    contractor_id = auth.uid() OR
    vendor_id = auth.uid()
  );

CREATE POLICY "Project parties can view milestones"
  ON project_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND (
        projects.customer_id = auth.uid() OR
        projects.contractor_id = auth.uid() OR
        projects.vendor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Customers can manage project milestones"
  ON project_milestones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND projects.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND projects.customer_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - CONTRACTS
-- =====================================================

CREATE POLICY "Contract parties can view contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    contractor_id = auth.uid() OR
    vendor_id = auth.uid()
  );

CREATE POLICY "Customers and vendors can create contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid() OR
    vendor_id = auth.uid()
  );

CREATE POLICY "Contract parties can update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    contractor_id = auth.uid() OR
    vendor_id = auth.uid()
  )
  WITH CHECK (
    customer_id = auth.uid() OR
    contractor_id = auth.uid() OR
    vendor_id = auth.uid()
  );

CREATE POLICY "Contract parties can view services"
  ON contract_services FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_services.contract_id
      AND (
        contracts.customer_id = auth.uid() OR
        contracts.contractor_id = auth.uid() OR
        contracts.vendor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Vendors can manage contract services"
  ON contract_services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_services.contract_id
      AND contracts.vendor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_services.contract_id
      AND contracts.vendor_id = auth.uid()
    )
  );

CREATE POLICY "Contract parties can view deliverables"
  ON contract_deliverables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_deliverables.contract_id
      AND (
        contracts.customer_id = auth.uid() OR
        contracts.contractor_id = auth.uid() OR
        contracts.vendor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Contract parties can manage deliverables"
  ON contract_deliverables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_deliverables.contract_id
      AND (
        contracts.customer_id = auth.uid() OR
        contracts.vendor_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_deliverables.contract_id
      AND (
        contracts.customer_id = auth.uid() OR
        contracts.vendor_id = auth.uid()
      )
    )
  );

-- =====================================================
-- RLS POLICIES - MESSAGES
-- =====================================================

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own sent messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view attachments in own messages"
  ON message_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_attachments.message_id
      AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Users can add attachments to own messages"
  ON message_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_attachments.message_id
      AND messages.sender_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - NOTIFICATIONS
-- =====================================================

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES - REVIEWS
-- =====================================================

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());

-- =====================================================
-- RLS POLICIES - SAVED VENDORS
-- =====================================================

CREATE POLICY "Customers can view own saved vendors"
  ON saved_vendors FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can manage own saved vendors"
  ON saved_vendors FOR ALL
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- =====================================================
-- RLS POLICIES - ENQUIRIES
-- =====================================================

CREATE POLICY "Customers and vendors can view relevant enquiries"
  ON enquiries FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    vendor_id = auth.uid()
  );

CREATE POLICY "Customers can create enquiries"
  ON enquiries FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Vendors can update enquiry status"
  ON enquiries FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());
