import React, { useState } from 'react';
import { X, UserPlus, Mail, Shield, Loader2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, ROLES } from '../hooks/useAuth';

const ProvisionUserModal = ({ isOpen, onClose, onUserProvisioned }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role_id: 'sa'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Pre-provision a profile with a placeholder ID (or no ID if we allow it)
      // Since 'id' is a primary key, we'll use a temporary random UUID
      // and update it later during signup.
      const tempId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: tempId,
          org_id: profile.org_id,
          name: formData.name,
          email: formData.email.toLowerCase(),
          role_id: formData.role_id,
          profile_type: 'STANDARD_USER' // Default profile type
        }])
        .select();

      if (error) throw error;
      
      alert('Invitation Prepared! Since public signup is disabled, please use the Supabase Dashboard to send the invitation email, or deploy the Edge Function provided in the instructions.');
      if (onUserProvisioned) onUserProvisioned(data[0]);
      onClose();
    } catch (error) {
      console.error('Error provisioning user:', error.message);
      alert('Failed to provision user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="text-primary" size={24} />
              Secure User Invitation
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Provision a profile and prepare an invitation.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={12} className="text-primary" /> Full Name
            </label>
            <input 
              required name="name" value={formData.name} onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="E.g. John Doe"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Mail size={12} className="text-primary" /> Email Address
            </label>
            <input 
              required type="email" name="email" value={formData.email} onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Shield size={12} className="text-primary" /> Security Role
            </label>
            <select 
              name="role_id" value={formData.role_id} onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
            >
              {Object.entries(ROLES).map(([id, role]) => (
                <option key={id} value={id}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl">
             <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Security Note</p>
             <p className="text-[10px] leading-relaxed text-amber-600/80 dark:text-amber-400/60">
               Once invited, the user will receive a system email to verify their identity and set their password. No public signup required.
             </p>
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
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Invite User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProvisionUserModal;
