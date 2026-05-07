-- ═══════════════════════════════════════════════════════════════════════
-- Migration 005 — Add customer_id FK to leads table
-- Enables proper lead → customer linkage after conversion.
-- Run in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Add customer_id back-reference so a converted lead links to its customer
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id)
  WHERE customer_id IS NOT NULL;

-- 2. Add a source field on customers if not present (helps trace back to lead)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_lead_id ON customers(lead_id)
  WHERE lead_id IS NOT NULL;
