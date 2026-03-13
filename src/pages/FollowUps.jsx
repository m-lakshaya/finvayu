import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  List, 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Phone,
  Video,
  MapPin,
  Clock,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const CalendarView = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [currentDate] = useState(new Date(2024, 2, 12)); // Mar 12, 2024
  
  // Simplified calendar grid generator
  const daysInMonth = 31;
  const firstDay = 5; // Friday
  const grid = [];
  for (let i = 0; i < firstDay; i++) grid.push(null);
  for (let i = 1; i <= daysInMonth; i++) grid.push(i);

  const events = {
    12: [{ name: 'Robert Taylor', type: 'Call', time: '14:30', color: 'bg-emerald-500' }],
    13: [{ name: 'Linda Parker', type: 'Meeting', time: '10:00', color: 'bg-blue-500' }],
    15: [{ name: 'Kevin Adams', type: 'Call', time: '16:00', color: 'bg-emerald-500' }],
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <h3 className="font-extrabold text-lg flex items-center gap-2">
          <CalendarIcon size={20} className="text-primary" />
          March 2024
        </h3>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"><ChevronLeft size={16} /></button>
          <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
        {days.map(day => (
          <div key={day} className="py-4 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-5 h-[600px]">
        {grid.map((day, i) => (
          <div key={i} className={`border-r border-b border-slate-100 dark:border-slate-800 p-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all relative ${day === 12 ? 'bg-primary/5' : ''}`}>
            {day && (
              <>
                <span className={`text-xs font-bold ${day === 12 ? 'size-6 flex items-center justify-center bg-primary text-white rounded-lg shadow-sm' : 'text-slate-500'}`}>{day}</span>
                <div className="mt-2 space-y-1">
                  {(events[day] || []).map((ev, idx) => (
                    <div key={idx} className={`${ev.color} text-white text-[9px] font-bold p-1 rounded-md shadow-sm truncate flex items-center gap-1`}>
                      <span className="opacity-70">{ev.time}</span> {ev.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TableView = () => {
  const followups = [
    { id: 1, name: 'Robert Taylor', type: 'Call', time: 'Today, 2:30 PM', goal: 'Document Review', status: 'Urgent', phone: '+91 98765 00123' },
    { id: 2, name: 'Linda Parker', type: 'Meeting', time: 'Today, 4:00 PM', goal: 'Loan Terms Negotiation', status: 'Pending', phone: '+91 98765 00456' },
    { id: 3, name: 'Kevin Adams', type: 'Call', time: 'Tomorrow, 10:00 AM', goal: 'Introductory Call', status: 'Upcoming', phone: '+91 98765 00789' },
  ];

  return (
    <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
            <tr>
              <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">Client Info</th>
              <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">Time & Type</th>
              <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">Objective</th>
              <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800">Status</th>
              <th className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {followups.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xs">RT</div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{item.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs uppercase italic tracking-tighter">
                      <Clock size={12} className="text-primary" />
                      {item.time}
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{item.type}</span>
                  </div>
                </td>
                <td className="px-8 py-6 font-medium text-slate-600 dark:text-slate-400 italic">
                  "{item.goal}"
                </td>
                <td className="px-8 py-6">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tighter border ${
                    item.status === 'Urgent' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/50' :
                    item.status === 'Upcoming' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50' :
                    'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/30 transition-all"><Phone size={16} /></button>
                    <button className="p-2 bg-primary text-white rounded-xl shadow-md shadow-primary/10 hover:shadow-primary/30 transition-all"><CheckCircle2 size={16} /></button>
                    <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-600 transition-all"><MoreVertical size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import { useSearchParams } from 'react-router-dom';

const FollowUps = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get('view') === 'calendar' ? 'calendar' : 'list';

  const handleViewChange = (view) => {
    setSearchParams({ view });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Follow-up Management</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Don't miss a beat. Track your schedule and client meetings.</p>
        </div>
        <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => handleViewChange('list')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeView === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <List size={18} />
            List View
          </button>
          <button 
            onClick={() => handleViewChange('calendar')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeView === 'calendar' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <CalendarIcon size={18} />
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
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Urgent Today</p>
            <h4 className="text-2xl font-extrabold">08</h4>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Completed</p>
            <h4 className="text-2xl font-extrabold">12</h4>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Pending Sync</p>
            <h4 className="text-2xl font-extrabold">03</h4>
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="relative">
        {activeView === 'list' ? <TableView /> : <CalendarView />}
      </div>
    </div>
  );
};

export default FollowUps;
