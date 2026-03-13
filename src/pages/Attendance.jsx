import React from 'react';
import { 
  UserCheck, 
  MapPin, 
  Clock, 
  Calendar, 
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  Users
} from 'lucide-react';

const Attendance = () => {
  const records = [
    { executive: 'Arun Kumar', status: 'Present', checkIn: '09:15 AM', checkOut: '06:30 PM', location: 'Mumbai Office', device: 'Mobile' },
    { executive: 'Sneha Rao', status: 'Present', checkIn: '09:30 AM', checkOut: '06:00 PM', location: 'Field - Pune', device: 'Mobile' },
    { executive: 'Vijay Singh', status: 'Late', checkIn: '10:45 AM', checkOut: '07:15 PM', location: 'Chennai Hub', device: 'Web' },
    { executive: 'Priya Dharshini', status: 'On Leave', checkIn: '--', checkOut: '--', location: '--', device: '--' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Executive Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Monitor real-time check-ins, field locations, and team availability.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
            <UserCheck size={18} />
            My Check-in
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Strength', value: '48', icon: Users, color: 'text-primary bg-primary/10' },
          { label: 'Present Today', value: '42', icon: UserCheck, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'On Leave', value: '4', icon: Calendar, color: 'text-orange-500 bg-orange-500/10' },
          { label: 'Late Arrival', value: '2', icon: Clock, color: 'text-rose-500 bg-rose-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className={`p-3 rounded-xl ${stat.color} w-fit mb-4`}>
              <stat.icon size={22} />
            </div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h4 className="text-2xl font-black">{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search by executive name..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
            </div>
            <button className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-primary transition-all"><Filter size={16} /></button>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Calendar size={14} />
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Executive Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Check-in</th>
                <th className="px-6 py-4">Check-out</th>
                <th className="px-6 py-4">Last Location</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                        {row.executive.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{row.executive}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                      row.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20' :
                      row.status === 'Late' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20' :
                      'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-700 dark:text-slate-300">{row.checkIn}</td>
                  <td className="px-6 py-5 font-bold text-slate-700 dark:text-slate-300">{row.checkOut}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold italic">
                      {row.location !== '--' && <MapPin size={12} className="text-primary" />}
                      {row.location}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-primary transition-all">
                      <ArrowRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
