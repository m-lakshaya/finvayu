import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail, Lock, ArrowRight, AlertCircle, ShieldCheck,
  TrendingUp, Users, IndianRupee, Zap, BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Static showcase metrics (login page is public — these are illustrative) ──
const METRICS = [
  {
    icon: IndianRupee,
    value: '₹24.6 Cr',
    label: 'Disbursed This Month',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    delay: '0s',
    position: 'top-[12%] right-[8%]',
  },
  {
    icon: Users,
    value: '1,240',
    label: 'Active Leads',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    delay: '0.8s',
    position: 'top-[38%] right-[14%]',
  },
  {
    icon: TrendingUp,
    value: '94%',
    label: 'Conversion Rate',
    color: 'text-primary',
    bg: 'bg-primary/10',
    delay: '1.4s',
    position: 'top-[62%] right-[6%]',
  },
  {
    icon: BarChart3,
    value: '12 Days',
    label: 'Avg. Closure Cycle',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    delay: '2s',
    position: 'top-[82%] right-[16%]',
  },
];

// ─── Floating metric card ──────────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, value, label, color, bg, delay, position }) => (
  <div
    className={`absolute ${position} animate-float backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3 min-w-[180px]`}
    style={{ animationDelay: delay, animationDuration: '4s' }}
  >
    <div className={`size-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon size={18} className={color} />
    </div>
    <div>
      <p className={`text-base font-black leading-none ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  </div>
);

// ─── Login Page ────────────────────────────────────────────────────────────────
const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950 overflow-hidden">

      {/* ── Left: Login Form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="size-11 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30">
              <Zap size={24} className="text-white" fill="white" />
            </div>
            <div className="leading-none">
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
                FINVAYU<span className="text-primary">.</span>
              </h1>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.35em] mt-0.5">
                Enterprise CRM
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1.5">
              Sign in to your workspace to manage your pipeline.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[10px] font-black text-primary hover:text-primary/70 transition-colors uppercase tracking-wide"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all outline-none"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full group flex items-center justify-center gap-2.5 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 active:scale-[0.98]"
            >
              {loading ? (
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Contact your administrator to get access.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Branded Visual Panel (desktop only) ───────────────────── */}
      <div className="hidden lg:flex w-[52%] relative bg-slate-950 overflow-hidden items-center justify-center">

        {/* Abstract grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-violet-600/20" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-950/80 to-transparent" />

        {/* Floating metric cards */}
        {METRICS.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}

        {/* Centre branding */}
        <div className="relative z-10 text-center px-12 max-w-md">
          <div className="inline-flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 mb-8 backdrop-blur-sm">
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Enterprise CRM</span>
          </div>

          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Close more loans,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">faster.</span>
          </h2>

          <p className="text-sm text-white/40 font-medium leading-relaxed">
            Manage your entire loan pipeline — from lead to disbursement — in one unified workspace.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['Pipeline Tracking', 'Partner Network', 'Commission Engine', 'Smart Reporting'].map(f => (
              <span key={f} className="text-[10px] font-bold text-white/50 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom powered-by strip */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2">
          <Zap size={12} className="text-primary" />
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Powered by Finvayu</p>
        </div>
      </div>

    </div>
  );
};

export default Login;
