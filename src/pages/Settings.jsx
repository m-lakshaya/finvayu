import React, { useState, useEffect } from 'react';
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
  Monitor
} from 'lucide-react';

const OrganizationTab = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">Company Profile</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
          <input type="text" defaultValue="Finvayu Credits Pvt Ltd" className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business Email</label>
          <input type="email" defaultValue="admin@finvayu.com" className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Phone</label>
          <input type="text" defaultValue="+91 1800-FINVAYU" className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Headquarters</label>
          <input type="text" defaultValue="Bengaluru, Karnataka, India" className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">Save Changes</button>
      </div>
    </div>
  </div>
);

const UsersTab = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="lg:col-span-8 space-y-6">
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold">Team Members</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
            <Plus size={16} /> Add User
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { name: 'Sarah Jenkins', role: 'Branch Manager', status: 'Active', email: 'sarah.j@finvayu.com' },
              { name: 'Alex Rivera', role: 'Sales Manager', status: 'Active', email: 'alex.r@finvayu.com' },
              { name: 'David Miller', role: 'Lead Executive', status: 'Active', email: 'david.m@finvayu.com' },
            ].map((user, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-[10px] uppercase">{user.name.split(' ').map(n=>n[0]).join('')}</div>
                    <div>
                      <p className="font-bold">{user.name}</p>
                      <p className="text-[10px] text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">{user.role}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="size-2 bg-emerald-500 rounded-full inline-block mr-2 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                  <span className="text-[10px] font-bold text-emerald-600">{user.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-slate-400 hover:text-primary transition-colors"><MoreVertical size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="lg:col-span-4 space-y-6">
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          Role Permissions
        </h4>
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary/30 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold group-hover:text-primary transition-colors">Admin</span>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary/30 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold group-hover:text-primary transition-colors">Executive</span>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PlaceholderTab = ({ title, description }) => (
  <div className="glass-card p-20 rounded-2xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
      <div className="size-10 bg-primary rounded-lg opacity-50"></div>
    </div>
    <h3 className="text-2xl font-bold mb-4">{title} Settings</h3>
    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{description}</p>
  </div>
);

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'organization';

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'users', label: 'Users & Roles', icon: Users2 },
    { id: 'leads', label: 'Lead Config', icon: Filter },
    { id: 'calls', label: 'Call Settings', icon: PhoneCall },
    { id: 'system', label: 'System', icon: Settings2 },
  ];

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Configuration</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Configure your workspace, team, and global CRM rules.</p>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col xl:flex-row gap-10 min-h-[600px]">
        {/* Tab Sidebar */}
        <div className="xl:w-64 flex-shrink-0 flex xl:flex-col gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 h-fit overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${
                  isActive 
                    ? 'bg-white dark:bg-slate-900 text-primary shadow-sm font-bold border border-slate-200 dark:border-slate-700' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-primary' : 'text-slate-400'} />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1">
          {activeTab === 'organization' && <OrganizationTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'leads' && (
            <PlaceholderTab 
              title="Leads Configuration" 
              description="Define lead scoring rules, auto-assignment logic, and custom status pipelines." 
            />
          )}
          {activeTab === 'calls' && (
            <PlaceholderTab 
              title="Calling Infrastructure" 
              description="Integrate VoIP providers, set up recording rules, and manage office hours." 
            />
          )}
          {activeTab === 'system' && (
            <PlaceholderTab 
              title="System Integration" 
              description="API management, webhook triggers, and third-party software connections." 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
