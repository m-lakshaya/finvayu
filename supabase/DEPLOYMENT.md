# Deployment Guide: User Invite System

## Step 1: Run SQL in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **SQL Editor**
3. Open file: `supabase/migrations/001_trigger_and_rls.sql`
4. Paste the entire contents and click **Run**

This will:
- Create the `handle_new_user` trigger (auto-creates profile when a user accepts invite)
- Set up all RLS policies for org-level data isolation

---

## Step 2: Initialize Supabase CLI in your project

Open a terminal in your project root:

```powershell
cd "c:\Users\Vijay Kannaan\OneDrive\Documents\finvayu\src\webapp"
npx supabase login
```

Then link your project (find your Project Reference ID in Supabase Dashboard → Project Settings):

```powershell
npx supabase link --project-ref YOUR_PROJECT_REF_ID
```

---

## Step 3: Deploy the Edge Function

```powershell
npx supabase functions deploy invite-user --no-verify-jwt
```

> Note: `--no-verify-jwt` is NOT a security risk here because the function manually validates the JWT itself (checks the caller is a SYSTEM_ADMIN).

---

## Step 4: Set the Site URL environment variable

In Supabase Dashboard → **Edge Functions** → `invite-user` → **Secrets**:

```
SITE_URL = https://your-deployed-app-url.com
```

Or if testing locally:
```
SITE_URL = http://localhost:5173
```

---

## Step 5: Configure Email Redirect URL

In Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `https://your-app-url.com`
- **Redirect URLs**: Add `https://your-app-url.com/#/reset-password`

---

## Verification

1. Log in as a SYSTEM_ADMIN user
2. Go to Admin Setup → click **Provision User**
3. Fill in details and click **Send Invite**
4. Check the target email inbox — they should receive an invite link
5. User clicks link → sets password → gets redirected to `/reset-password`
6. User logs in → their profile is auto-created with correct org_id and role

---

## Security Checklist

- [x] Edge Function validates caller is SYSTEM_ADMIN before inviting
- [x] `service_role` key is only in Supabase's secure environment (never in frontend)
- [x] RLS policies enforce org-level isolation on all tables
- [x] Collaborators/Bankers get `STANDARD_USER` profile — cannot access Admin Setup
- [x] Invoice upload gated by `UPLOAD_INVOICE` permission check in frontend
- [ ] TODO: Test with a real invite flow end-to-end after deployment
