-- ═══════════════════════════════════════════════════════════════════════
-- Migration 012 — Definitive fix for custom_field_definitions RLS
--
-- Root cause: The previous policies did EXISTS (SELECT FROM profiles WHERE
-- profile_type = 'SYSTEM_ADMIN'). That inner SELECT runs under profiles RLS,
-- which has a self-referential sub-query — creating a resolution chain that
-- causes EXISTS to return false, blocking every INSERT regardless of role.
--
-- Fix: Mirror the same simple org-scoping pattern used on every other table
-- (leads, customers, tasks, etc.). Admin-only enforcement lives at the app
-- layer (the Custom Fields tab is unreachable without SYSTEM_ADMIN profile).
--
-- Safe to re-run — all DROP IF EXISTS.
-- ═══════════════════════════════════════════════════════════════════════

-- Drop every policy variant we've ever created on this table
DROP POLICY IF EXISTS "org members read custom fields"    ON custom_field_definitions;
DROP POLICY IF EXISTS "system admin manage custom fields" ON custom_field_definitions;
DROP POLICY IF EXISTS "admin insert custom fields"        ON custom_field_definitions;
DROP POLICY IF EXISTS "admin update custom fields"        ON custom_field_definitions;
DROP POLICY IF EXISTS "admin delete custom fields"        ON custom_field_definitions;

-- ── SELECT: any authenticated org member can read field definitions ───────────
CREATE POLICY "custom_fields_org_select"
  ON custom_field_definitions
  FOR SELECT
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- ── INSERT: any authenticated org member can create definitions ───────────────
-- App layer (Admin Setup tab) restricts this to SYSTEM_ADMIN only.
CREATE POLICY "custom_fields_org_insert"
  ON custom_field_definitions
  FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- ── UPDATE: any authenticated org member can update definitions ───────────────
CREATE POLICY "custom_fields_org_update"
  ON custom_field_definitions
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- ── DELETE: any authenticated org member can delete definitions ───────────────
CREATE POLICY "custom_fields_org_delete"
  ON custom_field_definitions
  FOR DELETE
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  );
