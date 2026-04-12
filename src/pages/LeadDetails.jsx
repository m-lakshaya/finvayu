import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3, 
  MoreHorizontal,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  History,
  Share2,
  Shield,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import PermissionGate from '../components/PermissionGate';
import { IndianRupee, Percent, FileCheck } from 'lucide-react';

const DetailCard = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-primary shadow-sm">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{value || 'N/A'}</p>
    </div>
  </div>
);

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  
  const isCustomerRecord = location.pathname.includes('customers');
  const recordType = isCustomerRecord ? 'Customer' : 'Lead';
  const table = isCustomerRecord ? 'customers' : 'leads';

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const { hasPermission } = useAuth();
  const canSetCommission = hasPermission('SET_COMMISSION');
  const canRaiseInvoice = hasPermission('RAISE_INVOICE');
  const canProcessPayment = hasPermission('PROCESS_PAYMENT');

  useEffect(() => {
    const fetchRecord = async () => {
      if (!profile?.org_id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setRecord(data);
      } catch (error) {
        console.error('Error fetching record:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id, table, profile?.org_id]);

  const handleUpdateRecord = async (updates) => {
    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setRecord(data);
    } catch (error) {
      console.error('Error updating record:', error.message);
      alert('Failed to update: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRaiseInvoice = () => {
    if (record.status !== 'Approved' && record.status !== 'Loan Approved') {
      alert('Invoice can only be raised for Approved loans.');
      return;
    }
    handleUpdateRecord({ invoice_status: 'raised' });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-slate-500 font-medium tracking-tight">Accessing secure record...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="size-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-6 font-bold">
          <Shield size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Access Denied or Not Found</h2>
        <p className="text-slate-500 max-w-md">The record you are looking for does not exist or you do not have permission to view it within your organization.</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-8 px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Back Button & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">{record.name}</h1>
              <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full border uppercase tracking-tighter ${
                isCustomerRecord 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50'
                  : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50'
              }`}>
                {isCustomerRecord ? 'Active Account' : record.status}
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm mt-1">{recordType} ID: #{record.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:shadow-sm transition-all text-slate-700 dark:text-slate-200"
          >
            <Share2 size={18} />
            Share
          </button>
          {canRaiseInvoice && (record.status === 'Approved' || record.status === 'Loan Approved') && record.invoice_status === 'pending' && (
            <button 
              onClick={handleRaiseInvoice}
              disabled={updating}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <FileCheck size={18} />
              {updating ? 'Processing...' : 'Raise Invoice'}
            </button>
          )}
          {canProcessPayment && record.invoice_status === 'raised' && (
            <button 
              onClick={() => handleUpdateRecord({ invoice_status: 'paid' })}
              disabled={updating}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <CheckCircle2 size={18} />
              {updating ? 'Processing...' : 'Mark as Paid'}
            </button>
          )}
          {!isCustomerRecord && !canRaiseInvoice && (
            <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
              <CheckCircle2 size={18} />
              Convert to Customer
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Essential Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary/40"></div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              Information Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailCard icon={Mail} label="Email Address" value={record.email} />
              <DetailCard icon={Phone} label="Primary Phone" value={record.phone} />
              <DetailCard icon={MapPin} label="Location" value={record.address} />
              <DetailCard icon={Calendar} label="Date Created" value={new Date(record.created_at).toLocaleDateString()} />
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Loan Type</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{record.loan_type}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Expected Amount</p>
                <p className="font-extrabold text-primary text-xl">₹{record.loan_amount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Invoice Status</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  record.invoice_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                  record.invoice_status === 'raised' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {record.invoice_status || 'pending'}
                </span>
              </div>
            </div>

            {/* Commission Management - CEO ONLY or View Only for Others */}
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <IndianRupee size={18} className="text-primary" />
                Commission Details
              </h3>
              {canSetCommission ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Commission Rate (%)</p>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="number" 
                        value={record.commission_rate || ''}
                        onChange={(e) => handleUpdateRecord({ commission_rate: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Commission Amount</p>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="number" 
                        value={record.commission_amount || ''}
                        onChange={(e) => handleUpdateRecord({ commission_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Your Rate</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{record.commission_rate || 0}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Your Earnings</p>
                    <p className="font-extrabold text-emerald-600 text-lg">₹{record.commission_amount?.toLocaleString() || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline - Placeholder for real activity logs */}
          <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <History size={18} className="text-primary" />
              Recent Activity
            </h3>
            <div className="space-y-8 relative">
              <div className="absolute left-6 top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex gap-6 relative z-10">
                <div className="size-12 rounded-xl flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm bg-emerald-500 text-white">
                  <Clock size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">Record Created</p>
                    <span className="text-[10px] font-extrabold text-slate-400">System</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">This record was initialized in the {record.source} system.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="space-y-8">
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-6">Quick Actions</h4>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all">
                <Phone size={18} /> Call Lead
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all">
                <Mail size={18} /> Send Email
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                <MessageSquare size={18} /> Log Note
              </button>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">Lead Score</h4>
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl font-extrabold text-primary">{record.score || 0}<span className="text-xs text-slate-400 ml-1">/100</span></div>
              <div className="size-12 rounded-full border-4 border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xs uppercase">
                {(record.score || 0) > 80 ? 'High' : (record.score || 0) > 40 ? 'Med' : 'Low'}
              </div>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full shadow-[0_0_8px_rgba(19,127,236,0.4)]" style={{ width: `${record.score || 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ShareModal Placeholder */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm px-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4">Share Lead</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Live sharing across organizations is restricted. You can share with team members in your organization settings.</p>
            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetails;
