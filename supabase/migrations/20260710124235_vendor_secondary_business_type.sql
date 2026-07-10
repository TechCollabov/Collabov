-- Vendors can now select up to two business types at signup. Adds the
-- second slot and updates the signup trigger to persist both, plus the
-- contact phone number now collected at signup.

ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS business_type_secondary text;

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

  INSERT INTO public.profiles (id, email, full_name, user_type, profile_completed, onboarding_step, verified)
  VALUES (NEW.id, NEW.email, full_name_value, user_type_value::user_type, false, 0, false)
  ON CONFLICT (id) DO NOTHING;

  IF user_type_value = 'buyer' THEN
    INSERT INTO public.buyers (id, company_name)
    VALUES (NEW.id, COALESCE(NULLIF(company_name_value, ''), 'Pending'))
    ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name;

  ELSIF user_type_value = 'contractor' THEN
    INSERT INTO public.contractors (id, title)
    VALUES (NEW.id, 'Freelancer')
    ON CONFLICT (id) DO NOTHING;

  ELSIF user_type_value = 'vendor' THEN
    INSERT INTO public.vendors (id, company_name, contact_name, contact_email, contact_phone, business_type, business_type_secondary)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(company_name_value, ''), 'Pending'),
      full_name_value,
      NEW.email,
      NULLIF(user_metadata->>'contact_phone', ''),
      NULLIF(user_metadata->>'business_type', ''),
      NULLIF(user_metadata->>'business_type_secondary', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      contact_name = EXCLUDED.contact_name,
      contact_email = EXCLUDED.contact_email,
      contact_phone = COALESCE(EXCLUDED.contact_phone, public.vendors.contact_phone),
      business_type = COALESCE(EXCLUDED.business_type, public.vendors.business_type),
      business_type_secondary = COALESCE(EXCLUDED.business_type_secondary, public.vendors.business_type_secondary);
  END IF;

  RETURN NEW;
END;
$$;
