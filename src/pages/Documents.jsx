import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Plus,
  MoreVertical,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileUp,
  FolderOpen,
  Loader2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const PAGE_SIZE = 10;
const MIN_ROWS = 10;

// Salesforce-style sortable column header
const SortableHeader = ({ label, field, sortField, sortAsc, onSort, className = '' }) => {
  const active = sortField === field;
  return (
    <th
      className={`px-8 py-5 font-black select-none cursor-pointer group/th hover:text-primary transition-colors ${className}`}
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

const Documents = () => {
  const { profile } = useAuth();
  const [docs, setDocs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [allDocs, setAllDocs] = useState([]); // for category counts
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSort = (field) => {
    if (field === sortField) setSortAsc((prev) => !prev);
    else { setSortField(field); setSortAsc(true); }
  };

  const fetchDocs = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('documents')
        .select('*, leads(name)', { count: 'exact' })
        .eq('org_id', profile.org_id)
        .order(sortField, { ascending: sortAsc })
        .range(from, to);

      if (searchTerm) query = query.ilike('file_name', `%${searchTerm}%`);
      if (activeCategory !== 'All') query = query.eq('category', activeCategory);

      const { data, error, count } = await query;
      if (error) throw error;
      setDocs(data || []);
      setTotalCount(count || 0);

      // Fetch all docs for category pill counts (lightweight)
      const { data: all } = await supabase.from('documents').select('category').eq('org_id', profile.org_id);
      setAllDocs(all || []);
    } catch (error) {
      console.error('Fetch Docs Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, searchTerm, activeCategory, sortField, sortAsc, currentPage]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, activeCategory, sortField, sortAsc]);

  const categories = [
    { label: 'ID Proofs', icon: FileText, color: 'text-blue-500' },
    { label: 'Income Proofs', icon: FileText, color: 'text-orange-500' },
    { label: 'Agreements', icon: FolderOpen, color: 'text-primary' },
    { label: 'Certificates', icon: FileText, color: 'text-indigo-500' },
  ];

  const emptyRowCount = Math.max(0, MIN_ROWS - docs.length);

  const pageWindow = () => {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Document Vault</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mt-2 uppercase tracking-[0.3em]">Secure asset management & verification protocol.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/20 transition-all">
            <FileUp size={18} /> Ingest Archive
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          onClick={() => setActiveCategory('All')}
          className={`glass-card p-5 rounded-3xl border ${activeCategory === 'All' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800'} hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden`}
        >
          <div className="text-primary mb-3 group-hover:scale-110 transition-transform relative z-10"><FolderOpen size={24} /></div>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100 relative z-10">All Repositories</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 relative z-10">{allDocs.length} Entities</p>
        </div>
        {categories.map((cat, i) => (
          <div
            key={i}
            onClick={() => setActiveCategory(cat.label)}
            className={`glass-card p-5 rounded-3xl border ${activeCategory === cat.label ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800'} hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden`}
          >
            <div className={`${cat.color} mb-3 group-hover:scale-110 transition-transform relative z-10`}><cat.icon size={24} /></div>
            <p className="text-xs font-black text-slate-900 dark:text-slate-100 relative z-10">{cat.label}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 relative z-10">
              {allDocs.filter((d) => d.category === cat.label).length} Files
            </p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900/50">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by filename or lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/20 dark:bg-slate-800/20 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
              <tr>
                <SortableHeader label="Credential Identifier" field="file_name" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                <SortableHeader label="Classification" field="category" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                <th className="px-8 py-5 font-black">Associated Lead</th>
                <SortableHeader label="Ingestion Date" field="created_at" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                <SortableHeader label="State" field="status" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                <th className="px-8 py-5 text-right font-black"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center" style={{ height: `${MIN_ROWS * 68}px` }}>
                    <Loader2 className="animate-spin text-primary mx-auto mb-2" size={32} />
                    <p className="uppercase text-[10px] font-black text-slate-400 tracking-[0.3em]">Querying Vault...</p>
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center" style={{ height: `${MIN_ROWS * 68}px` }}>
                    <p className="uppercase text-[10px] font-black text-slate-400 tracking-[0.3em]">No digital assets found in current scope.</p>
                  </td>
                </tr>
              ) : (
                <>
                  {docs.map((doc, i) => (
                    <tr key={i} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-all group h-[68px]">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="size-12 bg-primary/5 dark:bg-primary/10 rounded-2xl flex items-center justify-center text-primary/40 group-hover:text-primary group-hover:rotate-6 transition-all border border-primary/5 shrink-0">
                            <FileText size={22} />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-slate-100 leading-tight">{doc.file_name}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-widest">{doc.size}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800">
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-8 py-5 font-black text-slate-900 dark:text-slate-300 text-xs">{doc.leads?.name || 'Unlinked'}</td>
                      <td className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-tighter">
                        {new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 font-black text-[9px] uppercase tracking-widest">
                          {doc.status === 'Verified' ? (
                            <div className="flex items-center gap-1.5 text-emerald-500"><CheckCircle2 size={14} /> Verified</div>
                          ) : doc.status === 'Pending' ? (
                            <div className="flex items-center gap-1.5 text-orange-500"><Clock size={14} /> Pending</div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-rose-500"><AlertCircle size={14} /> Rejected</div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <button className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-400 hover:text-primary shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-700"><Eye size={16} /></button>
                          <button className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-500 shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-700"><Download size={16} /></button>
                          <button className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-400 hover:text-primary shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-700"><MoreVertical size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Ghost rows */}
                  {Array.from({ length: emptyRowCount }).map((_, i) => (
                    <tr key={`ghost-${i}`} style={{ height: '68px' }}>
                      <td colSpan={6}></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {loading ? 'Loading...' : `Page ${currentPage} of ${totalPages} · ${totalCount} file${totalCount !== 1 ? 's' : ''}`}
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
    </div>
  );
};

export default Documents;
