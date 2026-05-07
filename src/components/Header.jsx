import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Bell, ChevronDown, Menu, Sun, Moon,
  User, Settings, LogOut, CheckCheck,
  Receipt, AlertCircle, X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getDisplayName } from '../utils/profileUtils';
import { useNotificationsDB } from '../hooks/useNotificationsDB';

// ─── Notification type → icon/colour/destination ──────────────────────────────
const notifConfig = (type) => {
  const map = {
    invoice_submitted: { icon: Receipt,     color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
    invoice_approved:  { icon: CheckCheck,  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    invoice_rejected:  { icon: AlertCircle, color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20' },
  };
  return map[type] || { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' };
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({ toggleSidebar, toggleTheme, isDarkMode }) => {
  const { profile, logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const profileRef = useRef(null);
  const notifRef   = useRef(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen,   setIsNotifOpen]   = useState(false);

  const { notifications, unreadCount, markAsRead, markAllRead } = useNotificationsDB();

  const isDetailPage = location.pathname.includes('/leads/') || location.pathname.includes('/customers/');
  const roleName = profile?.roles?.name || 'User';
  const userName = getDisplayName(profile);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch (e) { console.error('Logout error:', e.message); }
  };

  const handleNotifClick = (notif) => {
    markAsRead(notif.id);
    setIsNotifOpen(false);
    // Route based on notification type
    if (notif.reference_type === 'invoice') navigate('/revenue');
    else if (notif.reference_id) navigate(`/leads/${notif.reference_id}`);
    else navigate('/');
  };

  return (
    <header className="h-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/20 dark:border-white/10 flex items-center justify-between px-8 flex-shrink-0 z-10 transition-all duration-300">

      {/* Left: search */}
      <div className="flex items-center gap-6 flex-1">
        {!isDetailPage && (
          <div className="flex-1 max-w-xl animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search everything..."
                className="w-full bg-slate-100/50 dark:bg-white/5 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-500 outline-none backdrop-blur-md"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3">

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all duration-300"
          title={isDarkMode ? 'Light mode' : 'Dark mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* ── Notification bell ─────────────────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setIsNotifOpen((p) => !p); setIsProfileOpen(false); }}
            className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all duration-300"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-200 overflow-hidden">
              {/* Dropdown header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-primary text-white text-[9px] font-black rounded-full leading-none">{unreadCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-black text-primary hover:text-primary/70 uppercase tracking-wide flex items-center gap-1">
                      <CheckCheck size={12} /> All read
                    </button>
                  )}
                  <button onClick={() => setIsNotifOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell size={28} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No notifications yet</p>
                  </div>
                ) : notifications.map((notif) => {
                  const { icon: Icon, color, bg } = notifConfig(notif.type);
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!notif.is_read ? 'bg-primary/[0.025]' : ''}`}
                    >
                      <div className={`size-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${bg}`}>
                        <Icon size={16} className={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-bold leading-snug ${!notif.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && <span className="size-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                        </div>
                        {notif.message && (
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                        )}
                        <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-1">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer link */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20">
                  <Link
                    to="/revenue"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                  >
                    Open Invoice Centre →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1" />

        {/* ── Profile dropdown ──────────────────────────────────────────── */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => { setIsProfileOpen((p) => !p); setIsNotifOpen(false); }}
            className={`flex items-center gap-3 cursor-pointer p-1.5 rounded-2xl transition-all group border ${isProfileOpen ? 'bg-white dark:bg-white/10 border-white/40 dark:border-white/20' : 'border-transparent hover:bg-white dark:hover:bg-white/5 hover:border-white/40 dark:hover:border-white/10'}`}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">{userName}</p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{roleName}</p>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 ring-2 ring-primary/10 group-hover:ring-primary/40 transition-all shadow-md">
                <User size={24} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
            </div>
            <ChevronDown className={`text-slate-400 group-hover:text-primary transition-all duration-300 ${isProfileOpen ? 'rotate-180 text-primary' : ''}`} size={16} />
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 px-2 animate-in fade-in slide-in-from-top-4 duration-200 backdrop-blur-xl z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Context</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">{profile?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all group"
              >
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Settings size={16} />
                </div>
                Settings
              </Link>
              <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all group"
              >
                <div className="p-1.5 bg-red-100 dark:bg-red-900/20 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-all">
                  <LogOut size={16} />
                </div>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
