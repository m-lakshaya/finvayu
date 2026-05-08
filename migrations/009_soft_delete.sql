-- ═══════════════════════════════════════════════════════════════════════
-- Migration 009 — Soft Delete on leads, customers, tasks
-- Replaces hard DELETE with a deleted_at timestamp so records can be
-- restored from the Recycle Bin and audit trails stay intact.
-- Run in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Add deleted_at to leads ──────────────────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ── 2. Add deleted_at to customers ─────────────────────────────────────────
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ── 3. Add deleted_at to tasks (follow-ups) ─────────────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ── 4. Indexes for fast soft-delete filtering ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at     ON leads(org_id, deleted_at)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(org_id, deleted_at) WHERE deleted_at IS NULL;

-- ── 5. Add lead_id back-reference on customers (if not already present) ──────
-- Allows navigating from customer → originating lead for commission history
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- ── 6. Notes: RLS policies ───────────────────────────────────────────────────
-- Existing SELECT policies on leads/customers already scope by org_id.
-- Application-level filters (deleted_at IS NULL) handle the rest.
-- The recycle bin view explicitly queries WHERE deleted_at IS NOT NULL.
-- No DB-level policy changes needed — app code controls the filter.
