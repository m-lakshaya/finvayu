import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  Filter,
  Users
} from 'lucide-react';

const Revenue = () => {
  const transactions = [
    { id: 'TXN-991', partner: 'Rajesh Enterprise', amount: '₹12,400', date: 'Mar 12, 2024', status: 'Settled', type: 'Commission' },
    { id: 'TXN-992', partner: 'Smart Finserv', amount: '₹45,000', date: 'Mar 11, 2024', status: 'Pending', type: 'Lead Bonus' },
    { id: 'TXN-993', partner: 'Kiran Consultancy', amount: '₹8,200', date: 'Mar 10, 2024', status: 'Settled', type: 'Commission' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Revenue & Commissions</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Monitor payouts, track earnings, and analyze financial performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:shadow-sm transition-all">
            <Download size={18} />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
            Process Payouts
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: '₹12.4M', change: '+14.2%', up: true, icon: DollarSign, color: 'text-primary bg-primary/10' },
          { label: 'Net Commission', value: '₹1.8M', change: '+8.4%', up: true, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Pending Payouts', value: '₹4.2L', change: '-2.1%', up: false, icon: PieChart, color: 'text-orange-500 bg-orange-500/10' },
          { label: 'Active Partners', value: '1,248', change: '+12', up: true, icon: Users, color: 'text-indigo-500 bg-indigo-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${stat.up ? 'text-emerald-500' : 'text-orange-500'}`}>
                {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
            <h4 className="text-2xl font-black">{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transactions Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-lg italic tracking-tight">Recent Settlements</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-primary transition-all"><Filter size={16} /></button>
                <button className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-primary transition-all"><Calendar size={16} /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Partner Agency</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                      <td className="px-6 py-5 font-mono text-[11px] font-extrabold text-primary">{txn.id}</td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{txn.partner}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{txn.type}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-black text-slate-900 dark:text-slate-100">{txn.amount}</td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                          txn.status === 'Settled' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20' : 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-medium text-slate-500 text-xs">
                        {txn.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">Revenue Breakdown</h3>
            <div className="space-y-6">
              {[
                { label: 'Home Loan Payouts', value: '45%', amount: '₹5.6M', color: 'bg-primary' },
                { label: 'Business Expansion', value: '28%', amount: '₹3.4M', color: 'bg-emerald-500' },
                { label: 'Unsecured Loans', value: '15%', amount: '₹1.8M', color: 'bg-indigo-500' },
                { label: 'Others (Bonus)', value: '12%', amount: '₹1.5M', color: 'bg-slate-400' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">{item.amount}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full`} style={{ width: item.value }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 p-4 bg-slate-900 rounded-xl relative overflow-hidden">
              <div className="relative z-10 text-center">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Projected Q2</p>
                <h4 className="text-white text-3xl font-black">₹42.5M</h4>
                <div className="mt-2 flex items-center justify-center gap-1 text-emerald-400 text-[10px] font-black uppercase">
                  <TrendingUp size={12} /> Target: 88% Reached
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenue;
