import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, 
  List, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Phone,
  Clock,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';

const CalendarView = ({ events }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const grid = [];
  for (let i = 0; i < firstDay; i++) grid.push(null);
  for (let i = 1; i <= daysInMonth; i++) grid.push(i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getEventsForDay = (day) => {
    if (!day) return [];
    return events.filter(ev => {
      const d = new Date(ev.follow_up_date);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <h3 className="font-extrabold text-lg flex items-center gap-2">
          <CalendarIcon size={20} className="text-primary" />
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"><ChevronLeft size={16} /></button>
          <button onClick={nextMonth} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
        {days.map(day => (
          <div key={day} className="py-4 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 h-[600px]">
        {grid.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();
          return (
            <div key={i} className={`border-r border-b border-slate-100 dark:border-slate-800 p-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all relative ${isToday ? 'bg-primary/5' : ''}`}>
              {day && (
                <>
                  <span className={`text-xs font-bold ${isToday ? 'size-6 flex items-center justify-center bg-primary text-white rounded-lg shadow-sm' : 'text-slate-500'}`}>{day}</span>
                  <div className="mt-2 space-y-1">
                    {dayEvents.map((ev, idx) => (
                      <div key={ev.id} className={`bg-primary text-white text-[9px] font-bold p-1 rounded-md shadow-sm truncate flex items-center gap-1`}>
                        <span className="opacity-70">{new Date(ev.follow_up_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> {ev.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TableView = ({ events, onComplete }) => {
  return (
    <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
            <tr>
              <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">Client Info</th>
              <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">Time & Status</th>
              <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">Objective</th>
              <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">Urgency</th>
              <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No pending follow-ups found.</td>
                </tr>
            ) : events.map(item => {
              const date = new Date(item.follow_up_date);
              const isPast = date < new Date();
              return (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xs">
                        {item.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{item.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-tighter ${isPast ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>
                        <Clock size={12} className={isPast ? 'text-red-500' : 'text-primary'} />
                        {date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{item.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-medium text-slate-600 dark:text-slate-400">
                    "{item.loan_type} Support"
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tighter border ${
                      isPast ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20' :
                      'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800'
                    }`}>
                      {isPast ? 'Overdue' : 'Scheduled'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-emerald-500 text-white rounded-xl shadow-md transition-all active:scale-95"><Phone size={16} /></button>
                      <button 
                        onClick={() => onComplete(item.id)}
                        className="p-2 bg-primary text-white rounded-xl shadow-md transition-all active:scale-95"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-600 transition-all"><MoreVertical size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FollowUps = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeView = searchParams.get('view') === 'calendar' ? 'calendar' : 'list';

  const fetchFollowUps = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('org_id', profile.org_id)
        .not('follow_up_date', 'is', null)
        .order('follow_up_date');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching followups:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const handleComplete = async (id) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ follow_up_date: null, status: 'Contacted' })
        .eq('id', id);
      
      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (error) {
       console.error('Error completing followup:', error.message);
    }
  };

  const urgentCount = events.filter(e => new Date(e.follow_up_date) < new Date()).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Follow-up Management</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Don't miss a beat. Track your schedule and client meetings.</p>
        </div>
        <div className="flex items-center bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => setSearchParams({ view: 'list' })}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeView === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <List size={16} />
            List View
          </button>
          <button 
            onClick={() => setSearchParams({ view: 'calendar' })}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeView === 'calendar' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <CalendarIcon size={16} />
            Calendar
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Missing Cutoff</p>
            <h4 className="text-2xl font-black">{urgentCount}</h4>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Scheduled</p>
            <h4 className="text-2xl font-black">{events.length}</h4>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <User size={24} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active RM</p>
            <h4 className="text-2xl font-black">01</h4>
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="relative min-h-[500px]">
        {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-primary mb-4" size={40} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing with global calendar...</p>
            </div>
        ) : activeView === 'list' ? (
            <TableView events={events} onComplete={handleComplete} />
        ) : (
            <CalendarView events={events} />
        )}
      </div>
    </div>
  );
};

export default FollowUps;
