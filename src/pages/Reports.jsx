import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  PieChart, 
  Download, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  UserPlus, 
  Rocket, 
  Loader2, 
  Users2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const Reports = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    monthlyVolume: [],
    topPerformer: null,
    conversionRate: 0,
    avgClosureTime: 0,
    partnerGrowth: 0
  });

  const fetchPerformanceData = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const [leadsRes, appsRes, profilesRes] = await Promise.all([
        supabase.from('leads').select('*').eq('org_id', profile.org_id),
        supabase.from('loan_applications').select('*, owner_id').eq('org_id', profile.org_id),
        supabase.from('profiles').select('id, name')
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (appsRes.error) throw appsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const leads = leadsRes.data || [];
      const apps = appsRes.data || [];
      const profiles = profilesRes.data || [];

      // Calculate Conversion Rate
      const totalLeads = leads.length;
      const closedLeads = leads.filter(l => l.status === 'Closed').length;
      const conversionRate = totalLeads ? ((closedLeads / totalLeads) * 100).toFixed(1) : 0;

      // Monthly Volume Trend (Last 7 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      const monthlyVolume = months.map((m, i) => {
        const monthApps = apps.filter(a => new Date(a.created_at).getMonth() === i);
        const volume = monthApps.reduce((sum, a) => sum + (Number(a.loan_amount) || 0), 0);
        return { label: m, volume: Math.round(volume / 100000) }; // in Lakhs
      });

      // Top Performer (By application count)
      const ownerCounts = apps.reduce((acc, a) => {
        acc[a.owner_id] = (acc[a.owner_id] || 0) + 1;
        return acc;
      }, {});
      
      const topOwnerId = Object.keys(ownerCounts).sort((a,b) => ownerCounts[b] - ownerCounts[a])[0];
      const topPerformerProf = profiles.find(p => p.id === topOwnerId);
      
      const topPerformer = {
        name: topPerformerProf?.name || 'Top Agent',
        count: ownerCounts[topOwnerId] || 0,
        rate: '78%' // Aggregated placeholder
      };

      setData({
        monthlyVolume,
        topPerformer,
        conversionRate,
        avgClosureTime: 12,
        partnerGrowth: 15
      });

    } catch (error) {
      console.error('Reports Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  if (loading) {
    return (
        <div className="h-[70vh] flex flex-col items-center justify-center animate-in fade-in duration-500 text-center">
            <Loader2 className="animate-spin text-primary mb-4" size={48} />
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Processing Performance Metrics...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Performance Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1 uppercase tracking-widest">Deep dive into conversion rates & branch velocity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-sm transition-all text-slate-600 dark:text-slate-300">
            <Calendar size={18} className="text-primary" />
            Quarterly View
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all">
            <Download size={18} />
            Generate Dossier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Growth trajectory</p>
              <h3 className="text-2xl font-black mt-1 tracking-tighter">Disbursement Pipeline</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary/20"></span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Actual</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full flex items-end justify-between gap-4 px-4 border-b border-slate-100 dark:border-slate-800 pb-2 relative z-10">
             {data.monthlyVolume.map((item, i) => (
              <div key={i} className="flex-1 group relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[9px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl z-20 whitespace-nowrap">
                   ₹{item.volume} Lakhs
                </div>
                <div className="w-full bg-emerald-500/10 rounded-t-2xl group-hover:bg-emerald-500/20 transition-all overflow-hidden flex flex-col justify-end min-h-[10px]" style={{ height: `${Math.max(item.volume, 10)}%` }}>
                  <div className="w-full bg-emerald-500 rounded-t-2xl transition-all duration-1000 delay-150 shadow-lg shadow-emerald-500/10" style={{ height: '60%' }}></div>
                </div>
                <div className="mt-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full"></div>
        </div>

        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 text-center">Star Executive</h3>
          <div className="flex flex-col items-center text-center">
            <div className="size-28 rounded-full border-4 border-primary p-1.5 mb-6 shadow-2xl shadow-primary/20 relative group-hover:scale-105 transition-transform">
              <div className="size-full rounded-full bg-slate-950 flex items-center justify-center">
                 <Users2 size={40} className="text-primary" />
              </div>
              <div className="absolute -bottom-2 -right-2 size-10 bg-amber-400 text-white rounded-xl flex items-center justify-center font-black shadow-lg border-2 border-white dark:border-slate-900 rotate-12 group-hover:rotate-0 transition-transform">1</div>
            </div>
            <h4 className="text-2xl font-black tracking-tighter">{data.topPerformer?.name}</h4>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-2">Senior Portfolio Manager</p>
            <div className="grid grid-cols-2 gap-4 w-full mt-10">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Efficiency</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tighter">{data.topPerformer?.rate}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Throughput</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tighter">{data.topPerformer?.count} Files</p>
              </div>
            </div>
          </div>
          <button className="w-full mt-12 py-4 bg-slate-950 dark:bg-white dark:text-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-95">View Rankings</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Conversion Velocity', value: `${data.conversionRate}%`, change: '+5.2%', up: true, icon: Activity, color: 'text-emerald-500' },
          { label: 'Avg Closure Cycle', value: `${data.avgClosureTime} Days`, change: '-2 Days', up: true, icon: Rocket, color: 'text-blue-500' },
          { label: 'Partner Onboarding', value: `+${data.partnerGrowth}`, change: 'Weekly', up: true, icon: UserPlus, color: 'text-primary' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-primary/50 transition-all flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className={`p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl ${stat.color} group-hover:bg-primary group-hover:text-white transition-all shadow-sm`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h4 className="text-2xl font-black tracking-tighter">{stat.value}</h4>
              </div>
            </div>
            <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${stat.up ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-500 dark:bg-rose-900/20'}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
