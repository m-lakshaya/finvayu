import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, ROLES, PROFILES } from '../hooks/useAuth';
import { Users, Shield, UserPlus, MoreVertical, Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import PermissionGate from '../components/PermissionGate';
import { supabase } from '../lib/supabase';
import ProvisionUserModal from '../components/ProvisionUserModal';
import { IndianRupee, Percent, Edit2 } from 'lucide-react';

const UserManagement = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [updating, setUpdating] = useState(null);
  
  const fetchUsers = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', profile.org_id);
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id]);

  const handleUpdateRole = async (userId, newRoleId) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role_id: newRoleId })
        .eq('id', userId);
      
      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, role_id: newRoleId } : u));
    } catch (error) {
      console.error('Error updating role:', error.message);
      alert('Failed to update role: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Setup</h1>
          <p className="text-slate-500 font-medium text-xs mt-1 uppercase tracking-widest">Manage organization users, profiles, and roles</p>
        </div>
        <PermissionGate permission="MANAGE_USERS">
          <button 
            onClick={() => setIsProvisionModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <UserPlus size={16} />
            Provision User
          </button>
        </PermissionGate>
      </div>

      <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800">
        {['users', 'profiles', 'roles'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Filter by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:border-primary/50"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/30 dark:bg-slate-800/20 text-[9px] uppercase font-black text-slate-400 tracking-[0.2em]">
                <tr>
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Internal Profile</th>
                  <th className="px-6 py-4">Security Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                            <Loader2 className="animate-spin text-primary mx-auto mb-2" size={24} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrieving Directory...</p>
                        </td>
                    </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                    <td className="px-6 py-12 text-center text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">
                      No organizational users found.
                    </td>
                  </tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="size-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-[11px] group-hover:scale-110 transition-transform">
                          {u.name?.split(' ').map(n => n[0]).join('') || '??'}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-slate-100 leading-none">{u.name}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase mt-1 tracking-tighter">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 uppercase tracking-widest">
                        {PROFILES[u.profile_type]?.name || 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {ROLES[u.role_id]?.name || u.role_id}
                    </td>
                    <td className="px-6 py-4">
                      {updating === u.id ? (
                        <Loader2 className="animate-spin text-primary" size={14} />
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                          <div className={`size-1.5 rounded-full ${u.id.length > 30 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                          {u.id.length > 30 ? 'Verified' : 'Pending'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select 
                          value={u.role_id}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-primary focus:ring-0 cursor-pointer hover:underline"
                        >
                          {Object.entries(ROLES).map(([id, role]) => (
                            <option key={id} value={id}>{role.name}</option>
                          ))}
                        </select>
                        <button className="p-2 text-slate-400 hover:text-primary rounded-lg transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeTab === 'profiles' || activeTab === 'roles') && (
        <div className="glass-card p-16 text-center rounded-3xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="size-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-xl shadow-primary/10">
            <Shield size={40} className="text-primary" />
          </div>
          <h3 className="text-2xl font-black tracking-tighter mb-3">Enterprise Governance</h3>
          <p className="text-slate-500 max-w-sm mx-auto text-[10px] font-black uppercase tracking-widest leading-relaxed">System-wide role definitions and security hierarchies are managed at the root-level deployment.</p>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
        </div>
      )}
      <ProvisionUserModal 
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        onUserProvisioned={(newUser) => setUsers([newUser, ...users])}
      />
    </div>
  );
};

export default UserManagement;
