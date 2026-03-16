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
  Menu
} from 'lucide-react';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Leads', icon: Users, path: '/leads' },
    { name: 'Customers', icon: UserCircle, path: '/customers' },
    { name: 'Follow-ups', icon: RotateCcw, path: '/follow-ups' },
    { name: 'Documents', icon: FileText, path: '/documents' },
    { name: 'Loan Apps', icon: ClipboardList, path: '/loan-apps' },
  ];

  const networkItems = [
    { name: 'Bankers', icon: Briefcase, path: '/bankers' },
    { name: 'Collaborators', icon: Handshake, path: '/collaborators' },
  ];

  const insightItems = [
    { name: 'Revenue', icon: Banknote, path: '/revenue' },
    { name: 'Calls', icon: Phone, path: '/calls' },
    { name: 'Attendance', icon: UserCheck, path: '/attendance' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
    { name: 'User Management', icon: Users, path: '/settings?tab=users' },
  ];

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-6 py-3 transition-all duration-300 ${
          isActive 
            ? 'bg-primary/15 text-primary border-r-4 border-primary font-semibold backdrop-blur-md' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:translate-x-1'
        }`
      }
    >
      <item.icon size={20} className="flex-shrink-0" />
      {!isCollapsed && <span className="text-sm font-medium transition-opacity duration-300">{item.name}</span>}
    </NavLink>
  );

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-white/20 dark:border-white/10 flex flex-col h-screen transition-all duration-500 ease-in-out z-20`}>
      <div className={`p-6 flex items-center ${isCollapsed ? 'flex-col gap-6 justify-center' : 'justify-between'} overflow-hidden transition-all duration-300`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-primary/90 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 flex-shrink-0">
            <Banknote size={24} />
          </div>
          {!isCollapsed && <span className="font-bold text-2xl tracking-tight text-slate-800 dark:text-white transition-opacity duration-300">Kredflow</span>}
        </div>
        <button 
          onClick={toggleSidebar}
          className={`p-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center ${isCollapsed ? 'w-10 h-10' : ''}`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu size={20} />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
        {!isCollapsed && <div className="px-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Main Menu</div>}
        {menuItems.map(item => <NavItem key={item.name} item={item} />)}
        
        <div className="my-4 mx-4 h-px bg-slate-200/50 dark:bg-white/5" />
        
        {!isCollapsed && <div className="px-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Network</div>}
        {networkItems.map(item => <NavItem key={item.name} item={item} />)}
        
        <div className="my-4 mx-4 h-px bg-slate-200/50 dark:bg-white/5" />
        
        {!isCollapsed && <div className="px-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Insights</div>}
        {insightItems.map(item => <NavItem key={item.name} item={item} />)}
      </nav>

      <div className="p-4 border-t border-white/20 dark:border-white/10">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              isActive 
                ? 'bg-primary/15 text-primary font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5'
            }`
          }
        >
          <Settings size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
