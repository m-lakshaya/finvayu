import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserPlus, 
  Calendar, 
  Timer, 
  Activity, 
  ArrowUpRight,
  Globe,
  CircleDollarSign,
  Trophy,
  PhoneCall,
  ChevronRight,
  Loader2,
  IndianRupee,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, change, icon: Icon, color = "primary", urgent = false }) => (
  <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className={`p-3 bg-${color}/10 text-${color} rounded-xl group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      {urgent ? (
        <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full border border-orange-100 dark:border-orange-800/30 animate-pulse">URGENT</span>
      ) : (
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/30">{change}</span>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-extrabold mt-1 tracking-tight">{value}</h3>
        {change && !urgent && <span className="text-[10px] text-slate-400 font-bold">LIFETIME</span>}
      </div>
    </div>
    <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${color}/5 rounded-full blur-2xl group-hover:bg-${color}/10 transition-colors`}></div>
  </div>
);

const SourceBar = ({ label, percentage, color = "primary" }) => (
  <div className="flex items-center gap-4">
    <span className="text-[10px] font-extrabold uppercase text-slate-400 w-20 tracking-wider truncate">{label}</span>
    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={`bg-primary h-full rounded-full transition-all duration-1000 ease-out`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
    <span className="text-xs font-bold w-10 text-right">{percentage}%</span>
  </div>
);

const BranchIntelligenceModal = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/20 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black tracking-tight">Organization Intelligence</h3>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Cross-Branch Performance & Efficiency Metrics</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Close</button>
            </div>
            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lead Velocity</p>
                        <h4 className="text-3xl font-black">4.2 Days</h4>
                        <p className="text-[10px] text-emerald-500 font-bold mt-2">↑ 12% faster than last month</p>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resource Efficiency</p>
                        <h4 className="text-3xl font-black">88.4%</h4>
                        <p className="text-[10px] text-primary font-bold mt-2">Optimal Load</p>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Conversion Alpha</p>
                        <h4 className="text-3xl font-black">24.1%</h4>
                        <p className="text-[10px] text-emerald-500 font-bold mt-2">↑ Top Decile Performance</p>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Branch Performance Heatmap</h4>
                    <div className="space-y-4">
                        {[
                            { name: 'Hyderabad Main', conversion: 78, volume: 'High' },
                            { name: 'Bangalore Tech Park', conversion: 92, volume: 'Mid' },
                            { name: 'Mumbai Corporate', conversion: 64, volume: 'Extreme' },
                            { name: 'Delhi North', conversion: 45, volume: 'Low' }
                        ].map(branch => (
                            <div key={branch.name} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <span className="text-sm font-bold">{branch.name}</span>
                                <div className="flex items-center gap-6">
                                    <div className="w-32 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${branch.conversion}%` }}></div>
                                    </div>
                                    <span className="text-xs font-black w-8">{branch.conversion}%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase w-16">{branch.volume}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

const Dashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    newToday: 0,
    pendingFollowups: 0,
    appsProgress: 0,
    totalRevenue: 0,
    pendingCommissions: 0,
    totalEarnings: 0,
    readyToInvoice: 0,
    sourceDistribution: [],
    funnel: { new: 0, contacted: 0, qualified: 0, closed: 0 },
    recentLeads: [],
    upcomingFollowups: []
  });
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0,0,0,0);

      const roleName = profile?.roles?.name?.toLowerCase() || '';
      const isPartner = ['collaborator', 'banker', 'sales agent'].includes(roleName);
      const isRM = roleName === 'regional manager';

      let leadsQuery = supabase.from('leads').select('*').eq('org_id', profile.org_id);
      let appsQuery = supabase.from('loan_applications').select('*').eq('org_id', profile.org_id);

      if (isPartner) {
        leadsQuery = leadsQuery.eq('owner_id', profile.id);
        appsQuery = appsQuery.eq('owner_id', profile.id);
      } else if (isRM) {
        // In a real app, you'd filter by branch_id or parent_role_id
        // For now, let's assume RMs see their own + siblings' data if not CEO
        leadsQuery = leadsQuery.eq('org_id', profile.org_id); 
      }

      const [leadsRes, appsRes] = await Promise.all([
        leadsQuery,
        appsQuery
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (appsRes.error) throw appsRes.error;

      const leads = leadsRes.data || [];
      const apps = appsRes.data || [];

      // Stat Cards
      const newToday = leads.filter(l => new Date(l.created_at) >= today).length;
      const pendingFollowups = leads.filter(l => l.follow_up_date && new Date(l.follow_up_date) <= new Date()).length;
      const appsProgress = apps.filter(a => a.stage !== 'Completed').length;
      
      // Financial Stats
      let totalRevenue = 0;
      let pendingCommissions = 0;
      let totalEarnings = 0;
      let readyToInvoice = 0;

      if (roleName === 'ceo') {
        totalRevenue = leads
          .filter(l => l.status === 'Closed' || l.status === 'Disbursed')
          .reduce((sum, l) => sum + (l.loan_amount || 0), 0);
        
        pendingCommissions = leads
          .filter(l => l.invoice_status === 'raised')
          .reduce((sum, l) => sum + (l.commission_amount || 0), 0);
        
        totalEarnings = leads
          .filter(l => l.invoice_status === 'paid')
          .reduce((sum, l) => sum + (l.commission_amount || 0), 0);
      } else {
        // Stats for Banker/Collaborator
        totalEarnings = leads
          .filter(l => l.invoice_status === 'paid')
          .reduce((sum, l) => sum + (l.commission_amount || 0), 0);
        
        pendingCommissions = leads
          .filter(l => l.invoice_status === 'raised')
          .reduce((sum, l) => sum + (l.commission_amount || 0), 0);

        readyToInvoice = leads
          .filter(l => (l.status === 'Approved' || l.status === 'Loan Approved') && l.invoice_status === 'pending')
          .length;
      }

      // Source Distribution
      const sources = ['Direct', 'Referral', 'Website', 'Social'];
      const sourceDistribution = sources.map(s => {
        const count = leads.filter(l => l.source === s).length;
        return { label: s, percentage: leads.length ? Math.round((count / leads.length) * 100) : 0 };
      });

      // Funnel
      const funnel = {
        new: leads.filter(l => l.status === 'New').length,
        contacted: leads.filter(l => l.status === 'Contacted').length,
        qualified: leads.filter(l => l.status === 'Qualified').length,
        closed: leads.filter(l => l.status === 'Closed').length
      };

      // Recent Leads (Latest 3)
      const recentLeads = [...leads].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);

      // Upcoming Followups (Next 3)
      const upcomingFollowups = leads
        .filter(l => l.follow_up_date)
        .sort((a,b) => new Date(a.follow_up_date) - new Date(b.follow_up_date))
        .slice(0, 3);

      setStats({
        totalLeads: leads.length,
        newToday,
        pendingFollowups,
        appsProgress,
        totalRevenue,
        pendingCommissions,
        totalEarnings,
        readyToInvoice,
        sourceDistribution,
        funnel,
        recentLeads,
        upcomingFollowups
      });

    } catch (error) {
      console.error('Dashboard Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
         <Loader2 className="animate-spin text-primary mb-4" size={48} />
         <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Aggregating Branch Performance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Financial Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">Finvayu Credits • Branch Overview • {profile?.roles?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:shadow-sm transition-all text-slate-600 dark:text-slate-300">
            <Calendar size={16} className="text-primary" />
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </button>
          <button 
            onClick={() => setIsIntelligenceOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <ArrowUpRight size={16} />
            Branch Intelligence
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {profile?.roles?.name?.toLowerCase() === 'ceo' ? (
          <>
            <StatCard title="Total Leads" value={stats.totalLeads.toLocaleString()} change="+8%" icon={UserPlus} />
            <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} change="LIFETIME" icon={IndianRupee} color="emerald-500" />
            <StatCard title="Commission Outflow" value={`₹${stats.pendingCommissions.toLocaleString()}`} urgent icon={Activity} color="orange-500" />
            <StatCard title="Total Payouts" value={`₹${stats.totalEarnings.toLocaleString()}`} change="PAID" icon={CheckCircle2} color="blue-500" />
          </>
        ) : (
          <>
            <StatCard title="My Total Leads" value={stats.totalLeads.toLocaleString()} change="ACTIVE" icon={UserPlus} />
            <StatCard title="Total Earned" value={`₹${stats.totalEarnings.toLocaleString()}`} change="PAID" icon={CheckCircle2} color="emerald-500" />
            <StatCard title="Pending Invoices" value={`₹${stats.pendingCommissions.toLocaleString()}`} change="RAISED" icon={IndianRupee} color="blue-500" />
            <StatCard title="Ready to Invoice" value={stats.readyToInvoice} urgent icon={Timer} color="orange-500" />
          </>
        )}
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Leads by Source */}
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Origination Mix</h4>
            <Globe className="text-primary/40" size={20} />
          </div>
          <div className="space-y-6">
            {stats.sourceDistribution.map((s, i) => (
              <SourceBar key={i} label={s.label} percentage={s.percentage} />
            ))}
          </div>
        </div>

        {/* Status Funnel */}
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Conversion Funnel</h4>
            <Activity className="text-primary/40" size={20} />
          </div>
          <div className="flex flex-col gap-2.5 relative">
            <div className="bg-primary/90 h-14 w-full rounded-2xl flex items-center justify-between px-6 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              <span>New Interest</span>
              <span className="bg-white/20 px-3 py-1 rounded-lg">{stats.funnel.new}</span>
            </div>
            <div className="bg-primary/70 h-12 w-[85%] mx-auto rounded-2xl flex items-center justify-between px-6 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              <span>Engaged</span>
              <span className="bg-white/20 px-3 py-1 rounded-lg">{stats.funnel.contacted}</span>
            </div>
            <div className="bg-primary/50 h-12 w-[70%] mx-auto rounded-2xl flex items-center justify-between px-6 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              <span>Sanctioned</span>
              <span className="bg-white/20 px-3 py-1 rounded-lg">{stats.funnel.qualified}</span>
            </div>
            <div className="bg-emerald-500 h-12 w-[55%] mx-auto rounded-2xl flex items-center justify-between px-6 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              <span>Disbursed</span>
              <span className="bg-white/20 px-3 py-1 rounded-lg">{stats.funnel.closed}</span>
            </div>
          </div>
        </div>

        {/* Efficiency Chart */}
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Velocity Index</h4>
            <CircleDollarSign className="text-emerald-500" size={24} />
          </div>
          <div className="flex items-baseline gap-2 mb-8">
            <h3 className="text-5xl font-black text-primary tracking-tighter">9.2</h3>
            <span className="text-emerald-500 text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg tracking-wide uppercase">Optimal</span>
          </div>
          <div className="h-32 flex items-end justify-between gap-1.5 relative z-10 px-2">
            {[40, 60, 30, 80, 50, 100, 70, 90].map((h, i) => (
              <div 
                key={i} 
                className={`w-full ${i === 7 ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'} rounded-t-xl transition-all duration-700 ease-out cursor-pointer hover:scale-x-110`}
                style={{ height: `${h}%` }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[8px] font-black text-slate-400 tracking-[0.2em] px-1 uppercase">
             <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>W5</span><span>W6</span><span>W7</span><span>W8</span>
          </div>
        </div>
      </div>

      {/* Row: Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-8">
        {/* Recent Leads Table */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-900 dark:text-slate-100">Latest Acquisitions</h4>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Live feed from intake</p>
            </div>
            <Link to="/leads" className="flex items-center gap-1 text-primary text-[10px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
              Access Vault <ChevronRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[9px] tracking-[0.15em]">
                <tr>
                  <th className="px-8 py-4">Client Entity</th>
                  <th className="px-8 py-4">Origination</th>
                  <th className="px-8 py-4">Current Deck</th>
                  <th className="px-8 py-4 text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.recentLeads.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-8 py-10 text-center text-slate-400 text-xs font-bold uppercase">No ingestion detected in current cycle.</td>
                    </tr>
                ) : stats.recentLeads.map((lead, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group/row">
                    <td className="px-8 py-5 font-black text-slate-900 dark:text-slate-100 group-hover/row:text-primary transition-colors">{lead.name}</td>
                    <td className="px-8 py-5 text-slate-500 font-bold text-[10px] uppercase tracking-tighter">{lead.source || 'Direct'}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-lg border border-primary/20 uppercase tracking-tighter`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center font-black text-primary">{lead.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Follow-ups */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-900 dark:text-slate-100">Critical Touchpoints</h4>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">High-Priority Retainment</p>
            </div>
            <button className="flex items-center gap-1 text-primary text-[10px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
              Full Strategy <ChevronRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[9px] tracking-[0.15em]">
                <tr>
                  <th className="px-8 py-4">Client</th>
                  <th className="px-8 py-4">Deadline</th>
                  <th className="px-8 py-4">Intent</th>
                  <th className="px-8 py-4 text-center">Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.upcomingFollowups.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-8 py-10 text-center text-slate-400 text-xs font-bold uppercase">Zero high-velocity triggers pending.</td>
                    </tr>
                ) : stats.upcomingFollowups.map((task, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer">
                    <td className="px-8 py-5 font-black text-slate-800 dark:text-slate-200">{task.name}</td>
                    <td className="px-8 py-5 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-tighter">
                        {new Date(task.follow_up_date).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-slate-500 font-bold text-xs truncate max-w-[150px]">{task.status} Review</td>
                    <td className="px-8 py-5 text-center">
                      <button className="w-10 h-10 mx-auto flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95">
                        <PhoneCall size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <BranchIntelligenceModal 
        isOpen={isIntelligenceOpen} 
        onClose={() => setIsIntelligenceOpen(false)} 
        stats={stats}
      />
    </div>
  );
};

export default Dashboard;
