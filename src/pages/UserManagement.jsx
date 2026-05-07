import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Shield, UserPlus, Search, Loader2, ChevronDown,
  Check, X, Save, RefreshCw, Info, Lock, Unlock,
  UserCog, Settings2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, PERMISSIONS, ROLES, PROFILES } from '../hooks/useAuth';
import { getDisplayName, getInitials } from '../utils/profileUtils';
import ProvisionUserModal from '../components/ProvisionUserModal';
import { ROLE_PERMISSIONS } from '../config/rbac';

// ── Permission catalogue (for the Roles tab UI) ───────────────────────────────
const PERMISSION_GROUPS = [
  {
    label: 'Leads',
    perms: [
      { key: 'READ_LEADS',   label: 'View Leads' },
      { key: 'CREATE_LEADS', label: 'Create Leads' },
      { key: 'EDIT_LEADS',   label: 'Edit Leads' },
      { key: 'DELETE_LEADS', label: 'Delete Leads' },
    ],
  },
  {
    label: 'CRM',
    perms: [
      { key: 'VIEW_CUSTOMERS',  label: 'View Customers' },
      { key: 'VIEW_FOLLOW_UPS', label: 'View Follow-ups' },
      { key: 'VIEW_DOCUMENTS',  label: 'View Documents' },
      { key: 'VIEW_LOAN_APPS',  label: 'View Loan Applications' },
    ],
  },
  {
    label: 'Operations',
    perms: [
      { key: 'VIEW_CALLS',      label: 'View Calls' },
      { key: 'VIEW_ATTENDANCE', label: 'View Attendance' },
    ],
  },
  {
    label: 'Partners',
    perms: [
      { key: 'VIEW_BANKERS',       label: 'View Banker Partners' },
      { key: 'VIEW_COLLABORATORS', label: 'View Collaborator Partners' },
    ],
  },
  {
    label: 'Finance',
    perms: [
      { key: 'VIEW_REVENUE',   label: 'View Revenue' },
      { key: 'SET_COMMISSION', label: 'Set Commission Rates' },
      { key: 'RAISE_INVOICE',  label: 'Raise Commission Invoices' },
      { key: 'UPLOAD_INVOICE', label: 'Upload Invoice Documents' },
      { key: 'PROCESS_PAYMENT',label: 'Process Payments' },
    ],
  },
  {
    label: 'Analytics & Admin',
    perms: [
      { key: 'VIEW_REPORTS', label: 'View Reports' },
      { key: 'MANAGE_USERS', label: 'Manage Users (Admin)' },
    ],
  },
];

const ROLE_ORDER = ['ceo', 'rm', 'sa', 'banker', 'collaborator'];

// ── Shared helpers ────────────────────────────────────────────────────────────
const Tab = ({ id, label, icon: Icon, active, onClick }) => (
  <button onClick={() => onClick(id)}
    className={`flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
      active ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
    }`}>
    <Icon size={15} />{label}
  </button>
);

const RoleBadge = ({ roleId }) => {
  const role = ROLES[roleId];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wide">
      {role?.name || roleId || '—'}
    </span>
  );
};

