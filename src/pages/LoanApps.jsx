import React from 'react';
import { 
  BarChart2, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  KanbanSquare
} from 'lucide-react';

const LoanApps = () => {
  const pipelines = [
    { title: 'In Discussion', count: 12, value: '₹4.2 Cr', color: 'bg-primary' },
    { title: 'Documentation', count: 8, value: '₹2.8 Cr', color: 'bg-indigo-500' },
    { title: 'Bank Processing', count: 15, value: '₹8.4 Cr', color: 'bg-amber-500' },
    { title: 'Disbursal Stage', count: 4, value: '₹1.2 Cr', color: 'bg-emerald-500' },
  ];

  const applications = [
    { id: 'APP-1021', name: 'Rohan Mehra', loanType: 'Home Loan', amount: '₹85,00,000', bank: 'HDFC Bank', stage: 'Bank Processing', updated: '2h ago' },
    { id: 'APP-1022', name: 'Sneha Enterprise', loanType: 'Business Expansion', amount: '₹1,20,00,000', bank: 'ICICI Bank', stage: 'Documentation', updated: '4h ago' },
    { id: 'APP-1023', name: 'Amitabh Sharma', loanType: 'Mortgage Loan', amount: '₹42,00,000', bank: 'Axis Bank', stage: 'In Discussion', updated: 'Yesterday' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Loan Pipeline</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Track case progress across banks and optimize turnaround times.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:shadow-sm transition-all text-slate-600 dark:text-slate-300">
            <KanbanSquare size={16} />
            Board View
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
            <Plus size={18} />
            Create Application
          </button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pipelines.map((p, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
            <div className={`absolute top-0 left-0 w-1 h-full ${p.color}`}></div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{p.title}</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black italic">{p.count}</h4>
              <span className="text-xs font-bold text-slate-500">Files</span>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-2">{p.value}</p>
          </div>
        ))}
      </div>

      {/* Active Pipeline List */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-extrabold text-lg tracking-tight italic">Active Applications</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search app id or name..." className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-primary/20 transition-all outline-none" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Application ID</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Loan Config</th>
                <th className="px-6 py-4">Bank Partner</th>
                <th className="px-6 py-4">Pipeline Stage</th>
                <th className="px-6 py-4 text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group cursor-pointer">
                  <td className="px-6 py-5 font-mono text-xs font-black text-primary uppercase">{app.id}</td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{app.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Retail Asset Client</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300">{app.amount}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{app.loanType}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 italic">
                      <Building2 size={14} className="text-primary" />
                      {app.bank}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${
                        app.stage === 'Bank Processing' ? 'bg-amber-500' :
                        app.stage === 'Documentation' ? 'bg-indigo-500' :
                        'bg-primary'
                      } animate-pulse`}></span>
                      <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700 dark:text-slate-300">{app.stage}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">Updated {app.updated}</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-300 group-hover:text-primary transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanApps;
