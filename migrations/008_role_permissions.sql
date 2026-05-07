-- ═══════════════════════════════════════════════════════════════════════
-- Migration 008 — role_permissions (org-level permission overrides)
-- Allows the admin to customise which permissions each role gets via
-- the Admin Setup UI, without touching source code.
--
-- How it works:
--   • On login, the app fetches this table for the org.
--   • If an entry exists for a role, it REPLACES the code default.
--   • If no entry exists, the hardcoded rbac.js defaults apply.
--   • CEO is always unrestricted (SYSTEM_ADMIN profile_type bypass).
-- Run in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS role_permissions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_id     TEXT        NOT NULL,   -- must match profiles.role_id (e.g. "rm", "sa")
  permissions TEXT[]      NOT NULL DEFAULT '{}', -- array of PERMISSIONS enum strings
  updated_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One customisation row per role per org
  UNIQUE (org_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_org
  ON role_permissions(org_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Any authenticated org member can READ (so the app can load permissions on login)
CREATE POLICY "role_permissions_select" ON role_permissions
  FOR SELECT TO authenticated
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1));

-- Only SYSTEM_ADMIN profile_type can INSERT / UPDATE / DELETE
CREATE POLICY "role_permissions_insert" ON role_permissions
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    AND (SELECT profile_type FROM profiles WHERE id = auth.uid() LIMIT 1) = 'SYSTEM_ADMIN'
  );

CREATE POLICY "role_permissions_update" ON role_permissions
  FOR UPDATE TO authenticated
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    AND (SELECT profile_type FROM profiles WHERE id = auth.uid() LIMIT 1) = 'SYSTEM_ADMIN'
  );

CREATE POLICY "role_permissions_delete" ON role_permissions
  FOR DELETE TO authenticated
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    AND (SELECT profile_type FROM profiles WHERE id = auth.uid() LIMIT 1) = 'SYSTEM_ADMIN'
  );
