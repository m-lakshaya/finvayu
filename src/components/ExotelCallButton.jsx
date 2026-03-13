import React, { useState } from 'react';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';

/**
 * ExotelCallButton
 * Triggers an outbound call via Exotel's Click-to-Call API.
 *
 * Props:
 *   - phone: string  — destination number (e.g., "+919876543210")
 *   - label: string  — optional display label
 *   - leadId: string — CRM lead/account ID to tag the call
 *   - agentPhone: string — agent's virtual number (from env)
 *
 * In production:
 *   Replace the simulated fetch with a real call to your backend:
 *   POST /api/calls/initiate  → body: { from, to, callerId, customField }
 *   Your backend then calls Exotel's API using your SID + token.
 */
const ExotelCallButton = ({
  phone,
  label,
  leadId = '',
  compact = false,
}) => {
  const [status, setStatus] = useState('idle'); // idle | calling | active | ended | error

  const handleCall = async () => {
    if (!phone) return;
    setStatus('calling');

    try {
      /**
       * PRODUCTION: Replace with real backend call
       * const res = await fetch('/api/calls/initiate', {
       *   method: 'POST',
       *   headers: { 'Content-Type': 'application/json' },
       *   body: JSON.stringify({ to: phone, customField: leadId }),
       * });
       */

      // --- SIMULATION (remove in production) ---
      await new Promise(r => setTimeout(r, 1800));
      setStatus('active');
      await new Promise(r => setTimeout(r, 3000));
      setStatus('ended');
      setTimeout(() => setStatus('idle'), 2000);
      // -----------------------------------------
    } catch (err) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const endCall = () => {
    setStatus('ended');
    setTimeout(() => setStatus('idle'), 1500);
  };

  if (compact) {
    // Icon-only button for table rows
    return (
      <button
        onClick={status === 'active' ? endCall : handleCall}
        disabled={status === 'calling' || status === 'ended'}
        title={`Call ${phone}`}
        className={`p-2 rounded-xl transition-all disabled:opacity-50 ${
          status === 'active'
            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
            : status === 'calling'
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
            : status === 'ended'
            ? 'bg-slate-100 text-slate-400'
            : 'bg-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/30'
        }`}
      >
        {status === 'calling' ? (
          <Loader2 size={16} className="animate-spin" />
        ) : status === 'active' ? (
          <PhoneOff size={16} />
        ) : (
          <Phone size={16} />
        )}
      </button>
    );
  }

  // Full button with label
  return (
    <button
      onClick={status === 'active' ? endCall : handleCall}
      disabled={status === 'calling' || status === 'ended'}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
        status === 'active'
          ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20'
          : status === 'calling'
          ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700'
          : status === 'ended'
          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          : 'bg-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20'
      }`}
    >
      {status === 'calling' ? (
        <><Loader2 size={16} className="animate-spin" /> Connecting...</>
      ) : status === 'active' ? (
        <><PhoneOff size={16} /> End Call</>
      ) : status === 'ended' ? (
        <><Phone size={16} /> Call Ended</>
      ) : (
        <><Phone size={16} /> {label || `Call ${phone}`}</>
      )}
    </button>
  );
};

export default ExotelCallButton;
