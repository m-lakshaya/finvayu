-- ═══════════════════════════════════════════════════════════════════════
-- Migration 010 — Custom Fields (schema-free per-org field definitions)
-- Allows SYSTEM_ADMIN to define extra fields for leads, customers, tasks.
-- Values are stored in a JSONB column on each entity table.
-- Run in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Field Definitions table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type  TEXT        NOT NULL CHECK (entity_type IN ('lead', 'customer', 'task')),
  field_key    TEXT        NOT NULL,          -- snake_case, used as JSON key
  label        TEXT        NOT NULL,          -- display label shown in UI
  field_type   TEXT        NOT NULL DEFAULT 'text'
               CHECK (field_type IN ('text','number','date','select','checkbox','textarea','phone','email')),
  options      JSONB,                         -- for 'select': ["Option A","Option B"]
  required     BOOLEAN     NOT NULL DEFAULT FALSE,
  show_in_list BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, entity_type, field_key)
);

-- Fix: org_id should reference the orgs/organisations table, not profiles.
-- If you have an 'organisations' table use that. Otherwise keep profiles reference
-- and store the org's owner profile id. Adjust as needed for your schema.

-- ── 2. Add JSONB value column to entity tables ──────────────────────────────
ALTER TABLE leads     ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}';
ALTER TABLE tasks     ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}';

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user in the same org can read field definitions
CREATE POLICY "org members read custom fields"
  ON custom_field_definitions FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Write: only SYSTEM_ADMIN can create/update/delete custom field definitions
CREATE POLICY "system admin manage custom fields"
  ON custom_field_definitions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND org_id = custom_field_definitions.org_id
        AND profile_type = 'SYSTEM_ADMIN'
    )
  );

-- ── 4. Index for fast lookup ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_custom_fields_org_entity
  ON custom_field_definitions (org_id, entity_type, sort_order);

-- ── NOTE ─────────────────────────────────────────────────────────────────────
-- org_id in custom_field_definitions stores the org_id value from the profiles
-- table (same as profiles.org_id), not a user's profile id.
-- If your app uses a separate 'organisations' table, update the REFERENCES above.
