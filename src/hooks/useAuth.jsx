import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// UI Metadata for Roles and Profiles (Matching DB IDs)
export const PROFILES = {
  SYSTEM_ADMIN: { name: 'System Administrator' },
  STANDARD_USER: { name: 'Standard User' },
  READ_ONLY: { name: 'Read Only' }
};

export const ROLES = {
  ceo: { id: 'ceo', name: 'CEO' },
  rm: { id: 'rm', name: 'Regional Manager' },
  sa: { id: 'sa', name: 'Sales Agent' },
  collaborator: { id: 'collaborator', name: 'Collaborator' },
  banker: { id: 'banker', name: 'Banker' }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          roles (*)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    if (!profile) return false;
    
    // 1. Root profile type permissions
    const typePermissions = {
      'SYSTEM_ADMIN': ['READ_ALL', 'MODIFY_ALL', 'CREATE_LEADS', 'EDIT_LEADS', 'DELETE_LEADS', 'MANAGE_USERS', 'SET_COMMISSION', 'PROCESS_PAYMENT'],
      'STANDARD_USER': ['CREATE_LEADS', 'EDIT_LEADS', 'READ_LEADS'],
      'READ_ONLY': ['READ_LEADS']
    };

    // 2. Role-specific overrides (Based on the new hierarchy)
    const rolePermissions = {
      'CEO': ['MANAGE_USERS', 'VIEW_ORG_ANALYTICS', 'VIEW_ALL_LEADS'],
      'REGIONAL MANAGER': ['MANAGE_USERS', 'VIEW_BRANCH_ANALYTICS', 'VIEW_BRANCH_LEADS'],
      'SALES AGENT': ['VIEW_OWN_LEADS'],
      'BANKER': ['VIEW_OWN_LEADS'],
      'COLLABORATOR': ['VIEW_OWN_LEADS']
    };
    
    const profileType = profile.profile_type || 'READ_ONLY';
    const roleName = profile.roles?.name?.toUpperCase() || '';
    
    const basePerms = typePermissions[profileType] || [];
    const extraPerms = rolePermissions[roleName] || [];
    
    const allPerms = new Set([...basePerms, ...extraPerms]);

    // Implicit permissions (CEO has everything)
    if (roleName === 'CEO') return true;

    return allPerms.has(permission);
  };

  // Temporary helper for transition: In Supabase, accessibility is handled by RLS.
  // We return true if the record exists (meaning RLS allowed fetching it) or if it's mock data.
  const isRecordAccessible = (recordId, ownerId) => {
    if (!profile) return false;
    if (profile.profile_type === 'SYSTEM_ADMIN') return true;
    if (profile.id === ownerId) return true;
    return true; // Fallback for mock data transition
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      hasPermission, 
      isRecordAccessible,
      login, 
      signup, 
      logout 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
