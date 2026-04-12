import React, { useState } from 'react';
import { X, Building2, User, Phone, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const CreateBankerModal = ({ isOpen, onClose, onBankerCreated }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    institution: 'HDFC Bank',
    branch: '',
    phone: '',
    products: '',
    status: 'Active'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bankers')
        .insert([{
          ...formData,
          org_id: profile.org_id
        }])
        .select();

      if (error) throw error;
      onBankerCreated(data[0]);
      onClose();
    } catch (error) {
      console.error('Error creating banker:', error.message);
      alert('Failed to add banker: ' + error.message);
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Banker</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Register a new point of contact from a financial institution.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Institution */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Building2 size={12} className="text-primary" /> Bank / Institution
            </label>
            <select 
              name="institution" value={formData.institution} onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>Axis Bank</option>
              <option>SBI</option>
              <option>Kotak Bank</option>
              <option>Others</option>
            </select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={12} className="text-primary" /> Contact Person Name
            </label>
            <input 
              required name="name" value={formData.name} onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="E.g. Amitabh Sharma"
            />
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={12} className="text-primary" /> Branch / Office
            </label>
            <input 
              name="branch" value={formData.branch} onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="E.g. Mumbai Corporate Office"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} className="text-primary" /> Phone
              </label>
              <input 
                required name="phone" value={formData.phone} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="+91 98765 XXXXX"
              />
            </div>

            {/* Products */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={12} className="text-primary" /> Dealing Products
              </label>
              <input 
                name="products" value={formData.products} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="E.g. Home, LAP, PL"
              />
            </div>
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
              className="flex-1 py-3 px-6 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Banker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBankerModal;
