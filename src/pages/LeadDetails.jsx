import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  History
} from 'lucide-react';

const DetailCard = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-primary shadow-sm">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  </div>
);

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data for a single lead
  const lead = {
    name: 'Michael Chen',
    status: 'Contacted',
    email: 'm.chen@example.com',
    phone: '+91 98765 43210',
    address: 'Silicon Hills, Bangalore, Karnataka',
    source: 'Website Form',
    executive: 'James Wilson',
    loanType: 'Business Expansion',
    loanAmount: '$450,000',
    created: 'Mar 12, 2024',
    activity: [
      { type: 'call', date: '2 hours ago', text: 'Follow-up call regarding document verification.' },
      { type: 'email', date: 'Yesterday', text: 'Application form sent to lead email.' },
      { type: 'status', date: 'Mar 12, 2024', text: 'Status updated from New to Contacted.' },
    ]
  };

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
              <h1 className="text-3xl font-extrabold tracking-tight">{lead.name}</h1>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-extrabold rounded-full border border-blue-100 dark:border-blue-800/50 uppercase tracking-tighter">
                {lead.status}
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm mt-1">Lead ID: #FNC-{id || '1284'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:shadow-sm transition-all">
            <Edit3 size={18} />
            Edit Profile
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
            <CheckCircle2 size={18} />
            Convert to Customer
          </button>
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
              <DetailCard icon={Mail} label="Email Address" value={lead.email} />
              <DetailCard icon={Phone} label="Primary Phone" value={lead.phone} />
              <DetailCard icon={MapPin} label="Location" value={lead.address} />
              <DetailCard icon={Calendar} label="Date Created" value={lead.created} />
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Loan Type</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{lead.loanType}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Expected Amount</p>
                <p className="font-extrabold text-primary text-xl">{lead.loanAmount}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Assigned Executive</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="size-6 bg-emerald-500 rounded-full"></div>
                  <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{lead.executive}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <History size={18} className="text-primary" />
              Recent Activity
            </h3>
            <div className="space-y-8 relative">
              <div className="absolute left-6 top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800"></div>
              {lead.activity.map((act, i) => (
                <div key={i} className="flex gap-6 relative z-10">
                  <div className={`size-12 rounded-xl flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm ${
                    act.type === 'call' ? 'bg-emerald-500 text-white' : 
                    act.type === 'email' ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'
                  }`}>
                    {act.type === 'call' ? <Phone size={20} /> : <MessageSquare size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">{act.type} Logged</p>
                      <span className="text-[10px] font-extrabold text-slate-400">{act.date}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{act.text}</p>
                  </div>
                </div>
              ))}
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
              <div className="text-4xl font-extrabold text-primary">88<span className="text-xs text-slate-400 ml-1">/100</span></div>
              <div className="size-12 rounded-full border-4 border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xs uppercase">High</div>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[88%] rounded-full shadow-[0_0_8px_rgba(19,127,236,0.4)]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;
