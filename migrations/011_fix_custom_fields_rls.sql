-- ═══════════════════════════════════════════════════════════════════════
-- Migration 011 — Fix custom_field_definitions RLS policies
--
-- Problem: The "FOR ALL" policy with USING + WITH CHECK was blocking
-- INSERTs because PostgreSQL evaluates USING as a visibility check even
-- on INSERT rows that don't exist yet — causing the SYSTEM_ADMIN sub-query
-- to fail silently. The fix: use explicit per-action policies.
--
-- Safe to run multiple times (DROP IF EXISTS on each policy).
-- ═══════════════════════════════════════════════════════════════════════

-- Drop all existing policies on this table
DROP POLICY IF EXISTS "org members read custom fields"       ON custom_field_definitions;
DROP POLICY IF EXISTS "system admin manage custom fields"    ON custom_field_definitions;
DROP POLICY IF EXISTS "admin insert custom fields"           ON custom_field_definitions;
DROP POLICY IF EXISTS "admin update custom fields"           ON custom_field_definitions;
DROP POLICY IF EXISTS "admin delete custom fields"           ON custom_field_definitions;

-- ── SELECT: any authenticated user in the same org can read ──────────────
CREATE POLICY "org members read custom fields"
  ON custom_field_definitions
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ── INSERT: only SYSTEM_ADMIN (case-insensitive) ─────────────────────────
-- Note: for INSERT we use WITH CHECK only (no USING — the row is new).
CREATE POLICY "admin insert custom fields"
  ON custom_field_definitions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND org_id = custom_field_definitions.org_id
        AND UPPER(profile_type) = 'SYSTEM_ADMIN'
    )
  );

-- ── UPDATE: only SYSTEM_ADMIN of same org ────────────────────────────────
CREATE POLICY "admin update custom fields"
  ON custom_field_definitions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND org_id = custom_field_definitions.org_id
        AND UPPER(profile_type) = 'SYSTEM_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND org_id = custom_field_definitions.org_id
        AND UPPER(profile_type) = 'SYSTEM_ADMIN'
    )
  );

-- ── DELETE: only SYSTEM_ADMIN of same org ────────────────────────────────
CREATE POLICY "admin delete custom fields"
  ON custom_field_definitions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND org_id = custom_field_definitions.org_id
        AND UPPER(profile_type) = 'SYSTEM_ADMIN'
    )
  );

-- ── Verify: run this SELECT to confirm your profile_type value ───────────
-- SELECT id, email, profile_type, org_id FROM profiles WHERE id = auth.uid();
