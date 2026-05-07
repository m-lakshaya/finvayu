import React, { useState, useEffect, useCallback } from 'react';
import { Handshake, Phone, Search, Plus, IndianRupee, Loader2, CheckCircle2, Clock, Users2, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, PERMISSIONS } from '../hooks/useAuth';
import { getDisplayName } from '../utils/profileUtils';
import { useNavigate } from 'react-router-dom';
import ProvisionUserModal from '../components/ProvisionUserModal';

const tierBadge = (commission) => {
  if (commission >= 500000) return { label: 'Platinum', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20' };
  if (commission >= 100000) return { label: 'Gold', cls: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20' };
  return { label: 'Silver', cls: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800' };
};

const CollaboratorRow = ({ partner, onView }) => {
  const initials = (partner.full_name || partner.name || 'CP').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const commFormatted = partner.totalCommission >= 100000 ? `₹${(partner.totalCommission / 100000).toFixed(1)}L` : `₹${(partner.totalCommission || 0).toLocaleString()}`;
  const { label: tier, cls: tierCls } = tierBadge(partner.totalCommission);

  return (
    <tr onClick={onView} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer group border-b border-slate-100 dark:border-slate-800 last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="size-9 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center text-violet-600 font-bold text-xs flex-shrink-0">{initials}</div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{getDisplayName(partner)}</p>
            <p className="text-[11px] text-slate-400">{partner.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${tierCls}`}><Trophy size={9} />{tier}</span>
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{partner.leadCount || 0}</td>
      <td className="px-6 py-4 text-sm font-bold text-emerald-500">{commFormatted}</td>
      <td className="px-6 py-4">
        {partner.pendingInvoices > 0
          ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600"><Clock size={10} />{partner.pendingInvoices} pending</span>
          : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500"><CheckCircle2 size={10} />Clear</span>}
      </td>
      <td className="px-6 py-4 text-xs text-slate-500">{partner.phone || '—'}</td>
    </tr>
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

const Collaborators = () => {
  const { profile, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isSelf    = profile?.roles?.name?.toLowerCase() === 'collaborator';
  const canManage = hasPermission(PERMISSIONS.MANAGE_USERS);

  const fetchPartners = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      let q = supabase.from('profiles').select('*, roles(name)').eq('org_id', profile.org_id).eq('role_id', 'collaborator');
      if (search) q = q.or(`full_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data: profiles, error: pErr } = await q;
      if (pErr) throw pErr;
      if (!profiles?.length) { setPartners([]); setLoading(false); return; }
      const ids = profiles.map(p => p.id);

      const { data: leadRows } = await supabase.from('leads').select('referred_by').eq('org_id', profile.org_id).in('referred_by', ids);
      const leadCounts = (leadRows || []).reduce((acc, r) => { acc[r.referred_by] = (acc[r.referred_by] || 0) + 1; return acc; }, {});

      const { data: invoiceRows } = await supabase.from('partner_invoices').select('partner_id, amount').eq('org_id', profile.org_id).in('partner_id', ids).in('status', ['Approved', 'Paid']);
      const commTotals = (invoiceRows || []).reduce((acc, r) => { acc[r.partner_id] = (acc[r.partner_id] || 0) + (Number(r.amount) || 0); return acc; }, {});

      const { data: pendingRows } = await supabase.from('partner_invoices').select('partner_id').eq('org_id', profile.org_id).in('partner_id', ids).eq('status', 'Pending');
      const pendingCounts = (pendingRows || []).reduce((acc, r) => { acc[r.partner_id] = (acc[r.partner_id] || 0) + 1; return acc; }, {});

      setPartners(profiles.map(p => ({ ...p, leadCount: leadCounts[p.id] || 0, totalCommission: commTotals[p.id] || 0, pendingInvoices: pendingCounts[p.id] || 0 })));
    } catch (err) {
      console.error('Collaborators fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, search]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const totalLeads  = partners.reduce((s, p) => s + p.leadCount, 0);
  const totalComm   = partners.reduce((s, p) => s + p.totalCommission, 0);
  const pendingAct  = partners.reduce((s, p) => s + p.pendingInvoices, 0);
  const commDisplay = totalComm >= 100000 ? `₹${(totalComm / 100000).toFixed(1)}L` : `₹${totalComm.toLocaleString()}`;

  const viewPartnerLeads = (partner) =>
    navigate(`/leads?partner=${partner.id}&partnerName=${encodeURIComponent(getDisplayName(partner))}`);

  if (!loading && isSelf) {
    const myStats = partners.find(p => p.id === profile.id);
    const myComm = myStats?.totalCommission || 0;
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Partner Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Your collaboration partnership dashboard.</p>
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Collaborator Partners</h1>
          <p className="text-slate-500 text-sm mt-1">Active collaborators, referred leads, and tier standings.</p>
        </div>
        {canManage && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]">
            <Plus size={16} />Invite Collaborator
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Handshake}   label="Collaborators"   value={partners.length} color="text-violet-500" />
        <StatCard icon={Users2}      label="Total Leads"     value={totalLeads}      color="text-primary" />
        <StatCard icon={IndianRupee} label="Commission Paid" value={commDisplay}     color="text-emerald-500" />
        <StatCard icon={Clock}       label="Pending Actions" value={pendingAct}      color="text-amber-500" />
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search collaborators…" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4"><Handshake size={24} className="text-slate-300" /></div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">No collaborators found</h4>
          <p className="text-slate-500 text-sm mt-1 max-w-xs">{search ? 'Try a different search.' : 'Invite your first collaborator to get started.'}</p>
          {!search && canManage && <button onClick={() => setIsModalOpen(true)} className="mt-5 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all">Invite Collaborator</button>}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {['Collaborator', 'Tier', 'Leads', 'Commission', 'Invoices', 'Phone'].map(h => (
                  <th key={h} className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners.map(partner => <CollaboratorRow key={partner.id} partner={partner} onView={() => viewPartnerLeads(partner)} />)}
            </tbody>
          </table>
        </div>
      )}

      <ProvisionUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultRole="collaborator"
        onUserCreated={() => { setIsModalOpen(false); fetchPartners(); }}
        onUserProvisioned={() => { setIsModalOpen(false); fetchPartners(); }}
      />
    </div>
  );
};

export default Collaborators;
