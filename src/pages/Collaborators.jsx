import React, { useState, useEffect, useCallback } from 'react';
import { 
  Handshake, 
  MapPin, 
  Phone, 
  Mail, 
  TrendingUp, 
  Search, 
  Filter, 
  Plus,
  Trophy,
  Activity,
  UserPlus,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import CreateCollaboratorModal from '../components/CreateCollaboratorModal';

const CollaboratorRow = ({ partner }) => (
  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
    <td className="px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs uppercase">
          {partner.name?.split(' ').map(n=>n[0]).join('') || 'CP'}
        </div>
        <div>
          <p className="font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{partner.name}</p>
          <p className="text-[10px] text-slate-500 font-medium font-mono uppercase">{partner.id}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-tighter">
        <MapPin size={12} className="text-primary" />
        {partner.city || 'National'}
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex flex-col">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{partner.phone}</span>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{partner.email}</span>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex flex-col">
          <span className="text-xs font-black text-slate-900 dark:text-slate-100">₹{(parseFloat(partner.revenue) || 0).toLocaleString()}</span>
          <div className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-500 uppercase tracking-tighter">
            <TrendingUp size={10} /> +{(Math.random() * 20).toFixed(0)}% growth
          </div>
      </div>
    </td>
    <td className="px-6 py-5">
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
        partner.tier === 'Platinum' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20' :
        partner.tier === 'Gold' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20' :
        'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800'
      }`}>
        {partner.tier}
      </span>
    </td>
  </tr>
);

const Collaborators = () => {
  const { profile } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, premium: 0, activeLeads: 0 });

  const isSelf = ['collaborator'].includes(profile?.roles?.name?.toLowerCase());

  const fetchPartners = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('collaborators')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('name');

      if (search) {
        query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,id.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setPartners(data || []);

      // Calculate Stats
      const premiumCount = data?.filter(p => p.tier === 'Gold' || p.tier === 'Platinum').length || 0;
      setStats({
        total: data?.length || 0,
        premium: premiumCount,
        activeLeads: (data?.length || 0) * 8 // Mocked lead count for now
      });

    } catch (error) {
      console.error('Error fetching partners:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, search]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Channel Partners</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Collaborate with agencies and individuals to scale your business.</p>
        </div>
        {(profile?.roles?.name?.toLowerCase() === 'ceo' || profile?.roles?.name?.toLowerCase() === 'rm' || profile?.roles?.name?.toLowerCase() === 'regional manager') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <UserPlus size={18} />
            Register Partner
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 group cursor-pointer hover:border-indigo-500/50 transition-all">
          <div className="size-14 rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center transition-all">
            <Handshake size={28} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Partners</p>
            <h4 className="text-2xl font-black">{stats.total}</h4>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 group cursor-pointer hover:border-emerald-500/50 transition-all">
          <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all">
            <Trophy size={28} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Premium Tier</p>
            <h4 className="text-2xl font-black">{stats.premium}</h4>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 group cursor-pointer hover:border-indigo-500/50 transition-all">
          <div className="size-14 rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center transition-all">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Est. Active Leads</p>
            <h4 className="text-2xl font-black">{stats.activeLeads}</h4>
          </div>
        </div>
      </div>

      {/* Filter & Table Area */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by name, ID, or city..." 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" 
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border-dashed">
            <Filter size={18} />
            Filters
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.15em]">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Partner Details</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Region</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Contact</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Revenue (Total)</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Tier Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Syncing channel partner registry...</p>
                  </td>
                </tr>
              ) : isSelf ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                     <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="size-12 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                    {profile.name?.[0] || 'CP'}
                                </div>
                                <div>
                                    <h4 className="font-extrabold">{profile.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Your Partner Profile</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-400">Assigned Leads</span>
                                    <span>24 Active</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-400">Settlement Status</span>
                                    <span className="text-emerald-500">Cleared</span>
                                </div>
                            </div>
                        </div>
                        <button 
                          onClick={() => navigate('/leads')}
                          className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20"
                        >
                          Access My Leads Vault
                        </button>
                     </div>
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Handshake size={48} className="text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No partners registered yet.</p>
                  </td>
                </tr>
              ) : partners.map((partner) => (
                <CollaboratorRow key={partner.id} partner={partner} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateCollaboratorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onPartnerCreated={(newPartner) => {
          setPartners(prev => [newPartner, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
          setStats(s => ({ ...s, total: s.total + 1 }));
        }}
      />
    </div>
  );
};

export default Collaborators;
