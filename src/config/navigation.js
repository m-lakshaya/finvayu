/**
 * @file navigation.js
 * @description Sidebar navigation structure — config-driven, permission-gated.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  HOW TO ADD A NEW PAGE TO THE SIDEBAR
 * ═══════════════════════════════════════════════════════════════════
 *
 *  1. Add the route in App.jsx (with a permission prop on ProtectedRoute)
 *  2. Add ONE entry in the relevant group's `items` array below
 *  3. Set `permission: PERMISSIONS.YOUR_PERMISSION` (or null for always-visible)
 *  4. Done. The Sidebar reads this config and renders automatically.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  ITEM FIELDS
 * ═══════════════════════════════════════════════════════════════════
 *
 *  id         — unique string key (used as React key and for future analytics)
 *  name       — display label in the sidebar
 *  icon       — lucide-react component
 *  path       — React Router path (must match App.jsx route)
 *  permission — PERMISSIONS.XYZ to gate, or null for always-visible
 */

import {
  LayoutDashboard,
  Users,
  UserCircle,
  RotateCcw,
  FileText,
  ClipboardList,
  Briefcase,
  Handshake,
  Banknote,
  Phone,
  UserCheck,
  BarChart3,
  ShieldAlert,
} from 'lucide-react';

import { PERMISSIONS } from './rbac';

export const NAV_GROUPS = [
  // ── Operations Center ────────────────────────────────────────────────────
  {
    id: 'operations',
    label: 'Operations Center',
    items: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: LayoutDashboard,
        path: '/',
        permission: null, // Always visible to authenticated users
      },
      {
        id: 'leads',
        name: 'Leads',
        icon: Users,
        path: '/leads',
        permission: PERMISSIONS.READ_LEADS,
      },
      {
        id: 'customers',
        name: 'Customers',
        icon: UserCircle,
        path: '/customers',
        permission: PERMISSIONS.VIEW_CUSTOMERS,
      },
      {
        id: 'follow-ups',
        name: 'Follow-ups',
        icon: RotateCcw,
        path: '/follow-ups',
        permission: PERMISSIONS.VIEW_FOLLOW_UPS,
      },
      {
        id: 'documents',
        name: 'Documents',
        icon: FileText,
        path: '/documents',
        permission: PERMISSIONS.VIEW_DOCUMENTS,
      },
      {
        id: 'loan-apps',
        name: 'Loan Apps',
        icon: ClipboardList,
        path: '/loan-apps',
        permission: PERMISSIONS.VIEW_LOAN_APPS,
      },
    ],
  },

  // ── Partner Network ───────────────────────────────────────────────────────
  {
    id: 'network',
    label: 'Partner Network',
    items: [
      {
        id: 'bankers',
        name: 'Bankers',
        icon: Briefcase,
        path: '/bankers',
        permission: PERMISSIONS.VIEW_BANKERS,
      },
      {
        id: 'collaborators',
        name: 'Collaborators',
        icon: Handshake,
        path: '/collaborators',
        permission: PERMISSIONS.VIEW_COLLABORATORS,
      },
    ],
  },

  // ── Business Intelligence ─────────────────────────────────────────────────
  {
    id: 'intelligence',
    label: 'Business Intelligence',
    items: [
      {
        id: 'revenue',
        name: 'Revenue',
        icon: Banknote,
        path: '/revenue',
        permission: PERMISSIONS.VIEW_REVENUE,
      },
      {
        id: 'calls',
        name: 'Calls',
        icon: Phone,
        path: '/calls',
        permission: PERMISSIONS.VIEW_CALLS,
      },
      {
        id: 'attendance',
        name: 'Attendance',
        icon: UserCheck,
        path: '/attendance',
        permission: PERMISSIONS.VIEW_ATTENDANCE,
      },
      {
        id: 'reports',
        name: 'Reports',
        icon: BarChart3,
        path: '/reports',
        permission: PERMISSIONS.VIEW_REPORTS,
      },
      {
        id: 'console',
        name: 'Admin Setup',
        icon: ShieldAlert,
        path: '/console',
        permission: PERMISSIONS.MANAGE_USERS,
      },
    ],
  },
];

// ─── Flat lookup: path → nav item ─────────────────────────────────────────────
// Useful for breadcrumbs, page title resolution, active state detection, etc.
// Usage: NAV_ITEMS_BY_PATH['/revenue'] → { id, name, icon, path, permission }
export const NAV_ITEMS_BY_PATH = Object.freeze(
  NAV_GROUPS.flatMap((g) => g.items).reduce(
    (acc, item) => ({ ...acc, [item.path]: item }),
    {}
  )
);
