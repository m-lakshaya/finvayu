import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Loader2,
  X,
  Check,
  Handshake,
} from 'lucide-react';
import ExotelCallButton from '../components/ExotelCallButton';
import CreateLeadModal from '../components/CreateLeadModal';
import CSVToolbar from '../components/CSVToolbar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useCustomFields } from '../hooks/useCustomFields';
const PAGE_SIZE = 10;
// Minimum visible rows so the table never shrinks below this
const MIN_ROWS = 10;

const STATUS_COLORS = {
  New: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50',
  Contacted: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50',
  Interested: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/20 dark:border-violet-800/50',
  Qualified: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/50',
  Converted: 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:border-teal-800/50',
  Active: 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:border-teal-800/50',
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

const LeadList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const isCustomers = location.pathname.includes('customers');

  // Partner filter — set when navigating from Bankers/Collaborators page
  const partnerFilter     = searchParams.get('partner')     || '';
  const partnerFilterName = searchParams.get('partnerName') || 'Partner';

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [notification, setNotification] = useState(null); // { message, type }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Custom field definitions — only those marked show_in_list
  const entityType = isCustomers ? 'customer' : 'lead';
  const { fields: customFieldDefs } = useCustomFields(profile?.org_id, entityType);
  const listCustomFields = customFieldDefs.filter(f => f.show_in_list);

  const handleSortField = (field) => {
    if (field === sortField) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const title = isCustomers ? 'Customer Management' : 'Lead Management';
  const subtitle = isCustomers
    ? 'Manage and track your active customer database'
    : 'Track and convert your potential loan opportunities';
  const btnText = isCustomers ? 'Add Customer' : 'Create Lead';

  const leadExportConfig = {
    headers: ['Name', 'Email', 'Phone', 'Loan Type', 'Amount', 'Status', 'Created'],
    keys: ['name', 'email', 'phone', 'loan_type', 'loan_amount', 'status', 'created_at'],
  };
  const customerExportConfig = {
    headers: ['Company Name', 'Email', 'Phone', 'Status', 'Loan Type', 'Amount', 'Source', 'Created'],
    keys: ['name', 'email', 'phone', 'status', 'loan_type', 'loan_amount', 'source', 'created_at'],
  };
  const exportConfig = isCustomers ? customerExportConfig : leadExportConfig;

  const fieldMapping = {
    'full name': 'name',
    'expected amount': 'loan_amount',
    amount: 'loan_amount',
    'loan category': 'loan_type',
    company: 'name',
    'company name': 'name',
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchLeads = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const table = isCustomers ? 'customers' : 'leads';
      const roleName = profile?.roles?.name?.toLowerCase() || '';

      const buildQuery = (withSoftDelete) => {
        let q = supabase
          .from(table)
          .select('*', { count: 'exact' })
          .eq('org_id', profile.org_id)
          .order(sortField, { ascending: sortAsc })
          .range(from, to);

        if (withSoftDelete) q = q.is('deleted_at', null);

        if (['collaborator', 'banker', 'sa', 'sales agent'].includes(roleName)) {
          q = q.eq('owner_id', profile.id);
        }
        if (searchTerm) {
          q = q.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
        }
        if (statusFilter) q = q.eq('status', statusFilter);
        if (partnerFilter && !isCustomers) q = q.eq('referred_by', partnerFilter);
        return q;
      };

      // Try with soft-delete filter first; fall back if column doesn't exist yet
      let { data, error, count } = await buildQuery(true);
      if (error && error.message?.includes('deleted_at')) {
        ({ data, error, count } = await buildQuery(false));
      }
      if (error) throw error;
      setLeads(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching leads:', error.message);
    } finally {
      setLoading(false);
    }
  }, [
    profile?.org_id,
    isCustomers,
    searchTerm,
    statusFilter,
    sortField,
    sortAsc,
    currentPage,
    partnerFilter,
  ]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Fetch ALL records for CSV export (no pagination limit)
  const handleExportAll = async () => {
    const table = isCustomers ? 'customers' : 'leads';
    let { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('org_id', profile.org_id)
      .is('deleted_at', null)
      .order(sortField, { ascending: sortAsc });
    // Fallback if deleted_at column missing
    if (error?.message?.includes('deleted_at')) {
      ({ data } = await supabase
        .from(table)
        .select('*')
        .eq('org_id', profile.org_id)
        .order(sortField, { ascending: sortAsc }));
    }
    return data || [];
  };

  // Reset to page 1 whenever filters/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortField, sortAsc, isCustomers, partnerFilter]);

  const handleImportSuccess = async (parsedData) => {
    const skipped = [];
    const valid = parsedData.filter((obj, i) => {
      if (!obj.name?.trim()) { skipped.push(`Row ${i + 2}: missing Name`); return false; }
      return true;
    });

    if (!valid.length) {
      showNotification('No valid rows to import. Ensure a "Name" column is present.', 'error');
      return;
    }

    try {
      const table = isCustomers ? 'customers' : 'leads';
      const dataToInsert = valid.map((obj) =>
        isCustomers
          ? {
              name:        obj.name.trim(),
              email:       obj.email || null,
              phone:       obj.phone || null,
              loan_type:   obj.loan_type || null,
              loan_amount: parseFloat(obj.loan_amount) || 0,
              source:      obj.source || 'Import',
              status:      obj.status || 'Active',
              org_id:      profile.org_id,
              owner_id:    profile.id,
            }
          : {
              name:        obj.name.trim(),
              email:       obj.email || null,
              phone:       obj.phone || null,
              loan_type:   obj.loan_type || null,
              loan_amount: parseFloat(obj.loan_amount) || 0,
              source:      obj.source || 'Import',
              status:      obj.status || 'New',
              org_id:      profile.org_id,
              owner_id:    profile.id,
            }
      );

      const { error } = await supabase.from(table).insert(dataToInsert);
      if (error) throw error;

      const msg = skipped.length
        ? `Imported ${valid.length} records. Skipped ${skipped.length} invalid rows.`
        : `Successfully imported ${valid.length} ${table}.`;
      showNotification(msg, 'success');
      fetchLeads();
    } catch (error) {
      showNotification('Import failed: ' + error.message, 'error');
      throw error;
    }
  };


  // Pad visible rows to always show at least MIN_ROWS rows
  const emptyRowCount = Math.max(0, MIN_ROWS - leads.length);

  // Pagination window (max 5 visible page buttons)
  const pageWindow = () => {
    const half = 2;
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const SORT_OPTIONS = [
    { value: 'created_at', label: 'Date' },
    { value: 'name', label: 'Name' },
    { value: 'loan_amount', label: 'Amount' },
    { value: 'status', label: 'Status' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Toast notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300 ${
          notification.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400'
        }`}>
          {notification.type === 'error' ? <X size={15} /> : <Check size={15} />}
          {notification.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <CSVToolbar
            entityType={isCustomers ? 'customers' : 'leads'}
            exportHeaders={exportConfig.headers}
            exportKeys={exportConfig.keys}
            sampleRows={isCustomers
              ? [{ name: 'John Doe', email: 'john@example.com', phone: '9876543210', status: 'Active', loan_type: 'Home Loan', loan_amount: 5000000, source: 'Referral' }]
              : [{ name: 'Jane Smith', email: 'jane@example.com', phone: '9123456789', loan_type: 'Business Loan', loan_amount: 2500000, status: 'New', source: 'Website' }]
            }
            onExportAll={handleExportAll}
            onImportSuccess={handleImportSuccess}
            onImportError={(msg) => showNotification(msg, 'error')}
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

      {/* Partner filter banner */}
      {partnerFilter && !isCustomers && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm">
          <Handshake size={15} className="text-indigo-500 flex-shrink-0" />
          <span className="text-indigo-700 dark:text-indigo-300 font-medium flex-1">
            Showing leads referred by <span className="font-bold">{decodeURIComponent(partnerFilterName)}</span>
          </span>
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 transition-colors text-xs font-semibold"
          >
            <X size={13} /> Clear filter
          </button>
        </div>
      )}

      {/* Filter & Sort Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4">
        {/* Search */}
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

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Interested">Interested</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
              <tr>
                <SortableHeader label="Name & Details" field="name" sortField={sortField} sortAsc={sortAsc} onSort={handleSortField} />
                <SortableHeader label="Status" field="status" sortField={sortField} sortAsc={sortAsc} onSort={handleSortField} />
                <SortableHeader label="Score" field="score" sortField={sortField} sortAsc={sortAsc} onSort={handleSortField} className="text-center" />
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold">Source</th>
                {listCustomFields.map(f => (
                  <th key={f.field_key} className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-bold whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
                <SortableHeader label="Created" field="created_at" sortField={sortField} sortAsc={sortAsc} onSort={handleSortField} />
                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6 + listCustomFields.length} className="px-6 text-center" style={{ height: `${MIN_ROWS * 64}px` }}>
                    <Loader2 className="animate-spin text-primary mx-auto mb-2" size={32} />
                    <p className="text-slate-500 font-medium">Fetching secure records...</p>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6 + listCustomFields.length} className="px-6 text-center" style={{ height: `${MIN_ROWS * 64}px` }}>
                    <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="text-slate-400" size={24} />
                    </div>
                    <p className="text-slate-900 dark:text-white font-bold text-lg">No records found</p>
                    <p className="text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                <>
                  {leads.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(isCustomers ? `/customers/${item.id}` : `/leads/${item.id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group h-16"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                            {item.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">{item.phone || item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tighter border ${
                            STATUS_COLORS[item.status] ||
                            'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                          }`}
                        >
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
                      <td className="px-6 py-4 text-slate-500 font-semibold text-xs tracking-tight">{item.source}</td>
                      {listCustomFields.map(f => {
                        const val = item.custom_fields?.[f.field_key];
                        let display = '—';
                        if (val !== undefined && val !== null && val !== '') {
                          if (f.field_type === 'checkbox') display = val ? '✓' : '✗';
                          else if (f.field_type === 'date') display = new Date(val).toLocaleDateString('en-IN');
                          else display = String(val);
                        }
                        return (
                          <td key={f.field_key} className="px-6 py-4 text-slate-500 text-xs max-w-[140px] truncate">
                            {display}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                        {new Date(item.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.phone && (
                              <ExotelCallButton phone={item.phone} compact leadId={String(item.id)} />
                            )}
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
                  ))}

                  {/* Ghost rows to maintain fixed table height */}
                  {Array.from({ length: emptyRowCount }).map((_, i) => (
                    <tr key={`ghost-${i}`} className="h-16 border-t border-slate-50 dark:border-slate-800/50">
                      <td colSpan={6 + listCustomFields.length}></td>
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
            {loading ? (
              'Loading...'
            ) : (
              <>
                Page {currentPage} of {totalPages} &nbsp;·&nbsp;{' '}
                {totalCount} total record{totalCount !== 1 ? 's' : ''}
              </>
            )}
          </p>

          <div className="flex items-center gap-1.5">
            {/* Prev */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page numbers */}
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

            {/* Next */}
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

      <CreateLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLeadCreated={(newLead) => {
          setTotalCount((prev) => prev + 1);
          if (currentPage === 1) setLeads((prev) => [newLead, ...prev.slice(0, PAGE_SIZE - 1)]);
        }}
      />
    </div>
  );
};

export default LeadList;
