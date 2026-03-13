import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  PieChart, 
  Download,
  Calendar,
  Filter,
  ArrowUpRight,
  UserPlus,
  Rocket
} from 'lucide-react';

const Reports = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight italic">Performance Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Deep dive into conversion rates, sales velocity, and executive performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:shadow-sm transition-all text-slate-600 dark:text-slate-300">
            <Calendar size={18} />
            Quarterly View
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
            <Download size={18} />
            Generate PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Simulation */}
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Growth trajectory</p>
              <h3 className="text-2xl font-black mt-1 tracking-tight">Revenue Pipeline</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-primary"></span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Projected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Actual</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full flex items-end justify-between gap-4 px-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            {[45, 62, 58, 84, 76, 92, 100].map((h, i) => (
              <div key={i} className="flex-1 group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{h}L
                </div>
                <div className="w-full bg-emerald-500/10 rounded-t-xl group-hover:bg-emerald-500/20 transition-all overflow-hidden flex flex-col justify-end" style={{ height: `${h}%` }}>
                  <div className="w-full bg-emerald-500 rounded-t-xl transition-all" style={{ height: '40%' }}></div>
                </div>
                <div className="mt-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Executive Leaderboard */}
        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Top Performer</h3>
          <div className="flex flex-col items-center text-center">
            <div className="size-24 rounded-full border-4 border-primary p-1 mb-4 shadow-xl shadow-primary/20 relative">
              <div className="size-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAwJ6UDSndiFu2exQ8mbZWaeIQM4P1zBlDq9rv-m-V_sCETdWxZLuXHUPnxEC50iY4H1Tce9nGf1UhxjOO47fwYOUQT_e9pkMW5Qvw-mnHGYN4pV2DpWQZBfrROJHra2evMyF2D7jnKUnwSHHCAn0RKFNb9uzeu0oKa6yMFfTeiR0_JzKEr6asbzCL09ujE96gUMUXKJW39YvcjNTbQk5KU-ZGwwOCZONVTBeqysJaWNS0ShhlXR9uox3dpr1B1jKg1zMBQ55VnOO4')" }}></div>
              <div className="absolute -bottom-2 -right-2 size-8 bg-amber-400 text-white rounded-full flex items-center justify-center font-black shadow-lg">1</div>
            </div>
            <h4 className="text-xl font-black">Rajesh Khanna</h4>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1 italic">Senior Executive</p>
            <div className="grid grid-cols-2 gap-4 w-full mt-8">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tighter">Conversion</p>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100">82%</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tighter">Closure</p>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100">14 Files</p>
              </div>
            </div>
          </div>
          <button className="w-full mt-10 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all">View All Teams</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Conversion Rate', value: '24.8%', change: '+5.2%', up: true, icon: Activity },
          { label: 'Avg Closure Time', value: '12 Days', change: '-2 Days', up: true, icon: Rocket },
          { label: 'Partner Growth', value: '32', change: '+12%', up: true, icon: UserPlus },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-primary/50 transition-all flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h4 className="text-xl font-black">{stat.value}</h4>
              </div>
            </div>
            <div className={`text-[10px] font-black uppercase ${stat.up ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
import { Users2 } from 'lucide-react';
