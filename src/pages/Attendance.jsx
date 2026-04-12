import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserCheck, 
  MapPin, 
  Clock, 
  Calendar, 
  ArrowRight,
  Search,
  Filter,
  Users,
  Loader2,
  LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const Attendance = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [myStatus, setMyStatus] = useState(null); // 'Present', 'CheckedOut', or null
  const [stats, setStats] = useState([
    { label: 'Total Strength', value: '0', icon: Users, color: 'text-primary bg-primary/10' },
    { label: 'Present Today', value: '0', icon: UserCheck, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'On Leave', value: '0', icon: Calendar, color: 'text-orange-500 bg-orange-500/10' },
    { label: 'Late Arrival', value: '0', icon: Clock, color: 'text-rose-500 bg-rose-500/10' },
  ]);

  const fetchAttendance = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch all today's attendance for the org
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .eq('org_id', profile.org_id)
        .eq('date', today);

      if (error) throw error;
      
      setRecords(data || []);

      // Check my current status for today
      const me = data?.find(r => r.user_id === profile.id);
      if (me) {
        setMyStatus(me.check_out ? 'CheckedOut' : 'Present');
      } else {
        setMyStatus(null);
      }

      // Calculate Stats
      const presentCount = data?.length || 0;
      const lateCount = data?.filter(r => r.status === 'Late').length || 0;
      
      setStats([
        { label: 'Total Strength', value: 'Live', icon: Users, color: 'text-primary bg-primary/10' },
        { label: 'Present Today', value: presentCount.toString(), icon: UserCheck, color: 'text-emerald-500 bg-emerald-500/10' },
        { label: 'On Leave', value: '0', icon: Calendar, color: 'text-orange-500 bg-orange-500/10' },
        { label: 'Late Arrival', value: lateCount.toString(), icon: Clock, color: 'text-rose-500 bg-rose-500/10' },
      ]);

    } catch (error) {
      console.error('Error fetching attendance:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, profile.id]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleCheckIn = async () => {
    try {
      const now = new Date();
      const hour = now.getHours();
      const status = hour >= 10 ? 'Late' : 'Present'; // Late after 10 AM
      
      const { error } = await supabase
        .from('attendance')
        .insert([{
          org_id: profile.org_id,
          user_id: profile.id,
          status,
          check_in: now.toISOString(),
          location: 'Main Office', // In a real app, use geolocation
          device: 'Platform Portal',
          date: now.toISOString().split('T')[0]
        }]);

      if (error) throw error;
      fetchAttendance();
    } catch (error) {
      alert('Check-in failed: ' + error.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('attendance')
        .update({ check_out: new Date().toISOString() })
        .eq('user_id', profile.id)
        .eq('date', today);

      if (error) throw error;
      fetchAttendance();
    } catch (error) {
      alert('Check-out failed: ' + error.message);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Executive Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Monitor real-time check-ins, field locations, and team availability.</p>
        </div>
        <div className="flex items-center gap-3">
          {myStatus === null ? (
            <button 
              onClick={handleCheckIn}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
            >
              <UserCheck size={18} />
              Verify My Check-in
            </button>
          ) : myStatus === 'Present' ? (
            <button 
              onClick={handleCheckOut}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-rose-500/20 transition-all active:scale-[0.98]"
            >
              <LogOut size={18} />
              Clock Out Now
            </button>
          ) : (
            <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-sm font-bold flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-500" />
              Logged Out for Today
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className={`p-3 rounded-xl ${stat.color} w-fit mb-4`}>
              <stat.icon size={22} />
            </div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h4 className="text-2xl font-black">{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search team members..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
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
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-2" size={32} />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Verifying secure attendance...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No attendance records for today yet.</p>
                  </td>
                </tr>
              ) : records.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-[10px] uppercase">
                        {row.profiles?.full_name?.split(' ').map(n=>n[0]).join('') || '??'}
                      </div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{row.profiles?.full_name || 'Legacy User'}</p>
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
                  <td className="px-6 py-5 font-bold text-slate-700 dark:text-slate-300">{formatTime(row.check_in)}</td>
                  <td className="px-6 py-5 font-bold text-slate-700 dark:text-slate-300">{formatTime(row.check_out)}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      <MapPin size={12} className="text-primary" />
                      {row.location || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-primary transition-all">
                      <ArrowRight size={18} />
                      <span className="sr-only">Details</span>
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

const CheckCircle = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default Attendance;
