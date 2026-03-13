import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ArrowUpDown,
  Download
} from 'lucide-react';
import ExotelCallButton from '../components/ExotelCallButton';

const LeadList = () => {
  const location = useLocation();
  const isCustomers = location.pathname.includes('customers');

  const title = isCustomers ? 'Customer Management' : 'Lead Management';
  const subtitle = isCustomers ? 'Manage and track your active customer database' : 'Track and convert your potential loan opportunities';
  const btnText = isCustomers ? 'Add Customer' : 'Create Lead';


  const mockData = [
    { id: 1, name: 'Michael Chen', phone: '+91 98765 43210', email: 'm.chen@example.com', status: 'New', score: 88, source: 'Web Form', date: '2024-03-12' },
    { id: 2, name: 'Elena Rodriguez', phone: '+91 87654 32109', email: 'elena.r@agency.com', status: 'Contacted', score: 92, source: 'Referral', date: '2024-03-11' },
    { id: 3, name: 'James Wilson', phone: '+91 76543 21098', email: 'james.w@outlook.com', status: 'Qualified', score: 85, source: 'Direct', date: '2024-03-10' },
    { id: 4, name: 'Sarah Ahmed', phone: '+91 65432 10987', email: 'sarah.a@gmail.com', status: 'Follow-up', score: 78, source: 'Social', date: '2024-03-09' },
    { id: 5, name: 'Robert Taylor', phone: '+91 54321 09876', email: 'robert.t@company.in', status: 'Waiting', score: 65, source: 'Advertisement', date: '2024-03-08' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:shadow-sm transition-all border-dashed">
            <Download size={16} />
            Export CSV
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
            <Plus size={18} />
            {btnText}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${isCustomers ? 'customers' : 'leads'} by name, email or phone...`}
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

      {/* Table Container */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Name & Details</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Status</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-center">Score</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Source</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Created</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mockData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xs uppercase">
                        {item.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tighter border ${item.status === 'New' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50' :
                        item.status === 'Contacted' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50' :
                          item.status === 'Qualified' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800/50' :
                            'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                      }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-extrabold text-primary">
                    <div className="flex flex-col items-center gap-1">
                      <span>{item.score}</span>
                      <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${item.score}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-semibold text-xs tracking-tight">
                    {item.source}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExotelCallButton phone={item.phone} compact leadId={String(item.id)} />
                      </div>
                      <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Showing 5 of 1,284 entries</p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-50" disabled>
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(p => (
                <button key={p} className={`size-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${p === 1 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-800'}`}>
                  {p}
                </button>
              ))}
            </div>
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadList;
