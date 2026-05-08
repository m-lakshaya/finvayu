import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Clock, CheckCircle2, AlertCircle, TrendingUp,
  IndianRupee, Target, ChevronRight, Loader2, Calendar,
  Award, Activity, PhoneCall, Mail, CheckSquare,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

// ── Constants ────────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { key: 'week',    label: 'This Week'    },
  { key: 'month',   label: 'This Month'   },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'all',     label: 'All Time'     },
];

const PIPELINE_STAGES = ['New', 'Contacted', 'Interested', 'Follow-up', 'Qualified'];
const CLOSED_STAGES   = ['Converted', 'Closed', 'Disbursed'];

const TASK_ICONS = { Call: PhoneCall, Email: Mail, Meeting: Calendar, 'To-Do': CheckSquare };

// ── Helpers ──────────────────────────────────────────────────────────────────

const getDateFrom = (range) => {
  const now = new Date();
  if (range === 'week')    return new Date(now.getTime() - 7 * 86400000);
  if (range === 'month')   return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === 'quarter') return new Date(now.getTime() - 90 * 86400000);
  return null;
};

const fmtCurrency = (n = 0) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const getLast6Months = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { month: 'short' }),
      count: 0,
    };
  });
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const isOverdue = (t) => t.due_date && new Date(t.due_date) < new Date();
const isDueToday = (t) => {
  if (!t.due_date) return false;
  const d = new Date(t.due_date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ title, value, sub, icon: Icon, iconClass = 'text-primary bg-primary/10', urgent = false }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 hover:shadow-sm transition-shadow">
    <div className="flex items-center justify-between">
      <span className={`p-2.5 rounded-xl ${iconClass}`}>
        <Icon size={17} />
      </span>
      {urgent && (
        <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full animate-pulse">
          Action Needed
        </span>
      )}
    </div>
    <div>
      <p className="text-xs font-medium text-slate-400">{title}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  </div>
);

// Horizontal bar funnel — real pipeline stages
const PipelineFunnel = ({ leads }) => {
  const all = [...PIPELINE_STAGES, ...CLOSED_STAGES];
  const counts = all.map(s => ({ label: s, count: leads.filter(l => l.status === s).length }));
  const max = Math.max(...counts.map(c => c.count), 1);

  const colors = [
    'bg-slate-300 dark:bg-slate-600',
    'bg-blue-400',
    'bg-indigo-400',
    'bg-violet-400',
    'bg-primary',
    'bg-emerald-500',
    'bg-emerald-600',
    'bg-emerald-700',
  ];

  return (
    <div className="space-y-2">
      {counts.map((s, i) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-20 text-right text-[11px] font-medium text-slate-400 shrink-0">{s.label}</span>
          <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
            <div
              className={`h-full ${colors[i]} rounded-md flex items-center px-2.5 transition-all duration-700`}
              style={{ width: `${Math.max((s.count / max) * 100, s.count > 0 ? 8 : 0)}%` }}
            >
              {s.count > 0 && <span className="text-[10px] font-bold text-white">{s.count}</span>}
            </div>
          </div>
          <span className="w-8 text-right text-[11px] font-semibold text-slate-500 shrink-0">{s.count}</span>
        </div>
      ))}
    </div>
  );
};

