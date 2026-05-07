import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  PERMISSIONS,
  PROFILE_TYPE_PERMISSIONS,
  ROLE_PERMISSIONS,
} from '../config/rbac';

export { PERMISSIONS };

const AuthContext = createContext(null);

// ─── UI metadata ──────────────────────────────────────────────────────────────
export const PROFILES = {
  SYSTEM_ADMIN: { name: 'System Administrator', description: 'Full unrestricted access. Org founder / root admin.' },
  STANDARD_USER: { name: 'Standard User', description: 'Internal employee. Access is determined by their assigned role.' },
  READ_ONLY: { name: 'Read Only', description: 'Auditor / observer. Can view leads and loan apps only.' },
};

export const ROLES = {
  ceo:          { id: 'ceo',          name: 'CEO',                description: 'Chief Executive — full operational access.' },
  rm:           { id: 'rm',           name: 'Regional Manager',   description: 'Full visibility, no admin or commission control.' },
  sa:           { id: 'sa',           name: 'Sales Agent',        description: 'Day-to-day CRM operations.' },
  collaborator: { id: 'collaborator', name: 'Collaborator',       description: 'External referral partner.' },
  banker:       { id: 'banker',       name: 'Banker',             description: 'External banking partner.' },
};

// ─── AuthProvider ──────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user,          setUser]          = useState(null);
  const [profile,       setProfile]       = useState(null);
  const [orgRolePerms,  setOrgRolePerms]  = useState(null); // DB overrides: { roleId: Set<perm> }
  const [loading,       setLoading]       = useState(true);

  // ── Fetch org-level role permission overrides ──────────────────────────────
  const fetchOrgRolePerms = useCallback(async (orgId) => {
    if (!orgId) return;
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role_id, permissions')
        .eq('org_id', orgId);
      if (error) throw error;
      if (data?.length) {
        const map = {};
        data.forEach(row => { map[row.role_id] = new Set(row.permissions || []); });
        setOrgRolePerms(map);
      }
    } catch (_) {
      // Table may not exist yet (pre-migration) — silently fall back to code defaults
    }
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, roles(*)')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setProfile(data);
      await fetchOrgRolePerms(data?.org_id);
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchOrgRolePerms]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setOrgRolePerms(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ─── Permission Resolution ─────────────────────────────────────────────────
  // Priority:
  //   1. SYSTEM_ADMIN profile_type → always unrestricted
  //   2. READ_ONLY profile_type    → always strictly limited
  //   3. DB role_permissions override (org-level customisation)
  //   4. rbac.js ROLE_PERMISSIONS  (code defaults)
  //   5. STANDARD_USER base        (final fallback)
  const hasPermission = (permission) => {
    if (!profile || !permission) return !permission;

    const profileType = profile.profile_type || 'READ_ONLY';
    const roleId      = profile.role_id?.toLowerCase() || '';

    if (profileType === 'SYSTEM_ADMIN') return true;
    if (profileType === 'READ_ONLY') return (PROFILE_TYPE_PERMISSIONS.READ_ONLY || new Set()).has(permission);

    // DB override takes precedence over rbac.js defaults
    if (orgRolePerms?.[roleId]) return orgRolePerms[roleId].has(permission);

    // Code defaults
    const rolePerms = ROLE_PERMISSIONS[roleId];
    if (rolePerms) return rolePerms.has(permission);

    return (PROFILE_TYPE_PERMISSIONS.STANDARD_USER || new Set()).has(permission);
  };

  const hasAllPermissions = (...perms) => perms.every(hasPermission);
  const hasAnyPermission  = (...perms) => perms.some(hasPermission);

  // Returns the full resolved Set for the current user (used by admin UI)
  const getAllPermissions = () => {
    if (!profile) return new Set();
    const profileType = profile.profile_type || 'READ_ONLY';
    const roleId      = profile.role_id?.toLowerCase() || '';
    if (profileType === 'SYSTEM_ADMIN') return new Set(Object.values(PERMISSIONS));
    if (profileType === 'READ_ONLY')    return PROFILE_TYPE_PERMISSIONS.READ_ONLY || new Set();
    if (orgRolePerms?.[roleId])         return orgRolePerms[roleId];
    return ROLE_PERMISSIONS[roleId] || PROFILE_TYPE_PERMISSIONS.STANDARD_USER || new Set();
  };

  // Returns the effective permission Set for any given role (for admin UI display)
  const getPermissionsForRole = (roleId) => {
    if (!roleId) return new Set();
    if (orgRolePerms?.[roleId]) return orgRolePerms[roleId];
    return ROLE_PERMISSIONS[roleId?.toLowerCase()] || new Set();
  };

  // Reload org permissions after admin saves changes
  const refreshOrgRolePerms = () => fetchOrgRolePerms(profile?.org_id);

  // Sign out
  const logout = async () => {
    try { await supabase.auth.signOut(); }
    catch (e) { console.error('Logout error:', e.message); }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      orgRolePerms,
      hasPermission, hasAllPermissions, hasAnyPermission,
      getAllPermissions, getPermissionsForRole, refreshOrgRolePerms,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
