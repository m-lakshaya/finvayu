import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  Clock,
  KanbanSquare,
  Loader2,
  DollarSign,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import CreateLoanAppModal from '../components/CreateLoanAppModal';

const PAGE_SIZE = 10;
const MIN_ROWS = 10;

const SortableHeader = ({ label, field, sortField, sortAsc, onSort, className = '' }) => {
  const active = sortField === field;
  return (
    <th
      className={`px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold select-none cursor-pointer group/th hover:text-primary transition-colors ${className}`}
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

const LoanApps = () => {
  const { profile } = useAuth();
  const [apps, setApps] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pipelines, setPipelines] = useState([
    { title: 'In Discussion', count: 0, value: 0, color: 'bg-primary' },
    { title: 'Login Done', count: 0, value: 0, color: 'bg-indigo-500' },
    { title: 'Sanctioned', count: 0, value: 0, color: 'bg-amber-500' },
    { title: 'Completed', count: 0, value: 0, color: 'bg-emerald-500' },
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSort = (field) => {
    if (field === sortField) setSortAsc((prev) => !prev);
    else { setSortField(field); setSortAsc(true); }
  };

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${(val || 0).toLocaleString()}`;
  };

  const fetchApplications = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('loan_applications')
        .select('*, lead:lead_id(name), bank:bank_id(name, institution)', { count: 'exact' })
        .eq('org_id', profile.org_id)
        .order(sortField, { ascending: sortAsc })
        .range(from, to);

      if (stageFilter) query = query.eq('stage', stageFilter);

      const { data, error, count } = await query;
      if (error) throw error;
      setApps(data || []);
      setTotalCount(count || 0);

      // Pipeline stats (all records)
      const { data: allApps } = await supabase
        .from('loan_applications')
        .select('stage, amount')
        .eq('org_id', profile.org_id);

      if (allApps) {
        const stats = [
          { title: 'In Discussion', color: 'bg-primary' },
          { title: 'Login Done', color: 'bg-indigo-500' },
          { title: 'Sanctioned', color: 'bg-amber-500' },
          { title: 'Completed', color: 'bg-emerald-500' },
        ].map((p) => {
          const filtered = allApps.filter((a) => a.stage === p.title);
          return { ...p, count: filtered.length, value: filtered.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0) };
        });
        setPipelines(stats);
      }
    } catch (error) {
      console.error('Error fetching loan apps:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, stageFilter, sortField, sortAsc, currentPage]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);
  useEffect(() => { setCurrentPage(1); }, [search, stageFilter, sortField, sortAsc]);

  const emptyRowCount = Math.max(0, MIN_ROWS - apps.length);
  const pageWindow = () => {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Loan Pipeline</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Track case progress across banks and optimize turnaround times.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:shadow-sm transition-all text-slate-600">
            <KanbanSquare size={16} /> Board View
          </button>
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]">
            <Plus size={18} /> Create Application
          </button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pipelines.map((p, i) => (
          <div
            key={i}
            onClick={() => setStageFilter(stageFilter === p.title ? '' : p.title)}
            className={`glass-card p-6 rounded-2xl border shadow-sm relative overflow-hidden cursor-pointer transition-all hover:border-primary/30 ${stageFilter === p.title ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800'}`}
          >
            <div className={`absolute top-0 left-0 w-1.5 h-full ${p.color}`}></div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{p.title}</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black">{p.count}</h4>
              <span className="text-xs font-bold text-slate-500">Files</span>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-2">{formatCurrency(p.value)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-extrabold text-lg tracking-tight">
            Active Applications
            {stageFilter && <span className="ml-2 text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{stageFilter}</span>}
          </h3>
          <div className="relative min-w-[260px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Application ID..."
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-9 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Application ID</th>
                <SortableHeader label="Customer" field="lead_id" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                <SortableHeader label="Loan Amount" field="amount" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Bank Partner</th>
                <SortableHeader label="Stage" field="stage" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                <SortableHeader label="Date" field="created_at" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-right font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center" style={{ height: `${MIN_ROWS * 64}px` }}>
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Filtering global portfolio...</p>
                  </td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center" style={{ height: `${MIN_ROWS * 64}px` }}>
                    <DollarSign size={40} className="mx-auto mb-3 opacity-20 text-slate-400" />
                    <p className="text-sm font-bold text-slate-500">No applications found.</p>
                  </td>
                </tr>
              ) : (
                <>
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group cursor-pointer h-16">
                      <td className="px-6 py-4 font-mono text-xs font-black text-primary uppercase">{app.id?.slice(0, 8)}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{app.lead?.name || 'Unknown Lead'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Retail Asset Client</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300">{formatCurrency(app.amount)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <Building2 size={14} className="text-primary" />
                          {app.bank?.institution || 'Unassigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${app.stage === 'Completed' ? 'bg-emerald-500' : app.stage === 'Sanctioned' ? 'bg-amber-500' : 'bg-primary'} ${app.stage !== 'Completed' ? 'animate-pulse' : ''}`}></span>
                          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700 dark:text-slate-300">{app.stage}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium text-xs">
                        {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-300 group-hover:text-primary transition-all"><ChevronRight size={20} /></button>
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: emptyRowCount }).map((_, i) => (
                    <tr key={`ghost-${i}`} className="h-16"><td colSpan={7}></td></tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {loading ? 'Loading...' : `Page ${currentPage} of ${totalPages} · ${totalCount} application${totalCount !== 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>
            {pageWindow().map((p) => (
              <button key={p} onClick={() => setCurrentPage(p)}
                className={`size-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${p === currentPage ? 'bg-primary text-white shadow-md shadow-primary/20' : 'border border-slate-200 dark:border-slate-700 hover:bg-white text-slate-600'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <CreateLoanAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAppCreated={(newApp) => {
          setTotalCount((prev) => prev + 1);
          if (currentPage === 1) setApps((prev) => [newApp, ...prev.slice(0, PAGE_SIZE - 1)]);
          fetchApplications();
        }}
      />
    </div>
  );
};

export default LoanApps;
