import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDisplayName } from '../utils/profileUtils';
import {
  ArrowLeft, Mail, Phone, MapPin, CheckCircle2, Clock,
  Shield, Loader2, Plus, IndianRupee, PhoneCall, Calendar,
  CheckSquare, Trash2, User, ChevronDown, ArrowRight, X,
  Handshake, Receipt, ChevronRight, ExternalLink, Zap,
  Activity, StickyNote, Building2, TrendingUp, History,
  GitCommitVertical, RefreshCw, UserCheck, ArrowRightLeft
} from 'lucide-react';
import { useAuth, PERMISSIONS } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import RaiseInvoiceModal from '../components/RaiseInvoiceModal';

// ─── Pipeline stage definitions ───────────────────────────────────────────────
const LEAD_STAGES = [
  { key: 'New',        label: 'New' },
  { key: 'Contacted',  label: 'Contacted' },
  { key: 'Interested', label: 'Interested' },
  { key: 'Qualified',  label: 'Qualified' },
  { key: 'Converted',  label: 'Converted' },
];

const CUSTOMER_STAGES = [
  { key: 'Active',     label: 'Active' },
  { key: 'Applied',    label: 'Loan Applied' },
  { key: 'Sanctioned', label: 'Sanctioned' },
  { key: 'Disbursed',  label: 'Disbursed' },
  { key: 'Closed',     label: 'Closed' },
];

const TASK_TYPES      = ['Call', 'Email', 'Meeting', 'To-Do'];
const TASK_PRIORITIES = ['Low', 'Normal', 'High'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const priorityColor = (p) => {
  if (p === 'High')   return 'text-red-500';
  if (p === 'Normal') return 'text-blue-500';
  return 'text-slate-400';
};

const typeIcon = (t) => {
  if (t === 'Call')    return PhoneCall;
  if (t === 'Email')   return Mail;
  if (t === 'Meeting') return Calendar;
  return CheckSquare;
};

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${day}d ago`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Clickable pipeline stage bar */
const PipelineStageBar = ({ stages, currentStatus, onStageChange, disabled }) => {
  const currentIdx = stages.findIndex(s => s.key === currentStatus);
  return (
    <div className="flex items-stretch gap-0.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl overflow-x-auto">
      {stages.map((stage, idx) => {
        const isDone    = idx < currentIdx;
        const isActive  = stage.key === currentStatus;
        const isFuture  = idx > currentIdx;
        return (
          <button
            key={stage.key}
            onClick={() => !isActive && !disabled && onStageChange(stage.key)}
            disabled={disabled || isActive}
            title={isActive ? 'Current stage' : `Move to ${stage.label}`}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all min-w-[72px] ${
              isActive
                ? 'bg-primary text-white shadow-md shadow-primary/25 cursor-default'
                : isDone
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800'
            } disabled:pointer-events-none`}
          >
            {isDone  && <CheckCircle2 size={11} />}
            {isActive && <Zap size={11} />}
            {stage.label}
          </button>
        );
      })}
    </div>
  );
};

