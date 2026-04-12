import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  Filter,
  Users,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const Revenue = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalRevenue: 0,
    netCommission: 0,
    pendingPayouts: 0,
    activePartners: 0,
    transactions: [],
    breakdown: []
  });

  const fetchRevenueData = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      // Fetch Loan Apps and Collaborators
      const [appsRes, collabRes] = await Promise.all([
        supabase.from('loan_applications').select('*, leads(name)').eq('org_id', profile.org_id),
        supabase.from('collaborators').select('*').eq('org_id', profile.org_id)
      ]);

      if (appsRes.error) throw appsRes.error;
      if (collabRes.error) throw collabRes.error;

      const apps = appsRes.data || [];
      const partners = collabRes.data || [];

      // Calculate Stats
      const disbursedApps = apps.filter(a => a.stage === 'Completed');
      const totalVolume = disbursedApps.reduce((sum, a) => sum + (Number(a.loan_amount) || 0), 0);
      const netCommission = totalVolume * 0.015; // Assuming 1.5% avg commission
      const pendingVolume = apps.filter(a => a.stage !== 'Completed').reduce((sum, a) => sum + (Number(a.loan_amount) || 0), 0);
      const pendingPayouts = pendingVolume * 0.015;

      // Transactions (Last 5 disbursed apps)
      const transactions = disbursedApps
        .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(a => ({
          id: `APP-${a.id.slice(0,4).toUpperCase()}`,
          partner: a.leads?.name || 'Direct Client',
          amount: `₹${(Number(a.loan_amount) || 0).toLocaleString()}`,
          commission: `₹${((Number(a.loan_amount) || 0) * 0.015).toLocaleString()}`,
          date: new Date(a.created_at).toLocaleDateString(),
          status: 'Settled',
          type: a.loan_type
        }));

      // Breakdown by Loan Type
      const types = [...new Set(apps.map(a => a.loan_type))];
      const breakdown = types.map(t => {
        const typeApps = disbursedApps.filter(a => a.loan_type === t);
        const typeVolume = typeApps.reduce((sum, a) => sum + (Number(a.loan_amount) || 0), 0);
        return {
          label: t,
          value: totalVolume ? Math.round((typeVolume / totalVolume) * 100) : 0,
          amount: `₹${(typeVolume / 100000).toFixed(1)}L`,
          color: t === 'Home Loan' ? 'bg-primary' : t === 'Personal Loan' ? 'bg-emerald-500' : 'bg-indigo-500'
        };
      });

      setData({
        totalRevenue: totalVolume,
        netCommission,
        pendingPayouts,
        activePartners: partners.length,
        transactions,
        breakdown
      });

    } catch (error) {
      console.error('Revenue Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  if (loading) {
    return (
        <div className="h-[70vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
            <Loader2 className="animate-spin text-primary mb-4" size={48} />
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Calculating Payout Ledger...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Revenue & Commissions</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1 uppercase tracking-widest">Live Branch Performance • {profile?.role}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase hover:shadow-sm transition-all tracking-widest">
            <Download size={14} className="text-primary" />
            Export Settlement
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase hover:shadow-lg hover:shadow-primary/20 transition-all tracking-widest">
            Process Payouts
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Volume', value: `₹${(data.totalRevenue / 10000000).toFixed(2)}Cr`, change: '+14%', up: true, icon: DollarSign, color: 'text-primary bg-primary/10' },
          { label: 'Net Earnings', value: `₹${(data.netCommission / 100000).toFixed(2)}L`, change: '+8%', up: true, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Pending Payout', value: `₹${(data.pendingPayouts / 1000).toFixed(1)}K`, change: 'Locked', up: false, icon: PieChart, color: 'text-orange-500 bg-orange-500/10' },
          { label: 'Network Partners', value: data.activePartners, change: 'Active', up: true, icon: Users, color: 'text-indigo-500 bg-indigo-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`p-3 rounded-xl ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-[9px] font-black uppercase ${stat.up ? 'text-emerald-500' : 'text-slate-400'}`}>
                {stat.up && <ArrowUpRight size={14} />}
                {stat.change}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1 relative z-10">{stat.label}</p>
            <h4 className="text-3xl font-black tracking-tighter relative z-10">{stat.value}</h4>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 dark:bg-slate-800/20 rounded-full blur-2xl group-hover:bg-primary/5 transition-all"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transactions Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100">Recent Settlements</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-primary transition-all"><Filter size={16} /></button>
                <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-primary transition-all"><Calendar size={16} /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                  <tr>
                    <th className="px-6 py-4">Ref ID</th>
                    <th className="px-6 py-4">Entity/Product</th>
                    <th className="px-6 py-4">Total Value</th>
                    <th className="px-6 py-4">Commission</th>
                    <th className="px-6 py-4 text-right">Settled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.transactions.length === 0 ? (
                      <tr>
                          <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No disbursements recorded in current cycle.</td>
                      </tr>
                  ) : data.transactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                      <td className="px-6 py-5 font-mono text-[10px] font-black text-primary">{txn.id}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <p className="font-black text-slate-900 dark:text-slate-100">{txn.partner}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{txn.type}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-black text-slate-900 dark:text-slate-100">{txn.amount}</td>
                      <td className="px-6 py-5">
                        <span className="text-emerald-500 font-black text-xs">+{txn.commission}</span>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-slate-400 text-[10px] uppercase">
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
          <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">Segmental Split</h3>
            <div className="space-y-6">
              {data.breakdown.length === 0 ? (
                  <p className="text-center text-slate-400 text-[10px] font-bold uppercase py-10">Data awaiting ingestion.</p>
              ) : data.breakdown.map((item, i) => (
                <div key={i} className="space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">{item.label}</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">{item.amount}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 p-6 bg-slate-950 rounded-2xl relative overflow-hidden shadow-2xl">
              <div className="relative z-10 text-center">
                <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] mb-2">Internal Burn Index</p>
                <h4 className="text-white text-3xl font-black tracking-tighter">0.14%</h4>
                <div className="mt-3 flex items-center justify-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                  <div className="size-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  Health: Optimized
                </div>
              </div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-3xl rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenue;
