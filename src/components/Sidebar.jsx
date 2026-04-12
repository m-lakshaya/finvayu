import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Settings,
  Menu,
  ShieldAlert,
  Zap
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { profile, hasPermission } = useAuth();
  const roleName = profile?.roles?.name?.toLowerCase() || '';
  const isCollaboratorOrBanker = ['collaborator', 'banker'].includes(roleName);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Leads', icon: Users, path: '/leads' },
    ...(!isCollaboratorOrBanker ? [
      { name: 'Customers', icon: UserCircle, path: '/customers' },
      { name: 'Follow-ups', icon: RotateCcw, path: '/follow-ups' },
      { name: 'Documents', icon: FileText, path: '/documents' },
    ] : []),
    { name: 'Loan Apps', icon: ClipboardList, path: '/loan-apps' },
  ];

  const networkItems = !isCollaboratorOrBanker ? [
    { name: 'Bankers', icon: Briefcase, path: '/bankers' },
    { name: 'Collaborators', icon: Handshake, path: '/collaborators' },
  ] : [];

  const insightItems = !isCollaboratorOrBanker ? [
    { name: 'Revenue', icon: Banknote, path: '/revenue' },
    { name: 'Calls', icon: Phone, path: '/calls' },
    { name: 'Attendance', icon: UserCheck, path: '/attendance' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
    ...(hasPermission('MANAGE_USERS') ? [{ name: 'Admin Setup', icon: ShieldAlert, path: '/console' }] : []),
  ] : [];

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-6 py-3 transition-all duration-300 ${
          isActive 
            ? 'bg-primary/15 text-primary border-r-4 border-primary font-bold shadow-inner' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:translate-x-1 font-medium'
        }`
      }
    >
      <item.icon size={18} className={`flex-shrink-0 ${item.path === window.location.pathname ? 'animate-pulse' : ''}`} />
      {!isCollapsed && <span className="text-[11px] uppercase tracking-widest transition-opacity duration-300">{item.name}</span>}
    </NavLink>
  );

  return (
    <aside className={`${isCollapsed ? 'w-24' : 'w-72'} flex-shrink-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen transition-all duration-500 ease-in-out z-20 shadow-2xl`}>
      <div className={`p-8 flex items-center ${isCollapsed ? 'flex-col gap-6 justify-center' : 'justify-between'} overflow-hidden transition-all duration-300`}>
        <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="size-11 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 flex-shrink-0 rotate-3 group-hover:rotate-6 transition-transform">
            <Zap size={24} fill="white" />
          </div>
          {!isCollapsed && (
            <div className="leading-none">
              <span className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white transition-opacity duration-300">FINVAYU</span>
              <p className="text-[8px] font-bold text-primary uppercase tracking-[0.4em] mt-1">Enterprise</p>
            </div>
          )}
        </div>
        <button 
          onClick={toggleSidebar}
          className={`p-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center ${isCollapsed ? 'w-10 h-10' : ''}`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu size={20} />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 no-scrollbar custom-scrollbar">
        {!isCollapsed && <div className="px-8 mb-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-50">Operations Center</div>}
        {menuItems.map(item => <NavItem key={item.name} item={item} />)}
        
        <div className="my-8 mx-6 h-px bg-slate-200 dark:bg-slate-800 opacity-50" />
        
        {!isCollapsed && <div className="px-8 mb-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-50">Partner Network</div>}
        {networkItems.map(item => <NavItem key={item.name} item={item} />)}
        
        <div className="my-8 mx-6 h-px bg-slate-200 dark:bg-slate-800 opacity-50" />
        
        {!isCollapsed && <div className="px-8 mb-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-50">Business Intelligence</div>}
        {insightItems.map(item => <NavItem key={item.name} item={item} />)}
      </nav>

      <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
              isActive 
                ? 'bg-primary text-white font-bold shadow-xl shadow-primary/20' 
                : 'text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-white/5'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Settings size={20} className={`flex-shrink-0 transition-transform ${isActive ? 'rotate-90' : 'group-hover:rotate-45'}`} />
              {!isCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>}
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
