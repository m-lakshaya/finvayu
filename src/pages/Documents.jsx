import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileUp,
  FolderOpen,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const Documents = () => {
  const { profile } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchDocs = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          leads (
            name
          )
        `)
        .eq('org_id', profile.org_id);
      
      if (error) throw error;
      setDocs(data || []);
    } catch (error) {
      console.error('Fetch Docs Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const filteredDocs = docs.filter(d => {
    const matchesSearch = d.file_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         d.leads?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || d.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { label: 'ID Proofs', icon: FileText, color: 'text-blue-500' },
    { label: 'Income Proofs', icon: FileText, color: 'text-orange-500' },
    { label: 'Agreements', icon: FolderOpen, color: 'text-primary' },
    { label: 'Certificates', icon: FileText, color: 'text-indigo-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Document Vault</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] mt-2 uppercase tracking-[0.3em]">Secure asset management & verification protocol.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/20 transition-all">
            <FileUp size={18} />
            Ingest Archive
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div 
          onClick={() => setActiveCategory('All')}
          className={`glass-card p-5 rounded-3xl border ${activeCategory === 'All' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800'} hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden`}
        >
          <div className="text-primary mb-3 group-hover:scale-110 transition-transform relative z-10">
            <FolderOpen size={24} />
          </div>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100 relative z-10">All Repositories</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 relative z-10">{docs.length} Entities</p>
        </div>
        {categories.map((cat, i) => (
          <div 
            key={i} 
            onClick={() => setActiveCategory(cat.label)}
            className={`glass-card p-5 rounded-3xl border ${activeCategory === cat.label ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800'} hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden`}
          >
            <div className={`${cat.color} mb-3 group-hover:scale-110 transition-transform relative z-10`}>
              <cat.icon size={24} />
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-slate-100 relative z-10">{cat.label}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 relative z-10">
                {docs.filter(d => d.category === cat.label).length} Files
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900/50">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search index by filename or associate..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
              <Filter size={16} /> Advanced Filter
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/20 dark:bg-slate-800/20 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Credential Identifier</th>
                <th className="px-8 py-5">Classification</th>
                <th className="px-8 py-5">Associated Lead</th>
                <th className="px-8 py-5">Ingestion Date</th>
                <th className="px-8 py-5">State</th>
                <th className="px-8 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                  <tr><td colSpan={6} className="p-20 text-center uppercase text-[10px] font-black text-slate-400 tracking-[0.3em]">Querying Vault...</td></tr>
              ) : filteredDocs.length === 0 ? (
                  <tr><td colSpan={6} className="p-20 text-center uppercase text-[10px] font-black text-slate-400 tracking-[0.3em]">No digital assets found in current scope.</td></tr>
              ) : filteredDocs.map((doc, i) => (
                <tr key={i} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="size-12 bg-primary/5 dark:bg-primary/10 rounded-2xl flex items-center justify-center text-primary/40 group-hover:text-primary group-hover:rotate-6 transition-all border border-primary/5">
                        <FileText size={22} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-slate-100 leading-tight">{doc.file_name}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-widest">{doc.size}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800">
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900 dark:text-slate-300 text-xs">
                      {doc.leads?.name || 'Unlinked'}
                  </td>
                  <td className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase tracking-tighter">
                      {new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 font-black text-[9px] uppercase tracking-widest">
                      {doc.status === 'Verified' ? (
                          <div className="flex items-center gap-1.5 text-emerald-500">
                              <CheckCircle2 size={14} /> Verified
                          </div>
                      ) : doc.status === 'Pending' ? (
                          <div className="flex items-center gap-1.5 text-orange-500">
                              <Clock size={14} /> Pending
                          </div>
                      ) : (
                          <div className="flex items-center gap-1.5 text-rose-500">
                              <AlertCircle size={14} /> Rejected
                          </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <button className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-400 hover:text-primary shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-700"><Eye size={16} /></button>
                      <button className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-500 shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-700"><Download size={16} /></button>
                      <button className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-400 hover:text-primary shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-700"><MoreVertical size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Documents;
