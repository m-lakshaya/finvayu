import React, { useState } from 'react';
import { X, Building2, Mail, Phone, MapPin, Briefcase, IndianRupee } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const CreateCustomerModal = ({ isOpen, onClose, onCustomerCreated }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    source: 'Direct',
    loan_type: 'Business Expansion',
    loan_amount: '',
    status: 'Active',
    account_id: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...formData,
          org_id: profile.org_id,
          owner_id: profile.id,
          loan_amount: formData.loan_amount ? parseFloat(formData.loan_amount) : 0,
          account_id: formData.account_id || `ACC-${Math.floor(Math.random() * 10000)}`
        }])
        .select();

      if (error) throw error;
      onCustomerCreated(data[0]);
      onClose();
    } catch (error) {
      console.error('Error creating customer:', error.message);
      alert('Failed to create customer: ' + error.message);
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Account</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Convert a business or add a new customer record.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company/Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={12} className="text-primary" /> Company / Customer Name
              </label>
              <input 
                required name="name" value={formData.name} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Acme Corp"
              />
            </div>

            {/* Account ID (Optional) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                # Account Referene ID
              </label>
              <input 
                name="account_id" value={formData.account_id} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="ACC-XXXX (Auto-generated if empty)"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Mail size={12} className="text-primary" /> Business Email
              </label>
              <input 
                type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="contact@acme.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} className="text-primary" /> Contact Phone
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
                <MapPin size={12} className="text-primary" /> Registered Address
              </label>
              <input 
                name="address" value={formData.address} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Industrial Area, Phase II"
              />
            </div>

            {/* Loan Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={12} className="text-primary" /> Primary Product
              </label>
              <select 
                name="loan_type" value={formData.loan_type} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option>Business Expansion</option>
                <option>Working Capital</option>
                <option>Project Finance</option>
                <option>Equipment Loan</option>
                <option>Commercial Property</option>
              </select>
            </div>

            {/* Loan Amount */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <IndianRupee size={12} className="text-primary" /> Portfolio Value
              </label>
              <input 
                type="number" name="loan_amount" value={formData.loan_amount} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="10000000"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-10">
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
