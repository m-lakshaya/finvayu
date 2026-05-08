/**
 * @file rbac.js
 * @description Central RBAC (Role-Based Access Control) configuration.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  MAKING PERMISSION CHANGES IN PRODUCTION — ONLY TOUCH THIS FILE
 * ═══════════════════════════════════════════════════════════════════
 *
 *  ▶ Give a role access to a new feature  → add PERMISSION to its set in ROLE_PERMISSIONS
 *  ▶ Revoke access from a role            → remove from its set in ROLE_PERMISSIONS
 *  ▶ Add a brand-new permission           → add to PERMISSIONS, then assign to sets
 *  ▶ Add a brand-new role                 → add role_id key to ROLE_PERMISSIONS
 *  ▶ Change what a profile tier can do    → edit PROFILE_TYPE_PERMISSIONS
 *
 *  No other file needs to change for any permission policy update.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  HOW PERMISSION RESOLUTION WORKS
 * ═══════════════════════════════════════════════════════════════════
 *
 *  1. SYSTEM_ADMIN profile_type  →  unrestricted (all permissions, no role check)
 *  2. READ_ONLY   profile_type  →  strictly limited (READ_ONLY set, role ignored)
 *  3. STANDARD_USER             →  driven by role_id from ROLE_PERMISSIONS
 *     - if role_id not found     →  fallback to PROFILE_TYPE_PERMISSIONS.STANDARD_USER
 *
 * ═══════════════════════════════════════════════════════════════════
 *  SUPABASE MAPPING (no schema change required for this implementation)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  profile_type  ←→  profiles.profile_type  (SYSTEM_ADMIN | STANDARD_USER | READ_ONLY)
 *  role key      ←→  profiles.role_id       (ceo | rm | sa | collaborator | banker)
 *
 * ═══════════════════════════════════════════════════════════════════
 *  FUTURE UPGRADE PATH (zero-deploy permission changes)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Create a Supabase table:
 *    role_permissions (role_id TEXT, permission TEXT, PRIMARY KEY (role_id, permission))
 *
 *  Then update hasPermission() in useAuth.jsx to fetch from this table at login
 *  and cache in context. Admins can grant/revoke permissions from the Supabase
 *  dashboard or your Admin Setup page — no code deploy needed.
 */

// ─── Permission Strings ────────────────────────────────────────────────────────
// Treat this as an enum. ALWAYS use PERMISSIONS.XYZ — never raw strings anywhere.

export const PERMISSIONS = Object.freeze({
  // ── Lead operations ────────────────────────────────────────────────────────
  READ_LEADS:    'READ_LEADS',
  CREATE_LEADS:  'CREATE_LEADS',
  EDIT_LEADS:    'EDIT_LEADS',
  DELETE_LEADS:  'DELETE_LEADS',

  // ── CRM entities ──────────────────────────────────────────────────────────
  VIEW_CUSTOMERS:     'VIEW_CUSTOMERS',
  VIEW_FOLLOW_UPS:    'VIEW_FOLLOW_UPS',
  VIEW_DOCUMENTS:     'VIEW_DOCUMENTS',
  VIEW_LOAN_APPS:     'VIEW_LOAN_APPS',

  // ── Partner network ───────────────────────────────────────────────────────
  VIEW_BANKERS:       'VIEW_BANKERS',
  VIEW_COLLABORATORS: 'VIEW_COLLABORATORS',

  // ── Business intelligence ─────────────────────────────────────────────────
  VIEW_REVENUE:    'VIEW_REVENUE',
  VIEW_REPORTS:    'VIEW_REPORTS',
  VIEW_CALLS:      'VIEW_CALLS',
  VIEW_ATTENDANCE: 'VIEW_ATTENDANCE',

  // ── Finance ───────────────────────────────────────────────────────────────
  SET_COMMISSION:  'SET_COMMISSION',
  RAISE_INVOICE:   'RAISE_INVOICE',
  UPLOAD_INVOICE:  'UPLOAD_INVOICE',
  PROCESS_PAYMENT: 'PROCESS_PAYMENT',

  // ── Administration ────────────────────────────────────────────────────────
  MANAGE_USERS: 'MANAGE_USERS',

  // ── Data management ───────────────────────────────────────────────────────
  // Grants access to the global Recycle Bin page (admin-only restore of soft-deleted records).
  // Intentionally withheld from all non-CEO roles — RMs, SAs, partners never see this.
  VIEW_RECYCLE_BIN: 'VIEW_RECYCLE_BIN',
});

