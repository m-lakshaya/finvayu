import React, { useState, useEffect } from 'react';
import { X, DollarSign, User, Building2, Layers, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const CreateLoanAppModal = ({ isOpen, onClose, onAppCreated }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [leads, setLeads] = useState([]);
  const [bankers, setBankers] = useState([]);
  
  const [formData, setFormData] = useState({
    lead_id: '',
    amount: '',
    bank_id: '',
    stage: 'In Discussion'
  });

  useEffect(() => {
    if (isOpen && profile?.org_id) {
      fetchRequiredData();
    }
  }, [isOpen, profile?.org_id]);

  const fetchRequiredData = async () => {
    setFetchingData(true);
    try {
      const [leadsRes, bankersRes] = await Promise.all([
        supabase.from('leads').select('id, name').eq('org_id', profile.org_id).order('name'),
        supabase.from('bankers').select('id, name, institution').eq('org_id', profile.org_id).order('name')
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (bankersRes.error) throw bankersRes.error;

      setLeads(leadsRes.data || []);
      setBankers(bankersRes.data || []);
    } catch (error) {
      console.error('Error fetching modal data:', error.message);
    } finally {
      setFetchingData(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lead_id) {
        alert('Please select a lead');
        return;
    }
    setLoading(true);
    try {
      // Generate a unique TEXT ID (e.g., APP-XXXX) or just use UUID string
      const appId = `APP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('loan_applications')
        .insert([{
          id: appId,
          org_id: profile.org_id,
          lead_id: formData.lead_id,
          bank_id: formData.bank_id || null,
          amount: parseFloat(formData.amount),
          stage: formData.stage
        }])
        .select(`
          *,
          lead:lead_id (name),
          bank:bank_id (name, institution)
        `);

      if (error) throw error;
      onAppCreated(data[0]);
      onClose();
    } catch (error) {
      console.error('Error creating application:', error.message);
      alert('Failed to create application: ' + error.message);
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Loan Application</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Initiate a new loan process for an existing lead.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {fetchingData ? (
          <div className="p-20 text-center">
            <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Leads & Bankers...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Lead Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} className="text-primary" /> Select Lead
              </label>
              <select 
                required name="lead_id" value={formData.lead_id} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select a lead...</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>{lead.name}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <DollarSign size={12} className="text-primary" /> Loan Amount (₹)
              </label>
              <input 
                required type="number" name="amount" value={formData.amount} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="E.g. 500000"
              />
            </div>

            {/* Banker/Bank */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={12} className="text-primary" /> Assign Banker (Optional)
              </label>
              <select 
                name="bank_id" value={formData.bank_id} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">No banker assigned</option>
                {bankers.map(banker => (
                  <option key={banker.id} value={banker.id}>{banker.name} ({banker.institution})</option>
                ))}
              </select>
            </div>

            {/* Stage */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers size={12} className="text-primary" /> Initial Stage
              </label>
              <select 
                name="stage" value={formData.stage} onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option>In Discussion</option>
                <option>Login Done</option>
                <option>Sanctioned</option>
                <option>Request Disburse</option>
                <option>Completed</option>
              </select>
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
                {loading ? 'Creating...' : 'Create Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateLoanAppModal;
