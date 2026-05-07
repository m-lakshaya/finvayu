-- ═══════════════════════════════════════════════════════════════════════
-- Migration 006 — Activity log + modified_by/modified_at on leads/customers
-- Enables full audit trail: every field change, who made it, when.
-- Run in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Add audit tracking columns to leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS modified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ;

-- 2. Add audit tracking columns to customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS modified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ;

-- 3. Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  record_id    UUID        NOT NULL,
  record_type  TEXT        NOT NULL CHECK (record_type IN ('lead', 'customer')),
  actor_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  action       TEXT        NOT NULL,     -- 'field_updated' | 'status_changed' | 'converted' | 'note_added' | 'created'
  field_name   TEXT,                     -- which field changed (null for non-field actions)
  old_value    TEXT,                     -- previous value as string
  new_value    TEXT,                     -- new value as string
  label        TEXT,                     -- human-readable summary e.g. "Status changed to Qualified"
  meta         JSONB,                    -- any extra structured context
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast record-level and org-level lookups
CREATE INDEX IF NOT EXISTS idx_activity_log_record
  ON activity_log(record_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_org
  ON activity_log(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_actor
  ON activity_log(actor_id, created_at DESC);

-- 4. RLS — same-org read/write
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Authenticated users in the same org can read
CREATE POLICY "activity_log_select" ON activity_log
  FOR SELECT TO authenticated
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1));

-- Authenticated users in the same org can insert
CREATE POLICY "activity_log_insert" ON activity_log
  FOR INSERT TO authenticated
  WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1));

-- No update/delete — activity log is append-only by design