// ─── Profile Type → Base Permissions ──────────────────────────────────────────
// profile_type is the "account tier" — it defines the access ceiling.
//
//  SYSTEM_ADMIN  →  Org founder / root admin.  Unrestricted.
//  STANDARD_USER →  Internal employee. Effective permissions come from role_id.
//                   This set acts as the fallback if role_id is unknown.
//  READ_ONLY     →  Auditor / observer. Minimal access regardless of role.

export const PROFILE_TYPE_PERMISSIONS = Object.freeze({
  SYSTEM_ADMIN: new Set(Object.values(PERMISSIONS)),

  STANDARD_USER: new Set([
    PERMISSIONS.READ_LEADS,
    PERMISSIONS.CREATE_LEADS,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_FOLLOW_UPS,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.VIEW_LOAN_APPS,
    PERMISSIONS.UPLOAD_INVOICE,
  ]),

  READ_ONLY: new Set([
    PERMISSIONS.READ_LEADS,
    PERMISSIONS.VIEW_LOAN_APPS,
  ]),
});

// ─── Role → Permission Grant Set ──────────────────────────────────────────────
// For STANDARD_USER accounts, the role_id determines their effective permissions.
// Key must EXACTLY match profiles.role_id in Supabase (always lowercase).
//
// Resolution: effective permissions = ROLE_PERMISSIONS[profile.role_id]
// Fallback (unknown role): PROFILE_TYPE_PERMISSIONS.STANDARD_USER

export const ROLE_PERMISSIONS = Object.freeze({
  // ── CEO ───────────────────────────────────────────────────────────────────
  // Full access. Typically paired with SYSTEM_ADMIN profile_type for the
  // org founder, but can also be a STANDARD_USER CEO at a branch level.
  ceo: new Set(Object.values(PERMISSIONS)),

  // ── Regional Manager ──────────────────────────────────────────────────────
  // Full operational visibility. Can raise invoices. Cannot manage users
  // or set commission rates (those stay with CEO/SYSTEM_ADMIN).
  rm: new Set([
    PERMISSIONS.READ_LEADS,
    PERMISSIONS.CREATE_LEADS,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.DELETE_LEADS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_FOLLOW_UPS,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.VIEW_LOAN_APPS,
    PERMISSIONS.VIEW_BANKERS,
    PERMISSIONS.VIEW_COLLABORATORS,
    PERMISSIONS.VIEW_REVENUE,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_CALLS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.RAISE_INVOICE,
    PERMISSIONS.UPLOAD_INVOICE,
  ]),

  // ── Sales Agent ───────────────────────────────────────────────────────────
  // Day-to-day operational access. No analytics, no partner network visibility.
  sa: new Set([
    PERMISSIONS.READ_LEADS,
    PERMISSIONS.CREATE_LEADS,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_FOLLOW_UPS,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.VIEW_LOAN_APPS,
    PERMISSIONS.UPLOAD_INVOICE,
    PERMISSIONS.VIEW_ATTENDANCE,
  ]),

  // ── Collaborator ──────────────────────────────────────────────────────────
  // External referral partner. Can submit leads they bring, view their own
  // leads and loan apps, and raise commission invoices on closed/disbursed leads.
  collaborator: new Set([
    PERMISSIONS.READ_LEADS,
    PERMISSIONS.CREATE_LEADS,    // submit leads they bring
    PERMISSIONS.VIEW_LOAN_APPS,
    PERMISSIONS.RAISE_INVOICE,   // raise commission invoice on closed leads
    PERMISSIONS.UPLOAD_INVOICE,  // upload PDF supporting documents
  ]),

  // ── Banker ────────────────────────────────────────────────────────────────
  // External banking partner. Same workflow as collaborator.
  banker: new Set([
    PERMISSIONS.READ_LEADS,
    PERMISSIONS.CREATE_LEADS,    // submit leads they bring
    PERMISSIONS.VIEW_LOAN_APPS,
    PERMISSIONS.RAISE_INVOICE,   // raise commission invoice on closed leads
    PERMISSIONS.UPLOAD_INVOICE,  // upload PDF supporting documents
  ]),
});
