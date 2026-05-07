import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorBoundary
 *
 * Catches unhandled React render errors and shows a friendly fallback
 * instead of a blank screen. Wrap around the Router in App.jsx.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <Router>...</Router>
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production, wire this to your error tracking service (e.g., Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
          <div className="w-full max-w-lg text-center animate-in fade-in zoom-in duration-300">
            {/* Icon */}
            <div className="size-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-500/10">
              <AlertTriangle size={40} className="text-red-500" />
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
              Something went wrong
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-sm mx-auto">
              An unexpected error occurred. Your data is safe — this is a display error only.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:shadow-sm transition-all"
              >
                <Home size={16} />
                Go to Dashboard
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
              >
                <RefreshCw size={16} />
                Reload Page
              </button>
            </div>

            {/* Dev-only stack trace */}
            {isDev && this.state.error && (
              <details className="mt-10 text-left bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <summary className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer mb-3">
                  Developer Details
                </summary>
                <pre className="text-xs text-red-400 overflow-auto whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
