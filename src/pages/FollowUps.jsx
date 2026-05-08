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
  X,
  Save,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams, Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

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

const TableView = ({ events, onComplete, onDelete, search, onSelect }) => {
  const [sortField, setSortField] = useState('due_date');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field) => {
    if (field === sortField) setSortAsc((p) => !p);
    else { setSortField(field); setSortAsc(true); }
  };

  const filtered = events
    .filter((e) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        e.subject?.toLowerCase().includes(q) ||
        e.leads?.name?.toLowerCase().includes(q) ||
        e.customers?.name?.toLowerCase().includes(q)
      );
    })
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
                <tr key={ev.id} onClick={() => onSelect && onSelect(ev)} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group ${ev.status === 'Completed' ? 'opacity-60' : ''}`}>
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
                    {ev.lead_id && (
                      <Link
                        to={`/leads/${ev.lead_id}`}
                        className="flex items-center gap-1.5 text-primary hover:underline font-bold"
                      >
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          Lead
                        </span>
                        {ev.leads?.name || ev.lead_id}
                      </Link>
                    )}
                    {ev.customer_id && (
                      <Link
                        to={`/customers/${ev.customer_id}`}
                        className="flex items-center gap-1.5 text-primary hover:underline font-bold"
                      >
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          Customer
                        </span>
                        {ev.customers?.name || ev.customer_id}
                      </Link>
                    )}
                    {!ev.lead_id && !ev.customer_id && (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
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
  const { confirm } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get('view') || 'list';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask]   = useState(null);  // draft copy while editing
  const [savingTask,  setSavingTask]    = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      // Try with deleted_at filter; fall back if migration 009 not run yet
      let { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          leads      ( id, name, deleted_at ),
          customers  ( id, name, deleted_at )
        `)
        .eq('org_id', profile.org_id)
        .is('deleted_at', null)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error?.message?.includes('deleted_at')) {
        // Column doesn't exist yet — fetch without filter
        ({ data, error } = await supabase
          .from('tasks')
          .select(`*, leads(id, name), customers(id, name)`)
          .eq('org_id', profile.org_id)
          .order('due_date', { ascending: true, nullsFirst: false }));
      }

      if (error) throw error;
      // Filter out tasks whose parent lead or customer has been soft-deleted
      const visible = (data || []).filter(t => {
        if (t.leads     && t.leads.deleted_at)     return false;
        if (t.customers && t.customers.deleted_at) return false;
        return true;
      });
      setEvents(visible);
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
    const ok = await confirm({
      title: 'Delete Follow-up',
      message: 'Delete this follow-up task? This action cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error.message);
    }
  };

  const handleSaveTask = async () => {
    if (!editingTask) return;
    setSavingTask(true);
    try {
      const { subject, type, status, priority, due_date, notes } = editingTask;
      const { data, error } = await supabase.from('tasks')
        .update({ subject, type, status, priority, due_date: due_date || null, notes })
        .eq('id', editingTask.id)
        .select().single();
      if (error) throw error;
      setEvents(prev => prev.map(e => e.id === data.id ? { ...e, ...data } : e));
      setSelectedTask({ ...selectedTask, ...data });
      setEditingTask(null);
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSavingTask(false);
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

      {/* Search bar — list view only */}
      {activeView === 'list' && (
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks, leads, customers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}

      {/* Views */}
      {!loading && activeView === 'list' && (
        <TableView
          events={events}
          onComplete={handleComplete}
          onDelete={handleDelete}
          search={search}
          onSelect={(task) => { setSelectedTask(task); setEditingTask(null); }}
        />
      )}
      {!loading && activeView === 'calendar' && <CalendarView events={events} />}

      {/* ── Task Detail Slide-over ─────────────────────────────────────── */}
      {selectedTask && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
            onClick={() => { setSelectedTask(null); setEditingTask(null); }}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 z-50 flex flex-col animate-in slide-in-from-right duration-250 border-l border-slate-200 dark:border-slate-800">

            {/* Top bar — type chip + close only */}
            <div className="flex items-center justify-between px-5 pt-4 pb-0">
              <div className="flex items-center gap-2">
                {(() => {
                  const TypeIcon = TYPE_ICONS[selectedTask.type] || CheckSquare;
                  return (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <TypeIcon size={13} />
                      {selectedTask.type}
                    </span>
                  );
                })()}
                {selectedTask.due_date && new Date(selectedTask.due_date) < new Date() && selectedTask.status !== 'Completed' && (
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">Overdue</span>
                )}
              </div>
              <button
                onClick={() => { setSelectedTask(null); setEditingTask(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Hero — title + status/priority */}
            <div className="px-5 pt-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              {editingTask ? (
                <input
                  autoFocus
                  type="text"
                  value={editingTask.subject || ''}
                  onChange={e => setEditingTask(p => ({ ...p, subject: e.target.value }))}
                  className="w-full text-lg font-semibold text-slate-900 dark:text-white bg-transparent border-0 border-b-2 border-primary/40 focus:border-primary outline-none pb-1 transition-colors"
                  placeholder="Task subject…"
                />
              ) : (
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug">
                  {selectedTask.subject}
                </h2>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${statusColor(editingTask?.status || selectedTask.status)}`}>
                  {editingTask?.status || selectedTask.status}
                </span>
                <span className={`text-[11px] font-semibold ${priorityColor(editingTask?.priority || selectedTask.priority)}`}>
                  {editingTask?.priority || selectedTask.priority} Priority
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">

              {editingTask ? (
                /* ── Edit mode ──────────────────────────────────────────────── */
                <div className="px-5 py-5 space-y-5">

                  {/* Type / Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Type</label>
                      <select
                        value={editingTask.type || 'To-Do'}
                        onChange={e => setEditingTask(p => ({ ...p, type: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-200"
                      >
                        {['Call', 'Email', 'Meeting', 'To-Do'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Priority</label>
                      <select
                        value={editingTask.priority || 'Normal'}
                        onChange={e => setEditingTask(p => ({ ...p, priority: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-200"
                      >
                        {['High', 'Normal', 'Low'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Status / Due date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Status</label>
                      <select
                        value={editingTask.status || 'Open'}
                        onChange={e => setEditingTask(p => ({ ...p, status: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-200"
                      >
                        {['Open', 'In Progress', 'Deferred', 'Completed'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Due Date</label>
                      <input
                        type="date"
                        value={editingTask.due_date ? editingTask.due_date.slice(0, 10) : ''}
                        onChange={e => setEditingTask(p => ({ ...p, due_date: e.target.value || null }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Notes</label>
                    <textarea
                      rows={5}
                      value={editingTask.notes || ''}
                      onChange={e => setEditingTask(p => ({ ...p, notes: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-200 resize-none leading-relaxed"
                      placeholder="Add notes…"
                    />
                  </div>
                </div>

              ) : (
                /* ── Read mode ──────────────────────────────────────────────── */
                <div className="divide-y divide-slate-100 dark:divide-slate-800">

                  {/* Metadata rows */}
                  <dl className="px-5 py-4 space-y-4">
                    {/* Due date */}
                    <div className="flex items-start gap-3">
                      <dt className="w-24 shrink-0 text-xs font-medium text-slate-400 pt-0.5">Due Date</dt>
                      <dd className="text-sm text-slate-800 dark:text-slate-200">
                        {selectedTask.due_date
                          ? new Date(selectedTask.due_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                          : <span className="text-slate-400">Not set</span>}
                      </dd>
                    </div>

                    {/* Related to */}
                    <div className="flex items-start gap-3">
                      <dt className="w-24 shrink-0 text-xs font-medium text-slate-400 pt-0.5">Related To</dt>
                      <dd className="flex-1">
                        {selectedTask.lead_id ? (
                          <Link
                            to={`/leads/${selectedTask.lead_id}`}
                            onClick={() => setSelectedTask(null)}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          >
                            {selectedTask.leads?.name || 'View Lead'}
                            <ExternalLink size={11} />
                          </Link>
                        ) : selectedTask.customer_id ? (
                          <Link
                            to={`/customers/${selectedTask.customer_id}`}
                            onClick={() => setSelectedTask(null)}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          >
                            {selectedTask.customers?.name || 'View Customer'}
                            <ExternalLink size={11} />
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </dd>
                    </div>

                    {/* Created */}
                    <div className="flex items-start gap-3">
                      <dt className="w-24 shrink-0 text-xs font-medium text-slate-400 pt-0.5">Created</dt>
                      <dd className="text-sm text-slate-500">
                        {selectedTask.created_at
                          ? new Date(selectedTask.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </dd>
                    </div>

                    {selectedTask.completed_at && (
                      <div className="flex items-start gap-3">
                        <dt className="w-24 shrink-0 text-xs font-medium text-slate-400 pt-0.5">Completed</dt>
                        <dd className="text-sm text-emerald-600 font-medium">
                          {new Date(selectedTask.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {/* Notes section */}
                  <div className="px-5 py-4">
                    <p className="text-xs font-medium text-slate-400 mb-2">Notes</p>
                    {selectedTask.notes ? (
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedTask.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400">No notes added.</p>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              {editingTask ? (
                <>
                  <button
                    onClick={() => setEditingTask(null)}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTask}
                    disabled={savingTask}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  >
                    {savingTask ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  {/* Destructive — far left, ghost */}
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Delete Follow-up',
                        message: 'Delete this follow-up task? This action cannot be undone.',
                        confirmLabel: 'Delete',
                        danger: true,
                      });
                      if (ok) { handleDelete(selectedTask.id); setSelectedTask(null); }
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="flex-1" />

                  {/* Edit */}
                  {selectedTask.status !== 'Completed' && (
                    <button
                      onClick={() => setEditingTask({ ...selectedTask })}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  )}

                  {/* Mark complete — primary CTA */}
                  {selectedTask.status !== 'Completed' ? (
                    <button
                      onClick={() => { handleComplete(selectedTask.id); setSelectedTask(p => ({ ...p, status: 'Completed' })); }}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    >
                      <CheckCircle2 size={13} /> Mark Complete
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-emerald-600">
                      <CheckCircle2 size={13} /> Completed
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FollowUps;
