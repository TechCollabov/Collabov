/*
  # Vendor re-registration block

  A rejected vendor should not be able to quietly re-apply under a new
  email with the same company. `check_email_exists` already blocks exact
  email dupes at the auth level; this adds a pre-auth-safe, case-insensitive
  company-name check against previously rejected applications so the
  signup form can warn/block before an account is even created.
*/

CREATE OR REPLACE FUNCTION public.check_vendor_rejected(p_company_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vendors
    WHERE lower(company_name) = lower(trim(p_company_name))
      AND rejected_at IS NOT NULL
  );
$$;
