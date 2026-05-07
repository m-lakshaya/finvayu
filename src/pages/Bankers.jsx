import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Phone, Mail, Search, Plus, IndianRupee, Loader2, CheckCircle2, Clock, Users2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, PERMISSIONS } from '../hooks/useAuth';
import { getDisplayName } from '../utils/profileUtils';
import { useNavigate } from 'react-router-dom';
import ProvisionUserModal from '../components/ProvisionUserModal';

const BankerCard = ({ banker, onView }) => {
  const initials = (banker.full_name || banker.name || 'BK').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const commFormatted = banker.totalCommission >= 100000 ? `₹${(banker.totalCommission / 100000).toFixed(1)}L` : `₹${(banker.totalCommission || 0).toLocaleString()}`;

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden" onClick={onView}>
      <div className={`absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${banker.pendingInvoices > 0 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'}`}>
        {banker.pendingInvoices > 0 ? <><Clock size={9} />{banker.pendingInvoices} Pending</> : <><CheckCircle2 size={9} />Clear</>}
      </div>
      <div className="size-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-sm mb-4 group-hover:scale-105 transition-transform">
        {initials}
      </div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{getDisplayName(banker)}</h4>
      <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mt-0.5">{banker.roles?.name || 'Banker'}</p>
      <div className="mt-3 space-y-1.5">
        {banker.email && <div className="flex items-center gap-2 text-xs text-slate-500"><Mail size={11} className="text-slate-300 flex-shrink-0" /><span className="truncate">{banker.email}</span></div>}
        {banker.phone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone size={11} className="text-slate-300 flex-shrink-0" />{banker.phone}</div>}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Leads</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{banker.leadCount || 0}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Commission</p>
          <p className="text-xl font-black text-emerald-500">{commFormatted}</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h4 className={`text-2xl font-black mt-1 ${color}`}>{value}</h4>
    </div>
    <Icon size={22} className={`${color} opacity-20`} />
  </div>
);

const Bankers = () => {
  const { profile, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [bankers, setBankers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isSelf = profile?.roles?.name?.toLowerCase() === 'banker';
  const canManage = hasPermission(PERMISSIONS.MANAGE_USERS);

  const fetchBankers = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      let q = supabase.from('profiles').select('*, roles(name)').eq('org_id', profile.org_id).eq('role_id', 'banker');
      if (search) q = q.or(`full_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data: profiles, error: pErr } = await q;
      if (pErr) throw pErr;
      if (!profiles?.length) { setBankers([]); setLoading(false); return; }
      const ids = profiles.map(p => p.id);

      const { data: leadRows } = await supabase.from('leads').select('referred_by').eq('org_id', profile.org_id).in('referred_by', ids);
      const leadCounts = (leadRows || []).reduce((acc, r) => { acc[r.referred_by] = (acc[r.referred_by] || 0) + 1; return acc; }, {});

      const { data: invoiceRows } = await supabase.from('partner_invoices').select('partner_id, amount').eq('org_id', profile.org_id).in('partner_id', ids).in('status', ['Approved', 'Paid']);
      const commTotals = (invoiceRows || []).reduce((acc, r) => { acc[r.partner_id] = (acc[r.partner_id] || 0) + (Number(r.amount) || 0); return acc; }, {});

      const { data: pendingRows } = await supabase.from('partner_invoices').select('partner_id').eq('org_id', profile.org_id).in('partner_id', ids).eq('status', 'Pending');
      const pendingCounts = (pendingRows || []).reduce((acc, r) => { acc[r.partner_id] = (acc[r.partner_id] || 0) + 1; return acc; }, {});

      setBankers(profiles.map(p => ({ ...p, leadCount: leadCounts[p.id] || 0, totalCommission: commTotals[p.id] || 0, pendingInvoices: pendingCounts[p.id] || 0 })));
    } catch (err) {
      console.error('Bankers fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, search]);

  useEffect(() => { fetchBankers(); }, [fetchBankers]);

  const totalLeads  = bankers.reduce((s, b) => s + b.leadCount, 0);
  const totalComm   = bankers.reduce((s, b) => s + b.totalCommission, 0);
  const pendingAct  = bankers.reduce((s, b) => s + b.pendingInvoices, 0);
  const commDisplay = totalComm >= 100000 ? `₹${(totalComm / 100000).toFixed(1)}L` : `₹${totalComm.toLocaleString()}`;

  const viewBankerLeads = (banker) =>
    navigate(`/leads?partner=${banker.id}&partnerName=${encodeURIComponent(getDisplayName(banker))}`);

  if (!loading && isSelf) {
    const myStats = bankers.find(b => b.id === profile.id);
    const myComm = myStats?.totalCommission || 0;
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Partner Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Your banking partnership dashboard.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-xl">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Leads Referred</p>
            <p className="text-4xl font-black text-primary">{myStats?.leadCount || 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Commission Earned</p>
            <p className="text-4xl font-black text-emerald-500">{myComm >= 100000 ? `₹${(myComm / 100000).toFixed(1)}L` : `₹${myComm.toLocaleString()}`}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center max-w-md">
          <Users2 size={28} className="mx-auto mb-3 text-slate-300" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">Your Lead Portfolio</h4>
          <p className="text-slate-500 text-sm mt-1 mb-5">View all leads attributed to your partner profile.</p>
          <button onClick={() => navigate(`/leads?partner=${profile.id}&partnerName=${encodeURIComponent(getDisplayName(profile))}`)} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all">
            View My Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Banker Partners</h1>
          <p className="text-slate-500 text-sm mt-1">Banking partners, referred leads, and commission settlements.</p>
        </div>
        {canManage && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]">
            <Plus size={16} />Invite Banker
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Building2}   label="Total Bankers"   value={bankers.length} color="text-primary" />
        <StatCard icon={Users2}      label="Total Leads"     value={totalLeads}     color="text-violet-500" />
        <StatCard icon={IndianRupee} label="Commission Paid" value={commDisplay}    color="text-emerald-500" />
        <StatCard icon={Clock}       label="Pending Actions" value={pendingAct}     color="text-amber-500" />
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bankers…" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : bankers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4"><Building2 size={24} className="text-slate-300" /></div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">No bankers found</h4>
          <p className="text-slate-500 text-sm mt-1 max-w-xs">{search ? 'Try a different search term.' : 'Invite your first banking partner to get started.'}</p>
          {!search && canManage && <button onClick={() => setIsModalOpen(true)} className="mt-5 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all">Invite Banker</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {bankers.map(banker => <BankerCard key={banker.id} banker={banker} onView={() => viewBankerLeads(banker)} />)}
        </div>
      )}

      <ProvisionUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultRole="banker"
        onUserCreated={() => { setIsModalOpen(false); fetchBankers(); }}
        onUserProvisioned={() => { setIsModalOpen(false); fetchBankers(); }}
      />
    </div>
  );
};

export default Bankers;
