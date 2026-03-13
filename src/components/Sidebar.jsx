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
  Settings
} from 'lucide-react';

const Sidebar = () => {
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
        `flex items-center gap-3 px-6 py-3 transition-all duration-200 ${
          isActive 
            ? 'bg-primary/10 text-primary border-r-4 border-primary font-semibold' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`
      }
    >
      <item.icon size={20} />
      <span className="text-sm font-medium">{item.name}</span>
    </NavLink>
  );

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
          <Banknote size={20} />
        </div>
        <span className="font-bold text-xl tracking-tight text-primary">Kredflow</span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Menu</div>
        {menuItems.map(item => <NavItem key={item.name} item={item} />)}
        
        <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Network</div>
        {networkItems.map(item => <NavItem key={item.name} item={item} />)}
        
        <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Insights</div>
        {insightItems.map(item => <NavItem key={item.name} item={item} />)}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
              isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`
          }
        >
          <Settings size={20} />
          <span className="text-sm font-medium">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
