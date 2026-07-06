/*
  # Capture business_type and company-basics at vendor signup

  ## Problem
  VendorSignup.tsx already collects business_type, country, website, description,
  service categories, and tech stack — but handle_new_user() (the SECURITY DEFINER
  trigger that creates the vendors row from auth metadata, since RLS blocks a
  client-side insert before email confirmation) only ever read company_name.
  Everything else was silently dropped, and business_type in particular is what
  every downstream vendor-type-specific branch (contract template, IR35 flag,
  packages-tab visibility) keys off.

  ## Changes
  1. Extend handle_new_user() to also read business_type/country/website_url/
     description/service_categories/tech_stack from auth metadata and persist
     them on the vendors row it creates.
  2. Constrain vendors.business_type to the three real values once set (NULL
     remains allowed for any vendor row that predates this migration).
*/

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
  business_type_value text;
  country_value text;
  website_url_value text;
  description_value text;
  service_categories_value jsonb;
  tech_stack_value jsonb;
BEGIN
  user_metadata           := NEW.raw_user_meta_data;
  user_type_value         := user_metadata->>'user_type';
  full_name_value         := user_metadata->>'full_name';
  company_name_value      := user_metadata->>'company_name';
  business_type_value     := NULLIF(user_metadata->>'business_type', '');
  country_value           := NULLIF(user_metadata->>'country', '');
  website_url_value       := NULLIF(user_metadata->>'website_url', '');
  description_value       := NULLIF(user_metadata->>'description', '');
  service_categories_value:= user_metadata->'service_categories';
  tech_stack_value        := user_metadata->'tech_stack';

  IF user_type_value IS NULL OR full_name_value IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create profile (idempotent)
  INSERT INTO public.profiles (id, email, full_name, user_type, profile_completed, onboarding_step, verified)
  VALUES (NEW.id, NEW.email, full_name_value, user_type_value::user_type, false, 0, false)
  ON CONFLICT (id) DO NOTHING;

  -- Create role-specific record (idempotent)
  IF user_type_value = 'customer' THEN
    INSERT INTO public.customers (id, company_name)
    VALUES (NEW.id, COALESCE(NULLIF(company_name_value, ''), 'Pending'))
    ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name;

  ELSIF user_type_value = 'contractor' THEN
    INSERT INTO public.contractors (id, title)
    VALUES (NEW.id, 'Freelancer')
    ON CONFLICT (id) DO NOTHING;

  ELSIF user_type_value = 'vendor' THEN
    INSERT INTO public.vendors (
      id, company_name, contact_name, contact_email, contact_phone,
      business_type, country, website_url, description, service_categories, tech_stack
    )
    VALUES (
      NEW.id, COALESCE(NULLIF(company_name_value, ''), 'Pending'), full_name_value, NEW.email, '',
      business_type_value, country_value, website_url_value, description_value,
      service_categories_value, tech_stack_value
    )
    ON CONFLICT (id) DO UPDATE SET
      company_name        = EXCLUDED.company_name,
      contact_name         = EXCLUDED.contact_name,
      contact_email        = EXCLUDED.contact_email,
      business_type        = COALESCE(EXCLUDED.business_type, public.vendors.business_type),
      country              = COALESCE(EXCLUDED.country, public.vendors.country),
      website_url          = COALESCE(EXCLUDED.website_url, public.vendors.website_url),
      description          = COALESCE(EXCLUDED.description, public.vendors.description),
      service_categories    = COALESCE(EXCLUDED.service_categories, public.vendors.service_categories),
      tech_stack           = COALESCE(EXCLUDED.tech_stack, public.vendors.tech_stack);
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vendors_business_type_check'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_business_type_check
      CHECK (business_type IS NULL OR business_type IN ('msp', 'agency', 'staffaug'));
  END IF;
END $$;
