import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Mic,
  AlertCircle,
  CheckCircle2,
  Zap,
  Loader2,
  FileText
} from 'lucide-react';
import ExotelCallButton from '../components/ExotelCallButton';
import CSVToolbar from '../components/CSVToolbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const formatDuration = (seconds) => {
  const s = parseInt(seconds, 10);
  if (!s || s === 0) return '—';
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
};

const formatTime = (isoStr) => {
  if (!isoStr) return 'Unknown';
  const d = new Date(isoStr);
  return d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
};

const statusBadge = {
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50', icon: CheckCircle2 },
  'no-answer': { label: 'No Answer', cls: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/50', icon: AlertCircle },
  busy: { label: 'Busy', cls: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800/50', icon: PhoneMissed },
  failed: { label: 'Failed', cls: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700', icon: AlertCircle },
};

const directionIcon = {
  'outbound-api': { icon: PhoneOutgoing, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', label: 'Outbound' },
  inbound: { icon: PhoneIncoming, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20', label: 'Inbound' },
};

const Calls = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [playingId, setPlayingId] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('call_logs')
        .select(`
          *,
          agent:agent_id (full_name)
        `)
        .eq('org_id', profile.org_id)
        .order('start_time', { ascending: false });

      if (search) {
        query = query.or(`from_number.ilike.%${search}%,contact_name.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      setLogs(data || []);
      setTotalCount(count || data?.length || 0);
    } catch (error) {
      console.error('Error fetching call logs:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'outbound') return log.direction === 'outbound-api';
    if (filter === 'inbound') return log.direction === 'inbound';
    if (filter === 'missed') return ['no-answer', 'busy', 'failed'].includes(log.status);
    return true;
  });

  const stats = [
    { label: 'Total Calls', value: logs.length, icon: Phone, color: 'text-primary bg-primary/10' },
    { label: 'Outbound', value: logs.filter(l => l.direction === 'outbound-api').length, icon: PhoneOutgoing, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Inbound', value: logs.filter(l => l.direction === 'inbound').length, icon: PhoneIncoming, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Missed / No Answer', value: logs.filter(l => l.status !== 'completed').length, icon: PhoneMissed, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
  ];

  const exportHeaders = ['SID', 'From', 'To', 'Direction', 'Status', 'Duration', 'Agent', 'Time'];
  const exportKeys = ['sid', 'from_number', 'to_number', 'direction', 'status', 'duration', 'agent_name', 'start_time'];
  
  // Flatten agent name for Export
  const dataToExport = logs.map(l => ({
    ...l,
    agent_name: l.agent?.full_name || 'System'
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Communication Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            Powered by <span className="text-primary font-extrabold">Exotel</span> — Webhook-synced records and voice recordings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:shadow-sm transition-all border-dashed">
            <Calendar size={16} />
            This Month
          </button>
          <CSVToolbar 
            entityType="call_logs"
            dataToExport={dataToExport}
            exportHeaders={exportHeaders}
            exportKeys={exportKeys}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className={`size-11 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">{s.label}</p>
              <h4 className="text-2xl font-black mt-1.5 leading-none">{s.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contact name or phone number..."
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'outbound', 'inbound', 'missed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize border ${
                filter === f
                  ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">Dir</th>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">Contact</th>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">Agent</th>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">Duration</th>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">Status</th>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">Recording</th>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Retrieving secure call logs...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <Phone size={32} className="mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="font-bold text-sm text-slate-500">No communication logs found.</p>
                  </td>
                </tr>
              ) : filteredLogs.map(log => {
                const dir = directionIcon[log.direction] || directionIcon['inbound'];
                const st = statusBadge[log.status] || statusBadge['failed'];
                const isPlaying = playingId === log.sid;
                return (
                  <tr key={log.sid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                    <td className="px-5 py-5">
                      <div className={`size-10 rounded-xl flex items-center justify-center ${dir.color}`}>
                        <dir.icon size={18} />
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <User size={16} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                            {log.contact_name || 'Unknown Caller'}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">{log.from_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">
                          {log.agent?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        {log.agent?.full_name || 'System'}
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs">
                        <Clock size={12} className="text-primary" />
                        {formatDuration(log.duration)}
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tight border ${st.cls}`}>
                        <st.icon size={10} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      {log.recording_url ? (
                        <button
                          onClick={() => setPlayingId(isPlaying ? null : log.sid)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                            isPlaying
                              ? 'bg-primary text-white animate-pulse'
                              : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                          }`}
                        >
                          <Mic size={12} />
                          {isPlaying ? 'Playing...' : 'Recording'}
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 opacity-50">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-5 text-right font-bold text-xs text-slate-500">
                      {formatTime(log.start_time)}
                      <div className="opacity-0 group-hover:opacity-100 mt-1">
                         <ExotelCallButton phone={log.from_number} compact leadId={log.lead_id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Calls;
