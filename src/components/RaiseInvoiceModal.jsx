import React, { useState, useEffect } from 'react';
import { X, Receipt, IndianRupee, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { sendNotification } from '../hooks/useNotificationsDB';
import { fmtCurrency } from '../utils/formatUtils';

/**
 * RaiseInvoiceModal
 *
 * Allows a banker or collaborator to raise a commission invoice against a
 * closed / disbursed lead they referred.
 *
 * Props:
 *   isOpen        {boolean}
 *   onClose       {() => void}
 *   lead          {object}  — the lead record (must include id, name, loan_amount,
 *                             commission_rate, commission_amount, org_id)
 *   onInvoiceRaised {(invoice) => void}  — called after successful insert
 */
const RaiseInvoiceModal = ({ isOpen, onClose, lead, onInvoiceRaised }) => {
  const { profile } = useAuth();

  const [form, setForm] = useState({
    amount: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill amount from lead commission data when modal opens
  useEffect(() => {
    if (isOpen && lead) {
      const suggested =
        lead.commission_amount
          ? String(lead.commission_amount)
          : lead.commission_rate && lead.loan_amount
          ? String(((lead.loan_amount * lead.commission_rate) / 100).toFixed(0))
          : '';
      setForm({ amount: suggested, notes: '' });
      setDone(false);
      setError(null);
    }
  }, [isOpen, lead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid invoice amount.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // 1. Insert partner invoice
      const { data: invoice, error: insErr } = await supabase
        .from('partner_invoices')
        .insert([{
          org_id:     lead.org_id,
          partner_id: profile.id,
          lead_id:    lead.id,
          amount:     Number(form.amount),
          notes:      form.notes || null,
          status:     'Pending',
        }])
        .select()
        .single();

      if (insErr) throw insErr;

      // 2. Notify all CEO/admin-level users in the org
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('org_id', lead.org_id)
        .in('profile_type', ['SYSTEM_ADMIN'])
        .neq('id', profile.id);

      const partnerName = profile?.full_name || profile?.name || profile?.email || 'A partner';

      await Promise.all(
        (admins || []).map(admin =>
          sendNotification({
            orgId:         lead.org_id,
            recipientId:   admin.id,
            type:          'invoice_submitted',
            title:         `Invoice raised by ${partnerName}`,
            message:       `₹${Number(form.amount).toLocaleString()} commission invoice for lead "${lead.name}". Awaiting your approval.`,
            referenceId:   invoice.id,
            referenceType: 'invoice',
          })
        )
      );

      setDone(true);
      onInvoiceRaised?.(invoice);
    } catch (err) {
      console.error('RaiseInvoiceModal error:', err.message);
      setError(err.message || 'Failed to raise invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setDone(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[480px] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Raise Commission Invoice</h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[260px]">Lead: {lead?.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Success state */}
        {done ? (
          <div className="px-6 py-12 text-center">
            <div className="size-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Invoice Submitted!</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Your commission invoice for <strong>₹{Number(form.amount).toLocaleString()}</strong> has been sent for approval. You'll be notified once it's reviewed.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Lead context banner */}
            <div className="mx-6 mt-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Loan Amount</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    ₹{lead?.loan_amount?.toLocaleString() || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Agreed Rate</p>
                  <p className="text-sm font-black text-primary">
                    {lead?.commission_rate ? `${lead.commission_rate}%` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Loan Type</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {lead?.loan_type || 'General'}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* Invoice amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Invoice Amount (₹) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    inputMode="decimal"
                    value={form.amount}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = raw.split('.');
                      const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
                      setForm(f => ({ ...f, amount: clean }));
                    }}
                    placeholder="Enter commission amount"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  />
                </div>
                {lead?.commission_rate && lead?.loan_amount && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Suggested: {fmtCurrency(Math.round((lead.loan_amount * lead.commission_rate) / 100))} ({lead.commission_rate}% of loan amount)
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Notes <span className="text-slate-300 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <FileText size={14} className="absolute left-3 top-3 text-slate-400" />
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any remarks for the admin reviewing this invoice…"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.amount}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                ) : (
                  <><Receipt size={15} /> Submit Invoice</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RaiseInvoiceModal;
