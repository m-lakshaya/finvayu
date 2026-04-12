import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ArrowUpDown,
  Download,
  Loader2,
  FileText
} from 'lucide-react';
import ExotelCallButton from '../components/ExotelCallButton';
import CreateLeadModal from '../components/CreateLeadModal';
import CSVToolbar from '../components/CSVToolbar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const LeadList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const isCustomers = location.pathname.includes('customers');

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const title = isCustomers ? 'Customer Management' : 'Lead Management';
  const subtitle = isCustomers ? 'Manage and track your active customer database' : 'Track and convert your potential loan opportunities';
  const btnText = isCustomers ? 'Add Customer' : 'Create Lead';

  const fetchLeads = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      let query = supabase
        .from(isCustomers ? 'customers' : 'leads')
        .select('*', { count: 'exact' })
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

      const roleName = profile?.roles?.name?.toLowerCase() || '';
      if (['collaborator', 'banker'].includes(roleName)) {
        query = query.eq('owner_id', profile.id);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setLeads(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching leads:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, isCustomers, searchTerm]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleImportSuccess = async (parsedData) => {
    try {
      const dataToInsert = parsedData.map(obj => ({
        ...obj,
        org_id: profile.org_id,
        owner_id: profile.id,
        loan_amount: parseFloat(obj.loan_amount) || 0
      }));

      const { error } = await supabase.from(isCustomers ? 'customers' : 'leads').insert(dataToInsert);
      if (error) throw error;
      fetchLeads();
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  };

  const leadExportConfig = {
    headers: ['Name', 'Email', 'Phone', 'Loan Type', 'Amount', 'Status', 'Created'],
    keys: ['name', 'email', 'phone', 'loan_type', 'loan_amount', 'status', 'created_at']
  };

  const customerExportConfig = {
    headers: ['Account ID', 'Company Name', 'Email', 'Phone', 'Status', 'Loan Type', 'Amount', 'Source', 'Created'],
    keys: ['account_id', 'name', 'email', 'phone', 'status', 'loan_type', 'loan_amount', 'source', 'created_at']
  };

  const exportConfig = isCustomers ? customerExportConfig : leadExportConfig;

  const fieldMapping = {
    'full name': 'name',
    'expected amount': 'loan_amount',
    'loan category': 'loan_type',
    'company': 'name',
    'company name': 'name'
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <CSVToolbar 
            entityType={isCustomers ? 'customers' : 'leads'}
            dataToExport={leads}
            exportHeaders={exportConfig.headers}
            exportKeys={exportConfig.keys}
            onImportSuccess={handleImportSuccess}
            fieldMapping={fieldMapping}
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            {btnText}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${isCustomers ? 'customers' : 'leads'} by name, email or phone...`}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <Filter size={16} />
            Filters
          </button>
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <ArrowUpDown size={16} />
            Sort
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Name & Details</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Status</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-center font-bold">Score</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Source</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Created</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-2" size={32} />
                    <p className="text-slate-500 font-medium">Fetching secure records...</p>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="text-slate-400" size={24} />
                    </div>
                    <p className="text-slate-900 dark:text-white font-bold text-lg">No records found</p>
                    <p className="text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your search or filters to find what you're looking for.</p>
                  </td>
                </tr>
              ) : leads.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => navigate(`/leads/${item.id}`)}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xs uppercase">
                        {item.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{item.phone || item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tighter border ${
                      item.status === 'New' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50' :
                      item.status === 'Contacted' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50' :
                      'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-extrabold text-primary">
                    <div className="flex flex-col items-center gap-1">
                      <span>{item.score || 0}</span>
                      <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${item.score || 0}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-semibold text-xs tracking-tight">
                    {item.source}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                    {new Date(item.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.phone && <ExotelCallButton phone={item.phone} compact leadId={String(item.id)} />}
                      </div>
                      <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                        <MoreVertical size={18} />
                        <span className="sr-only">Menu</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Showing {leads.length} of {totalCount} entries
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-50" disabled>
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {[1].map(p => (
                <button key={p} className={`size-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all bg-primary text-white shadow-md shadow-primary/20`}>
                  {p}
                </button>
              ))}
            </div>
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-50" disabled>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <CreateLeadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onLeadCreated={(newLead) => {
          setLeads([newLead, ...leads]);
          setTotalCount(prev => prev + 1);
        }}
      />
    </div>
  );
};

export default LeadList;