/** Labelled field with icon */
const InfoField = ({ icon: Icon, label, children, className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
      {Icon && <Icon size={11} className="text-slate-300 dark:text-slate-600" />}
      {label}
    </p>
    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{children}</div>
  </div>
);

/** Tab button */
const Tab = ({ id, label, count, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
      active
        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
    }`}
  >
    {label}
    {count !== undefined && count > 0 && (
      <span className={`px-1.5 py-0.5 rounded-full text-[9px] leading-none ${active ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
        {count}
      </span>
    )}
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────
const LeadDetails = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { profile, hasPermission } = useAuth();
  const { showNotification, confirm } = useNotification();

  const isCustomerRecord = location.pathname.includes('customers');
  const recordType       = isCustomerRecord ? 'Customer' : 'Lead';
  const table            = isCustomerRecord ? 'customers' : 'leads';
  const stages           = isCustomerRecord ? CUSTOMER_STAGES : LEAD_STAGES;

  // ── Core state ────────────────────────────────────────────────────────────
  const [record,        setRecord]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [updating,      setUpdating]      = useState(false);
  const [activeTab,     setActiveTab]     = useState('overview');
  const [executives,    setExecutives]    = useState([]);
  const [linkedCustomer, setLinkedCustomer] = useState(null); // set when lead is Converted

  // ── Tasks state ───────────────────────────────────────────────────────────
  const [tasks,         setTasks]         = useState([]);
  const [tasksLoading,  setTasksLoading]  = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm,      setTaskForm]      = useState({
    subject: '', type: 'Call', status: 'Not Started', priority: 'Normal', due_date: '', notes: ''
  });
  const [savingTask,    setSavingTask]    = useState(false);

  // ── Partner invoice state ──���──────────────────────────────────────────────
  const [referredByProfile, setReferredByProfile] = useState(null);
  const [existingInvoice,   setExistingInvoice]   = useState(null);
  const [showInvoiceModal,  setShowInvoiceModal]  = useState(false);

  // ── Activity log state ────────────────────────────────────────────────────
  const [activityLog,     setActivityLog]     = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // ── Permissions ───────────────────────────────────────────────────────────
  const canSetCommission  = hasPermission(PERMISSIONS.SET_COMMISSION);
  const canRaiseInvoice   = hasPermission(PERMISSIONS.RAISE_INVOICE);
  const canProcessPayment = hasPermission(PERMISSIONS.PROCESS_PAYMENT);
  const roleId            = profile?.roles?.name?.toLowerCase();
  const isPartner         = roleId === 'banker' || roleId === 'collaborator';
  const leadClosed        = record && ['Closed', 'Converted', 'Disbursed'].includes(record.status);
  const isReferringPartner = record?.referred_by === profile?.id;
  const invoicePending    = existingInvoice && ['Pending', 'Approved', 'Paid'].includes(existingInvoice.status);
  const showRaiseInvoiceBtn = !isCustomerRecord && isPartner && isReferringPartner && leadClosed && !invoicePending;

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase.from(table).select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (!error) setRecord(data);
        setLoading(false);
      });
  }, [id, table]);

  const fetchTasks = () => {
    if (!id) return;
    setTasksLoading(true);
    const col = isCustomerRecord ? 'customer_id' : 'lead_id';
    supabase.from('tasks').select('*').eq(col, id)
      .order('due_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => { setTasks(data || []); setTasksLoading(false); });
  };
  useEffect(fetchTasks, [id, isCustomerRecord]);

  useEffect(() => {
    if (!profile?.org_id) return;
    supabase.from('profiles')
      .select('id, full_name, name, first_name, last_name, email')
      .eq('org_id', profile.org_id)
      .then(({ data }) => setExecutives(data || []));
  }, [profile?.org_id]);

  // Fetch partner attribution + existing invoice
  useEffect(() => {
    if (!record || isCustomerRecord) return;

    if (record.referred_by) {
      supabase.from('profiles')
        .select('id, full_name, first_name, last_name, name, email, roles(name)')
        .eq('id', record.referred_by).single()
        .then(({ data }) => setReferredByProfile(data || null));
    } else {
      setReferredByProfile(null);
    }

    supabase.from('partner_invoices').select('*')
      .eq('lead_id', record.id)
      .order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => setExistingInvoice(data?.[0] || null));
  }, [record, isCustomerRecord]);

  // Fetch linked customer when lead is Converted
  useEffect(() => {
    if (!record || isCustomerRecord || record.status !== 'Converted') {
      setLinkedCustomer(null);
      return;
    }
    // Prefer stored customer_id FK, fall back to email match
    if (record.customer_id) {
      supabase.from('customers').select('id, name').eq('id', record.customer_id).single()
        .then(({ data }) => setLinkedCustomer(data || null));
    } else if (record.email) {
      supabase.from('customers').select('id, name')
        .eq('org_id', record.org_id).eq('email', record.email).limit(1)
        .then(({ data }) => setLinkedCustomer(data?.[0] || null));
    }
  }, [record, isCustomerRecord]);

  // ── Activity log fetch ───────────────────────────────────────────────────
  const fetchActivityLog = async () => {
    if (!id || !profile?.org_id) return;
    setActivityLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, actor:actor_id(id, full_name, first_name, last_name, name, email)')
        .eq('record_id', id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error) setActivityLog(data || []);
    } catch (_) { /* silent */ } finally {
      setActivityLoading(false);
    }
  };
  useEffect(() => { if (id) fetchActivityLog(); }, [id]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  // ── logActivity helper ───────────────────────────────────────────────────
  const logActivity = async (entries) => {
    if (!entries?.length || !profile?.org_id) return;
    try {
      await supabase.from('activity_log').insert(
        entries.map(e => ({
          org_id:      profile.org_id,
          record_id:   id,
          record_type: isCustomerRecord ? 'customer' : 'lead',
          actor_id:    profile.id,
          ...e,
        }))
      );
      // Refresh log in background (don't await)
      fetchActivityLog();
    } catch (_) { /* non-blocking */ }
  };

  const handleUpdateRecord = async (updates) => {
    setUpdating(true);
    try {
      // Enrich with audit fields
      const enriched = {
        ...updates,
        modified_by: profile?.id,
        modified_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from(table).update(enriched).eq('id', id).select().single();
      if (error) throw error;
      setRecord(data);

      // Build activity log entries for each changed field
      const FIELD_LABELS = {
        status:           'Status',
        owner_id:         'Assigned To',
        loan_type:        'Loan Type',
        loan_amount:      'Loan Amount',
        commission_rate:  'Commission Rate',
        commission_amount:'Commission Amount',
        invoice_status:   'Invoice Status',
        source:           'Source',
        address:          'Address',
        email:            'Email',
        phone:            'Phone',
        name:             'Name',
      };

      const entries = Object.entries(updates)
        .filter(([key]) => FIELD_LABELS[key])
        .map(([key, newVal]) => {
          const oldVal = record?.[key];
          const isStatus = key === 'status';
          return {
            action:     isStatus ? 'status_changed' : 'field_updated',
            field_name: key,
            old_value:  oldVal != null ? String(oldVal) : null,
            new_value:  newVal != null ? String(newVal) : null,
            label:      isStatus
              ? `Status changed from ${oldVal || '?'} → ${newVal}`
              : `${FIELD_LABELS[key]} updated`,
          };
        });

      if (entries.length) await logActivity(entries);
    } catch (err) {
      showNotification('Failed to update: ' + err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleConvertToCustomer = async () => {
    const ok = await confirm({
      message: 'Convert this lead to a Customer? A customer account will be created and this lead will be archived as Converted.',
      confirmLabel: 'Convert to Customer'
    });
    if (!ok) return;
    setUpdating(true);
    try {
      const { data: cust, error: cErr } = await supabase.from('customers').insert([{
        name:        record.name,
        email:       record.email,
        phone:       record.phone,
        address:     record.address,
        org_id:      record.org_id,
        owner_id:    record.owner_id,
        loan_type:   record.loan_type,
        loan_amount: record.loan_amount,
        source:      record.source,
        status:      'Active',
        lead_id:     record.id,       // back-reference to the originating lead
      }]).select().single();
      if (cErr) throw cErr;

      // Archive lead with customer_id stored
      await supabase.from('leads').update({
        status: 'Converted',
        customer_id: cust.id,
        modified_by: profile?.id,
        modified_at: new Date().toISOString(),
      }).eq('id', id);

      // Log conversion activity
      await supabase.from('activity_log').insert([{
        org_id:      record.org_id,
        record_id:   id,
        record_type: 'lead',
        actor_id:    profile?.id,
        action:      'converted',
        label:       `Converted to customer — ${cust.name}`,
        meta:        { customer_id: cust.id },
      }]);

      showNotification('Lead converted to Customer successfully', 'success');
      navigate(`/customers/${cust.id}`);
    } catch (err) {
      showNotification('Conversion failed: ' + err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleRaiseInvoice = async () => {
    const commAmt = ((record.loan_amount || 0) * (record.commission_rate || 0)) / 100;
    handleUpdateRecord({ invoice_status: 'raised', commission_amount: commAmt });
  };

  const handleSaveTask = async () => {
    if (!taskForm.subject.trim()) return;
    setSavingTask(true);
    const col = isCustomerRecord ? 'customer_id' : 'lead_id';
    try {
      const { error } = await supabase.from('tasks').insert([{
        ...taskForm,
        org_id:   profile.org_id,
        owner_id: profile.id,
        [col]:    id,
        due_date: taskForm.due_date || null,
      }]);
      if (error) throw error;
      setTaskForm({ subject: '', type: 'Call', status: 'Not Started', priority: 'Normal', due_date: '', notes: '' });
      setShowTaskModal(false);
      showNotification('Activity scheduled', 'success');
      fetchTasks();
    } catch (err) {
      showNotification('Failed to save: ' + err.message, 'error');
    } finally {
      setSavingTask(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    await supabase.from('tasks').update({ status: 'Completed', completed_at: new Date().toISOString() }).eq('id', taskId);
    fetchTasks();
  };

  const handleDeleteTask = async (taskId) => {
    const ok = await confirm({ message: 'Delete this activity?', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    await supabase.from('tasks').delete().eq('id', taskId);
    showNotification('Activity deleted', 'info');
    fetchTasks();
  };

  const handleDeleteRecord = async () => {
    const ok = await confirm({
      message: isCustomerRecord
        ? 'Permanently delete this customer account?'
        : 'Delete this lead? All activity history will be removed.',
      confirmLabel: 'Delete Permanently',
      danger: true,
    });
    if (!ok) return;
    setUpdating(true);
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      showNotification(`${recordType} deleted`, 'success');
      navigate(isCustomerRecord ? '/customers' : '/leads');
    } catch (err) {
      showNotification('Delete failed: ' + err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  // ── Guard states ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-primary mb-4" size={40} />
    </div>
  );

  if (!record) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Shield size={40} className="text-red-400" />
      <h2 className="text-2xl font-bold">Record Not Found</h2>
      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold">Go Back</button>
    </div>
  );

  // ── Derived display values ─────────────────────────────────────────────────
  const ownerInfo  = executives.find(e => e.id === record.owner_id) || (record.owner_id === profile?.id ? profile : null);
  const ownerName  = ownerInfo ? getDisplayName(ownerInfo) : 'Unassigned';
  const initials   = record.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??';
  const isConverted = !isCustomerRecord && record.status === 'Converted';

  const pendingTasks   = tasks.filter(t => t.status !== 'Completed').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">

      {/* ── Top bar: back + pipeline ───────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft size={18} />
            {isCustomerRecord ? 'Customers' : 'Leads'}
          </button>
          {/* Top-right actions */}
          <div className="flex items-center gap-2">
            {record.status !== 'Converted' && (
              <button
                onClick={handleDeleteRecord}
                disabled={updating}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                title={`Delete ${recordType}`}
              >
                <Trash2 size={17} />
              </button>
            )}
            {!isCustomerRecord && !isConverted && (
              <button
                onClick={handleConvertToCustomer}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                {updating ? <Loader2 size={14} className="animate-spin" /> : <><ArrowRight size={14} /> Initialize Account</>}
              </button>
            )}
            {isConverted && linkedCustomer && (
              <button
                onClick={() => navigate(`/customers/${linkedCustomer.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                <ExternalLink size={14} /> View Customer Record
              </button>
            )}
          </div>
        </div>

        {/* Pipeline stage bar */}
        <PipelineStageBar
          stages={stages}
          currentStatus={record.status}
          disabled={isConverted || updating}
          onStageChange={(newStatus) => handleUpdateRecord({ status: newStatus })}
        />
      </div>

      {/* ── Converted banner ──────────────────────────────────────────────── */}
      {isConverted && (
        <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Lead Successfully Converted</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-500 mt-0.5">
              This lead is archived. The original record is preserved for commission history and audit trails — leads are never deleted after conversion.
            </p>
          </div>
          {linkedCustomer && (
            <button
              onClick={() => navigate(`/customers/${linkedCustomer.id}`)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all"
            >
              {linkedCustomer.name} <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}

      {/* ── Header card ───────────────────────────────────────────────────── */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Avatar */}
        <div className="size-16 rounded-2xl bg-primary/10 text-primary font-black text-xl flex items-center justify-center flex-shrink-0 ring-4 ring-primary/5">
          {initials}
        </div>
        {/* Core info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{record.name}</h1>
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
              isConverted
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                : isCustomerRecord
                ? 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/20'
                : 'bg-primary/5 text-primary border-primary/20'
            }`}>
              {record.status || recordType}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            {record.email && (
              <a href={`mailto:${record.email}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors">
                <Mail size={13} /> {record.email}
              </a>
            )}
            {record.phone && (
              <a href={`tel:${record.phone}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors">
                <Phone size={13} /> {record.phone}
              </a>
            )}
            {record.address && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin size={13} /> {record.address}
              </span>
            )}
          </div>
        </div>
        {/* Mini stats */}
        <div className="hidden lg:flex items-center gap-6 flex-shrink-0 pr-2">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loan Ask</p>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {record.loan_amount ? `₹${record.loan_amount.toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Activities</p>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{tasks.length}</p>
          </div>
          <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</p>
            <p className="text-sm font-black text-primary mt-0.5">{record.loan_type || 'General'}</p>
          </div>
        </div>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column (Overview + Activity tabs) ─────────────────────── */}
        <div className="lg:col-span-2 space-y-0">

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mb-5 w-fit">
            <Tab id="overview"  label="Overview"      active={activeTab === 'overview'}  onClick={setActiveTab} />
            <Tab id="activity"  label="Activity"      count={pendingTasks} active={activeTab === 'activity'}  onClick={setActiveTab} />
            <Tab id="history"   label="History"       count={activityLog.length} active={activeTab === 'history'}   onClick={setActiveTab} />
          </div>

          {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-5">

              {/* Contact details */}
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InfoField icon={Mail} label="Email">
                    {record.email
                      ? <a href={`mailto:${record.email}`} className="text-primary hover:underline">{record.email}</a>
                      : <span className="text-slate-400 font-normal text-xs">Not provided</span>
                    }
                  </InfoField>
                  <InfoField icon={Phone} label="Phone">
                    {record.phone
                      ? <a href={`tel:${record.phone}`} className="text-primary hover:underline">{record.phone}</a>
                      : <span className="text-slate-400 font-normal text-xs">Not provided</span>
                    }
                  </InfoField>
                  <InfoField icon={MapPin} label="Address" className="sm:col-span-2">
                    {record.address || <span className="text-slate-400 font-normal text-xs">Not provided</span>}
                  </InfoField>
                </div>
              </div>

              {/* Lead / Customer metadata */}
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  {isCustomerRecord ? 'Account Details' : 'Lead Details'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* Assigned executive */}
                  <InfoField icon={User} label="Portfolio Manager">
                    <div className="relative mt-0.5">
                      <select
                        value={record.owner_id || ''}
                        onChange={e => e.target.value && handleUpdateRecord({ owner_id: e.target.value })}
                        disabled={isConverted || updating}
                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none disabled:opacity-60 disabled:cursor-default"
                      >
                        <option value="">Select Representative</option>
                        {executives.map(e => (
                          <option key={e.id} value={e.id}>{getDisplayName(e)}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </InfoField>

                  <InfoField label="Lead Source">
                    {record.source || <span className="text-slate-400 font-normal text-xs">Direct</span>}
                  </InfoField>

                  {/* Referred by partner */}
                  {!isCustomerRecord && referredByProfile && (
                    <InfoField icon={Handshake} label="Referred By Partner">
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="size-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-black text-[10px] uppercase flex-shrink-0">
                          {getDisplayName(referredByProfile).split(' ').map(w => w[0]).slice(0,2).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{getDisplayName(referredByProfile)}</p>
                          <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wide">{referredByProfile.roles?.name || 'Partner'}</p>
                        </div>
                      </div>
                    </InfoField>
                  )}

                  <InfoField label="Created">
                    {record.created_at
                      ? new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '—'
                    }
                  </InfoField>
                </div>
              </div>

            </div>
          )}

          {/* ── ACTIVITY TAB ──────────────────────────────────────────────── */}
          {activeTab === 'activity' && (
            <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Toolbar */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Timeline Activity</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{pendingTasks} open · {completedTasks} completed</p>
                </div>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary/50 transition-all shadow-sm"
                >
                  <Plus size={13} className="text-primary" /> Log Activity
                </button>
              </div>

              {/* Task list */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50 min-h-[200px]">
                {tasksLoading ? (
                  <div className="py-12 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto" size={28} />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity size={20} className="text-slate-300" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No activities logged yet</p>
                    <p className="text-xs text-slate-400 mt-1">Log a call, meeting or to-do to get started.</p>
                  </div>
                ) : tasks.map((task) => {
                  const TypeIcon = typeIcon(task.type);
                  const done = task.status === 'Completed';
                  return (
                    <div
                      key={task.id}
                      className={`px-6 py-5 flex gap-4 transition-all group ${done ? 'opacity-40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                    >
                      <div className={`size-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-primary/8 text-primary'}`}>
                        <TypeIcon size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className={`text-sm font-bold ${done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{task.subject}</p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                            {!done && (
                              <button onClick={() => handleCompleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all" title="Complete">
                                <CheckCircle2 size={15} />
                              </button>
                            )}
                            <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Delete">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${priorityColor(task.priority)}`}>{task.priority}</span>
                          <span className="text-slate-200 dark:text-slate-700 text-[10px]">·</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                              : 'No due date'
                            }
                          </span>
                          {task.notes && (
                            <>
                              <span className="text-slate-200 dark:text-slate-700 text-[10px]">·</span>
                              <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{task.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ────────────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Change History</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Every field update, status change, and action — by whom and when.</p>
                </div>
                <button onClick={fetchActivityLog} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Refresh">
                  <RefreshCw size={14} className="text-slate-400" />
                </button>
              </div>

              {/* Modified by banner — shown if record has been edited */}
              {record?.modified_by && record?.modified_at && (
                <div className="px-6 py-3 bg-blue-50/60 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/30 flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-300">
                  <UserCheck size={14} className="flex-shrink-0" />
                  <span>Last modified <strong>{new Date(record.modified_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong></span>
                </div>
              )}

              {/* Timeline */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50 min-h-[200px]">
                {activityLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : activityLog.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-3">
                      <History size={20} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No history yet</p>
                    <p className="text-xs text-slate-400 mt-1">Changes will appear here as the record is updated.</p>
                  </div>
                ) : activityLog.map((entry) => {
                  const actorName = entry.actor
                    ? (entry.actor.full_name || [entry.actor.first_name, entry.actor.last_name].filter(Boolean).join(' ') || entry.actor.email || 'Unknown')
                    : 'System';
                  const actorInitials = actorName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

                  const actionIcon = (() => {
                    switch (entry.action) {
                      case 'status_changed': return <ArrowRightLeft size={13} className="text-violet-500" />;
                      case 'converted':      return <CheckCircle2   size={13} className="text-emerald-500" />;
                      case 'field_updated':  return <GitCommitVertical size={13} className="text-blue-400" />;
                      default:               return <Activity size={13} className="text-slate-400" />;
                    }
                  })();

                  const actionColor = (() => {
                    switch (entry.action) {
                      case 'status_changed': return 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/30';
                      case 'converted':      return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30';
                      default:               return 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50';
                    }
                  })();

                  return (
                    <div key={entry.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Actor avatar */}
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {actorInitials}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Summary line */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{actorName}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${actionColor}`}>
                            {actionIcon}
                            {entry.label || entry.action.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Old → New value diff */}
                        {entry.old_value != null && entry.new_value != null && (
                          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                            <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded line-through font-mono">
                              {entry.old_value}
                            </span>
                            <ArrowRight size={10} className="text-slate-300 flex-shrink-0" />
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded font-mono font-semibold">
                              {entry.new_value}
                            </span>
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(entry.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          <span className="ml-2 text-slate-300">·</span>
                          <span className="ml-2">{timeAgo(entry.created_at)}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ── Right column — Financial Intelligence ──────────────────────── */}
        <div className="space-y-5">

          {/* Dark finance card */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
              <IndianRupee size={140} />
            </div>

            <div className="relative z-10 space-y-6">

              {/* Invoice status pill */}
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Financial Suite</p>
                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                  record.invoice_status === 'paid'   ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  record.invoice_status === 'raised' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                  {record.invoice_status || 'Unbilled'}
                </span>
              </div>

              {/* Loan amount */}
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Loan Request</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black tabular-nums">
                    ₹{(record.loan_amount || 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">
                    {record.loan_type || 'General'}
                  </span>
                </div>
              </div>

              {/* Commission section */}
              <div className="pt-4 border-t border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Commission</p>

                {canSetCommission ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Rate (%)</label>
                      <input
                        type="number" min="0" max="100" step="0.1"
                        value={record.commission_rate || ''}
                        onChange={e => handleUpdateRecord({ commission_rate: parseFloat(e.target.value) || 0 })}
                        disabled={isConverted}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black w-full focus:ring-1 focus:ring-primary outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Amount (₹)</label>
                      <input
                        type="number" min="0"
                        value={record.commission_amount || ''}
                        onChange={e => handleUpdateRecord({ commission_amount: parseFloat(e.target.value) || 0 })}
                        disabled={isConverted}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black w-full focus:ring-1 focus:ring-primary outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-800/40 rounded-xl">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Rate</p>
                      <p className="text-lg font-black">{record.commission_rate || 0}%</p>
                    </div>
                    <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                      <p className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Earnings</p>
                      <p className="text-lg font-black text-emerald-400">
                        ₹{(record.commission_amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Partner attribution (compact) */}
              {!isCustomerRecord && referredByProfile && (
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Handshake size={10} className="text-indigo-400" /> Referred By
                  </p>
                  <p className="text-sm font-black">{getDisplayName(referredByProfile)}</p>
                  <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black">{referredByProfile.roles?.name || 'Partner'}</p>
                </div>
              )}

              {/* Operations */}
              <div className="pt-4 border-t border-slate-800 space-y-2.5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Operations</p>

                {/* Partner: raise commission invoice */}
                {showRaiseInvoiceBtn && (
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Receipt size={13} /> Raise Commission Invoice
                  </button>
                )}

                {/* Partner invoice status badge */}
                {!isCustomerRecord && isPartner && isReferringPartner && existingInvoice && (
                  <div className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border ${
                    existingInvoice.status === 'Paid'     ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    existingInvoice.status === 'Approved' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    existingInvoice.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    Invoice: {existingInvoice.status} · ₹{Number(existingInvoice.amount).toLocaleString()}
                  </div>
                )}

                {/* Internal: generate invoice */}
                {canRaiseInvoice && record.invoice_status === 'pending' && !isPartner && (
                  <button
                    onClick={handleRaiseInvoice}
                    disabled={isConverted}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    Generate Invoice
                  </button>
                )}

                {/* Internal: acknowledge payment */}
                {canProcessPayment && record.invoice_status === 'raised' && (
                  <button
                    onClick={() => handleUpdateRecord({ invoice_status: 'paid' })}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Acknowledge Payment
                  </button>
                )}

                <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Download Summary
                </button>
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] text-center">
              Encrypted · Audit Logged · Org Scoped
            </p>
          </div>
        </div>

      </div>{/* end main grid */}

      {/* ── Task creation modal ────────────────────────────────────────────── */}
      {showTaskModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={e => { if (e.target === e.currentTarget) setShowTaskModal(false); }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[520px] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Log Activity</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Create a task or record an interaction</p>
                </div>
              </div>
              <button onClick={() => setShowTaskModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Subject <span className="text-red-400">*</span></label>
                <input
                  type="text" value={taskForm.subject}
                  onChange={e => setTaskForm({ ...taskForm, subject: e.target.value })}
                  placeholder="e.g., Follow-up call with client"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Activity Type</label>
                <div className="flex flex-wrap gap-2">
                  {TASK_TYPES.map(t => {
                    const icons = { Call: <PhoneCall size={13}/>, Email: <Mail size={13}/>, Meeting: <Calendar size={13}/>, 'To-Do': <CheckSquare size={13}/> };
                    return (
                      <button key={t} type="button"
                        onClick={() => setTaskForm({ ...taskForm, type: t })}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          taskForm.type === t
                            ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40 hover:text-primary'
                        }`}
                      >
                        {icons[t]} {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Priority</label>
                  <select value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    {TASK_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Due Date <span className="text-slate-300 font-normal">(optional)</span></label>
                  <input type="datetime-local" value={taskForm.due_date}
                    onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Notes <span className="text-slate-300 font-normal">(optional)</span></label>
                <textarea value={taskForm.notes} rows={3}
                  onChange={e => setTaskForm({ ...taskForm, notes: e.target.value })}
                  placeholder="Add any relevant context or details…"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button onClick={() => setShowTaskModal(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button onClick={handleSaveTask} disabled={savingTask || !taskForm.subject.trim()}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingTask ? 'Saving…' : 'Save Activity'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Raise Commission Invoice Modal ─────────────────────────────────── */}
      {!isCustomerRecord && record && (
        <RaiseInvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          lead={record}
          onInvoiceRaised={invoice => {
            setExistingInvoice(invoice);
            setShowInvoiceModal(false);
          }}
        />
      )}
    </div>
  );
};

export default LeadDetails;
