import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Briefcase, IndianRupee, Handshake } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { getDisplayName } from '../utils/profileUtils';

const CreateLeadModal = ({ isOpen, onClose, onLeadCreated }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState([]);

  const roleId = profile?.roles?.name?.toLowerCase();
  const isPartner = roleId === 'banker' || roleId === 'collaborator';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    source: 'Direct',
    loan_type: 'Personal Loan',
    loan_amount: '',
    status: 'New',
    referred_by: ''
  });

  // Fetch partner profiles (bankers + collaborators) for internal users to attribute
  useEffect(() => {
    if (!isOpen || !profile?.org_id || isPartner) return;
    supabase
      .from('profiles')
      .select('id, full_name, first_name, last_name, name, email, roles(name)')
      .eq('org_id', profile.org_id)
      .in('role_id', ['banker', 'collaborator'])
      .order('full_name')
      .then(({ data }) => setPartners(data || []));
  }, [isOpen, profile?.org_id, isPartner]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // For banker/collaborator: always auto-attribute to themselves
      const referredBy = isPartner
        ? profile.id
        : (formData.referred_by || null);

      const { data, error } = await supabase
        .from('leads')
        .insert([{
          ...formData,
          org_id:      profile.org_id,
          owner_id:    profile.id,
          loan_amount: formData.loan_amount ? parseFloat(formData.loan_amount) : 0,
          referred_by: referredBy,
        }])
        .select();

      if (error) throw error;
      onLeadCreated(data[0]);
      onClose();
      // Reset form
      setFormData({ name: '', email: '', phone: '', address: '', source: 'Direct', loan_type: 'Personal Loan', loan_amount: '', status: 'New', referred_by: '' });
    } catch (error) {
      console.error('Error creating lead:', error.message);
      alert('Failed to create lead: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} className="text-primary" /> Full Name
              </label>
              <input
                required name="name" value={formData.name} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Mail size={12} className="text-primary" /> Email Address
              </label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="john@example.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} className="text-primary" /> Phone Number
              </label>
              <input
                required name="phone" value={formData.phone} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="+91 98765 43210"
              />
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} className="text-primary" /> Office/Home Address
              </label>
              <input
                name="address" value={formData.address} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="123 Silicon Hills, Bangalore"
              />
            </div>

            {/* Loan Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={12} className="text-primary" /> Loan Category
              </label>
              <select
                name="loan_type" value={formData.loan_type} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option>Personal Loan</option>
                <option>Business Loan</option>
                <option>Home Loan</option>
                <option>Education Loan</option>
                <option>Property Loan</option>
              </select>
            </div>

            {/* Loan Amount */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <IndianRupee size={12} className="text-primary" /> Expected Amount
              </label>
              <input
                type="number" name="loan_amount" value={formData.loan_amount} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="500000"
              />
            </div>

            {/* Referred By — only shown to internal users (not partners) */}
            {!isPartner && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Handshake size={12} className="text-indigo-500" /> Referred By Partner
                  <span className="text-slate-300 font-normal normal-case tracking-normal text-[10px]">(optional)</span>
                </label>
                <select
                  name="referred_by"
                  value={formData.referred_by}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="">— No referral / Direct —</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {getDisplayName(p)} · {p.roles?.name || 'Partner'}
                      {p.email ? ` (${p.email})` : ''}
                    </option>
                  ))}
                </select>
                {partners.length === 0 && (
                  <p className="text-[10px] text-slate-400">No bankers or collaborators onboarded yet.</p>
                )}
              </div>
            )}

            {/* For partners: show a badge that this lead will be attributed to them */}
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
