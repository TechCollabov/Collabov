-- Rename "customer" terminology to "buyer" across the schema.
-- Covers: user_type enum value, customers/customer_team_members tables,
-- customer_id FK columns, customer-prefixed columns, RLS policy names,
-- and the handle_new_user() signup trigger.

-- 1. Enum value (existing rows keep their value; just the label changes)
ALTER TYPE user_type RENAME VALUE 'customer' TO 'buyer';

-- 2. Tables
ALTER TABLE public.customers RENAME TO buyers;
ALTER TABLE public.customer_team_members RENAME TO buyer_team_members;

-- 3. FK columns (customer_id -> buyer_id)
ALTER TABLE public.contracts RENAME COLUMN customer_id TO buyer_id;
ALTER TABLE public.buyer_team_members RENAME COLUMN customer_id TO buyer_id;
ALTER TABLE public.enquiries RENAME COLUMN customer_id TO buyer_id;
ALTER TABLE public.jobs RENAME COLUMN customer_id TO buyer_id;
ALTER TABLE public.payment_methods RENAME COLUMN customer_id TO buyer_id;
ALTER TABLE public.projects RENAME COLUMN customer_id TO buyer_id;
ALTER TABLE public.proposals RENAME COLUMN customer_id TO buyer_id;
ALTER TABLE public.reviews RENAME COLUMN customer_id TO buyer_id;
ALTER TABLE public.saved_vendors RENAME COLUMN customer_id TO buyer_id;

-- 4. Other customer-prefixed columns
ALTER TABLE public.contracts RENAME COLUMN customer_signature_date TO buyer_signature_date;
ALTER TABLE public.contracts RENAME COLUMN signed_by_customer TO signed_by_buyer;
ALTER TABLE public.enquiries RENAME COLUMN customer_phone TO buyer_phone;
ALTER TABLE public.enquiries RENAME COLUMN customer_email TO buyer_email;

-- 5. Rename RLS policies for clarity (functionality unaffected by column/table renames above)
ALTER POLICY "Anyone can view customer profiles" ON public.buyers RENAME TO "Anyone can view buyer profiles";
ALTER POLICY "Customers can insert own profile" ON public.buyers RENAME TO "Buyers can insert own profile";
ALTER POLICY "Customers can update own profile" ON public.buyers RENAME TO "Buyers can update own profile";
ALTER POLICY "Customers can manage job skills" ON public.job_skills RENAME TO "Buyers can manage job skills";
ALTER POLICY "Customers can manage job attachments" ON public.job_attachments RENAME TO "Buyers can manage job attachments";
ALTER POLICY "Customers and contractors can view relevant proposals" ON public.proposals RENAME TO "Buyers and contractors can view relevant proposals";
ALTER POLICY "Customers can create projects" ON public.projects RENAME TO "Buyers can create projects";
ALTER POLICY "Customers can manage own saved vendors" ON public.saved_vendors RENAME TO "Buyers can manage own saved vendors";
ALTER POLICY "Customers can view own saved vendors" ON public.saved_vendors RENAME TO "Buyers can view own saved vendors";
ALTER POLICY "Customers and vendors can create contracts" ON public.contracts RENAME TO "Buyers and vendors can create contracts";
ALTER POLICY "Customers can create reviews" ON public.reviews RENAME TO "Buyers can create reviews";
ALTER POLICY "Customers can update own reviews" ON public.reviews RENAME TO "Buyers can update own reviews";
ALTER POLICY "Customers can delete own reviews" ON public.reviews RENAME TO "Buyers can delete own reviews";
ALTER POLICY "Customers and vendors can view relevant enquiries" ON public.enquiries RENAME TO "Buyers and vendors can view relevant enquiries";
ALTER POLICY "Customers can create enquiries" ON public.enquiries RENAME TO "Buyers can create enquiries";
ALTER POLICY "Customers manage own payment methods" ON public.payment_methods RENAME TO "Buyers manage own payment methods";
ALTER POLICY "Customers manage own team" ON public.buyer_team_members RENAME TO "Buyers manage own team";
ALTER POLICY "Customers view and triage own proposals" ON public.proposals RENAME TO "Buyers view and triage own proposals";
ALTER POLICY "Customers update triage state" ON public.proposals RENAME TO "Buyers update triage state";
ALTER POLICY "Customers can manage own jobs" ON public.jobs RENAME TO "Buyers can manage own jobs";

-- 6. Signup trigger: read 'buyer' from metadata and insert into public.buyers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_metadata jsonb;
  user_type_value text;
  full_name_value text;
  company_name_value text;
BEGIN
  user_metadata      := NEW.raw_user_meta_data;
  user_type_value    := user_metadata->>'user_type';
  full_name_value    := user_metadata->>'full_name';
  company_name_value := user_metadata->>'company_name';

  IF user_type_value IS NULL OR full_name_value IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create profile (idempotent)
  INSERT INTO public.profiles (id, email, full_name, user_type, profile_completed, onboarding_step, verified)
  VALUES (NEW.id, NEW.email, full_name_value, user_type_value::user_type, false, 0, false)
  ON CONFLICT (id) DO NOTHING;

  -- Create role-specific record (idempotent)
  IF user_type_value = 'buyer' THEN
    INSERT INTO public.buyers (id, company_name)
    VALUES (NEW.id, COALESCE(NULLIF(company_name_value, ''), 'Pending'))
    ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name;

  ELSIF user_type_value = 'contractor' THEN
    INSERT INTO public.contractors (id, title)
    VALUES (NEW.id, 'Freelancer')
    ON CONFLICT (id) DO NOTHING;

  ELSIF user_type_value = 'vendor' THEN
    INSERT INTO public.vendors (id, company_name, contact_name, contact_email, contact_phone)
    VALUES (NEW.id, COALESCE(NULLIF(company_name_value, ''), 'Pending'), full_name_value, NEW.email, '')
    ON CONFLICT (id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      contact_name = EXCLUDED.contact_name,
      contact_email = EXCLUDED.contact_email;
  END IF;

  RETURN NEW;
END;
$$;
