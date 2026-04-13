import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="size-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 italic">FINVAYU<span className="text-primary">.</span></h1>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-400"></div>
          
          <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-200">Reset Password</h2>
          <p className="text-slate-500 text-sm mb-6">Enter your email and we'll send you a recovery link.</p>

          {success ? (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
              <div className="size-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Check your Email</h3>
              <p className="text-slate-500 text-sm mb-6">We've sent a password reset link to <span className="text-slate-900 dark:text-white font-bold">{email}</span>.</p>
              <Link to="/login" className="text-primary font-bold hover:underline flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block ml-1">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@finvayu.com" 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50 mt-4 active:scale-95"
              >
                {loading ? 'Sending link...' : 'Send Recovery Link'}
              </button>

              <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors mt-4">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
