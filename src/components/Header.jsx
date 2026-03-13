import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 flex-shrink-0 z-10">
      <div className="flex-1 max-w-2xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search leads, applications, or customers..."
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-500 outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>

        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-xl transition-all group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-none text-slate-900 dark:text-slate-100">Sarah Jenkins</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Branch Manager</p>
          </div>
          <div className="relative">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwRq7WtcgBcR3iM3wKoIa1S2wahAtAV6hH2X0nUzDcVWvODAlq2YJjXzVhM9TQuF3c_1LIjoszThcmWurVjcT9amJ2vcngobitabFctQteeM0ieNW_9PA2Rlz-9MtdQmFCuzHdaG4tTFVv8746g5xol6veRQ4XU2gZf-Emd2_wd7nMilPj6kcm3AtSWbtdXaQ8wwNFHLkCwD0QixwVL0G9gJi72hZU6dR07nFZ17YJHka3FTnALGv4lNDRkRh4yISv_tT085eH7Ak" 
              alt="User" 
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all shadow-sm"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
          </div>
          <ChevronDown className="text-slate-400 group-hover:text-slate-600 transition-colors" size={16} />
        </div>
      </div>
    </header>
  );
};

export default Header;
