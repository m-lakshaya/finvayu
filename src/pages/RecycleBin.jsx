import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  Loader2,
  Users,
  Building2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { fmtCurrency } from '../utils/formatUtils';

// ─── RecycleBin ───────────────────────────────────────────────────────────────
// Global admin-only recycle bin (Salesforce-style).
// Shows all soft-deleted leads AND customers for the org.
// Admins (CEO / SYSTEM_ADMIN) can restore records.
// No "Delete Forever" — records are retained as a permanent soft-delete backup.

const ENTITY_BADGE = {
  lead:     { label: 'Lead',     color: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/20 dark:border-violet-800/50', Icon: Users },
  customer: { label: 'Customer', color: 'bg-amber-50  text-amber-600  border-amber-100  dark:bg-amber-900/20  dark:border-amber-800/50',  Icon: Building2 },
};

const RecycleBin = () => {
  const { profile } = useAuth();
  const { showNotification } = useNotification();

  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // '' | 'lead' | 'customer'
  const [restoring, setRestoring] = useState(null); // id of item being restored

  // ── Fetch deleted leads + customers ─────────────────────────────────────
  const fetchDeleted = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const [leadsRes, customersRes] = await Promise.all([
        supabase
          .from('leads')
          .select('id, name, email, phone, loan_type, loan_amount, status, deleted_at')
          .eq('org_id', profile.org_id)
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false }),
        supabase
          .from('customers')
          .select('id, name, email, phone, loan_type, loan_amount, status, deleted_at')
          .eq('org_id', profile.org_id)
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false }),
      ]);

      const leads     = (leadsRes.data     || []).map(r => ({ ...r, _type: 'lead' }));
      const customers = (customersRes.data || []).map(r => ({ ...r, _type: 'customer' }));

      // Merge and sort by deleted_at descending
      const merged = [...leads, ...customers].sort(
        (a, b) => new Date(b.deleted_at) - new Date(a.deleted_at)
      );
      setItems(merged);
    } catch (err) {
      console.error('[RecycleBin] fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id]);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  // ── Restore ──────────────────────────────────────────────────────────────
  const handleRestore = async (item) => {
    setRestoring(item.id);
    const table = item._type === 'lead' ? 'leads' : 'customers';
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: null, deleted_by: null })
      .eq('id', item.id);

    if (error) {
      showNotification(`Restore failed: ${error.message}`, 'error');
    } else {
      setItems(prev => prev.filter(r => r.id !== item.id));
      showNotification(`"${item.name}" has been restored successfully.`, 'success');
    }
    setRestoring(null);
  };

  // ── Filter ───────────────────────────────────────────────────────────────
  const visible = items.filter(item => {
    const matchesType   = !typeFilter || item._type === typeFilter;
    const matchesSearch = !search
      || item.name?.toLowerCase().includes(search.toLowerCase())
      || item.email?.toLowerCase().includes(search.toLowerCase())
      || item.phone?.includes(search);
    return matchesType && matchesSearch;
  });

  const leadsCount     = items.filter(i => i._type === 'lead').length;
  const customersCount = items.filter(i => i._type === 'customer').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <Trash2 size={20} className="text-rose-500" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Recycle Bin</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">
                Soft-deleted records — visible only to admins. Restore to bring them back.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchDeleted}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary transition-all disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Info Banner ──────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
        <p>
          Records here are <strong>hidden from all users</strong> but kept as a permanent backup. Only admins can see this page.
          Use <strong>Restore</strong> to make a record active again. Records are never automatically purged.
        </p>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Deleted', value: items.length, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20',   Icon: Trash2 },
          { label: 'Deleted Leads', value: leadsCount, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20', Icon: Users },
          { label: 'Deleted Customers', value: customersCount, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', Icon: Building2 },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.Icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <h4 className="text-2xl font-extrabold mt-0.5">{loading ? '…' : s.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="">All Types</option>
          <option value="lead">Leads only</option>
          <option value="customer">Customers only</option>
        </select>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-primary" size={36} />
            <p className="text-sm font-medium text-slate-500">Loading deleted records…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Trash2 className="text-slate-300" size={28} />
            </div>
            <p className="text-slate-900 dark:text-white font-bold text-lg">
              {search || typeFilter ? 'No matching records' : 'Recycle bin is empty'}
            </p>
            <p className="text-slate-500 text-sm max-w-xs text-center">
              {search || typeFilter
                ? 'Try clearing your filters.'
                : "When leads or customers are deleted they'll appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
                <tr>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Record</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Type</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Loan Type</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Loan Value</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Deleted On</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(item => {
                  const badge = ENTITY_BADGE[item._type];
                  const isRestoring = restoring === item.id;
                  return (
                    <tr
                      key={`${item._type}-${item.id}`}
                      className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all"
                    >
                      {/* Record */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${badge.color}`}>
                            <badge.Icon size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{item.phone || item.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      {/* Type badge */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tighter border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      {/* Loan type */}
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">{item.loan_type || '—'}</td>
                      {/* Loan value */}
                      <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {fmtCurrency(item.loan_amount || 0)}
                      </td>
                      {/* Deleted on */}
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                        {new Date(item.deleted_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      {/* Restore action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRestore(item)}
                          disabled={isRestoring}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all disabled:opacity-50"
                        >
                          {isRestoring
                            ? <Loader2 size={11} className="animate-spin" />
                            : <RotateCcw size={11} />
                          }
                          {isRestoring ? 'Restoring…' : 'Restore'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && visible.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {visible.length} record{visible.length !== 1 ? 's' : ''} in bin
              {(search || typeFilter) && ` · filtered from ${items.length} total`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecycleBin;
