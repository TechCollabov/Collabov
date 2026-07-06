-- Customer signup currently collects legal entity name, trading name, industry
-- and headcount band but handle_new_user() only ever persisted company_name,
-- silently dropping the rest. Country was already generic in the trigger but
-- CustomerSignup.tsx never sent it as signup metadata either. Extend the
-- trigger to accept and persist all of these onto the customers row it creates.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  legal_entity_name_value text;
  trading_name_value text;
  industry_value text;
  headcount_band_value text;
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
  legal_entity_name_value := NULLIF(user_metadata->>'legal_entity_name', '');
  trading_name_value      := NULLIF(user_metadata->>'trading_name', '');
  industry_value          := NULLIF(user_metadata->>'industry', '');
  headcount_band_value    := NULLIF(user_metadata->>'headcount_band', '');

  IF user_type_value IS NULL OR full_name_value IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, user_type, profile_completed, onboarding_step, verified)
  VALUES (NEW.id, NEW.email, full_name_value, user_type_value::user_type, false, 0, false)
  ON CONFLICT (id) DO NOTHING;

  IF user_type_value = 'customer' THEN
    INSERT INTO public.customers (id, company_name, legal_entity_name, trading_name, industry, headcount_band, country)
    VALUES (NEW.id, COALESCE(NULLIF(company_name_value, ''), 'Pending'), legal_entity_name_value, trading_name_value, industry_value, headcount_band_value, country_value)
    ON CONFLICT (id) DO UPDATE SET
      company_name       = EXCLUDED.company_name,
      legal_entity_name  = COALESCE(EXCLUDED.legal_entity_name, public.customers.legal_entity_name),
      trading_name       = COALESCE(EXCLUDED.trading_name, public.customers.trading_name),
      industry           = COALESCE(EXCLUDED.industry, public.customers.industry),
      headcount_band     = COALESCE(EXCLUDED.headcount_band, public.customers.headcount_band),
      country            = COALESCE(EXCLUDED.country, public.customers.country);

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
$function$;
