-- Update handle_new_user trigger to read company_name from auth metadata
-- This allows the trigger (running as SECURITY DEFINER / service role) to
-- create accurate profile and role records without relying on client-side inserts,
-- which are blocked by RLS when email confirmation is enabled.

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
  IF user_type_value = 'customer' THEN
    INSERT INTO public.customers (id, company_name)
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
