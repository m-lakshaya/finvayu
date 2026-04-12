import React from 'react';
import { Search, Bell, ChevronDown, Menu, Sun, Moon, User, Settings, LogOut } from 'lucide-react';
import { useAuth, ROLES } from '../hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar, toggleTheme, isDarkMode }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const roleName = profile?.roles?.name || 'User';
  const userName = profile?.name || profile?.full_name || profile?.email?.split('@')[0] || 'User';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };
  return (
    <header className="h-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/20 dark:border-white/10 flex items-center justify-between px-8 flex-shrink-0 z-10 transition-all duration-300">
      <div className="flex items-center gap-6 flex-1">
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search everything..."
              className="w-full bg-slate-100/50 dark:bg-white/5 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-500 outline-none backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all duration-300"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all duration-300">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></span>
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>

        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-3 cursor-pointer p-1.5 rounded-2xl transition-all group border ${isProfileOpen ? 'bg-white dark:bg-white/10 border-white/40 dark:border-white/20' : 'border-transparent hover:bg-white dark:hover:bg-white/5 hover:border-white/40 dark:hover:border-white/10'}`}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">{userName}</p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{roleName}</p>
            </div>
            <div className="relative">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwRq7WtcgBcR3iM3wKoIa1S2wahAtAV6hH2X0nUzDcVWvODAlq2YJjXzVhM9TQuF3c_1LIjoszThcmWurVjcT9amJ2vcngobitabFctQteeM0ieNW_9PA2Rlz-9MtdQmFCuzHdaG4tTFVv8746g5xol6veRQ4XU2gZf-Emd2_wd7nMilPj6kcm3AtSWbtdXaQ8wwNFHLkCwD0QixwVL0G9gJi72hZU6dR07nFZ17YJHka3FTnALGv4lNDRkRh4yISv_tT085eH7Ak" 
                alt="User" 
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/10 group-hover:ring-primary/40 transition-all shadow-md"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full"></div>
            </div>
            <ChevronDown className={`text-slate-400 group-hover:text-primary transition-all duration-300 ${isProfileOpen ? 'rotate-180 text-primary' : ''}`} size={16} />
          </div>

          {/* User Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 px-2 animate-in fade-in slide-in-from-top-4 duration-200 backdrop-blur-xl">
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

              <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>

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
