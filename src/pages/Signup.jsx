import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, AlertCircle, ShieldCheck, Building2, CheckCircle2 } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call the register-org Edge Function which atomically creates the
      // organization and the founding user (SYSTEM_ADMIN / CEO)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/register-org`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          org_name: orgName.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed. Please try again.');
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md py-10">
        <div className="text-center mb-10">
          <div className="size-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">FINVAYU<span className="text-primary">.</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Enterprise CRM Suite</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-primary"></div>
          
          <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200">Create Your Organization</h2>

          {success ? (
            <div className="py-8 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in duration-300">
              <div className="size-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Account Created!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Please check your email to verify your account. Redirecting to login…
              </p>
            </div>
          ) : (
          <>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-in fade-in zoom-in duration-200">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Company Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block ml-1">Company / Organization Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Finvayu Credits Pvt Ltd"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block ml-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Sarah" 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block ml-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Jenkins" 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

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

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters" 
                  required
                  minLength={6}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50 mt-4 active:scale-95"
            >
              {loading ? 'Processing...' : (
                <>
                  <UserPlus size={20} />
                  Register Account
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-slate-500 font-medium">
            Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Login here</Link>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
