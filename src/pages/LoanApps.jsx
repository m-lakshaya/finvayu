import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  ChevronRight, 
  Clock,
  KanbanSquare,
  Loader2,
  DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import CreateLoanAppModal from '../components/CreateLoanAppModal';

const LoanApps = () => {
  const { profile } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pipelines, setPipelines] = useState([
    { title: 'In Discussion', count: 0, value: 0, color: 'bg-primary' },
    { title: 'Login Done', count: 0, value: 0, color: 'bg-indigo-500' },
    { title: 'Sanctioned', count: 0, value: 0, color: 'bg-amber-500' },
    { title: 'Completed', count: 0, value: 0, color: 'bg-emerald-500' },
  ]);

  const fetchApplications = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('loan_applications')
        .select(`
          *,
          lead:lead_id (name),
          bank:bank_id (name, institution)
        `)
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`id.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setApps(data || []);

      // Calculate Pipeline Stats
      const stats = [
        { title: 'In Discussion', color: 'bg-primary' },
        { title: 'Login Done', color: 'bg-indigo-500' },
        { title: 'Sanctioned', color: 'bg-amber-500' },
        { title: 'Completed', color: 'bg-emerald-500' },
      ].map(p => {
        const filtered = data?.filter(a => a.stage === p.title) || [];
        const totalValue = filtered.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
        return {
          ...p,
          count: filtered.length,
          value: totalValue
        };
      });

      setPipelines(stats);

    } catch (error) {
      console.error('Error fetching dynamic loan apps:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Loan Pipeline</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Track case progress across banks and optimize turnaround times.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:shadow-sm transition-all text-slate-600 dark:text-slate-300">
            <KanbanSquare size={16} />
            Board View
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            Create Application
          </button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pipelines.map((p, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${p.color}`}></div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{p.title}</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black">{p.count}</h4>
              <span className="text-xs font-bold text-slate-500">Files</span>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-2">{formatCurrency(p.value)}</p>
          </div>
        ))}
      </div>

      {/* Active Pipeline List */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-extrabold text-lg tracking-tight">Active Applications</h3>
          <div className="relative min-w-[300px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Application ID..." 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-9 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-primary/20 transition-all outline-none" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Application ID</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Customer Details</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Loan Config</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Bank Partner</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Pipeline Stage</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Filtering global portfolio...</p>
                  </td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <DollarSign size={40} className="mx-auto mb-3 opacity-20 text-slate-400" />
                    <p className="text-sm font-bold text-slate-500">No active applications in the pipeline.</p>
                  </td>
                </tr>
              ) : apps.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group cursor-pointer">
                  <td className="px-6 py-5 font-mono text-xs font-black text-primary uppercase">{app.id}</td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{app.lead?.name || 'Unknown Lead'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Retail Asset Client</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formatCurrency(app.amount)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Personal Loan</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <Building2 size={14} className="text-primary" />
                      {app.bank?.institution || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${
                        app.stage === 'Completed' ? 'bg-emerald-500' :
                        app.stage === 'Sanctioned' ? 'bg-amber-500' :
                        'bg-primary'
                      } ${app.stage !== 'Completed' ? 'animate-pulse' : ''}`}></span>
                      <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700 dark:text-slate-300">{app.stage}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">Updated {new Date(app.updated_at).toLocaleDateString()}</p>
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

      <CreateLoanAppModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAppCreated={(newApp) => {
          setApps(prev => [newApp, ...prev]);
          // Refresh pipelines
          fetchApplications();
        }}
      />
    </div>
  );
};

export default LoanApps;
