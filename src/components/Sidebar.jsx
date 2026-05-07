import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Settings, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { NAV_GROUPS } from '../config/navigation';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { hasPermission } = useAuth();
  const location = useLocation();

  const visibleGroups = useMemo(() => {
    return NAV_GROUPS
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => item.permission === null || hasPermission(item.permission)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [hasPermission]);

  return (
    <aside
      className={`flex-shrink-0 flex flex-col h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-14' : 'w-[220px]'}`}
    >
      {/* Logo + collapse */}
      <div className={`flex items-center h-14 px-3 flex-shrink-0 border-b border-slate-100 dark:border-slate-800 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="size-7 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={14} fill="white" className="text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight truncate">
              Finvayu
            </span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="size-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 no-scrollbar">
        {visibleGroups.map((group, groupIndex) => (
          <div key={group.id} className={groupIndex > 0 ? 'mt-5' : ''}>
            {!isCollapsed && (
              <div className="px-4 mb-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5 px-2">
              {group.items.map((item) => (
                <NavItem key={item.id} item={item} isCollapsed={isCollapsed} currentPath={location.pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div className="px-2 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
        <NavLink
          to="/settings"
          title={isCollapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'} ${isCollapsed ? 'justify-center' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <Settings size={17} className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'rotate-45' : ''}`} />
              {!isCollapsed && <span className="truncate">Settings</span>}
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
};

// ─── NavItem ──────────────────────────────────────────────────────────────────
const NavItem = ({ item, isCollapsed, currentPath }) => {
  const Icon = item.icon;
  const isActive = item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path);

  return (
    <NavLink
      to={item.path}
      title={isCollapsed ? item.name : undefined}
      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'} ${isCollapsed ? 'justify-center' : ''}`}
    >
      <Icon size={17} className="flex-shrink-0" />
      {!isCollapsed && <span className="truncate">{item.name}</span>}
    </NavLink>
  );
};

export default Sidebar;
