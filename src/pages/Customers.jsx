import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Building2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExotelCallButton from '../components/ExotelCallButton';
import CreateCustomerModal from '../components/CreateCustomerModal';
import CSVToolbar from '../components/CSVToolbar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 10;
const MIN_ROWS = 10;

const statusConfig = {
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50',
  Prospect: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50',
  'At Risk': 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800/50',
  Churned: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
};

const industryConfig = {
  'Real Estate': { icon: Building2, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  Manufacturing: { icon: TrendingUp, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  Retail: { icon: Star, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  Healthcare: { icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
  Technology: { icon: TrendingUp, color: 'text-primary bg-primary/10' },
};

// Salesforce-style sortable column header
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
          {active ? (sortAsc ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}
        </span>
      </div>
    </th>
  );
};

const Customers = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [stats, setStats] = useState([
    { label: 'Total Accounts', value: '0', icon: Building2, color: 'text-primary bg-primary/10' },
    { label: 'Active Accounts', value: '0', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Total Loan Book', value: '₹0', icon: DollarSign, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Portfolio Growth', value: 'Live', icon: Star, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSort = (field) => {
    if (field === sortField) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const fetchAccounts = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('org_id', profile.org_id)
        .order(sortField, { ascending: sortAsc })
        .range(from, to);

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setAccounts(data || []);
      setTotalCount(count || 0);

      // Stats need full query (no pagination), fetch summary separately
      const { data: allData } = await supabase
        .from('customers')
        .select('status, loan_amount')
        .eq('org_id', profile.org_id);

      if (allData) {
        const activeCount = allData.filter((a) => a.status === 'Active').length;
        const totalLoan = allData.reduce((sum, a) => sum + (parseFloat(a.loan_amount) || 0), 0);
        setStats([
          { label: 'Total Accounts', value: count?.toString() || '0', icon: Building2, color: 'text-primary bg-primary/10' },
          { label: 'Active Accounts', value: activeCount.toString(), icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Total Loan Book', value: `₹${(totalLoan / 10000000).toFixed(1)} Cr`, icon: DollarSign, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Portfolio Growth', value: 'Live', icon: Star, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, search, statusFilter, sortField, sortAsc, currentPage]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Reset to page 1 on filter/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortField, sortAsc]);

  const handleImportSuccess = async (parsedData) => {
    try {
      const dataToInsert = parsedData.map((obj) => ({
        account_id: obj.account_id,
        name: obj.name || 'Unknown Company',
        email: obj.email,
        phone: obj.phone,
        loan_type: obj.loan_type,
        loan_amount: parseFloat(obj.loan_amount) || 0,
        status: obj.status || 'Active',
        source: obj.source || 'Import',
        org_id: profile.org_id,
        owner_id: profile.id,
      }));
      const { error } = await supabase.from('customers').insert(dataToInsert);
      if (error) throw error;
      fetchAccounts();
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  };

  const exportHeaders = ['Company Name', 'Email', 'Phone', 'Status', 'Loan Type', 'Amount', 'Source', 'Created'];
  const exportKeys = ['name', 'email', 'phone', 'status', 'loan_type', 'loan_amount', 'source', 'created_at'];
  const fieldMapping = {
    company: 'name',
    'company name': 'name',
    'portfolio value': 'loan_amount',
    'account id': 'account_id',
  };

  const emptyRowCount = Math.max(0, MIN_ROWS - accounts.length);

  const pageWindow = () => {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Customer Accounts</h1>
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
            <Plus size={18} /> New Account
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, email, or phone..."
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Prospect">Prospect</option>
          <option value="At Risk">At Risk</option>
          <option value="Churned">Churned</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
              <tr>
                <SortableHeader label="Account" field="name" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Loan Type</th>
                <SortableHeader label="Loan Value" field="loan_amount" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                <SortableHeader label="Status" field="status" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                <SortableHeader label="Created" field="created_at" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 text-center" style={{ height: `${MIN_ROWS * 64}px` }}>
                    <Loader2 className="animate-spin text-primary mx-auto mb-2" size={32} />
                    <p className="text-slate-500 font-medium">Loading organization accounts...</p>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 text-center" style={{ height: `${MIN_ROWS * 64}px` }}>
                    <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="text-slate-400" size={24} />
                    </div>
                    <p className="text-slate-900 dark:text-white font-bold text-lg">No accounts found</p>
                    <p className="text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                <>
                  {accounts.map((acc) => {
                    const ind = industryConfig[acc.loan_type] || { icon: Building2, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
                    return (
                      <tr
                        key={acc.id}
                        onClick={() => navigate(`/customers/${acc.id}`)}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group h-16"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${ind.color}`}>
                              <ind.icon size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{acc.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{acc.phone || acc.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">{acc.loan_type || '—'}</td>
                        <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          ₹{((acc.loan_amount || 0) / 100000).toFixed(1)} L
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tighter border ${statusConfig[acc.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {acc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                          {new Date(acc.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {acc.phone && <ExotelCallButton phone={acc.phone} compact leadId={acc.id} />}
                            </div>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Ghost rows for fixed height */}
                  {Array.from({ length: emptyRowCount }).map((_, i) => (
                    <tr key={`ghost-${i}`} className="h-16 border-t border-slate-50 dark:border-slate-800/50">
                      <td colSpan={6}></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {loading ? 'Loading...' : `Page ${currentPage} of ${totalPages} · ${totalCount} total account${totalCount !== 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {pageWindow().map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`size-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  p === currentPage
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <CreateCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCustomerCreated={(newAcc) => {
          setTotalCount((prev) => prev + 1);
          if (currentPage === 1) setAccounts((prev) => [newAcc, ...prev.slice(0, PAGE_SIZE - 1)]);
        }}
      />
    </div>
  );
};

export default Customers;
