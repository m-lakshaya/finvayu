import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Building2,
  ArrowUpDown,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Loader2,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExotelCallButton from '../components/ExotelCallButton';
import CreateCustomerModal from '../components/CreateCustomerModal';
import CSVToolbar from '../components/CSVToolbar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const statusConfig = {
  'Active': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50',
  'Prospect': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50',
  'At Risk': 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800/50',
  'Churned': 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
};

const industryConfig = {
  'Real Estate': { icon: Building2, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  'Manufacturing': { icon: TrendingUp, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  'Retail': { icon: Star, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  'Healthcare': { icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
  'Technology': { icon: TrendingUp, color: 'text-primary bg-primary/10' },
};

const Customers = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [stats, setStats] = useState([
    { label: 'Total Accounts', value: '0', icon: Building2, color: 'text-primary bg-primary/10' },
    { label: 'Active Accounts', value: '0', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Total Loan Book', value: '₹0', icon: DollarSign, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Portfolio Growth', value: 'Live', icon: Star, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  ]);

  const fetchAccounts = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,account_id.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      setAccounts(data || []);
      setTotalCount(count || 0);

      // Update Stats
      const activeCount = (data || []).filter(a => a.status === 'Active').length;
      const totalLoan = (data || []).reduce((sum, a) => sum + (parseFloat(a.loan_amount) || 0), 0);
      
      setStats([
        { label: 'Total Accounts', value: count?.toString() || '0', icon: Building2, color: 'text-primary bg-primary/10' },
        { label: 'Active Accounts', value: activeCount.toString(), icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Total Loan Book', value: `₹${(totalLoan / 10000000).toFixed(1)} Cr`, icon: DollarSign, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
        { label: 'Portfolio Growth', value: 'Live', icon: Star, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
      ]);

    } catch (error) {
      console.error('Error fetching customers:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, search]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleImportSuccess = async (parsedData) => {
    try {
      const dataToInsert = parsedData.map(obj => ({
        ...obj,
        org_id: profile.org_id,
        owner_id: profile.id,
        loan_amount: parseFloat(obj.loan_amount) || 0
      }));

      const { error } = await supabase.from('customers').insert(dataToInsert);
      if (error) throw error;
      fetchAccounts();
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  };

  const exportHeaders = ['Account ID', 'Company Name', 'Email', 'Phone', 'Status', 'Loan Type', 'Amount', 'Source', 'Created'];
  const exportKeys = ['account_id', 'name', 'email', 'phone', 'status', 'loan_type', 'loan_amount', 'source', 'created_at'];

  const fieldMapping = {
    'company': 'name',
    'company name': 'name',
    'portfolio value': 'loan_amount',
    'account id': 'account_id'
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Customer Accounts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            Business accounts — company records, relationship owners, and loan portfolios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CSVToolbar 
            entityType="customers"
            dataToExport={accounts}
            exportHeaders={exportHeaders}
            exportKeys={exportKeys}
            onImportSuccess={handleImportSuccess}
            fieldMapping={fieldMapping}
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            New Account
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className={`size-11 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <h4 className="text-xl font-extrabold mt-0.5">{s.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by company, account ID, or email..."
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

      {/* Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Account</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Industry</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold text-center">Contacts</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Loan Value</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Status</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Last Activity</th>
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-2" size={32} />
                    <p className="text-slate-500 font-medium">Loading organization accounts...</p>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <p className="text-slate-500 font-medium">No business accounts found.</p>
                  </td>
                </tr>
              ) : accounts.map(acc => {
                const ind = industryConfig[acc.loan_type] || { icon: Building2, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
                return (
                  <tr 
                    key={acc.id} 
                    onClick={() => navigate(`/leads/${acc.id}`)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group"
                  >
                    {/* Account */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${ind.color}`}>
                          <ind.icon size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{acc.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{acc.account_id} · {acc.phone || acc.city}</p>
                        </div>
                      </div>
                    </td>
                    {/* Industry */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{acc.loan_type}</td>
                    {/* Contacts */}
                    <td className="px-6 py-4 text-center font-bold text-primary text-sm">1</td>
                    {/* Loan Value */}
                    <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-slate-100 text-sm">₹{(acc.loan_amount / 100000).toFixed(1)} L</td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tighter border ${statusConfig[acc.status] || ''}`}>
                        {acc.status}
                      </span>
                    </td>
                    {/* Last Activity */}
                    <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                      {new Date(acc.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {acc.phone && <ExotelCallButton phone={acc.phone} compact leadId={acc.id} />}
                        </div>
                        <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                          <MoreVertical size={18} />
                          <span className="sr-only">Menu</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Showing {accounts.length} of {totalCount} accounts</p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-50" disabled>
              <ChevronLeft size={16} />
            </button>
            <button className="size-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all bg-primary text-white">1</button>
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-50" disabled>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <CreateCustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCustomerCreated={(newAcc) => {
          setAccounts([newAcc, ...accounts]);
          setTotalCount(prev => prev + 1);
        }}
      />
    </div>
  );
};

export default Customers;
