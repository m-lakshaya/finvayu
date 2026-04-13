import React, { useState } from 'react';
import { X, UserPlus, MapPin, Phone, Mail, Award, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const CreateCollaboratorModal = ({ isOpen, onClose, onPartnerCreated }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_first_name: '',
    contact_last_name: '',
    city: '',
    phone: '',
    email: '',
    tier: 'Silver'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const partnerId = `PAR-${Math.random().toString(36).substr(2, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      
      const { data, error } = await supabase
        .from('collaborators')
        .insert([{
          id: partnerId,
          org_id: profile.org_id,
          name: formData.name,
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          tier: formData.tier,
          owner_id: profile.id
        }])
        .select();

      if (error) throw error;
      
      alert('Collaborator Profile Created! Since email confirmation is disabled, you can now invite them as a user from the Supabase Dashboard to send their set-password link.');
      
      onPartnerCreated(data[0]);
      onClose();
    } catch (error) {
      console.error('Error registering partner:', error.message);
      alert('Failed to register partner: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-indigo-600">Register Channel Partner</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Onboard a new agency or individual collaborator.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Handshake size={12} className="text-indigo-500" /> Legal Name / Entity
            </label>
            <input 
              required name="name" value={formData.name} onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="E.g. Rajesh Enterprise"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* City */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} className="text-indigo-500" /> City
                </label>
                <input 
                required name="city" value={formData.city} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="E.g. Mumbai"
                />
            </div>
            {/* Tier */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Award size={12} className="text-indigo-500" /> Partner Tier
                </label>
                <select 
                name="tier" value={formData.tier} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option>Silver</option>
                    <option>Gold</option>
                    <option>Platinum</option>
                </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} className="text-indigo-500" /> First Name
              </label>
              <input 
                required name="contact_first_name" value={formData.contact_first_name} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="E.g. Rajesh"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} className="text-indigo-500" /> Last Name
              </label>
              <input 
                required name="contact_last_name" value={formData.contact_last_name} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="E.g. Kumar"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Phone size={12} className="text-indigo-500" /> Phone Number
            </label>
            <input 
              required name="phone" value={formData.phone} onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="+91 9XXXX XXXXX"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Mail size={12} className="text-indigo-500" /> Email Address
            </label>
            <input 
              required type="email" name="email" value={formData.email} onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="partner@example.com"
            />
          </div>

          <div className="flex items-center gap-4 mt-8 pt-4">
            <button 
              type="button" onClick={onClose}
              className="flex-1 py-3 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={loading}
              className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all hover:shadow-xl hover:shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCollaboratorModal;
import { Handshake } from 'lucide-react';
