import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  Users2, 
  Filter, 
  PhoneCall, 
  Settings2,
  Lock,
  Mail,
  MoreVertical,
  Plus,
  ShieldCheck,
  ChevronRight,
  Monitor,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, ROLES } from '../hooks/useAuth';

const OrganizationTab = ({ org, onUpdate }) => {
  const [name, setName] = useState(org?.name || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(org?.name || '');
  }, [org]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name })
        .eq('id', org.id);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Update Org Error:', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 border-b border-slate-100 dark:border-slate-800 pb-4">Company Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Legal Entity Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
            />
          </div>
          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Subscription Identifier</label>
            <div className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest text-primary flex items-center justify-between">
               {org?.subscription_tier || 'Enterprise'}
               <span className="text-[8px] bg-primary/10 px-2 py-0.5 rounded-full">ACTIVE</span>
            </div>
          </div>
        </div>
        <div className="mt-12 flex justify-end relative z-10">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/20 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={14} /> : 'Synchronize Profile'}
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full"></div>
      </div>
    </div>
  );
};

const UsersTab = ({ orgId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', orgId);
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Fetch Team Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="lg:col-span-8 space-y-6">
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-black text-lg tracking-tighter">Team Roster</h3>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 dark:bg-white dark:text-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all">
              <Plus size={16} /> Invite Member
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-5">Operator</th>
                  <th className="px-8 py-5">Designation</th>
                  <th className="px-8 py-5">Access Level</th>
                  <th className="px-8 py-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                    <tr><td colSpan={4} className="p-10 text-center uppercase text-[10px] font-black text-slate-400 tracking-widest">Hydrating Team...</td></tr>
                ) : users.map((user, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-xs group-hover:scale-110 transition-transform">
                            {user.full_name?.split(' ').map(n=>n[0]).join('') || '??'}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-slate-100">{user.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-lg">
                        {ROLES[user.role_id]?.name || 'Agent'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                         <CheckCircle2 size={14} /> Verified
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-slate-400 hover:text-primary transition-colors"><MoreVertical size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            Governance
          </h4>
          <div className="space-y-4">
            {['Administrator', 'Super Agent', 'Support Staff'].map((role, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary/50 transition-all group/item">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest group-hover/item:text-primary transition-colors">{role}</span>
                  <ChevronRight size={14} className="text-slate-400 group-hover/item:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

const PlaceholderTab = ({ title, description }) => (
  <div className="glass-card p-24 rounded-3xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
    <div className="size-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3">
      <div className="size-10 bg-primary rounded-lg opacity-40 shadow-2xl"></div>
    </div>
    <h3 className="text-2xl font-black tracking-tighter mb-4">{title} Configuration</h3>
    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-[10px] font-black uppercase tracking-widest leading-relaxed">{description}</p>
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
  </div>
);

const Settings = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'organization';
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrg = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.org_id)
        .single();
      if (error) throw error;
      setOrg(data);
    } catch (error) {
      console.error('Fetch Org Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id]);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'users', label: 'Team & Roster', icon: Users2 },
    { id: 'leads', label: 'Pipeline Config', icon: Filter },
    { id: 'calls', label: 'Voice Infrastructure', icon: PhoneCall },
    { id: 'system', label: 'Core System', icon: Settings2 },
  ];

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  if (loading && !org) {
      return (
          <div className="h-[70vh] flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-primary mb-4" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Booting Config Interface...</p>
          </div>
      );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight">System Architecture</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mt-2 uppercase tracking-[0.3em]">Configure System Settings & Global State.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-12 min-h-[600px]">
        <div className="xl:w-72 flex-shrink-0 flex xl:flex-col gap-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/50 dark:border-slate-800 h-fit overflow-x-auto no-scrollbar shadow-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 whitespace-nowrap group ${
                  isActive 
                    ? 'bg-white dark:bg-slate-800 text-primary shadow-2xl shadow-primary/10 border border-slate-200 dark:border-slate-700' 
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 shadow-none'
                }`}
              >
                <Icon size={20} className={`${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'} transition-colors`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : ''}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1">
          {activeTab === 'organization' && <OrganizationTab org={org} onUpdate={fetchOrg} />}
          {activeTab === 'users' && <UsersTab orgId={profile?.org_id} />}
          {activeTab === 'leads' && (
            <PlaceholderTab 
              title="Pipeline" 
              description="Define lead scoring heuristics, auto-assignment logic, and stage transition triggers." 
            />
          )}
          {activeTab === 'calls' && (
            <PlaceholderTab 
              title="Calling" 
              description="Configure Exotel/Twilio bridge, define recording persistence, and routing office hours." 
            />
          )}
          {activeTab === 'system' && (
            <PlaceholderTab 
              title="Framework" 
              description="Master API management, webhook ingestion endpoints, and external service hooks." 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
