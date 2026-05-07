import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Trash2 } from 'lucide-react';

const NotificationContext = createContext(null);

// Individual Toast component with auto-close progress bar
const Toast = ({ n, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 5000;
    const interval = 30;
    const decrement = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) { clearInterval(timer); return 0; }
        return prev - decrement;
      });
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const config = {
    success: {
      icon: <CheckCircle2 size={16} />,
      bar: 'bg-emerald-500',
      iconBg: 'text-emerald-500',
      label: 'Success',
    },
    error: {
      icon: <AlertCircle size={16} />,
      bar: 'bg-red-500',
      iconBg: 'text-red-500',
      label: 'Error',
    },
    warning: {
      icon: <AlertTriangle size={16} />,
      bar: 'bg-amber-500',
      iconBg: 'text-amber-500',
      label: 'Warning',
    },
    info: {
      icon: <Info size={16} />,
      bar: 'bg-primary',
      iconBg: 'text-primary',
      label: 'Info',
    },
  };

  const c = config[n.type] || config.info;

  return (
    <div className="animate-in slide-in-from-right-5 fade-in duration-300 pointer-events-auto">
      <div className="relative flex items-start gap-3.5 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden min-w-[340px] max-w-sm">
        {/* Left accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />

        <div className="pl-5 pt-4 pb-4 pr-4 flex items-start gap-3.5 w-full">
          <span className={`mt-0.5 shrink-0 ${c.iconBg}`}>{c.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{c.label}</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">{n.message}</p>
          </div>
          <button
            onClick={() => onDismiss(n.id)}
            className="mt-0.5 p-1 rounded-md text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div
          className={`absolute bottom-0 left-1 right-0 h-0.5 ${c.bar} opacity-30 transition-all duration-30`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const confirm = useCallback((config) => {
    return new Promise((resolve) => {
      setConfirmDialog({ ...config, resolve });
    });
  }, []);

  const handleConfirm = (value) => {
    if (confirmDialog) {
      confirmDialog.resolve(value);
      setConfirmDialog(null);
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, confirm }}>
      {children}

      {/* Toast Stack — bottom-right, industry standard */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none">
        {notifications.map(n => (
          <Toast key={n.id} n={n} onDismiss={dismiss} />
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) handleConfirm(false); }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[420px] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Dialog Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-5">
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 shrink-0 size-10 rounded-xl flex items-center justify-center ${
                  confirmDialog.danger
                    ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
                }`}>
                  {confirmDialog.danger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {confirmDialog.title || (confirmDialog.danger ? 'Delete Confirmation' : 'Confirm Action')}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {confirmDialog.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleConfirm(false)}
                className="shrink-0 ml-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => handleConfirm(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                {confirmDialog.cancelLabel || 'Cancel'}
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-sm ${
                  confirmDialog.danger
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                    : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                }`}
              >
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
