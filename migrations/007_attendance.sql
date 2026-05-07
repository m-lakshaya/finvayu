-- ═══════════════════════════════════════════════════════════════════════
-- Migration 007 — Attendance table
-- Daily check-in / check-out tracking per user per org.
-- Run in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS attendance (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  check_in    TIMESTAMPTZ,
  check_out   TIMESTAMPTZ,
  -- Present  : normal on-time arrival
  -- Late     : arrived after configured cutoff (default 10:00 AM)
  -- Half Day : checked out before configured cutoff (default 14:00 / 2 PM)
  -- On Leave : marked as leave (future: link to leave_requests table)
  -- Absent   : no check-in by end of day (can be auto-populated by a scheduled job)
  status      TEXT        NOT NULL DEFAULT 'Present'
                CHECK (status IN ('Present', 'Late', 'Half Day', 'On Leave', 'Absent')),
  location    TEXT,
  device      TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One record per employee per day
  UNIQUE (org_id, user_id, date)
);

-- Fast lookups
CREATE INDEX IF NOT EXISTS idx_attendance_org_date
  ON attendance(org_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date
  ON attendance(user_id, date DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Any authenticated user in the same org can read attendance records
CREATE POLICY "attendance_select" ON attendance
  FOR SELECT TO authenticated
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1));

-- Any authenticated user can insert their OWN record for their org
CREATE POLICY "attendance_insert" ON attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Users can only update their OWN record (for check-out)
CREATE POLICY "attendance_update" ON attendance
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND org_id = (SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );
