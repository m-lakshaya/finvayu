import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Building2,
  ArrowUpDown,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Star
} from 'lucide-react';
import ExotelCallButton from '../components/ExotelCallButton';

const statusConfig = {
  'Active': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50',
  'Prospect': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50',
  'At Risk': 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800/50',
  'Churned': 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
};

const industryConfig = {
  'Real Estate': { icon: Building2, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  'Manufacturing': { icon: TrendingUp, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  'Retail': { icon: Star, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  'Healthcare': { icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
  'Technology': { icon: TrendingUp, color: 'text-primary bg-primary/10' },
};

const accounts = [
  {
    id: 'ACC-0001',
    company: 'Shree Developers Pvt Ltd',
    owner: 'Sarah Jenkins',
    industry: 'Real Estate',
    phone: '+919876543210',
    loanValue: '₹2.4 Cr',
    contacts: 4,
    status: 'Active',
    lastActivity: '2024-03-12',
    city: 'Mumbai',
  },
  {
    id: 'ACC-0002',
    company: 'Priya Manufacturing Co.',
    owner: 'Rahul Nair',
    industry: 'Manufacturing',
    phone: '+919876500987',
    loanValue: '₹85 L',
    contacts: 2,
    status: 'Prospect',
    lastActivity: '2024-03-11',
    city: 'Pune',
  },
  {
    id: 'ACC-0003',
    company: 'Mehta Retail Stores',
    owner: 'Ananya Sharma',
    industry: 'Retail',
    phone: '+919988012345',
    loanValue: '₹1.1 Cr',
    contacts: 6,
    status: 'Active',
    lastActivity: '2024-03-10',
    city: 'Ahmedabad',
  },
  {
    id: 'ACC-0004',
    company: 'WellCare Health Clinics',
    owner: 'Kiran Bose',
    industry: 'Healthcare',
    phone: '+917766099001',
    loanValue: '₹55 L',
    contacts: 3,
    status: 'At Risk',
    lastActivity: '2024-03-09',
    city: 'Bengaluru',
  },
  {
    id: 'ACC-0005',
    company: 'NextGen Software Pvt Ltd',
    owner: 'Sarah Jenkins',
    industry: 'Technology',
    phone: '+919898989898',
    loanValue: '₹3.2 Cr',
    contacts: 8,
    status: 'Active',
    lastActivity: '2024-03-08',
    city: 'Hyderabad',
  },
];

const stats = [
  { label: 'Total Accounts', value: '284', icon: Building2, color: 'text-primary bg-primary/10' },
  { label: 'Active Accounts', value: '198', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
  { label: 'Total Loan Book', value: '₹48.2 Cr', icon: DollarSign, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  { label: 'Avg Account Score', value: '82', icon: Star, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
];

const Customers = () => {
  const [search, setSearch] = useState('');

  const filtered = accounts.filter(a =>
    a.company.toLowerCase().includes(search.toLowerCase()) ||
    a.owner.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Customer Accounts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            Business accounts — company records, relationship owners, and loan portfolios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:shadow-sm transition-all border-dashed">
            <Download size={16} />
            Export CSV
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
            <Plus size={18} />
            New Account
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className={`size-11 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <h4 className="text-xl font-extrabold mt-0.5">{s.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by company, owner, or city..."
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <Filter size={16} />
            Filters
          </button>
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <ArrowUpDown size={16} />
            Sort
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Account</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Industry</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Relationship Owner</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-center">Contacts</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Loan Value</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Status</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Last Activity</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(acc => {
                const ind = industryConfig[acc.industry] || { icon: Building2, color: 'text-slate-500 bg-slate-100' };
                return (
                  <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group">
                    {/* Account */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${ind.color}`}>
                          <ind.icon size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{acc.company}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{acc.id} · {acc.city}</p>
                        </div>
                      </div>
                    </td>
                    {/* Industry */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{acc.industry}</td>
                    {/* Owner */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="size-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-bold uppercase">
                          {acc.owner.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{acc.owner}</span>
                      </div>
                    </td>
                    {/* Contacts */}
                    <td className="px-6 py-4 text-center font-bold text-primary text-sm">{acc.contacts}</td>
                    {/* Loan Value */}
                    <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-slate-100 text-sm">{acc.loanValue}</td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tighter border ${statusConfig[acc.status] || ''}`}>
                        {acc.status}
                      </span>
                    </td>
                    {/* Last Activity */}
                    <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                      {new Date(acc.lastActivity).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExotelCallButton phone={acc.phone} compact leadId={acc.id} />
                        </div>
                        <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Showing {filtered.length} of 284 accounts</p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-50" disabled>
              <ChevronLeft size={16} />
            </button>
            {[1, 2, 3].map(p => (
              <button key={p} className={`size-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${p === 1 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-800'}`}>
                {p}
              </button>
            ))}
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
