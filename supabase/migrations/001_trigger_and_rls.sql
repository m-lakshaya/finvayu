-- ============================================================
-- Step 0: Ensure organizations table has an owner_id column
-- (needed for the register-org Edge Function)
-- ============================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow the register-org Edge Function (service_role) to insert organizations.
-- Regular users should NOT be able to insert orgs directly — only via the Edge Function.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_owner_select" ON public.organizations;
CREATE POLICY "organizations_owner_select" ON public.organizations
  FOR SELECT USING (
    id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "organizations_owner_update" ON public.organizations;
CREATE POLICY "organizations_owner_update" ON public.organizations
  FOR UPDATE USING (
    id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT profile_type FROM public.profiles WHERE id = auth.uid()) = 'SYSTEM_ADMIN'
  );

-- ============================================================
-- Step 1: Run this in your Supabase SQL Editor
-- Creates the auto-profile trigger for invited users
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only insert if a profile doesn't already exist (safe for re-runs)
  INSERT INTO public.profiles (
    id,
    org_id,
    email,
    first_name,
    last_name,
    full_name,
    role_id,
    profile_type
  )
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'org_id'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    TRIM(CONCAT(
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
    )),
    COALESCE(NEW.raw_user_meta_data ->> 'role_id', 'sa'),
    'STANDARD_USER'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- Step 2: RLS Policies (run these after enabling RLS on each table)
-- ============================================================

-- Enable RLS on all tables first
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
-- Users can read all profiles in their own org
DROP POLICY IF EXISTS "profiles_org_select" ON public.profiles;
CREATE POLICY "profiles_org_select" ON public.profiles
  FOR SELECT USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

-- Only the trigger (SECURITY DEFINER) inserts profiles. Block direct inserts from frontend.
DROP POLICY IF EXISTS "profiles_no_direct_insert" ON public.profiles;
CREATE POLICY "profiles_no_direct_insert" ON public.profiles
  FOR INSERT WITH CHECK (false);

-- Users can only update their own profile
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Admins can update any profile in their org (for role changes)
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE USING (
    (SELECT profile_type FROM public.profiles WHERE id = auth.uid()) = 'SYSTEM_ADMIN'
    AND org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );


-- ---- LEADS ----
DROP POLICY IF EXISTS "leads_org_select" ON public.leads;
CREATE POLICY "leads_org_select" ON public.leads
  FOR SELECT USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "leads_org_insert" ON public.leads;
CREATE POLICY "leads_org_insert" ON public.leads
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "leads_org_update" ON public.leads;
CREATE POLICY "leads_org_update" ON public.leads
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "leads_org_delete" ON public.leads;
CREATE POLICY "leads_org_delete" ON public.leads
  FOR DELETE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );


-- ---- CUSTOMERS ----
DROP POLICY IF EXISTS "customers_org_select" ON public.customers;
CREATE POLICY "customers_org_select" ON public.customers
  FOR SELECT USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "customers_org_insert" ON public.customers;
CREATE POLICY "customers_org_insert" ON public.customers
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "customers_org_update" ON public.customers;
CREATE POLICY "customers_org_update" ON public.customers
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "customers_org_delete" ON public.customers;
CREATE POLICY "customers_org_delete" ON public.customers
  FOR DELETE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );


-- ---- LOAN APPLICATIONS ----
DROP POLICY IF EXISTS "loan_apps_org_select" ON public.loan_applications;
CREATE POLICY "loan_apps_org_select" ON public.loan_applications
  FOR SELECT USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "loan_apps_org_insert" ON public.loan_applications;
CREATE POLICY "loan_apps_org_insert" ON public.loan_applications
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "loan_apps_org_update" ON public.loan_applications;
CREATE POLICY "loan_apps_org_update" ON public.loan_applications
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );


-- ---- TASKS ----
DROP POLICY IF EXISTS "tasks_org_select" ON public.tasks;
CREATE POLICY "tasks_org_select" ON public.tasks
  FOR SELECT USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "tasks_org_insert" ON public.tasks;
CREATE POLICY "tasks_org_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "tasks_org_delete" ON public.tasks;
CREATE POLICY "tasks_org_delete" ON public.tasks
  FOR DELETE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );


-- ============================================================
-- Step 3: RLS for remaining tables (bankers, collaborators,
--         documents, call_logs, attendance)
-- Run these after enabling RLS on each table.
-- ============================================================

ALTER TABLE public.bankers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ---- BANKERS ----
DROP POLICY IF EXISTS "bankers_org_select" ON public.bankers;
CREATE POLICY "bankers_org_select" ON public.bankers
  FOR SELECT USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "bankers_org_insert" ON public.bankers;
CREATE POLICY "bankers_org_insert" ON public.bankers
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "bankers_org_update" ON public.bankers;
CREATE POLICY "bankers_org_update" ON public.bankers
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "bankers_org_delete" ON public.bankers;
CREATE POLICY "bankers_org_delete" ON public.bankers
  FOR DELETE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );


-- ---- COLLABORATORS ----
DROP POLICY IF EXISTS "collaborators_org_select" ON public.collaborators;
CREATE POLICY "collaborators_org_select" ON public.collaborators
  FOR SELECT USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "collaborators_org_insert" ON public.collaborators;
CREATE POLICY "collaborators_org_insert" ON public.collaborators
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "collaborators_org_update" ON public.collaborators;
CREATE POLICY "collaborators_org_update" ON public.collaborators
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "collaborators_org_delete" ON public.collaborators;
CREATE POLICY "collaborators_org_delete" ON public.collaborators
  FOR DELETE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );


-- ---- DOCUMENTS ----
DROP POLICY IF EXISTS "documents_org_select" ON public.documents;
CREATE POLICY "documents_org_select" ON public.documents
  FOR SELECT USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "documents_org_insert" ON public.documents;
CREATE POLICY "documents_org_insert" ON public.documents
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "documents_org_update" ON public.documents;
CREATE POLICY "documents_org_update" ON public.documents
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "documents_org_delete" ON public.documents;
CREATE POLICY "documents_org_delete" ON public.documents
  FOR DELETE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );


-- ---- CALL LOGS ----
DROP POLICY IF EXISTS "call_logs_org_select" ON public.call_logs;
CREATE POLICY "call_logs_org_select" ON public.call_logs
  FOR SELECT USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "call_logs_org_insert" ON public.call_logs;
CREATE POLICY "call_logs_org_insert" ON public.call_logs
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND agent_id = auth.uid()
  );

DROP POLICY IF EXISTS "call_logs_org_delete" ON public.call_logs;
CREATE POLICY "call_logs_org_delete" ON public.call_logs
  FOR DELETE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT profile_type FROM public.profiles WHERE id = auth.uid()) = 'SYSTEM_ADMIN'
  );


-- ---- ATTENDANCE ----
DROP POLICY IF EXISTS "attendance_org_select" ON public.attendance;
CREATE POLICY "attendance_org_select" ON public.attendance
  FOR SELECT USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "attendance_org_insert" ON public.attendance;
CREATE POLICY "attendance_org_insert" ON public.attendance
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "attendance_org_update" ON public.attendance;
CREATE POLICY "attendance_org_update" ON public.attendance
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "attendance_org_delete" ON public.attendance;
CREATE POLICY "attendance_org_delete" ON public.attendance
  FOR DELETE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT profile_type FROM public.profiles WHERE id = auth.uid()) = 'SYSTEM_ADMIN'
  );
