import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Briefcase, IndianRupee, Handshake, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { getDisplayName } from '../utils/profileUtils';

// Hard cap at ₹999 Cr — prevents absurd test values reaching the DB
const MAX_LOAN = 9_990_000_000;

const EMPTY_FORM = {
  name: '', email: '', phone: '', address: '',
  source: 'Direct', loan_type: 'Personal Loan',
  loan_amount: '', status: 'New', referred_by: ''
};

const CreateLeadModal = ({ isOpen, onClose, onLeadCreated }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const roleId = profile?.roles?.name?.toLowerCase();
  const isPartner = roleId === 'banker' || roleId === 'collaborator';

  // Fetch partner profiles (bankers + collaborators) for internal users to attribute.
  // Runs two separate .eq() queries (same pattern as Bankers.jsx / Collaborators.jsx).
  // Falls back to querying WITHOUT org_id filter if the scoped query returns nothing,
  // in case the banker's org_id was not set during onboarding.
  useEffect(() => {
    if (!isOpen || isPartner) return;
    setPartnersLoading(true);
    const sel = 'id, full_name, first_name, last_name, name, email, role_id, roles(name)';

    const runQuery = async () => {
      // Primary: scoped to org
      const [b, c] = await Promise.all([
        supabase.from('profiles').select(sel).eq('org_id', profile?.org_id).eq('role_id', 'banker'),
        supabase.from('profiles').select(sel).eq('org_id', profile?.org_id).eq('role_id', 'collaborator'),
      ]);

      let all = [...(b.data || []), ...(c.data || [])];

      // Fallback: if org-scoped query empty, fetch without org filter
      // (handles cases where banker profile has null/mismatched org_id)
      if (all.length === 0) {
        const [b2, c2] = await Promise.all([
          supabase.from('profiles').select(sel).eq('role_id', 'banker'),
          supabase.from('profiles').select(sel).eq('role_id', 'collaborator'),
        ]);
        all = [...(b2.data || []), ...(c2.data || [])];
        if (all.length > 0) {
          console.warn(
            '[CreateLeadModal] Partners found WITHOUT org_id filter — banker/collaborator profiles may have null org_id.',
            all.map(p => ({ id: p.id, name: p.full_name || p.name, org_id: p.org_id, role_id: p.role_id }))
          );
        }
        if (b2.error) console.error('Bankers fallback error:', b2.error.message);
        if (c2.error) console.error('Collaborators fallback error:', c2.error.message);
      }

      all.sort((a, b) => {
        const nameA = (a.full_name || a.first_name || a.name || '').toLowerCase();
        const nameB = (b.full_name || b.first_name || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

    };

    runQuery();
  }, [isOpen, isPartner]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Full name is required.';
    if (!formData.phone.trim()) {
      e.phone = 'Phone number is required.';
    } else {
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
      // For banker/collaborator: always auto-attribute to themselves
      const referredBy = isPartner ? profile.id : (formData.referred_by || null);

      const { data, error } = await supabase
        .from('leads')
        .insert([{
          ...formData,
          org_id:      profile.org_id,
          owner_id:    profile.id,
          loan_amount: formData.loan_amount !== '' ? parseFloat(formData.loan_amount) : 0,
          referred_by: referredBy,
        }])
        .select();

      if (error) throw error;
      onLeadCreated(data[0]);
      setFormData(EMPTY_FORM);
      onClose();
    } catch (error) {
      console.error('Error creating lead:', error.message);
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
      errors[name]
        ? 'border-red-300 focus:ring-red-200 dark:border-red-700'
        : 'border-transparent focus:ring-primary/20'
    }`;

  const ErrMsg = ({ name }) => errors[name]
    ? <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={11} />{errors[name]}</p>
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Lead</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {isPartner
                ? `This lead will be attributed to your partner profile (${roleId}).`
                : 'Fill in the details to add a new potential customer.'}
            </p>
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
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} className="text-primary" /> Full Name *
              </label>
              <input
                name="name" value={formData.name} onChange={handleChange}
                className={field('name')} placeholder="John Doe"
              />
              <ErrMsg name="name" />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Mail size={12} className="text-primary" /> Email Address
              </label>
              <input
                name="email" value={formData.email} onChange={handleChange}
                className={field('email')} placeholder="john@example.com"
              />
              <ErrMsg name="email" />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} className="text-primary" /> Phone Number *
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
                <MapPin size={12} className="text-primary" /> Office / Home Address
              </label>
              <input
                name="address" value={formData.address} onChange={handleChange}
                className={field('address')} placeholder="123 Silicon Hills, Bangalore"
              />
            </div>

            {/* Loan Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={12} className="text-primary" /> Loan Category
              </label>
              <select
                name="loan_type" value={formData.loan_type} onChange={handleChange}
                className={field('loan_type')}
              >
                <option>Personal Loan</option>
                <option>Business Loan</option>
                <option>Home Loan</option>
                <option>Education Loan</option>
                <option>Property Loan</option>
              </select>
            </div>

            {/* Loan Amount — numbers only, max ₹999 Cr */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <IndianRupee size={12} className="text-primary" /> Expected Amount (₹)
              </label>
              <input
                inputMode="decimal"
                value={formData.loan_amount}
                onChange={handleLoanChange}
                className={field('loan_amount')}
                placeholder="e.g. 500000  (₹5 L)"
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

            {/* Referred By — only shown to internal users (not partners) */}
            {!isPartner && (
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Handshake size={12} className="text-indigo-500" /> Referred By Partner
                  <span className="text-slate-300 font-normal normal-case tracking-normal text-[10px]">(optional)</span>
                </label>
                <select
                  name="referred_by"
                  value={formData.referred_by}
                  onChange={handleChange}
                  disabled={partnersLoading}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all disabled:opacity-60"
                >
                  <option value="">
                    {partnersLoading ? 'Loading partners…' : '— No referral / Direct —'}
                  </option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {getDisplayName(p)} · {p.roles?.name || p.role_id || 'Partner'}
                      {p.email ? ` (${p.email})` : ''}
                    </option>
                  ))}
                </select>
                {!partnersLoading && partners.length === 0 && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    No bankers or collaborators found. Add them first via{' '}
                    <span className="font-semibold text-primary">Team → Bankers / Collaborators</span>.
                  </p>
                )}
                {!partnersLoading && partners.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1">{partners.length} partner{partners.length > 1 ? 's' : ''} available</p>
                )}
              </div>
            )}

            {/* For partners: show attribution badge */}
            {isPartner && (
              <div className="md:col-span-2 flex items-center gap-2.5 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <Handshake size={16} className="text-indigo-500 flex-shrink-0" />
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  This lead will be automatically attributed to your partner profile. You'll be able to raise a commission invoice once it's closed.
                </p>
              </div>
            )}
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
              {loading ? 'Creating…' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeadModal;