// Horizontal bar chart — lead source breakdown
const SourceChart = ({ leads }) => {
  const map = {};
  leads.forEach(l => { const s = l.source || 'Direct'; map[s] = (map[s] || 0) + 1; });
  const total = leads.length || 1;
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);

  if (!sorted.length) return (
    <p className="text-sm text-slate-400 text-center py-10">No leads yet.</p>
  );

  return (
    <div className="space-y-3.5">
      {sorted.map(([label, count]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-20 text-right text-[11px] font-medium text-slate-500 shrink-0 truncate">{label}</span>
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <span className="w-10 text-right text-[11px] font-semibold text-slate-500 shrink-0">
            {Math.round((count / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
};

// SVG-free bar chart — monthly lead trend
const TrendChart = ({ months }) => {
  const max = Math.max(...months.map(m => m.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-24 mt-2">
      {months.map((m, i) => {
        const pct = (m.count / max) * 100;
        const isLatest = i === months.length - 1;
        return (
          <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <span className={`text-[9px] font-semibold ${m.count > 0 ? 'text-slate-400' : 'text-transparent'}`}>
              {m.count}
            </span>
            <div
              className={`w-full rounded-t-md transition-all duration-700 ${isLatest ? 'bg-primary' : 'bg-primary/20'}`}
              style={{ height: `${Math.max(pct, 3)}%` }}
              title={`${m.label}: ${m.count}`}
            />
            <span className="text-[9px] font-medium text-slate-400">{m.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Top performers leaderboard (CEO only)
const Leaderboard = ({ performers }) => {
  if (!performers.length) return (
    <p className="text-sm text-slate-400 text-center py-8">No conversions in this period.</p>
  );
  const max = performers[0]?.count || 1;
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="space-y-3">
      {performers.map((p, i) => (
        <div key={p.id} className="flex items-center gap-3">
          <span className="text-base w-6 shrink-0 text-center">{medals[i] || `#${i + 1}`}</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1 truncate">{p.name}</span>
          <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${(p.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-500 w-6 text-right shrink-0">{p.count}</span>
        </div>
      ))}
    </div>
  );
};

// Task row — extracted to avoid block-body arrow inside JSX ternary (OXC compat)
const TaskRow = ({ task }) => {
  const overdue = isOverdue(task);
  const today = isDueToday(task);
  const TypeIcon = TASK_ICONS[task.type] || CheckSquare;
  const relatedName = task.leads?.name || task.customers?.name;
  const dateLabel = overdue ? 'Overdue'
    : today ? 'Due today'
    : task.due_date
      ? new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : 'No date';
  const dateColor = overdue ? 'text-red-500' : today ? 'text-orange-500' : 'text-slate-400';
  const iconBg = overdue ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary';
  const priorityColor = task.priority === 'High' ? 'text-red-400'
    : task.priority === 'Normal' ? 'text-blue-400' : 'text-slate-300';
  return (
    <div className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
      <span className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${iconBg}`}>
        <TypeIcon size={13} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.subject}</p>
        {relatedName && <p className="text-[11px] text-slate-400 truncate">{relatedName}</p>}
      </div>
      <div className="shrink-0 text-right">
        <span className={`text-[10px] font-semibold ${dateColor}`}>{dateLabel}</span>
        <p className={`text-[10px] mt-0.5 ${priorityColor}`}>{task.priority}</p>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { profile } = useAuth();
  const [range, setRange]   = useState('month');
  const [loading, setLoading] = useState(true);
  const [data, setData]     = useState(null);

  const roleName  = profile?.roles?.name?.toLowerCase() || '';
  const isCEO     = roleName === 'ceo' || profile?.profile_type === 'SYSTEM_ADMIN';
  const isPartner = ['banker', 'collaborator'].includes(roleName);
  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'there';

  const fetchData = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const dateFrom = getDateFrom(range);

      // ── Leads query (role-scoped) ───────────────────────────────────────
      let leadsQ = supabase.from('leads').select('*').eq('org_id', profile.org_id);
      if (!isCEO) leadsQ = leadsQ.eq('owner_id', profile.id);
      if (dateFrom) leadsQ = leadsQ.gte('created_at', dateFrom.toISOString());

      // Soft-delete filter with fallback
      let leadsRes = await leadsQ.is('deleted_at', null);
      if (leadsRes.error?.message?.includes('deleted_at')) {
        leadsRes = await leadsQ;
      }
      const leads = leadsRes.data || [];

      // ── Tasks (my tasks; CEO sees all org tasks) ────────────────────────
      let tasksQ = supabase
        .from('tasks')
        .select('*, leads(name), customers(name)')
        .eq('org_id', profile.org_id)
        .neq('status', 'Completed')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(5);
      if (!isCEO) tasksQ = tasksQ.eq('assigned_to', profile.id);

      let tasksRes = await tasksQ.is('deleted_at', null);
      if (tasksRes.error?.message?.includes('deleted_at')) {
        tasksRes = await tasksQ;
      }
      const tasks = tasksRes.data || [];

      // ── 6-month trend (own leads, no date filter) ───────────────────────
      const sixAgo = new Date();
      sixAgo.setMonth(sixAgo.getMonth() - 6);
      let trendQ = supabase.from('leads').select('created_at').eq('org_id', profile.org_id)
        .gte('created_at', sixAgo.toISOString());
      if (!isCEO) trendQ = trendQ.eq('owner_id', profile.id);
      const { data: trendRaw } = await trendQ;
      const months = getLast6Months();
      (trendRaw || []).forEach(l => {
        const d = new Date(l.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const m = months.find(t => t.key === key);
        if (m) m.count++;
      });

      // ── Derived stats ───────────────────────────────────────────────────
      const activeLeads    = leads.filter(l => !CLOSED_STAGES.includes(l.status));
      const closedLeads    = leads.filter(l => CLOSED_STAGES.includes(l.status));
      const conversionRate = leads.length > 0 ? Math.round((closedLeads.length / leads.length) * 100) : 0;
      const pipelineValue  = activeLeads.reduce((s, l) => s + (l.loan_amount || 0), 0);
      const disbursedValue = closedLeads.reduce((s, l) => s + (l.loan_amount || 0), 0);
      const newToday       = leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;

      // Partner / commission stats
      const commissionEarned  = leads.filter(l => l.invoice_status === 'paid').reduce((s, l) => s + (l.commission_amount || 0), 0);
      const pendingCommission = leads.filter(l => l.invoice_status === 'raised').reduce((s, l) => s + (l.commission_amount || 0), 0);
      const readyToInvoice    = leads.filter(l => ['Approved', 'Loan Approved'].includes(l.status) && l.invoice_status === 'pending').length;

      // Overdue + due today tasks
      const overdueTasks  = tasks.filter(isOverdue);
      const todayTasks    = tasks.filter(isDueToday);

      // Recent leads
      const recentLeads = [...leads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

      // ── CEO: top performers ─────────────────────────────────────────────
      let topPerformers = [];
      if (isCEO) {
        let perfQ = supabase.from('leads').select('owner_id')
          .eq('org_id', profile.org_id).in('status', CLOSED_STAGES);
        if (dateFrom) perfQ = perfQ.gte('created_at', dateFrom.toISOString());
        const { data: converted } = await perfQ;

        const perfMap = {};
        (converted || []).forEach(l => { perfMap[l.owner_id] = (perfMap[l.owner_id] || 0) + 1; });
        const topIds = Object.entries(perfMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

        if (topIds.length) {
          const { data: profiles } = await supabase.from('profiles')
            .select('id, full_name, first_name, last_name').in('id', topIds.map(([id]) => id));
          topPerformers = topIds.map(([id, count]) => {
            const p = (profiles || []).find(x => x.id === id);
            const name = p?.full_name?.trim() ||
              [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Unknown';
            return { id, name, count };
          });
        }
      }

      setData({
        leads, tasks, months, activeLeads, closedLeads,
        conversionRate, pipelineValue, disbursedValue, newToday,
        commissionEarned, pendingCommission, readyToInvoice,
        overdueTasks, todayTasks, recentLeads, topPerformers,
      });
    } catch (e) {
      console.error('Dashboard error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, range, isCEO]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Stat card config per role ─────────────────────────────────────────────
  const statCards = () => {
    if (!data) return [];
    if (isCEO) return [
      {
        title: 'Active Pipeline',
        value: fmtCurrency(data.pipelineValue),
        sub:   `${data.activeLeads.length} active lead${data.activeLeads.length !== 1 ? 's' : ''}`,
        icon:  TrendingUp,
        iconClass: 'text-primary bg-primary/10',
      },
      {
        title: 'Disbursed / Closed',
        value: fmtCurrency(data.disbursedValue),
        sub:   `${data.closedLeads.length} deals closed`,
        icon:  CheckCircle2,
        iconClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
      },
      {
        title: 'Conversion Rate',
        value: `${data.conversionRate}%`,
        sub:   `${data.closedLeads.length} of ${data.leads.length} leads`,
        icon:  Target,
        iconClass: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
      },
      {
        title: 'Overdue Follow-ups',
        value: data.overdueTasks.length,
        sub:   data.overdueTasks.length > 0 ? 'Across all team members' : 'All caught up',
        icon:  AlertCircle,
        iconClass: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
        urgent: data.overdueTasks.length > 0,
      },
    ];

    if (isPartner) return [
      {
        title: 'Leads Referred',
        value: data.leads.length,
        sub:   `${data.activeLeads.length} still active`,
        icon:  UserPlus,
        iconClass: 'text-primary bg-primary/10',
      },
      {
        title: 'Commission Earned',
        value: fmtCurrency(data.commissionEarned),
        sub:   'Total paid out',
        icon:  CheckCircle2,
        iconClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
      },
      {
        title: 'Pending Commission',
        value: fmtCurrency(data.pendingCommission),
        sub:   'Invoice raised, awaiting payment',
        icon:  IndianRupee,
        iconClass: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      },
      {
        title: 'Ready to Invoice',
        value: data.readyToInvoice,
        sub:   data.readyToInvoice > 0 ? 'Approved leads awaiting invoice' : 'None pending',
        icon:  AlertCircle,
        iconClass: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
        urgent: data.readyToInvoice > 0,
      },
    ];

    // RM / SA
    return [
      {
        title: 'My Active Leads',
        value: data.activeLeads.length,
        sub:   data.newToday > 0 ? `+${data.newToday} added today` : 'No new leads today',
        icon:  UserPlus,
        iconClass: 'text-primary bg-primary/10',
      },
      {
        title: 'My Pipeline Value',
        value: fmtCurrency(data.pipelineValue),
        sub:   'Sum of active loan amounts',
        icon:  TrendingUp,
        iconClass: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
      },
      {
        title: 'Conversion Rate',
        value: `${data.conversionRate}%`,
        sub:   `${data.closedLeads.length} of ${data.leads.length} leads closed`,
        icon:  Target,
        iconClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
      },
      {
        title: 'Overdue Follow-ups',
        value: data.overdueTasks.length,
        sub:   data.overdueTasks.length > 0 ? `${data.todayTasks.length} due today` : 'All caught up',
        icon:  Clock,
        iconClass: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
        urgent: data.overdueTasks.length > 0,
      },
    ];
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary" size={36} />
      <p className="text-sm font-medium text-slate-400">Loading dashboard…</p>
    </div>
  );

  if (!data) return (
    <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
      <AlertCircle className="text-orange-400" size={36} />
      <p className="text-sm font-medium text-slate-400">Could not load dashboard data. Please refresh.</p>
    </div>
  );

  const cards = statCards();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-400">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {greeting()}, {firstName}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {profile?.roles?.name && <span className="ml-2 text-slate-300">·</span>}
            {profile?.roles?.name && <span className="ml-2">{profile.roles.name}</span>}
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {DATE_RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r.key
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Pipeline funnel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pipeline Stages</h3>
              <p className="text-xs text-slate-400 mt-0.5">{data.leads.length} total leads</p>
            </div>
            <Activity size={16} className="text-slate-300" />
          </div>
          <PipelineFunnel leads={data.leads} />
        </div>

        {/* Lead source */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Lead Sources</h3>
              <p className="text-xs text-slate-400 mt-0.5">Where leads come from</p>
            </div>
            <Target size={16} className="text-slate-300" />
          </div>
          <SourceChart leads={data.leads} />
        </div>

        {/* Monthly trend */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Leads</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
            </div>
            <TrendingUp size={16} className="text-slate-300" />
          </div>
          <TrendChart months={data.months} />
        </div>
      </div>

      {/* CEO: Top performers */}
      {isCEO && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top Performers</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ranked by conversions in selected period</p>
            </div>
            <Award size={16} className="text-slate-300" />
          </div>
          <Leaderboard performers={data.topPerformers} />
        </div>
      )}

      {/* Tables row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recent leads */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Leads</h3>
              <p className="text-xs text-slate-400 mt-0.5">Latest additions</p>
            </div>
            <Link
              to="/leads"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ChevronRight size={13} />
            </Link>
          </div>

          {data.recentLeads.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">No leads found for this period.</p>
            </div>
          )}
          {data.recentLeads.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {data.recentLeads.map((lead) => {
                  const statusCls = CLOSED_STAGES.includes(lead.status)
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20'
                    : 'bg-primary/10 text-primary';
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="font-medium text-slate-900 dark:text-white hover:text-primary transition-colors"
                        >
                          {lead.name}
                        </Link>
                        {lead.phone && <p className="text-[11px] text-slate-400">{lead.phone}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusCls}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                        {lead.loan_amount ? fmtCurrency(lead.loan_amount) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Upcoming follow-ups */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Follow-ups</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {data.overdueTasks.length > 0
                  ? `${data.overdueTasks.length} overdue`
                  : 'Your pending tasks'}
              </p>
            </div>
            <Link
              to="/follow-ups"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ChevronRight size={13} />
            </Link>
          </div>

          {data.tasks.length === 0 && (
            <div className="py-12 text-center">
              <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">All caught up — no pending tasks.</p>
            </div>
          )}
          {data.tasks.length > 0 && (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {data.tasks.map((task) => <TaskRow key={task.id} task={task} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;