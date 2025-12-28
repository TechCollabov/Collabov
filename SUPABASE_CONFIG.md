# Supabase Configuration Guide

## Critical Authentication Settings

To ensure the authentication system works correctly in production, you must configure the following settings in your Supabase dashboard.

### 1. Email Verification Settings

**Location:** Supabase Dashboard > Authentication > Settings > Email Auth

**Current Configuration:**
- **Enable email confirmations:** DISABLED
  - Users can sign in immediately after signup
  - No email verification required
  - Profiles are created automatically during signup

**Note:** If you want to enable email verification in the future, additional code changes will be required to support the email confirmation flow.

### 2. Redirect URL Configuration

**Location:** Supabase Dashboard > Authentication > URL Configuration

**Critical Settings to Update:**

#### Site URL
Set this to your production domain:
```
https://your-production-domain.com
```

**DO NOT** leave this as `http://localhost:3000` in production.

#### Redirect URLs
Add the following URLs to the "Redirect URLs" list:

For production:
```
https://your-production-domain.com/sign-in
https://your-production-domain.com/customer/dashboard
https://your-production-domain.com/vendor/dashboard
https://your-production-domain.com/contractor/dashboard
https://your-production-domain.com/admin/dashboard
```

For local development:
```
http://localhost:5173/sign-in
http://localhost:5173/customer/dashboard
http://localhost:5173/vendor/dashboard
http://localhost:5173/contractor/dashboard
```


## Testing Authentication Flow

### Current Flow (Email Verification Disabled)

1. User signs up with email and password
2. Profile and role-specific records are created immediately
3. User receives session immediately
4. User is automatically redirected to their role-based dashboard
5. No email verification required

## Troubleshooting

### Issue: User can't sign in after signup

**Solution:** Check that:
1. Profile records were created successfully
2. User is using the correct email and password
3. No errors occurred during signup process
4. Check browser console for detailed error logs

### Issue: Profile not created during signup

**Solution:** Check that:
1. User metadata contains `user_type` and `full_name`
2. Database RLS policies allow insert operations
3. Check browser console and Supabase logs for errors

## Security Notes

- Never commit Supabase keys to version control
- Use environment variables for all Supabase configuration
- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data unless explicitly shared
