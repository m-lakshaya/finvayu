import React from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink, 
  Search, 
  Filter, 
  Plus,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

const BankerCard = ({ banker }) => (
  <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
    <div className={`absolute top-0 right-0 p-2 ${banker.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'}`}>
      <ShieldCheck size={20} />
    </div>
    <div className="flex items-start justify-between mb-6">
      <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl group-hover:scale-110 transition-transform">
        {banker.institution[0]}
      </div>
    </div>
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{banker.name}</h4>
        <p className="text-xs font-bold text-primary uppercase tracking-wider">{banker.institution}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <MapPin size={14} className="text-slate-400" />
          {banker.branch}
        </div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <Phone size={14} className="text-slate-400" />
          {banker.phone}
        </div>
      </div>
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Products</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 italic">{banker.products}</span>
        </div>
        <button className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-primary hover:text-white transition-all">
          <ExternalLink size={16} />
        </button>
      </div>
    </div>
  </div>
);

const Bankers = () => {
  const bankers = [
    { name: 'Amitabh Sharma', institution: 'HDFC Bank', branch: 'Mumbai Corporate Office', phone: '+91 98765 00111', products: 'Home, LAP, PL', status: 'Active' },
    { name: 'Priya Rajan', institution: 'ICICI Bank', branch: 'Chennai Regional Hub', phone: '+91 98765 00222', products: 'Business Loan, CC', status: 'Active' },
    { name: 'Vikram Singh', institution: 'Axis Bank', branch: 'Delhi NCR Tower', phone: '+91 98765 00333', products: 'Auto Loan, Mortgage', status: 'Inactive' },
    { name: 'Sneha Gupta', institution: 'SBI', branch: 'Bangalore MG Road', phone: '+91 98765 00444', products: 'Retail Assets', status: 'Active' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Banker Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Manage and access your point of contact at financial institutions.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
          <Plus size={18} />
          Add New Banker
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by name, bank, or city..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
        </div>
        <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none min-w-[150px]">
          <option>All Institutions</option>
          <option>HDFC Bank</option>
          <option>ICICI Bank</option>
          <option>Axis Bank</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Banker Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {bankers.map((banker, i) => (
          <BankerCard key={i} banker={banker} />
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Connected Banks</p>
            <h4 className="text-3xl font-extrabold mt-1">12</h4>
          </div>
          <Building2 size={48} className="text-primary/10 absolute -right-2 -bottom-2" />
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Bankers</p>
            <h4 className="text-3xl font-extrabold mt-1 text-emerald-500">48</h4>
          </div>
          <Users2 className="text-emerald-500/10 absolute -right-2 -bottom-2" />
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Files</p>
            <h4 className="text-3xl font-extrabold mt-1 text-primary">156</h4>
          </div>
          <ArrowUpRight size={48} className="text-primary/10 absolute -right-2 -bottom-2" />
        </div>
      </div>
    </div>
  );
};

export default Bankers;
import { Users2 } from 'lucide-react';
