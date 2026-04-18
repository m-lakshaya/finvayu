import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, 
  List, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  PhoneCall,
  Mail,
  CheckSquare,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams, Link } from 'react-router-dom';

const TYPE_ICONS = { Call: PhoneCall, Email: Mail, Meeting: CalendarIcon, 'To-Do': CheckSquare };

const statusColor = (s) => {
  if (s === 'Completed') return 'bg-emerald-100 text-emerald-700';
  if (s === 'In Progress') return 'bg-blue-100 text-blue-700';
  if (s === 'Deferred') return 'bg-slate-100 text-slate-500';
  return 'bg-orange-100 text-orange-700';
};

const priorityColor = (p) => {
  if (p === 'High') return 'text-red-500';
  if (p === 'Normal') return 'text-blue-500';
  return 'text-slate-400';
};

const MIN_ROWS = 10;

// Salesforce-style sortable header
const SortableHeader = ({ label, field, sortField, sortAsc, onSort }) => {
  const active = sortField === field;
  return (
    <th
      className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold select-none cursor-pointer group/th hover:text-primary transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        <span className={`transition-all ${active ? 'text-primary' : 'text-slate-300 dark:text-slate-600 group-hover/th:text-slate-400'}`}>
          {active ? (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
        </span>
      </div>
    </th>
  );
};

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
      if (!ev.due_date) return false;
      const d = new Date(ev.due_date);
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
      <div className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {days.map(d => <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day && new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
            return (
              <div key={i} className={`min-h-[80px] rounded-xl p-1.5 border transition-all ${isToday ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${!day ? 'opacity-0 pointer-events-none' : ''}`}>
                {day && (
                  <>
                    <p className={`text-xs font-bold mb-1 text-right ${isToday ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>{day}</p>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev, j) => (
                        <div key={j} className="text-[9px] font-bold text-white bg-primary rounded px-1 py-0.5 truncate">
                          {ev.subject}
                        </div>
                      ))}
                      {dayEvents.length > 2 && <div className="text-[9px] font-bold text-primary">+{dayEvents.length - 2} more</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TableView = ({ events, onComplete, onDelete, search }) => {
  const [sortField, setSortField] = useState('due_date');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field) => {
    if (field === sortField) setSortAsc((p) => !p);
    else { setSortField(field); setSortAsc(true); }
  };

  const filtered = events
    .filter((e) =>
      !search ||
      e.subject?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let av = a[sortField] ?? '';
      let bv = b[sortField] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

  const emptyRowCount = Math.max(0, MIN_ROWS - filtered.length);

  return (
    <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
            <tr>
              <SortableHeader label="Subject" field="subject" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
              <SortableHeader label="Type" field="type" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
              <SortableHeader label="Priority" field="priority" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
              <SortableHeader label="Due Date" field="due_date" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
              <SortableHeader label="Status" field="status" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
              <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Related To</th>
              <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">No tasks found</td>
              </tr>
            ) : filtered.map((ev) => {
              const TypeIcon = TYPE_ICONS[ev.type] || CheckSquare;
              const isOverdue = ev.due_date && new Date(ev.due_date) < new Date() && ev.status !== 'Completed';
              return (
                <tr key={ev.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group ${ev.status === 'Completed' ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${ev.status === 'Completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                        <TypeIcon size={14} />
                      </div>
                      <span className={`font-bold text-slate-900 dark:text-slate-100 ${ev.status === 'Completed' ? 'line-through text-slate-400' : ''}`}>
                        {ev.subject}
                      </span>
                    </div>
                    {ev.notes && <p className="text-xs text-slate-400 mt-1 ml-9 truncate max-w-[200px]">{ev.notes}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full uppercase">{ev.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-extrabold uppercase ${priorityColor(ev.priority)}`}>● {ev.priority}</span>
                  </td>
                  <td className="px-6 py-4">
                    {ev.due_date ? (
                      <span className={`text-xs font-bold flex items-center gap-1.5 ${isOverdue ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                        <Clock size={12} />
                        {new Date(ev.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {isOverdue && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide">Overdue</span>}
                      </span>
                    ) : <span className="text-slate-400 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${statusColor(ev.status)}`}>{ev.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                    {ev.lead_id && <Link to={`/leads/${ev.lead_id}`} className="text-primary hover:underline">View Lead</Link>}
                    {ev.customer_id && <Link to={`/customers/${ev.customer_id}`} className="text-primary hover:underline">View Customer</Link>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {ev.status !== 'Completed' && (
                        <button onClick={() => onComplete(ev.id)} className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors" title="Mark Complete">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button onClick={() => onDelete(ev.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {/* Ghost rows for fixed table height */}
            {Array.from({ length: emptyRowCount }).map((_, i) => (
              <tr key={`ghost-${i}`} className="h-16"><td colSpan={7}></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FollowUps = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get('view') || 'list';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTasks = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleComplete = async (id) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'Completed', completed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'Completed' } : e));
    } catch (error) {
      console.error('Error completing task:', error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error.message);
    }
  };

  const overdueCount = events.filter(e => e.due_date && new Date(e.due_date) < new Date() && e.status !== 'Completed').length;
  const completedCount = events.filter(e => e.status === 'Completed').length;
  const pendingCount = events.filter(e => e.status !== 'Completed').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Tasks & Follow-ups</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Manage all scheduled activities and follow-ups across leads and customers.</p>
        </div>
        <div className="flex items-center bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => setSearchParams({ view: 'list' })}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeView === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <List size={16} /> List View
          </button>
          <button 
            onClick={() => setSearchParams({ view: 'calendar' })}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeView === 'calendar' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <CalendarIcon size={16} /> Calendar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center"><AlertCircle size={24} /></div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Overdue</p>
            <h4 className="text-2xl font-black">{overdueCount}</h4>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><Clock size={24} /></div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Pending</p>
            <h4 className="text-2xl font-black">{pendingCount}</h4>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Completed</p>
            <h4 className="text-2xl font-black">{completedCount}</h4>
          </div>
        </div>
      </div>

      {/* Search (list view only) */}
      {activeView === 'list' && (
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by subject..."
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative min-h-[500px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-primary mb-4" size={40} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading tasks...</p>
          </div>
        ) : activeView === 'list' ? (
          <TableView events={events} onComplete={handleComplete} onDelete={handleDelete} search={search} />
        ) : (
          <CalendarView events={events} />
        )}
      </div>
    </div>
  );
};

export default FollowUps;
