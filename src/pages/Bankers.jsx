import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  ExternalLink, 
  Search, 
  Filter, 
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Users2,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import CreateBankerModal from '../components/CreateBankerModal';

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
        <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1">{banker.name}</h4>
        <p className="text-xs font-bold text-primary uppercase tracking-wider line-clamp-1">{banker.institution}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <MapPin size={14} className="text-slate-400" />
          {banker.branch || 'General Branch'}
        </div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <Phone size={14} className="text-slate-400" />
          {banker.phone}
        </div>
      </div>
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Products</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 line-clamp-1">{banker.products || 'All Portfolio'}</span>
        </div>
        <a href={`tel:${banker.phone}`} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-primary hover:text-white transition-all">
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  </div>
);

const Bankers = () => {
  const { profile } = useAuth();
  const [bankers, setBankers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('All Institutions');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [counts, setCounts] = useState({ banks: 0, active: 0, files: 156 });
  
  const isSelf = ['banker'].includes(profile?.roles?.name?.toLowerCase());

  const fetchBankers = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('bankers')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('name');

      if (search) {
        query = query.or(`name.ilike.%${search}%,institution.ilike.%${search}%,branch.ilike.%${search}%`);
      }

      if (institutionFilter !== 'All Institutions') {
        query = query.eq('institution', institutionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setBankers(data || []);

      // Calculate Stats
      const uniqueBanks = new Set(data?.map(b => b.institution)).size;
      const activeCount = data?.filter(b => b.status === 'Active').length || 0;
      
      setCounts(prev => ({ ...prev, banks: uniqueBanks, active: activeCount }));

    } catch (error) {
      console.error('Error fetching bankers:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, search, institutionFilter]);

  useEffect(() => {
    fetchBankers();
  }, [fetchBankers]);

  const institutions = ['All Institutions', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI', 'Kotak Bank'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Banker Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Manage and access your point of contact at financial institutions.</p>
        </div>
        {(profile?.roles?.name?.toLowerCase() === 'ceo' || profile?.roles?.name?.toLowerCase() === 'rm' || profile?.roles?.name?.toLowerCase() === 'regional manager') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            Add New Banker
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, bank, or city..." 
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
          />
        </div>
        <select 
          value={institutionFilter}
          onChange={e => setInstitutionFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none min-w-[180px]"
        >
          {institutions.map(inst => <option key={inst}>{inst}</option>)}
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Banker Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Syncing with Financial Partners...</p>
        </div>
      ) : isSelf ? (
        <div className="space-y-8">
            <div className="max-w-xl">
                 <BankerCard banker={{ 
                    name: profile.name, 
                    institution: 'Private Portfolio', 
                    phone: profile.phone || 'N/A', 
                    branch: 'Personal Dashboard',
                    status: 'Active' 
                 }} />
            </div>
            <div className="glass-card p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                <Users2 size={32} className="mx-auto mb-4 text-slate-300" />
                <h4 className="text-lg font-extrabold">Your Managed Leads</h4>
                <p className="text-slate-500 text-sm mb-6">You only have access to leads assigned to your individual profile.</p>
                <button 
                  onClick={() => navigate('/leads')}
                  className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold"
                >
                  View My Leads
                </button>
            </div>
        </div>
      ) : bankers.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <Building2 size={48} className="text-slate-200 dark:text-slate-800 mx-auto mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No bankers found in this organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[300px]">
          {bankers.map((banker) => (
            <BankerCard key={banker.id} banker={banker} />
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Connected Banks</p>
            <h4 className="text-3xl font-extrabold mt-1">{counts.banks}</h4>
          </div>
          <Building2 size={48} className="text-primary/10 absolute -right-2 -bottom-2" />
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Bankers</p>
            <h4 className="text-3xl font-extrabold mt-1 text-emerald-500">{counts.active}</h4>
          </div>
          <Users2 size={48} className="text-emerald-500/10 absolute -right-2 -bottom-2" />
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Files</p>
            <h4 className="text-3xl font-extrabold mt-1 text-primary">{counts.files}</h4>
          </div>
          <ArrowUpRight size={48} className="text-primary/10 absolute -right-2 -bottom-2" />
        </div>
      </div>

      <CreateBankerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onBankerCreated={(newBanker) => {
          setBankers(prev => [...prev, newBanker].sort((a,b) => a.name.localeCompare(b.name)));
          setCounts(prev => ({ ...prev, active: prev.active + 1 }));
        }}
      />
    </div>
  );
};

export default Bankers;
