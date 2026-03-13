import React from 'react';
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
  UserPlus
} from 'lucide-react';

const CollaboratorRow = ({ partner }) => (
  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
    <td className="px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs uppercase">
          {partner.name.split(' ').map(n=>n[0]).join('')}
        </div>
        <div>
          <p className="font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{partner.name}</p>
          <p className="text-[10px] text-slate-500 font-medium">{partner.id}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase italic tracking-tighter">
        <MapPin size={12} className="text-primary" />
        {partner.city}
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
          <span className="text-xs font-black text-slate-900 dark:text-slate-100">₹{partner.revenue}</span>
          <div className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-500 uppercase tracking-tighter">
            <TrendingUp size={10} /> +12% this month
          </div>
      </div>
    </td>
    <td className="px-6 py-5">
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
        partner.tier === 'Gold' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20' :
        partner.tier === 'Silver' ? 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800' :
        'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20'
      }`}>
        {partner.tier}
      </span>
    </td>
  </tr>
);

const Collaborators = () => {
  const partners = [
    { name: 'Rajesh Enterprise', id: 'PAR-8821', city: 'Mumbai', phone: '+91 99887 76655', email: 'rajesh@ent.com', revenue: '8,45,000', tier: 'Gold' },
    { name: 'Kiran Consultancy', id: 'PAR-8822', city: 'Delhi', phone: '+91 99887 76644', email: 'contact@kiran.co', revenue: '3,12,000', tier: 'Silver' },
    { name: 'Smart Finserv', id: 'PAR-8823', city: 'Pune', phone: '+91 99887 76633', email: 'leads@smart.in', revenue: '12,90,000', tier: 'Platinum' },
    { name: 'Vijay Solutions', id: 'PAR-8824', city: 'Ahmedabad', phone: '+91 99887 76622', email: 'vijay@sol.com', revenue: '5,60,000', tier: 'Silver' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Channel Partners</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Collaborate with agencies and individuals to scale your business.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-600/20 transition-all">
          <UserPlus size={18} />
          Register Partner
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 group cursor-pointer hover:border-primary/50 transition-all">
          <div className="size-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
            <Handshake size={28} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Partners</p>
            <h4 className="text-2xl font-black">248</h4>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 group cursor-pointer hover:border-emerald-500/50 transition-all">
          <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <Trophy size={28} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Premium Tier</p>
            <h4 className="text-2xl font-black">32</h4>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 group cursor-pointer hover:border-indigo-500/50 transition-all">
          <div className="size-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Leads</p>
            <h4 className="text-2xl font-black">1,842</h4>
          </div>
        </div>
      </div>

      {/* Filter & Table Area */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Filter by name, ID, or city..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <Filter size={18} />
            Filters
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Partner Details</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Region</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Contact</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Revenue (Total)</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Tier Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {partners.map((partner, i) => (
                <CollaboratorRow key={i} partner={partner} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Collaborators;
