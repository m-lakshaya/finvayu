import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, PieChart, ArrowUpRight,
  Download, Calendar, Filter, Users, Loader2,
  Receipt, CheckCheck, XCircle, Clock, IndianRupee,
  ChevronDown, MessageSquare, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, PERMISSIONS } from '../hooks/useAuth';
import { getDisplayName } from '../utils/profileUtils';
import { fmtCurrency } from '../utils/formatUtils';
import { sendNotification } from '../hooks/useNotificationsDB';

// ─── Tab constants ────────────────────────────────────────────────────────────
const TABS = {
  SETTLEMENTS: 'settlements',
  PARTNER_INVOICES: 'partner_invoices',
};

// ─── Invoice status badge ─────────────────────────────────────────────────────
const InvoiceStatusBadge = ({ status }) => {
  const map = {
    Pending:  { cls: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20',  icon: Clock },
    Approved: { cls: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20',      icon: CheckCheck },
    Rejected: { cls: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20',          icon: XCircle },
    Paid:     { cls: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20', icon: CheckCheck },
  };
  const { cls, icon: Icon } = map[status] || map.Pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${cls}`}>
      <Icon size={10} /> {status}
    </span>
  );
};

const Revenue = () => {
  const { profile, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS.SETTLEMENTS);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalRevenue: 0,
    netCommission: 0,
    pendingPayouts: 0,
    activePartners: 0,
    transactions: [],
    breakdown: []
  });

  // ── Partner Invoices state ──────────────────────────────────────────────────
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { invoice }
  const [rejectNote, setRejectNote] = useState('');

  const canProcessPayment = hasPermission(PERMISSIONS.PROCESS_PAYMENT);
  // Only CEO / SYSTEM_ADMIN can see/approve partner invoices
  const canManageInvoices = profile?.profile_type === 'SYSTEM_ADMIN' || profile?.roles?.name?.toLowerCase() === 'ceo';

  // ── Settlements fetch ───────────────────────────────────────────────────────
  const fetchRevenueData = useCallback(async () => {
    if (!profile?.org_id) return;
    setLoading(true);
    try {
      const [appsRes, leadsRes, collabRes] = await Promise.all([
        supabase
          .from('loan_applications')
          .select('*, lead:lead_id(name, commission_amount, commission_rate)')
          .eq('org_id', profile.org_id),
        supabase
          .from('leads')
          .select('id, name, loan_amount, loan_type, commission_amount, commission_rate, invoice_status, created_at')
          .eq('org_id', profile.org_id),
        supabase.from('profiles').select('id').eq('org_id', profile.org_id).in('role_id', ['banker', 'collaborator'])
      ]);

      if (appsRes.error) throw appsRes.error;
      if (leadsRes.error) throw leadsRes.error;

      const apps     = appsRes.data  || [];
      const leads    = leadsRes.data || [];
      const partners = collabRes.data || [];

      const disbursedApps  = apps.filter(a => a.stage === 'Completed');
      const totalVolume    = disbursedApps.reduce((s, a) => s + (Number(a.amount) || 0), 0);
      const paidLeads      = leads.filter(l => l.invoice_status === 'paid');
      const raisedLeads    = leads.filter(l => l.invoice_status === 'raised');
      const netCommission  = paidLeads.reduce((s, l) => s + (Number(l.commission_amount) || 0), 0);
      const pendingPayouts = raisedLeads.reduce((s, l) => s + (Number(l.commission_amount) || 0), 0);

      const transactions = disbursedApps
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(a => ({
          id:         `APP-${a.id.slice(0, 4).toUpperCase()}`,
          partner:    a.lead?.name || 'Direct Client',
          amount:     fmtCurrency(Number(a.amount) || 0),
          commission: Number(a.lead?.commission_amount) > 0
            ? fmtCurrency(Number(a.lead.commission_amount)) : '—',
          date:       new Date(a.created_at).toLocaleDateString(),
          status:     'Settled',
          type:       a.loan_type
        }));

      const types = [...new Set(apps.map(a => a.loan_type).filter(Boolean))];
      const COLORS = ['bg-primary', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500', 'bg-rose-500'];
      const breakdown = types.map((t, i) => {
        const typeApps   = disbursedApps.filter(a => a.loan_type === t);
        const typeVolume = typeApps.reduce((s, a) => s + (Number(a.amount) || 0), 0);
        return {
          label: t,
          value: totalVolume ? Math.round((typeVolume / totalVolume) * 100) : 0,
          amount: fmtCurrency(typeVolume),
          color: COLORS[i % COLORS.length]
        };
      });

      setData({ totalRevenue: totalVolume, netCommission, pendingPayouts, activePartners: partners.length, transactions, breakdown });
    } catch (err) {
      console.error('Revenue Fetch Error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id]);

  // ── Partner Invoices fetch ──────────────────────────────────────────────────
  const fetchPartnerInvoices = useCallback(async () => {
    if (!profile?.org_id || !canManageInvoices) return;
    setInvoicesLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from('partner_invoices')
        .select(`
          *,
          partner:partner_id ( id, full_name, first_name, last_name, name, email, roles(name) ),
          lead:lead_id ( id, name, loan_amount, loan_type )
        `)
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(rows || []);
    } catch (err) {
      console.error('Partner invoices fetch error:', err.message);
    } finally {
      setInvoicesLoading(false);
    }
  }, [profile?.org_id, canManageInvoices]);

  useEffect(() => { fetchRevenueData(); }, [fetchRevenueData]);
  useEffect(() => {
    if (activeTab === TABS.PARTNER_INVOICES) fetchPartnerInvoices();
  }, [activeTab, fetchPartnerInvoices]);

  // ── Approve invoice ─────────────────────────────────────────────────────────
  const handleApprove = async (invoice) => {
    setProcessingId(invoice.id);
    try {
      const { error } = await supabase
        .from('partner_invoices')
        .update({ status: 'Approved', reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
        .eq('id', invoice.id);
      if (error) throw error;

      // Notify the partner
      await sendNotification({
        orgId:         invoice.org_id,
        recipientId:   invoice.partner_id,
        type:          'invoice_approved',
        title:         'Your invoice has been approved!',
        message:       `₹${Number(invoice.amount).toLocaleString()} commission invoice for lead "${invoice.lead?.name}" has been approved. Payment will be processed shortly.`,
        referenceId:   invoice.id,
        referenceType: 'invoice',
      });

      setInvoices(prev => prev.map(i => i.id === invoice.id
        ? { ...i, status: 'Approved', reviewed_by: profile.id }
        : i
      ));
    } catch (err) {
      console.error('Approve error:', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ── Reject invoice ──────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectModal) return;
    const invoice = rejectModal;
    setProcessingId(invoice.id);
    setRejectModal(null);
    try {
      const { error } = await supabase
        .from('partner_invoices')
        .update({
          status:      'Rejected',
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          notes:       rejectNote || invoice.notes,
        })
        .eq('id', invoice.id);
      if (error) throw error;

      await sendNotification({
        orgId:         invoice.org_id,
        recipientId:   invoice.partner_id,
        type:          'invoice_rejected',
        title:         'Invoice was not approved',
        message:       `Your ₹${Number(invoice.amount).toLocaleString()} invoice for "${invoice.lead?.name}" was rejected.${rejectNote ? ` Reason: ${rejectNote}` : ''}`,
        referenceId:   invoice.id,
        referenceType: 'invoice',
      });

      setInvoices(prev => prev.map(i => i.id === invoice.id
        ? { ...i, status: 'Rejected', reviewed_by: profile.id }
        : i
      ));
    } catch (err) {
      console.error('Reject error:', err.message);
    } finally {
      setProcessingId(null);
      setRejectNote('');
    }
  };

  // ── Mark paid ───────────────────────────────────────────────────────────────
  const handleMarkPaid = async (invoice) => {
    setProcessingId(invoice.id);
    try {
      await supabase
        .from('partner_invoices')
        .update({ status: 'Paid' })
        .eq('id', invoice.id);
      setInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, status: 'Paid' } : i));
    } catch (err) {
      console.error('Mark paid error:', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ── Pending invoice count for badge ────────────────────────────────────────
  const pendingInvoiceCount = invoices.filter(i => i.status === 'Pending').length;

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Calculating Payout Ledger…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Revenue & Commissions</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1 uppercase tracking-widest">
            Live Branch Performance · {profile?.roles?.name || 'Admin'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase hover:shadow-sm transition-all tracking-widest">
            <Download size={14} className="text-primary" /> Export Settlement
          </button>
          {canProcessPayment && (
            <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase hover:shadow-lg hover:shadow-primary/20 transition-all tracking-widest">
              Process Payouts
            </button>
          )}
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Volume',      value: fmtCurrency(data.totalRevenue),   change: 'DISBURSED', icon: DollarSign,  color: 'text-primary bg-primary/10' },
          { label: 'Net Earnings',      value: fmtCurrency(data.netCommission),  change: 'PAID',     icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Pending Payout',    value: fmtCurrency(data.pendingPayouts), change: 'RAISED',   icon: PieChart,   color: 'text-orange-500 bg-orange-500/10' },
          { label: 'Network Partners',  value: data.activePartners, change: 'Active', icon: Users, color: 'text-indigo-500 bg-indigo-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`p-3 rounded-xl ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500">
                <ArrowUpRight size={14} /> {stat.change}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1 relative z-10">{stat.label}</p>
            <h4 className="text-3xl font-black tracking-tighter relative z-10">{stat.value}</h4>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab(TABS.SETTLEMENTS)}
          className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === TABS.SETTLEMENTS
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          Settlements
        </button>
        {canManageInvoices && (
          <button
            onClick={() => setActiveTab(TABS.PARTNER_INVOICES)}
            className={`relative px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === TABS.PARTNER_INVOICES
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            Partner Invoices
            {pendingInvoiceCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-slate-100 dark:border-slate-800">
                {pendingInvoiceCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── SETTLEMENTS TAB ──────────────────────────────────────────────────── */}
      {activeTab === TABS.SETTLEMENTS && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100">Recent Settlements</h3>
                <div className="flex items-center gap-2">
                  <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-primary transition-all"><Filter size={16} /></button>
                  <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-primary transition-all"><Calendar size={16} /></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-separate border-spacing-0">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                    <tr>
                      <th className="px-6 py-4">Ref ID</th>
                      <th className="px-6 py-4">Entity/Product</th>
                      <th className="px-6 py-4">Total Value</th>
                      <th className="px-6 py-4">Commission</th>
                      <th className="px-6 py-4 text-right">Settled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No disbursements recorded in current cycle.</td>
                      </tr>
                    ) : data.transactions.map(txn => (
                      <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                        <td className="px-6 py-5 font-mono text-[10px] font-black text-primary">{txn.id}</td>
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900 dark:text-slate-100">{txn.partner}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{txn.type}</p>
                        </td>
                        <td className="px-6 py-5 font-black">{txn.amount}</td>
                        <td className="px-6 py-5 text-emerald-500 font-black text-xs">+{txn.commission}</td>
                        <td className="px-6 py-5 text-right font-black text-slate-400 text-[10px] uppercase">{txn.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">Segmental Split</h3>
            <div className="space-y-6">
              {data.breakdown.length === 0 ? (
                <p className="text-center text-slate-400 text-[10px] font-bold uppercase py-10">Data awaiting ingestion.</p>
              ) : data.breakdown.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{item.label}</span>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">{item.amount}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.value}%` }} />
                  </div>
                  <p className="text-[9px] font-black text-slate-400">{item.value}% of total</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PARTNER INVOICES TAB ─────────────────────────────────────────────── */}
      {activeTab === TABS.PARTNER_INVOICES && canManageInvoices && (
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100">Partner Commission Invoices</h3>
              {pendingInvoiceCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[9px] font-black uppercase tracking-wide rounded-full border border-amber-100 dark:border-amber-800">
                  <AlertCircle size={10} /> {pendingInvoiceCount} awaiting review
                </span>
              )}
            </div>
            <button
              onClick={fetchPartnerInvoices}
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
            >
              Refresh
            </button>
          </div>

          {invoicesLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin text-primary mx-auto mb-4" size={36} />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading invoices…</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-20 text-center">
              <Receipt size={40} className="text-slate-200 dark:text-slate-800 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No partner invoices submitted yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                  <tr>
                    <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Partner</th>
                    <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Lead / File</th>
                    <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Amount</th>
                    <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Status</th>
                    <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Submitted</th>
                    <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      {/* Partner */}
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {getDisplayName(inv.partner) || inv.partner?.email || '—'}
                        </p>
                        <p className="text-[10px] text-primary font-black uppercase tracking-tighter mt-0.5">
                          {inv.partner?.roles?.name || 'Partner'}
                        </p>
                      </td>

                      {/* Lead */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{inv.lead?.name || '—'}</p>
                        {inv.lead?.loan_type && (
                          <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{inv.lead.loan_type}</p>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-900 dark:text-white text-sm">
                          {fmtCurrency(Number(inv.amount))}
                        </p>
                        {inv.notes && (
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]" title={inv.notes}>
                            {inv.notes}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>

                      {/* Submitted date */}
                      <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">
                        {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {inv.status === 'Pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(inv)}
                              disabled={processingId === inv.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wide transition-all disabled:opacity-50 shadow-sm shadow-emerald-500/20"
                            >
                              {processingId === inv.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
                              Approve
                            </button>
                            <button
                              onClick={() => { setRejectModal(inv); setRejectNote(''); }}
                              disabled={processingId === inv.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all disabled:opacity-50 border border-red-100 dark:border-red-800"
                            >
                              <XCircle size={11} /> Reject
                            </button>
                          </div>
                        )}
                        {inv.status === 'Approved' && canProcessPayment && (
                          <button
                            onClick={() => handleMarkPaid(inv)}
                            disabled={processingId === inv.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-[10px] font-black uppercase tracking-wide transition-all disabled:opacity-50 shadow-sm shadow-primary/20 ml-auto"
                          >
                            {processingId === inv.id ? <Loader2 size={11} className="animate-spin" /> : <IndianRupee size={11} />}
                            Mark Paid
                          </button>
                        )}
                        {(inv.status === 'Rejected' || inv.status === 'Paid') && (
                          <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                            {inv.status === 'Paid' ? 'Settled' : 'Closed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Reject confirmation modal ─────────────────────────────────────────── */}
      {rejectModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={e => { if (e.target === e.currentTarget) setRejectModal(null); }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="size-9 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-500">
                <XCircle size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reject Invoice</h3>
                <p className="text-xs text-slate-400">{fmtCurrency(Number(rejectModal.amount))} · {getDisplayName(rejectModal.partner)}</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Reason <span className="text-slate-300 font-normal">(optional — will be sent to the partner)</span></label>
              <textarea
                rows={3}
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="e.g., Amount doesn't match agreed rate, missing supporting document…"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-all active:scale-[0.98]"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Revenue;
