import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Shield, UserPlus, Search, Loader2, ChevronDown,
  Check, X, Save, RefreshCw, Info, Lock, Unlock,
  UserCog, Settings2, SlidersHorizontal, Plus, Trash2, GripVertical, ChevronUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, PERMISSIONS, ROLES, PROFILES } from '../hooks/useAuth';
import { getDisplayName, getInitials } from '../utils/profileUtils';
import ProvisionUserModal from '../components/ProvisionUserModal';
import { ROLE_PERMISSIONS } from '../config/rbac';
import { useNotification } from '../context/NotificationContext';

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
            {loading && (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <Loader2 size={22} className="animate-spin text-primary mx-auto" />
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">No users found.</td>
              </tr>
            )}
            {!loading && filtered.map(u => {
              const isUpdating = updating?.startsWith(u.id);
              const isSelf = u.id === currentUserId;
              const profileOptions = Object.keys(PROFILES).map(k => (
                <option key={k} value={k}>{PROFILES[k].name}</option>
              ));
              const roleOptions = ROLE_ORDER.map(id => (
                <option key={id} value={id}>{ROLES[id]?.name}</option>
              ));
              return (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                        {getInitials(u)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {getDisplayName(u)}{isSelf && <span className="text-[10px] text-primary font-bold ml-1">(you)</span>}
                        </p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {isSelf ? (
                      <ProfileTypeBadge type={u.profile_type} />
                    ) : (
                      <select
                        value={u.profile_type || 'STANDARD_USER'}
                        disabled={isUpdating}
                        onChange={e => handleProfileTypeChange(u.id, e.target.value)}
                        className="text-[11px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {profileOptions}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {isSelf ? (
                      <RoleBadge roleId={u.role_id} />
                    ) : (
                      <select
                        value={u.role_id || 'sa'}
                        disabled={isUpdating}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="text-[11px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {roleOptions}
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
  const { confirm } = useNotification();
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
    const ok = await confirm({
      title: 'Reset to Defaults',
      message: `Reset ${ROLES[selectedRole]?.name} permissions to system defaults? Any custom changes will be lost.`,
      confirmLabel: 'Reset',
      danger: true,
    });
    if (!ok) return;
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
              {roleId === 'ceo' && (
                <Lock size={11} className={selectedRole === roleId ? 'text-white/60' : 'text-slate-300'} />
              )}
              {roleId !== 'ceo' && dbMap[roleId] && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  selectedRole === roleId ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                }`}>Custom</span>
              )}
            </div>
            <p className={`text-[10px] mt-0.5 truncate ${
              selectedRole === roleId ? 'text-white/70' : 'text-slate-400'
            }`}>{ROLES[roleId]?.description}</p>
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


// ── Custom Fields Tab ─────────────────────────────────────────────────────────
const ENTITY_TYPES = [
  { key: 'lead',     label: 'Leads' },
  { key: 'customer', label: 'Customers' },
  { key: 'task',     label: 'Tasks / Follow-ups' },
];

const FIELD_TYPES = [
  { value: 'text',     label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number',   label: 'Number' },
  { value: 'date',     label: 'Date' },
  { value: 'select',   label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox (Yes/No)' },
  { value: 'phone',    label: 'Phone' },
  { value: 'email',    label: 'Email' },
];

const toFieldKey = (label) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const EMPTY_FIELD = { label: '', field_type: 'text', required: false, show_in_list: false, options: [] };

const CustomFieldsTab = ({ orgId }) => {
  const { confirm } = useNotification();
  const [activeEntity, setActiveEntity] = useState('lead');
  const [fields,  setFields]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null); // field id being saved
  const [form,    setForm]    = useState(null);  // { ...EMPTY_FIELD } when adding
  const [optionInput, setOptionInput] = useState('');

  const fetchFields = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('custom_field_definitions')
      .select('*')
      .eq('org_id', orgId)
      .eq('entity_type', activeEntity)
      .order('sort_order');
    setFields(data || []);
    setLoading(false);
  }, [orgId, activeEntity]);

  useEffect(() => { fetchFields(); }, [fetchFields]);

  const [saveError, setSaveError] = useState(null);

  const handleSave = async (def) => {
    if (!def.label?.trim()) return;
    setSaveError(null);
    setSaving(def.id || 'new');

    // Strip unknown keys (id is undefined for new fields — remove it)
    const { id: _id, ...rest } = def;
    const payload = {
      ...rest,
      org_id:      orgId,
      entity_type: activeEntity,
      field_key:   def.field_key || toFieldKey(def.label),
      sort_order:  def.sort_order ?? fields.length,
      options:     def.field_type === 'select' ? (def.options || []) : null,
    };

    const { error } = await supabase
      .from('custom_field_definitions')
      .upsert(payload, { onConflict: 'org_id,entity_type,field_key' });

    if (error) {
      setSaveError(error.message);
    } else {
      setForm(null);
      setOptionInput('');
      fetchFields();
    }
    setSaving(null);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Custom Field',
      message: 'Delete this custom field? All data already stored under this field will become inaccessible. This cannot be undone.',
      confirmLabel: 'Delete Field',
      danger: true,
    });
    if (!ok) return;
    await supabase.from('custom_field_definitions').delete().eq('id', id);
    fetchFields();
  };

  const handleMoveUp = async (f, idx) => {
    if (idx === 0) return;
    const prev = fields[idx - 1];
    await Promise.all([
      supabase.from('custom_field_definitions').update({ sort_order: prev.sort_order }).eq('id', f.id),
      supabase.from('custom_field_definitions').update({ sort_order: f.sort_order }).eq('id', prev.id),
    ]);
    fetchFields();
  };

  return (
    <div className="space-y-6">
      {/* Entity type tabs */}
      <div className="flex gap-2 flex-wrap">
        {ENTITY_TYPES.map(e => (
          <button
            key={e.key}
            onClick={() => { setActiveEntity(e.key); setForm(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeEntity === e.key
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary'
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* Field list */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              Custom Fields — {ENTITY_TYPES.find(e => e.key === activeEntity)?.label}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">These fields appear in the detail view and are included in CSV exports.</p>
          </div>
          {!form && (
            <button
              onClick={() => setForm({ ...EMPTY_FIELD })}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus size={14} /> Add Field
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {fields.length === 0 && !form && (
              <div className="py-14 text-center">
                <SlidersHorizontal size={28} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400">No custom fields yet</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Click "Add Field" to create your first custom field.</p>
              </div>
            )}

            {fields.map((f, idx) => (
              <div key={f.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 group">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleMoveUp(f, idx)} disabled={idx === 0} className="text-slate-300 hover:text-primary disabled:opacity-20 transition-colors"><ChevronUp size={12} /></button>
                  <GripVertical size={14} className="text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{f.label}</p>
                    {f.required && <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase">Required</span>}
                    {f.show_in_list && <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase">In List</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Key: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{f.field_key}</code>
                    &nbsp;·&nbsp;{FIELD_TYPES.find(t => t.value === f.field_type)?.label || f.field_type}
                    {f.field_type === 'select' && f.options?.length ? ` (${f.options.length} options)` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Add form */}
            {form && (
              <div className="px-6 py-5 bg-primary/[0.02] border-t border-primary/10 space-y-4">
                <p className="text-xs font-black text-primary uppercase tracking-widest">New Custom Field</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Field Label *</label>
                    <input
                      type="text"
                      value={form.label}
                      onChange={e => setForm(p => ({ ...p, label: e.target.value, field_key: toFieldKey(e.target.value) }))}
                      placeholder="e.g. Bank Name"
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
                    />
                    {form.label && (
                      <p className="text-[10px] text-slate-400 mt-1">Key: <code>{form.field_key || toFieldKey(form.label)}</code></p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Field Type</label>
                    <select
                      value={form.field_type}
                      onChange={e => setForm(p => ({ ...p, field_type: e.target.value }))}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
                    >
                      {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Dropdown options builder */}
                {form.field_type === 'select' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Dropdown Options</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={optionInput}
                        onChange={e => setOptionInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && optionInput.trim()) {
                            setForm(p => ({ ...p, options: [...(p.options || []), optionInput.trim()] }));
                            setOptionInput('');
                          }
                        }}
                        placeholder="Type an option and press Enter"
                        className="flex-1 px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        onClick={() => { if (optionInput.trim()) { setForm(p => ({ ...p, options: [...(p.options||[]), optionInput.trim()] })); setOptionInput(''); }}}
                        className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold"
                      >Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(form.options || []).map((opt, i) => (
                        <span key={i} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold">
                          {opt}
                          <button onClick={() => setForm(p => ({ ...p, options: p.options.filter((_, j) => j !== i) }))} className="text-slate-400 hover:text-red-500"><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.required} onChange={e => setForm(p => ({ ...p, required: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Required field</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.show_in_list} onChange={e => setForm(p => ({ ...p, show_in_list: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Show in list view</span>
                  </label>
                </div>

                {saveError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <X size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setForm(null); setOptionInput(''); setSaveError(null); }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >Cancel</button>
                  <button
                    onClick={() => handleSave(form)}
                    disabled={!form.label?.trim() || saving === 'new'}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-sm"
                  >
                    {saving === 'new' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Save Field
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
        <Tab id="users"    label="Users"    icon={Users}          active={activeTab === 'users'}    onClick={setActiveTab} />
        <Tab id="roles"    label="Roles"    icon={UserCog}        active={activeTab === 'roles'}    onClick={setActiveTab} />
        <Tab id="profiles" label="Profiles" icon={Settings2} active={activeTab === 'profiles'} onClick={setActiveTab} />
        <Tab id="fields"   label="Custom Fields" icon={SlidersHorizontal} active={activeTab === 'fields'}   onClick={setActiveTab} />
      </div>

      {/* Content */}
      {activeTab === 'users'    && <UsersTab         orgId={profile.org_id} currentUserId={profile.id} />}
      {activeTab === 'roles'    && <RolesTab         orgId={profile.org_id} currentProfileId={profile.id} refreshOrgRolePerms={refreshOrgRolePerms} />}
      {activeTab === 'profiles' && <ProfilesTab      orgId={profile.org_id} />}
      {activeTab === 'fields'   && <CustomFieldsTab  orgId={profile.org_id} />}
    </div>
  );
};

export default UserManagement;
