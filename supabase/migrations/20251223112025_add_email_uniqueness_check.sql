/*
  # Add Email Uniqueness Check Function

  ## Overview
  Adds a database function to check if an email is already registered with any user type,
  preventing the same email from being used for multiple roles.

  ## New Functions
  - `check_email_exists(email_to_check text)` - Returns boolean indicating if email exists
  
  ## Purpose
  - Ensures one email can only be associated with one user account/role
  - Prevents confusion and security issues from duplicate accounts
*/

-- Function to check if email already exists
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE email = email_to_check
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_email_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_exists(text) TO anon;
