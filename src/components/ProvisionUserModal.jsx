import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, Shield, Loader2, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, ROLES } from '../hooks/useAuth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const ProvisionUserModal = ({ isOpen, onClose, onUserProvisioned, onUserCreated, defaultRole }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, message }
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role_id: defaultRole || 'sa'
  });

  // Sync defaultRole if it changes while modal is open
  useEffect(() => {
    if (isOpen && defaultRole) {
      setFormData(f => ({ ...f, role_id: defaultRole }));
    }
  }, [isOpen, defaultRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Get the current user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session. Please log in again.');

      // Call the secure Edge Function — it uses service_role key server-side
      const response = await fetch(`${SUPABASE_URL}/functions/v1/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          role_id: formData.role_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invite.');
      }

      // Show success state
      setResult({ success: true, message: `Invitation sent to ${formData.email}. They'll receive an email to set their password.` });

      const userData = { email: formData.email, role_id: formData.role_id, first_name: formData.first_name, last_name: formData.last_name };
      if (onUserProvisioned) onUserProvisioned(userData);
      if (onUserCreated) onUserCreated(userData);

      // Reset form after 2s and close
      setTimeout(() => {
        setFormData({ first_name: '', last_name: '', email: '', role_id: defaultRole || 'sa' });
        setResult(null);
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Invite error:', error.message);
      setResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">Invite User</h2>
              <p className="text-xs text-slate-400 mt-0.5">They'll receive a set-password email</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Result State */}
        {result && (
          <div className={`mx-6 mt-5 flex items-start gap-3 p-4 rounded-xl border text-sm ${
            result.success
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-400'
          }`}>
            {result.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
            <p className="font-medium leading-snug">{result.message}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                required name="first_name" value={formData.first_name} onChange={handleChange}
                placeholder="John"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Last Name</label>
              <input
                name="last_name" value={formData.last_name} onChange={handleChange}
                placeholder="Doe"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              required type="email" name="email" value={formData.email} onChange={handleChange}
              placeholder="user@company.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Role / Access Level <span className="text-red-400">*</span>
            </label>
            <select
              name="role_id" value={formData.role_id} onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all cursor-pointer"
            >
              {Object.entries(ROLES).map(([id, role]) => (
                <option key={id} value={id}>{role.name}</option>
              ))}
            </select>
          </div>

          {/* Security Info */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
              <Shield size={12} className="text-primary" /> How this works
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              An invitation email will be sent. The user clicks the link to set their own password and log in. No manual password sharing needed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading || result?.success}
              className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProvisionUserModal;
