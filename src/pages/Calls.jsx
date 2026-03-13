import React, { useState } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Search,
  Filter,
  MoreVertical,
  PlayCircle,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Mic,
  AlertCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import ExotelCallButton from '../components/ExotelCallButton';

/**
 * Call log data structured as per Exotel's webhook payload.
 * Exotel sends a POST to your webhook URL after each call with these fields:
 * https://developer.exotel.com/api/#call-object
 */
const exotelCallLogs = [
  {
    sid: 'e3f821b1a2c94',                   // Exotel call SID
    from_number: '+919876543210',            // Customer number
    to_number: '+918046X86400',              // Agent virtual number (Exotel ExoPhone)
    direction: 'outbound-api',              // outbound-api | inbound
    status: 'completed',                    // completed | no-answer | busy | failed
    duration: '765',                        // seconds
    recording_url: 'https://exotel.example/rec/abc123.mp3',
    start_time: '2024-03-12T10:30:00',
    end_time: '2024-03-12T10:42:45',
    // CRM-enriched fields (stored in your backend alongside Exotel data)
    contact_name: 'Michael Chen',
    lead_id: 'LEAD-001',
    agent_name: 'Sarah Jenkins',
    campaign_id: null,
  },
  {
    sid: 'f9a71c2b3d05e',
    from_number: '+919876500987',
    to_number: '+918046X86401',
    direction: 'inbound',
    status: 'completed',
    duration: '492',
    recording_url: 'https://exotel.example/rec/def456.mp3',
    start_time: '2024-03-11T14:00:00',
    end_time: '2024-03-11T14:08:12',
    contact_name: 'Linda Parker',
    lead_id: 'LEAD-002',
    agent_name: 'Rahul Nair',
    campaign_id: null,
  },
  {
    sid: 'a2b83d4e5f16f',
    from_number: '+919988776655',
    to_number: '+918046X86400',
    direction: 'outbound-api',
    status: 'no-answer',
    duration: '0',
    recording_url: null,
    start_time: '2024-03-11T09:15:00',
    end_time: '2024-03-11T09:15:30',
    contact_name: 'Rajesh Kumar',
    lead_id: 'LEAD-003',
    agent_name: 'Ananya Sharma',
    campaign_id: null,
  },
  {
    sid: 'b3c94e5f6g27a',
    from_number: '+917766544332',
    to_number: '+918046X86402',
    direction: 'inbound',
    status: 'completed',
    duration: '125',
    recording_url: null,
    start_time: '2024-03-11T11:00:00',
    end_time: '2024-03-11T11:02:05',
    contact_name: 'Unknown Caller',
    lead_id: null,
    agent_name: 'Kiran Bose',
    campaign_id: null,
  },
  {
    sid: 'c4d05f6g7h38b',
    from_number: '+919898989898',
    to_number: '+918046X86400',
    direction: 'outbound-api',
    status: 'busy',
    duration: '0',
    recording_url: null,
    start_time: '2024-03-10T16:30:00',
    end_time: '2024-03-10T16:30:22',
    contact_name: 'Priya Ramachandran',
    lead_id: 'LEAD-005',
    agent_name: 'Sarah Jenkins',
    campaign_id: 'CAMP-Q1',
  },
];

const formatDuration = (seconds) => {
  const s = parseInt(seconds, 10);
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
};

const formatTime = (isoStr) => {
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
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [playingId, setPlayingId] = useState(null);

  const filteredLogs = exotelCallLogs.filter(log => {
    const text = `${log.contact_name} ${log.from_number} ${log.agent_name}`.toLowerCase();
    const matchSearch = text.includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'outbound' && log.direction === 'outbound-api') ||
      (filter === 'inbound' && log.direction === 'inbound') ||
      (filter === 'missed' && ['no-answer', 'busy', 'failed'].includes(log.status));
    return matchSearch && matchFilter;
  });

  const stats = [
    { label: 'Total Calls', value: exotelCallLogs.length, icon: Phone, color: 'text-primary bg-primary/10' },
    { label: 'Outbound', value: exotelCallLogs.filter(l => l.direction === 'outbound-api').length, icon: PhoneOutgoing, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Inbound', value: exotelCallLogs.filter(l => l.direction === 'inbound').length, icon: PhoneIncoming, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Missed / No Answer', value: exotelCallLogs.filter(l => l.status !== 'completed').length, icon: PhoneMissed, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Communication Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            Powered by{' '}
            <a
              href="https://exotel.com"
              target="_blank"
              rel="noreferrer"
              className="text-primary font-extrabold hover:underline inline-flex items-center gap-1"
            >
              <Zap size={12} className="inline" /> Exotel
            </a>
            {' '}— Click-to-call, recordings, and webhook-synced logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:shadow-sm transition-all">
            <Calendar size={16} />
            Mar 2024
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
            <Download size={16} />
            Export Logs
          </button>
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
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <h4 className="text-2xl font-black mt-0.5">{s.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Exotel Banner */}
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-primary/20 bg-primary/5">
        <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white flex-shrink-0">
          <Zap size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Exotel Click-to-Call is Active</p>
          <p className="text-xs text-slate-500 mt-0.5">Calls initiated from Lead or Customer pages are automatically logged here via Exotel webhooks. Recording URLs are synced post-call.</p>
        </div>
        <button className="px-4 py-2 text-xs font-bold text-primary border border-primary/20 rounded-xl hover:bg-primary/10 transition-all whitespace-nowrap">
          Configure Exotel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contact, number, or agent..."
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'outbound', 'inbound', 'missed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                filter === f
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
              <tr>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">Direction</th>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">Contact</th>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">Agent</th>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">Duration</th>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">Status</th>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">Recording</th>
                <th className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-right">Time & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map(log => {
                const dir = directionIcon[log.direction] || directionIcon['inbound'];
                const st = statusBadge[log.status] || statusBadge['failed'];
                const isPlaying = playingId === log.sid;
                return (
                  <tr key={log.sid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                    {/* Direction */}
                    <td className="px-5 py-5">
                      <div className={`size-10 rounded-xl flex items-center justify-center ${dir.color}`}>
                        <dir.icon size={18} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1 block">{dir.label}</span>
                    </td>
                    {/* Contact */}
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <User size={16} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                            {log.contact_name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">{log.from_number}</p>
                          {log.lead_id && (
                            <span className="text-[9px] font-black text-primary/70 uppercase tracking-wider">
                              {log.lead_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Agent */}
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black uppercase">
                          {log.agent_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{log.agent_name}</span>
                      </div>
                    </td>
                    {/* Duration */}
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs">
                        <Clock size={12} className="text-primary" />
                        {formatDuration(log.duration)}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tight border ${st.cls}`}>
                        <st.icon size={10} />
                        {st.label}
                      </span>
                    </td>
                    {/* Recording */}
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
                          {isPlaying ? 'Playing...' : 'Listen'}
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 italic">No recording</span>
                      )}
                    </td>
                    {/* Time & Actions */}
                    <td className="px-5 py-5 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs font-semibold text-slate-500">{formatTime(log.start_time)}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExotelCallButton phone={log.from_number} compact leadId={log.lead_id} />
                          <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                            <MoreVertical size={15} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    <Phone size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm">No calls match your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Showing {filteredLogs.length} of {exotelCallLogs.length} logs
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-40" disabled>
              <ChevronLeft size={15} />
            </button>
            <button className="size-8 flex items-center justify-center rounded-lg text-xs font-bold bg-primary text-white shadow-sm">1</button>
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calls;
