import React, { useState } from 'react';
import { X, Building2, Mail, Phone, MapPin, Briefcase, IndianRupee, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

// Hard cap at ₹999 Cr — prevents absurd test values reaching the DB
const MAX_LOAN = 9_990_000_000;

const EMPTY_FORM = {
  name: '', email: '', phone: '', address: '',
  source: 'Direct', loan_type: 'Business Expansion',
  loan_amount: '', status: 'Active', account_id: ''
};

const CreateCustomerModal = ({ isOpen, onClose, onCustomerCreated }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(EMPTY_FORM);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Company name is required.';
    if (formData.phone) {
      const digits = formData.phone.replace(/[\s\-+()]/g, '');
      if (!/^[0-9]{10}$/.test(digits)) e.phone = 'Enter a valid 10-digit mobile number.';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = 'Enter a valid email address.';
    if (formData.loan_amount !== '') {
      const amt = parseFloat(formData.loan_amount);
      if (isNaN(amt) || amt < 0) e.loan_amount = 'Enter a valid positive amount.';
      else if (amt > MAX_LOAN) e.loan_amount = 'Amount cannot exceed ₹999 Cr. Please verify.';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const amt = formData.loan_amount !== '' ? parseFloat(formData.loan_amount) : 0;
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...formData,
          org_id: profile.org_id,
          owner_id: profile.id,
          loan_amount: amt,
          account_id: formData.account_id || `ACC-${Math.floor(Math.random() * 10000)}`
        }])
        .select();
      if (error) throw error;
      onCustomerCreated(data[0]);
      setFormData(EMPTY_FORM);
      onClose();
    } catch (error) {
      console.error('Error creating customer:', error.message);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Loan amount: digits and single decimal point only
  const handleLoanChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
    setFormData(prev => ({ ...prev, loan_amount: clean }));
    if (errors.loan_amount) setErrors(prev => ({ ...prev, loan_amount: null }));
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null }));
  };

  const field = (name) =>
    `w-full bg-slate-50 dark:bg-slate-800 border rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 transition-all ${
      errors[name] ? 'border-red-300 focus:ring-red-200 dark:border-red-700' : 'border-transparent focus:ring-primary/20'
    }`;

  const ErrMsg = ({ name }) => errors[name]
    ? <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={11} />{errors[name]}</p>
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Account</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Convert a business or add a new customer record.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.submit && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={13} className="shrink-0" />{errors.submit}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Company/Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={12} className="text-primary" /> Company / Customer Name *
              </label>
              <input
                name="name" value={formData.name} onChange={handleChange}
                className={field('name')} placeholder="Acme Corp"
              />
              <ErrMsg name="name" />
            </div>

            {/* Account ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"># Account Reference ID</label>
              <input
                name="account_id" value={formData.account_id} onChange={handleChange}
                className={field('account_id')} placeholder="ACC-XXXX (auto-generated if empty)"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Mail size={12} className="text-primary" /> Business Email
              </label>
              <input
                name="email" value={formData.email} onChange={handleChange}
                className={field('email')} placeholder="contact@acme.com"
              />
              <ErrMsg name="email" />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} className="text-primary" /> Contact Phone
              </label>
              <input
                name="phone" value={formData.phone} onChange={handleChange}
                className={field('phone')} placeholder="+91 98765 43210"
                inputMode="tel"
              />
              <ErrMsg name="phone" />
            </div>

            {/* Address */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} className="text-primary" /> Registered Address
              </label>
              <input
                name="address" value={formData.address} onChange={handleChange}
                className={field('address')} placeholder="Industrial Area, Phase II"
              />
            </div>

            {/* Loan Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={12} className="text-primary" /> Primary Product
              </label>
              <select
                name="loan_type" value={formData.loan_type} onChange={handleChange}
                className={field('loan_type')}
              >
                <option>Business Expansion</option>
                <option>Working Capital</option>
                <option>Project Finance</option>                <option>Equipment Loan</option>
                <option>Commercial Property</option>
              </select>
            </div>

            {/* Loan Amount — numbers only, max ₹999 Cr */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <IndianRupee size={12} className="text-primary" /> Portfolio Value (₹)
              </label>
              <input
                inputMode="decimal"
                value={formData.loan_amount}
                onChange={handleLoanChange}
                className={field('loan_amount')}
                placeholder="e.g. 5000000  (₹50 L)"
              />
              {formData.loan_amount && !errors.loan_amount && (
                <p className="text-[11px] text-slate-400 mt-1">
                  {(() => {
                    const n = parseFloat(formData.loan_amount);
                    if (!n) return null;
                    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
                    if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
                    return `₹${n.toLocaleString('en-IN')}`;
                  })()}
                </p>
              )}
              <ErrMsg name="loan_amount" />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-3 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 py-3 px-6 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCustomerModal;
