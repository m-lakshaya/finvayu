import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserCheck, MapPin, Calendar, Search, Users,
  Loader2, LogOut, LogIn, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, Coffee, RefreshCw,
  Timer, TrendingUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, PERMISSIONS } from '../hooks/useAuth';
import { getDisplayName, getInitials } from '../utils/profileUtils';

// ── helpers ──────────────────────────────────────────────────────────────────
const toLocalDate = (d = new Date()) => d.toISOString().split('T')[0];

const fmt12 = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const workingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '—';
  const mins = Math.round((new Date(checkOut) - new Date(checkIn)) / 60000);
  if (mins < 0) return '—';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const isLate = (checkIn) => {
  if (!checkIn) return false;
  const d = new Date(checkIn);
  return d.getHours() > 10 || (d.getHours() === 10 && d.getMinutes() > 0);
};

const isHalfDay = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return false;
  const out = new Date(checkOut);
  return out.getHours() < 14;
};

const deriveStatus = (row) => {
  if (!row.check_in) return 'Absent';
  if (row.check_out && isHalfDay(row.check_in, row.check_out)) return 'Half Day';
  if (isLate(row.check_in)) return 'Late';
  return 'Present';
};

const STATUS_CONFIG = {
  Present:  { color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20', icon: CheckCircle2 },
  Late:     { color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20',         icon: AlertCircle },
  'Half Day':{ color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20',            icon: Coffee },
  'On Leave':{ color: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/20',    icon: Calendar },
  Absent:   { color: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20',             icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Absent;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.color}`}>
      <Icon size={10} />{status}
    </span>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h4 className={`text-2xl font-black mt-1 ${color}`}>{value}</h4>
    </div>
    <Icon size={22} className={`${color} opacity-20`} />
  </div>
);

// ── Manager View ──────────────────────────────────────────────────────────────
const ManagerView = ({ profile }) => {
  const [date, setDate]       = useState(toLocalDate());
  const [search, setSearch]   = useState('');
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRecord, setMyRecord] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!profile?.org_id) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name, email, roles(name)')
      .eq('org_id', profile.org_id)
      .not('role_id', 'in', '(banker,collaborator)');
    if (error) console.error('fetchMembers error:', error);
    setMembers(data || []);
  }, [profile?.org_id]);

  const fetchAttendance = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('org_id', profile.org_id)
        .eq('date', date);
      if (error) throw error;
      setRecords(data || []);
      setMyRecord((data || []).find(r => r.user_id === profile.id) || null);
    } catch (e) {
      console.error('Attendance fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, profile?.id, date]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const now = new Date();
      const status = isLate(now.toISOString()) ? 'Late' : 'Present';
      await supabase.from('attendance').insert({
        org_id: profile.org_id,
        user_id: profile.id,
        date,
        check_in: now.toISOString(),
        status,
        device: 'Web Portal',
      });
      fetchAttendance();
    } catch (e) { alert('Check-in failed: ' + e.message); }
    finally { setActionLoading(false); }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const now = new Date();
      const status = isHalfDay(myRecord.check_in, now.toISOString()) ? 'Half Day'
                   : isLate(myRecord.check_in) ? 'Late' : 'Present';
      await supabase.from('attendance')
        .update({ check_out: now.toISOString(), status })
        .eq('id', myRecord.id)
        .eq('user_id', profile.id);
      fetchAttendance();
    } catch (e) { alert('Check-out failed: ' + e.message); }
    finally { setActionLoading(false); }
  };

  // Merge members + attendance records so absent members still appear
  const rows = useMemo(() => {
    const byUser = Object.fromEntries(records.map(r => [r.user_id, r]));
    return members
      .filter(m => {
        const name = getDisplayName(m).toLowerCase();
        return !search || name.includes(search.toLowerCase()) || (m.email || '').toLowerCase().includes(search.toLowerCase());
      })
      .map(m => ({ ...m, attendance: byUser[m.id] || null }));
  }, [members, records, search]);

  const presentCount  = records.filter(r => r.status === 'Present').length;
  const lateCount     = records.filter(r => r.status === 'Late').length;
  const halfDayCount  = records.filter(r => r.status === 'Half Day').length;
  const absentCount   = Math.max(0, members.length - records.length);
  const isToday       = date === toLocalDate();

  const adjDate = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(toLocalDate(d));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance</h1>
          <p className="text-slate-500 text-sm mt-1">Team check-ins, working hours, and daily status.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* My check-in/out */}
          {isToday && !myRecord && (
            <button onClick={handleCheckIn} disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60">
              {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
              Mark My Check-in
            </button>
          )}
          {isToday && myRecord && !myRecord.check_out && (
            <button onClick={handleCheckOut} disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60">
              {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
              Mark My Check-out
            </button>
          )}
          {isToday && myRecord?.check_out && (
            <span className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-sm font-semibold">
              <CheckCircle2 size={15} className="text-emerald-500" /> Done for today
            </span>
          )}
          <button onClick={fetchAttendance}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw size={15} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Team Strength" value={members.length} color="text-primary" />
        <StatCard icon={UserCheck}   label="Present"       value={presentCount}   color="text-emerald-500" />
        <StatCard icon={AlertCircle} label="Late"          value={lateCount}      color="text-amber-500" />
        <StatCard icon={XCircle}     label="Absent"        value={absentCount}    color="text-rose-500" />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search team member…"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
        {/* Date navigator */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2">
          <button onClick={() => adjDate(-1)} className="p-1.5 hover:text-primary transition-colors"><ChevronLeft size={16} /></button>
          <input type="date" value={date} max={toLocalDate()} onChange={e => setDate(e.target.value)}
            className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent outline-none cursor-pointer" />
          <button onClick={() => adjDate(1)} disabled={isToday} className="p-1.5 hover:text-primary transition-colors disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
        {!isToday && (
          <button onClick={() => setDate(toLocalDate())}
            className="px-4 py-2.5 text-sm font-semibold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors">
            Today
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {['Team Member', 'Role', 'Status', 'Check-in', 'Check-out', 'Hours', 'Location'].map(h => (
                <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-20 text-center">
                <Loader2 size={24} className="animate-spin text-primary mx-auto" />
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                {search ? 'No matching team members.' : 'No team members found.'}
              </td></tr>
            ) : rows.map(row => {
              const att   = row.attendance;
              const status = att ? (att.status || deriveStatus(att)) : 'Absent';
              const initials = getInitials(row);
              return (
                <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center flex-shrink-0">{initials}</div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{getDisplayName(row)}</p>
                        <p className="text-[10px] text-slate-400">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 capitalize">{row.roles?.name || '—'}</td>
                  <td className="px-5 py-4"><StatusBadge status={status} /></td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{fmt12(att?.check_in)}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{fmt12(att?.check_out)}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <Timer size={11} className="text-slate-400" />
                      {workingHours(att?.check_in, att?.check_out)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {att?.location
                      ? <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={11} className="text-primary" />{att.location}</span>
                      : <span className="text-xs text-slate-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      {!loading && rows.length > 0 && (
        <div className="flex items-center gap-6 text-xs text-slate-500">
          {halfDayCount > 0 && <span className="flex items-center gap-1"><Coffee size={11} className="text-blue-400" />{halfDayCount} Half Day</span>}
          <span className="flex items-center gap-1"><TrendingUp size={11} className="text-emerald-400" />
            Attendance rate: {members.length ? Math.round((records.length / members.length) * 100) : 0}%
          </span>
        </div>
      )}
    </div>
  );
};

// ── Employee Self View ────────────────────────────────────────────────────────
const EmployeeView = ({ profile }) => {
  const [today]         = useState(toLocalDate());
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month

  const targetMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthStart = useMemo(() => toLocalDate(targetMonth), [targetMonth]);
  const monthEnd   = useMemo(() => {
    const d = new Date(targetMonth);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return toLocalDate(d);
  }, [targetMonth]);

  const fetchData = useCallback(async () => {
    if (!profile?.id || !profile?.org_id) return;
    setLoading(true);
    try {
      // Today's record
      const { data: todayData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', profile.id)
        .eq('org_id', profile.org_id)
        .eq('date', today)
        .maybeSingle();
      setTodayRecord(todayData || null);

      // Month history
      const { data: histData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', profile.id)
        .eq('org_id', profile.org_id)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false });
      setHistory(histData || []);
    } catch (e) {
      console.error('Attendance self-fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.org_id, today, monthStart, monthEnd]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const now = new Date();
      const status = isLate(now.toISOString()) ? 'Late' : 'Present';
      const { data, error } = await supabase.from('attendance').insert({
        org_id: profile.org_id,
        user_id: profile.id,
        date: today,
        check_in: now.toISOString(),
        status,
        device: 'Web Portal',
      }).select().single();
      if (error) throw error;
      setTodayRecord(data);
    } catch (e) { alert('Check-in failed: ' + e.message); }
    finally { setActionLoading(false); }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setActionLoading(true);
    try {
      const now = new Date();
      const status = isHalfDay(todayRecord.check_in, now.toISOString()) ? 'Half Day'
                   : isLate(todayRecord.check_in) ? 'Late' : 'Present';
      const { data, error } = await supabase.from('attendance')
        .update({ check_out: now.toISOString(), status })
        .eq('id', todayRecord.id)
        .eq('user_id', profile.id)
        .select().single();
      if (error) throw error;
      setTodayRecord(data);
    } catch (e) { alert('Check-out failed: ' + e.message); }
    finally { setActionLoading(false); }
  };

  // Monthly stats
  const presentDays  = history.filter(r => r.status === 'Present').length;
  const lateDays     = history.filter(r => r.status === 'Late').length;
  const halfDays     = history.filter(r => r.status === 'Half Day').length;
  const totalMinutes = history.reduce((sum, r) => {
    if (!r.check_in || !r.check_out) return sum;
    return sum + Math.max(0, Math.round((new Date(r.check_out) - new Date(r.check_in)) / 60000));
  }, 0);
  const totalHours   = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

  const currentMonthLabel = targetMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const todayStatus = todayRecord
    ? (todayRecord.check_out ? deriveStatus(todayRecord) : (isLate(todayRecord.check_in) ? 'Late' : 'Present'))
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Attendance</h1>
        <p className="text-slate-500 text-sm mt-1">Track your check-ins and monthly attendance history.</p>
      </div>

      {/* Today's card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`size-14 rounded-2xl flex items-center justify-center
              ${!todayRecord ? 'bg-slate-100 dark:bg-slate-800' :
                todayRecord.check_out ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-primary/10'}`}>
              {!todayRecord ? <LogIn size={24} className="text-slate-400" /> :
               todayRecord.check_out ? <CheckCircle2 size={24} className="text-emerald-500" /> :
               <UserCheck size={24} className="text-primary" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                {todayRecord?.check_in && <span className="flex items-center gap-1"><LogIn size={10} className="text-emerald-500" /> In: {fmt12(todayRecord.check_in)}</span>}
                {todayRecord?.check_out && <span className="flex items-center gap-1"><LogOut size={10} className="text-rose-400" /> Out: {fmt12(todayRecord.check_out)}</span>}
                {todayRecord?.check_in && todayRecord?.check_out && (
                  <span className="flex items-center gap-1"><Timer size={10} className="text-slate-400" />{workingHours(todayRecord.check_in, todayRecord.check_out)}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {todayStatus && <StatusBadge status={todayStatus} />}
            {!todayRecord && (
              <button onClick={handleCheckIn} disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60">
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                Check In
              </button>
            )}
            {todayRecord && !todayRecord.check_out && (
              <button onClick={handleCheckOut} disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60">
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
                Check Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={UserCheck} label="Present Days"  value={presentDays}  color="text-emerald-500" />
        <StatCard icon={AlertCircle} label="Late Days"   value={lateDays}     color="text-amber-500" />
        <StatCard icon={Coffee}    label="Half Days"     value={halfDays}     color="text-blue-500" />
        <StatCard icon={Timer}     label="Total Hours"   value={totalHours}   color="text-primary" />
      </div>

      {/* History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly History</h3>
          <div className="flex items-center gap-1">
            <button onClick={() => setMonthOffset(o => o - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronLeft size={15} /></button>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-32 text-center">{currentMonthLabel}</span>
            <button onClick={() => setMonthOffset(o => o + 1)} disabled={monthOffset >= 0} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"><ChevronRight size={15} /></button>
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <tr>
              {['Date', 'Status', 'Check-in', 'Check-out', 'Hours'].map(h => (
                <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-16 text-center"><Loader2 size={22} className="animate-spin text-primary mx-auto" /></td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-400 text-sm">No attendance records for {currentMonthLabel}.</td></tr>
            ) : history.map(row => (
              <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {new Date(row.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </td>
                <td className="px-5 py-3"><StatusBadge status={row.status || deriveStatus(row)} /></td>
                <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400">{fmt12(row.check_in)}</td>
                <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400">{fmt12(row.check_out)}</td>
                <td className="px-5 py-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><Timer size={10} />{workingHours(row.check_in, row.check_out)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Root Component ────────────────────────────────────────────────────────────
const Attendance = () => {
  const { profile, hasPermission } = useAuth();

  // Managers (CEO, RM) see the full team dashboard
  // Everyone else sees their own self-view
  const isManager = hasPermission(PERMISSIONS.MANAGE_USERS) ||
                    profile?.roles?.name?.toLowerCase() === 'rm';

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return isManager
    ? <ManagerView profile={profile} />
    : <EmployeeView profile={profile} />;
};

export default Attendance;
