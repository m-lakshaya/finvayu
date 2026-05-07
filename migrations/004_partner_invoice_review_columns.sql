-- ═══════════════════════════════════════════════════════════════════════
-- Migration 004 — Add review columns to partner_invoices
--                + create_notification SECURITY DEFINER RPC
-- Run this in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Add review audit columns to partner_invoices
--    (safe to run even if they already exist)
ALTER TABLE partner_invoices
  ADD COLUMN IF NOT EXISTS reviewed_by  UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at  TIMESTAMPTZ;

-- 2. Create the SECURITY DEFINER notification RPC
--    This allows any authenticated user to insert a notification for
--    ANY other user without RLS blocking the insert.
CREATE OR REPLACE FUNCTION public.create_notification(
  p_org_id         UUID,
  p_recipient_id   UUID,
  p_type           TEXT,
  p_title          TEXT,
  p_message        TEXT    DEFAULT NULL,
  p_reference_id   UUID    DEFAULT NULL,
  p_reference_type TEXT    DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (
    org_id, recipient_id, type, title, message,
    reference_id, reference_type, is_read, created_at
  ) VALUES (
    p_org_id, p_recipient_id, p_type, p_title, p_message,
    p_reference_id, p_reference_type, FALSE, NOW()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;
