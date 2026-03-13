import React from 'react';
import { 
  UserPlus, 
  Calendar, 
  Timer, 
  Activity, 
  ArrowUpRight,
  Globe,
  CircleDollarSign,
  Trophy,
  PhoneCall,
  ChevronRight
} from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, color = "primary", urgent = false }) => (
  <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className={`p-3 bg-${color}/10 text-${color} rounded-xl group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      {urgent ? (
        <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full border border-orange-100 dark:border-orange-800/30">URGENT</span>
      ) : (
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/30">{change}</span>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-extrabold mt-1 tracking-tight">{value}</h3>
    </div>
    <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${color}/5 rounded-full blur-2xl group-hover:bg-${color}/10 transition-colors`}></div>
  </div>
);

const SourceBar = ({ label, percentage, color = "primary" }) => (
  <div className="flex items-center gap-4">
    <span className="text-[10px] font-bold uppercase text-slate-400 w-16 tracking-wider">{label}</span>
    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={`bg-${color} h-full rounded-full transition-all duration-1000 ease-out`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
    <span className="text-xs font-bold w-10 text-right">{percentage}%</span>
  </div>
);

const Dashboard = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Financial Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase text-xs tracking-[0.2em]">Finvayu Credits • Branch Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:shadow-sm transition-all">
            <Calendar size={16} />
            Mar 12, 2024
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
            <ArrowUpRight size={16} />
            View Reports
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Leads" value="1,284" change="+12.5%" icon={UserPlus} />
        <StatCard title="New Leads Today" value="24" change="+5.2%" icon={Timer} />
        <StatCard title="Follow-ups Pending" value="18" urgent icon={Activity} color="orange-500" />
        <StatCard title="Apps in Progress" value="42" change="Active" icon={ArrowUpRight} color="blue-500" />
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Leads by Source */}
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Leads by Source</h4>
            <Globe className="text-slate-300" size={20} />
          </div>
          <div className="space-y-6">
            <SourceBar label="Direct" percentage={45} />
            <SourceBar label="Referral" percentage={30} />
            <SourceBar label="Website" percentage={15} />
            <SourceBar label="Social" percentage={10} />
          </div>
        </div>

        {/* Status Funnel */}
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Conversion Funnel</h4>
            <Activity className="text-slate-300" size={20} />
          </div>
          <div className="flex flex-col gap-2 relative">
            <div className="bg-primary h-12 w-full rounded-xl flex items-center justify-between px-6 text-white text-xs font-bold shadow-sm">
              <span>New Leads</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">500</span>
            </div>
            <div className="bg-primary/80 h-10 w-[85%] mx-auto rounded-xl flex items-center justify-between px-6 text-white text-xs font-bold shadow-sm">
              <span>Contacted</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">320</span>
            </div>
            <div className="bg-primary/60 h-10 w-[70%] mx-auto rounded-xl flex items-center justify-between px-6 text-white text-[10px] font-bold shadow-sm">
              <span>Qualified</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full">180</span>
            </div>
            <div className="bg-emerald-500 h-10 w-[55%] mx-auto rounded-xl flex items-center justify-between px-6 text-white text-[10px] font-bold shadow-sm animate-pulse">
              <span>Closed</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full">42</span>
            </div>
          </div>
        </div>

        {/* Conversion Stats */}
        <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Conversion Rate</h4>
            <CircleDollarSign className="text-emerald-500 animate-float" size={24} />
          </div>
          <div className="flex items-baseline gap-2 mb-8">
            <h3 className="text-5xl font-extrabold text-primary tracking-tighter">8.4%</h3>
            <span className="text-emerald-500 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full tracking-wide">↑ 1.2%</span>
          </div>
          <div className="h-32 flex items-end justify-between gap-2 relative z-10 px-2">
            {[40, 60, 30, 80, 50, 100].map((h, i) => (
              <div 
                key={i} 
                className={`w-full ${i === 5 ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'} rounded-t-lg transition-all duration-700 ease-out cursor-pointer hover:scale-x-110`}
                style={{ height: `${h}%` }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[9px] font-extrabold text-slate-400 tracking-widest px-1">
            <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
          </div>
        </div>
      </div>

      {/* Row: Recent Activities & Executive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Executive */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 group hover:translate-x-1 transition-all">
          <div className="relative">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDar2FKSaoQwyuf2BJT1q3f5FFT4IKoT8bbA-nB-XLkNrVv39p82gUBFb6Gyhc375LNjhG7j1k6yvDpuEea0H0mk9vTcHub9-f_R4JXF2xOtgMKd7q_eOrraXufrWX_tgFxICfpHTGDzyREhbD_OMWIEt1NNsld4V7ZQpo2RyrLazp32HRnuANzr7IhNzNxlsEC-boIn7ltKIEUpCOj7UzbtafaEgA851JSLB_24HYxHxwojb9KW_Lba-XF5sLIUUP7E424KW-__8Q" 
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-primary/10 transition-all group-hover:ring-primary/20"
              alt="David Miller"
            />
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white rounded-lg p-1.5 border-2 border-white dark:border-slate-900 shadow-sm">
              <Trophy size={12} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Top Sales Executive</p>
            <h5 className="font-bold text-lg">David Miller</h5>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-primary text-sm font-extrabold">$1.2M Disbursed</span>
              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/30">STAR</span>
            </div>
          </div>
        </div>

        {/* Global Performance */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 group">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <Globe size={32} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Global Reach</p>
            <h5 className="font-bold text-lg">Direct Marketing</h5>
            <p className="text-emerald-500 text-sm font-extrabold">28% Conversion Rate</p>
          </div>
        </div>

        {/* Total Volume */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 group">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <CircleDollarSign size={32} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Disbursed Volume</p>
            <h5 className="font-bold text-lg">$4.82M Monthly</h5>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-500 text-sm font-semibold">Goal: $5.0M</span>
              <span className="text-blue-500 font-extrabold text-sm">96%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-8">
        {/* Recent Leads Table */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold tracking-widest uppercase text-slate-900 dark:text-slate-100">Recent Leads</h4>
              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Latest 3 entries</p>
            </div>
            <button className="flex items-center gap-1 text-primary text-[10px] font-extrabold uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
                <tr>
                  <th className="px-8 py-4">Lead Name</th>
                  <th className="px-8 py-4">Source</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { name: 'Michael Chen', source: 'Web Form', status: 'New', score: '88', sColor: 'emerald' },
                  { name: 'Elena Rodriguez', source: 'Referral', status: 'Contacted', score: '92', sColor: 'blue' },
                  { name: 'James Wilson', source: 'Direct', status: 'Waiting', score: '75', sColor: 'orange' }
                ].map((lead, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group/row">
                    <td className="px-8 py-5 font-bold group-hover/row:text-primary transition-colors">{lead.name}</td>
                    <td className="px-8 py-5 text-slate-500 font-medium">{lead.source}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 bg-${lead.sColor}-100 dark:bg-${lead.sColor}-900/30 text-${lead.sColor}-600 dark:text-${lead.sColor}-400 text-[10px] font-extrabold rounded-full border border-${lead.sColor}-200 dark:border-${lead.sColor}-800/50 uppercase tracking-tighter`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center font-extrabold text-primary">{lead.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Follow-ups */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold tracking-widest uppercase text-slate-900 dark:text-slate-100">Upcoming Follow-ups</h4>
              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Today's Agenda</p>
            </div>
            <button className="flex items-center gap-1 text-primary text-[10px] font-extrabold uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
              Full Schedule <ChevronRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-[0.1em]">
                <tr>
                  <th className="px-8 py-4">Client</th>
                  <th className="px-8 py-4">Time</th>
                  <th className="px-8 py-4">Purpose</th>
                  <th className="px-8 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { name: 'Robert Taylor', time: '2:30 PM', goal: 'Doc Review' },
                  { name: 'Linda Parker', time: '4:00 PM', goal: 'Loan Terms' },
                  { name: 'Kevin Adams', time: 'Tomorrow', goal: 'Intro Call' }
                ].map((task, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer">
                    <td className="px-8 py-5 font-bold">{task.name}</td>
                    <td className="px-8 py-5 text-slate-500 font-bold text-xs">{task.time}</td>
                    <td className="px-8 py-5 text-slate-500 font-medium">{task.goal}</td>
                    <td className="px-8 py-5 text-center">
                      <button className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm">
                        <PhoneCall size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
