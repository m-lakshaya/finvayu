-- ═══════════════════════════════════════════════════════════════════════
-- Migration 010b — Fix custom_field_definitions (drop bad FK on org_id)
-- Run this if you already ran 010. If you haven't run 010 yet, run this
-- instead of 010 (it is a safe superset).
-- ═══════════════════════════════════════════════════════════════════════

-- Drop and recreate cleanly (IF EXISTS so it's safe to re-run)
DROP TABLE IF EXISTS custom_field_definitions CASCADE;

CREATE TABLE custom_field_definitions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  -- org_id stores the same value as profiles.org_id (org identifier UUID).
  -- No FK here because org_id is not a PK on any table in this schema.
  org_id       UUID        NOT NULL,
  entity_type  TEXT        NOT NULL CHECK (entity_type IN ('lead', 'customer', 'task')),
  field_key    TEXT        NOT NULL,          -- snake_case key used in JSONB
  label        TEXT        NOT NULL,          -- display label
  field_type   TEXT        NOT NULL DEFAULT 'text'
               CHECK (field_type IN ('text','number','date','select','checkbox','textarea','phone','email')),
  options      JSONB,                         -- for 'select' type: ["Option A","Option B"]
  required     BOOLEAN     NOT NULL DEFAULT FALSE,
  show_in_list BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, entity_type, field_key)
);

-- Add custom_fields JSONB to entity tables (safe if already added by 010)
ALTER TABLE leads     ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}';
ALTER TABLE tasks     ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}';

-- RLS
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members read custom fields" ON custom_field_definitions;
DROP POLICY IF EXISTS "system admin manage custom fields" ON custom_field_definitions;

-- Any authenticated user in the same org can read definitions
CREATE POLICY "org members read custom fields"
  ON custom_field_definitions FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Only SYSTEM_ADMIN can create / update / delete definitions
CREATE POLICY "system admin manage custom fields"
  ON custom_field_definitions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND org_id = custom_field_definitions.org_id
        AND profile_type = 'SYSTEM_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND org_id = custom_field_definitions.org_id
        AND profile_type = 'SYSTEM_ADMIN'
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_custom_fields_org_entity
  ON custom_field_definitions (org_id, entity_type, sort_order);
