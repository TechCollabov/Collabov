# Supabase Configuration Guide

## Critical Authentication Settings

To ensure the authentication system works correctly in production, you must configure the following settings in your Supabase dashboard.

### 1. Email Verification Settings

**Location:** Supabase Dashboard > Authentication > Settings > Email Auth

**Configuration:**
- **Enable email confirmations:** Can be enabled or disabled
  - If **ENABLED**: Users must verify their email before they can sign in
  - If **DISABLED**: Users can sign in immediately after signup

**Current Implementation:** The app supports both modes. When email verification is enabled:
- Users receive a verification email after signup
- Profile records are created automatically via database trigger
- Users must verify their email before signing in
- Clear error messages guide users through the process

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

### 3. Email Templates

**Location:** Supabase Dashboard > Authentication > Email Templates

**Verify Email Template:**

Ensure the confirmation link in your email template uses the correct redirect URL:

```html
<h2>Confirm your email</h2>
<p>Click the link below to verify your email address:</p>
<p><a href="{{ .SiteURL }}/auth/v1/verify?token={{ .Token }}&type=signup&redirect_to={{ .RedirectTo }}">Verify Email</a></p>
```

The `redirect_to` parameter should point to your sign-in page or dashboard.

## Testing Authentication Flow

### With Email Verification Enabled

1. User signs up with email and password
2. User receives verification email
3. User clicks verification link in email
4. Database trigger creates profile and role-specific records
5. User is redirected to sign-in page
6. User signs in with their credentials
7. User is redirected to role-based dashboard

### With Email Verification Disabled

1. User signs up with email and password
2. Profile records are created immediately
3. User receives session immediately
4. User is redirected to role-based dashboard

## Troubleshooting

### Issue: Verification emails redirect to localhost

**Solution:** Update the Site URL in Supabase dashboard to your production domain.

### Issue: "Email not confirmed" error when signing in

**Solution:** User needs to verify their email. Check that:
1. Email verification is enabled in Supabase
2. Verification email was sent
3. User clicked the verification link
4. Verification link hasn't expired

### Issue: Profile not created after email verification

**Solution:** Check that:
1. The `handle_new_user()` trigger is installed (see migration: `add_auth_user_trigger`)
2. User metadata contains `user_type` and `full_name`
3. Database logs for any errors

## Security Notes

- Never commit Supabase keys to version control
- Use environment variables for all Supabase configuration
- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data unless explicitly shared