const ProfileTypeBadge = ({ type }) => {
  const cfg = {
    SYSTEM_ADMIN:  'bg-violet-50 text-violet-600 dark:bg-violet-900/20',
    STANDARD_USER: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    READ_ONLY:     'bg-slate-100 text-slate-500 dark:bg-slate-800',
  }[type] || 'bg-slate-100 text-slate-400';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${cfg}`}>
      {PROFILES[type]?.name || type || '—'}
    </span>
  );
};

// ── Users Tab ─────────────────────────────────────────────────────────────────
const UsersTab = ({ orgId, currentUserId }) => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [updating, setUpdating] = useState(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .eq('org_id', orgId)
      .order('first_name', { ascending: true });
    if (!error) setUsers(data || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleRoleChange = async (userId, newRoleId) => {
    setUpdating(userId + '_role');
    const { error } = await supabase.from('profiles').update({ role_id: newRoleId }).eq('id', userId);
    if (error) alert('Role update failed: ' + error.message);
    else setUsers(u => u.map(x => x.id === userId ? { ...x, role_id: newRoleId } : x));
    setUpdating(null);
  };

  const handleProfileTypeChange = async (userId, newType) => {
    setUpdating(userId + '_type');
    const { error } = await supabase.from('profiles').update({ profile_type: newType }).eq('id', userId);
    if (error) alert('Profile type update failed: ' + error.message);
    else setUsers(u => u.map(x => x.id === userId ? { ...x, profile_type: newType } : x));
    setUpdating(null);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || getDisplayName(u).toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
        <button onClick={() => setIsProvisionModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all">
          <UserPlus size={15} />Provision User
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {['User', 'Profile Type', 'Role', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-16 text-center"><Loader2 size={22} className="animate-spin text-primary mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-400 text-sm">No users found.</td></tr>
            ) : filtered.map(u => {
              const isUpdating = updating?.startsWith(u.id);
              const isSelf     = u.id === currentUserId;
              return (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                        {getInitials(u)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{getDisplayName(u)} {isSelf && <span className="text-[10px] text-primary font-bold">(you)</span>}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {isSelf ? <ProfileTypeBadge type={u.profile_type} /> : (
                      <select value={u.profile_type || 'STANDARD_USER'}
                        disabled={isUpdating}
                        onChange={e => handleProfileTypeChange(u.id, e.target.value)}
                        className="text-[11px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20">
                        {Object.entries(PROFILES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {isSelf ? <RoleBadge roleId={u.role_id} /> : (
                      <select value={u.role_id || 'sa'}
                        disabled={isUpdating}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="text-[11px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20">
                        {ROLE_ORDER.map(id => <option key={id} value={id}>{ROLES[id]?.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />Active
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {isUpdating && <Loader2 size={14} className="animate-spin text-primary" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ProvisionUserModal isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        onUserProvisioned={(u) => { setUsers(prev => [u, ...prev]); setIsProvisionModalOpen(false); }}
        onUserCreated={(u) => { setUsers(prev => [u, ...prev]); setIsProvisionModalOpen(false); }}
      />
    </>
  );
};

// ── Roles Tab ─────────────────────────────────────────────────────────────────
const RolesTab = ({ orgId, currentProfileId, refreshOrgRolePerms }) => {
  const [selectedRole, setSelectedRole] = useState('rm');
  const [permMap,      setPermMap]      = useState({}); // roleId → Set<perm>
  const [dbMap,        setDbMap]        = useState({}); // roleId → Set<perm> (from DB)
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);

  const loadDbOverrides = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase.from('role_permissions').select('role_id, permissions').eq('org_id', orgId);
    const db = {};
    (data || []).forEach(r => { db[r.role_id] = new Set(r.permissions || []); });
    setDbMap(db);
    // Build working permMap: DB overrides take precedence over code defaults
    const map = {};
    ROLE_ORDER.forEach(roleId => {
      map[roleId] = new Set(db[roleId] || ROLE_PERMISSIONS[roleId] || []);
    });
    setPermMap(map);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { loadDbOverrides(); }, [loadDbOverrides]);

  const togglePerm = (perm) => {
    if (selectedRole === 'ceo') return; // CEO always has all
    setPermMap(prev => {
      const next = new Set(prev[selectedRole] || []);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return { ...prev, [selectedRole]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const permsArray = [...(permMap[selectedRole] || [])];
      const { error } = await supabase.from('role_permissions').upsert({
        org_id:      orgId,
        role_id:     selectedRole,
        permissions: permsArray,
        updated_by:  currentProfileId,
        updated_at:  new Date().toISOString(),
      }, { onConflict: 'org_id,role_id' });
      if (error) throw error;
      setDbMap(prev => ({ ...prev, [selectedRole]: new Set(permsArray) }));
      await refreshOrgRolePerms();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Reset ${ROLES[selectedRole]?.name} to system defaults?`)) return;
    setSaving(true);
    try {
      await supabase.from('role_permissions').delete().eq('org_id', orgId).eq('role_id', selectedRole);
      setDbMap(prev => { const n = { ...prev }; delete n[selectedRole]; return n; });
      setPermMap(prev => ({ ...prev, [selectedRole]: new Set(ROLE_PERMISSIONS[selectedRole] || []) }));
      await refreshOrgRolePerms();
    } catch (e) {
      alert('Reset failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const currentPerms  = permMap[selectedRole] || new Set();
  const isCustomised  = !!dbMap[selectedRole];
  const isCeo         = selectedRole === 'ceo';
  const defaultPerms  = ROLE_PERMISSIONS[selectedRole] || new Set();
  const hasChanges    = !isCeo && JSON.stringify([...currentPerms].sort()) !== JSON.stringify([...(dbMap[selectedRole] || defaultPerms)].sort());

  return (
    <div className="flex gap-6">
      {/* Role selector sidebar */}
      <div className="w-52 flex-shrink-0 space-y-1">
        {ROLE_ORDER.map(roleId => (
          <button key={roleId} onClick={() => setSelectedRole(roleId)}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              selectedRole === roleId
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}>
            <div className="flex items-center justify-between">
              {ROLES[roleId]?.name}
              {roleId === 'ceo' && <Lock size={11} className={selectedRole === roleId ? 'text-white/60' : 'text-slate-300'} />}
              {roleId !== 'ceo' && dbMap[roleId] && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${selectedRole === roleId ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>Custom</span>}
            </div>
            <p className={`text-[10px] mt-0.5 truncate ${selectedRole === roleId ? 'text-white/70' : 'text-slate-400'}`}>{ROLES[roleId]?.description}</p>
          </button>
        ))}
      </div>

      {/* Permission editor */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {ROLES[selectedRole]?.name} Permissions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isCeo ? 'CEO always has all permissions — this cannot be changed.' :
                   isCustomised ? 'Using custom permissions for this org.' :
                   'Using system defaults. Changes will create an org-level override.'}
                </p>
              </div>
              {!isCeo && (
                <div className="flex items-center gap-2">
                  {isCustomised && (
                    <button onClick={handleReset} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-500 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors">
                      <RefreshCw size={12} />Reset defaults
                    </button>
                  )}
                  <button onClick={handleSave} disabled={saving || !hasChanges}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      saved ? 'bg-emerald-500 text-white' :
                      hasChanges ? 'bg-primary text-white hover:shadow-lg hover:shadow-primary/20' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                    {saved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-5">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{group.label}</h4>
                  </div>
                  <div className="p-2 grid grid-cols-2 gap-1">
                    {group.perms.map(({ key, label }) => {
                      const enabled = isCeo ? true : currentPerms.has(key);
                      const isDefault = defaultPerms.has(key);
                      return (
                        <button key={key}
                          onClick={() => togglePerm(key)}
                          disabled={isCeo}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                            enabled
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                              : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          } ${isCeo ? 'cursor-default' : 'cursor-pointer'}`}>
                          <span className={`size-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                            enabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700'
                          }`}>
                            {enabled ? <Check size={11} strokeWidth={3} /> : <X size={10} className="text-slate-400" />}
                          </span>
                          <span className="flex-1 min-w-0">
                            {label}
                            {!isCeo && enabled !== isDefault && (
                              <span className="ml-1.5 text-[9px] font-bold text-amber-500 uppercase">modified</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Profiles Tab ──────────────────────────────────────────────────────────────
const ProfilesTab = ({ orgId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    supabase.from('profiles').select('id, first_name, last_name, full_name, email, profile_type, role_id')
      .eq('org_id', orgId)
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, [orgId]);

  const groups = useMemo(() => {
    return Object.keys(PROFILES).map(type => ({
      type,
      ...PROFILES[type],
      users: users.filter(u => (u.profile_type || 'STANDARD_USER') === type),
    }));
  }, [users]);

  const PROFILE_ICONS = { SYSTEM_ADMIN: Lock, STANDARD_USER: Users, READ_ONLY: Shield };
  const PROFILE_COLORS = {
    SYSTEM_ADMIN:  { card: 'border-violet-200 dark:border-violet-800', icon: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600', badge: 'bg-violet-50 text-violet-600' },
    STANDARD_USER: { card: 'border-blue-200 dark:border-blue-800',     icon: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',     badge: 'bg-blue-50 text-blue-600' },
    READ_ONLY:     { card: 'border-slate-200 dark:border-slate-700',   icon: 'bg-slate-100 dark:bg-slate-800 text-slate-500',   badge: 'bg-slate-100 text-slate-500' },
  };

  return loading ? (
    <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
  ) : (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Profile types define the access ceiling for each user. <strong>System Admin</strong> overrides all role restrictions.
        <strong> Standard User</strong> uses their assigned role's permissions. <strong>Read Only</strong> restricts to view-only regardless of role.
        Change a user's profile type from the <span className="text-primary font-semibold">Users tab</span>.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {groups.map(({ type, name, description, users: typeUsers }) => {
          const Icon = PROFILE_ICONS[type] || Shield;
          const colors = PROFILE_COLORS[type];
          return (
            <div key={type} className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 ${colors.card}`}>
              <div className={`size-10 rounded-xl flex items-center justify-center mb-3 ${colors.icon}`}>
                <Icon size={18} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{name}</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">{description}</p>
              <div className="space-y-2">
                {typeUsers.length === 0 ? (
                  <p className="text-[11px] text-slate-300 dark:text-slate-600 italic">No users assigned</p>
                ) : typeUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-2">
                    <div className="size-6 rounded-md bg-primary/10 text-primary font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                      {getInitials(u)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{getDisplayName(u)}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${colors.badge}`}>
                      {ROLES[u.role_id]?.name || u.role_id}
                    </span>
                  </div>
                ))}
              </div>
              <div className={`mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400`}>
                {typeUsers.length} user{typeUsers.length !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Root Component ────────────────────────────────────────────────────────────
const UserManagement = () => {
  const { profile, refreshOrgRolePerms } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  if (!profile?.org_id) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Setup</h1>
        <p className="text-slate-500 text-sm mt-1">Manage users, role permissions, and profile types for your organisation.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800">
        <Tab id="users"    label="Users"    icon={Users}    active={activeTab === 'users'}    onClick={setActiveTab} />
        <Tab id="roles"    label="Roles"    icon={UserCog}  active={activeTab === 'roles'}    onClick={setActiveTab} />
        <Tab id="profiles" label="Profiles" icon={Settings2} active={activeTab === 'profiles'} onClick={setActiveTab} />
      </div>

      {/* Content */}
      {activeTab === 'users'    && <UsersTab    orgId={profile.org_id} currentUserId={profile.id} />}
      {activeTab === 'roles'    && <RolesTab    orgId={profile.org_id} currentProfileId={profile.id} refreshOrgRolePerms={refreshOrgRolePerms} />}
      {activeTab === 'profiles' && <ProfilesTab orgId={profile.org_id} />}
    </div>
  );
};

export default UserManagement;
