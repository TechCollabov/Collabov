/*
  # Add Auth User Creation Trigger

  ## Overview
  Creates a database trigger that automatically creates profile records when a user
  verifies their email. This handles the case where email verification is enabled
  in Supabase Auth settings.

  ## Changes
  1. Creates a function to handle new user creation
  2. Sets up a trigger on auth.users table
  3. Automatically creates profile and role-specific records based on user metadata

  ## Purpose
  - Ensures profiles are created after email verification
  - Handles the full signup flow when email confirmation is required
  - Uses user metadata to determine role and create appropriate records
*/

-- Function to handle new user creation after email verification
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
BEGIN
  -- Get user metadata
  user_metadata := NEW.raw_user_meta_data;
  
  -- Extract values from metadata
  user_type_value := user_metadata->>'user_type';
  full_name_value := user_metadata->>'full_name';

  -- Only proceed if we have the required metadata
  IF user_type_value IS NOT NULL AND full_name_value IS NOT NULL THEN
    -- Check if profile already exists (avoid duplicates)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
      -- Create profile record
      INSERT INTO public.profiles (
        id,
        email,
        full_name,
        user_type,
        profile_completed,
        onboarding_step,
        verified
      ) VALUES (
        NEW.id,
        NEW.email,
        full_name_value,
        user_type_value::user_type,
        false,
        0,
        false
      );

      -- Create role-specific records based on user_type
      IF user_type_value = 'customer' THEN
        -- Check if customer record doesn't exist
        IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = NEW.id) THEN
          INSERT INTO public.customers (id, company_name)
          VALUES (NEW.id, 'Company Name Pending');
        END IF;

      ELSIF user_type_value = 'contractor' THEN
        -- Check if contractor record doesn't exist
        IF NOT EXISTS (SELECT 1 FROM public.contractors WHERE id = NEW.id) THEN
          INSERT INTO public.contractors (id, title)
          VALUES (NEW.id, 'Freelancer');
        END IF;

      ELSIF user_type_value = 'vendor' THEN
        -- Check if vendor record doesn't exist
        IF NOT EXISTS (SELECT 1 FROM public.vendors WHERE id = NEW.id) THEN
          INSERT INTO public.vendors (
            id,
            company_name,
            contact_name,
            contact_email,
            contact_phone
          ) VALUES (
            NEW.id,
            'Company Name Pending',
            full_name_value,
            NEW.email,
            ''
          );
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
