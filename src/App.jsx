import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LeadList from './pages/LeadList';
import Customers from './pages/Customers';
import LeadDetails from './pages/LeadDetails';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import FollowUps from './pages/FollowUps';
import Documents from './pages/Documents';
import LoanApps from './pages/LoanApps';
import Bankers from './pages/Bankers';
import Collaborators from './pages/Collaborators';
import Revenue from './pages/Revenue';
import Calls from './pages/Calls';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { PERMISSIONS } from './config/rbac';
import { NotificationProvider } from './context/NotificationContext';

// ─── ProtectedRoute ────────────────────────────────────────────────────────────
// Handles authentication AND optional permission enforcement.
//   <ProtectedRoute>                                     — auth only
//   <ProtectedRoute permission={PERMISSIONS.VIEW_REVENUE}> — auth + permission
const ProtectedRoute = ({ children, permission }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/" replace />;

  return <Layout>{children}</Layout>;
};

// ─── App ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              {/* ── Public ─────────────────────────────────────────────── */}
              <Route path="/login"           element={<Login />} />
              <Route path="/signup"          element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password"  element={<ResetPassword />} />

              {/* ── Core CRM ────────────────────────────────────────────── */}
              <Route path="/"             element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/leads"        element={<ProtectedRoute permission={PERMISSIONS.READ_LEADS}><LeadList /></ProtectedRoute>} />
              <Route path="/leads/:id"    element={<ProtectedRoute permission={PERMISSIONS.READ_LEADS}><LeadDetails /></ProtectedRoute>} />
              <Route path="/customers"    element={<ProtectedRoute permission={PERMISSIONS.VIEW_CUSTOMERS}><Customers /></ProtectedRoute>} />
              <Route path="/customers/:id" element={<ProtectedRoute permission={PERMISSIONS.VIEW_CUSTOMERS}><LeadDetails /></ProtectedRoute>} />

              {/* ── Activity ────────────────────────────────────────────── */}
              <Route path="/follow-ups"   element={<ProtectedRoute permission={PERMISSIONS.VIEW_FOLLOW_UPS}><FollowUps /></ProtectedRoute>} />
              <Route path="/documents"    element={<ProtectedRoute permission={PERMISSIONS.VIEW_DOCUMENTS}><Documents /></ProtectedRoute>} />
              <Route path="/loan-apps"    element={<ProtectedRoute permission={PERMISSIONS.VIEW_LOAN_APPS}><LoanApps /></ProtectedRoute>} />
              <Route path="/calls"        element={<ProtectedRoute permission={PERMISSIONS.VIEW_CALLS}><Calls /></ProtectedRoute>} />
              <Route path="/attendance"   element={<ProtectedRoute permission={PERMISSIONS.VIEW_ATTENDANCE}><Attendance /></ProtectedRoute>} />

              {/* ── Partners ────────────────────────────────────────────── */}
              <Route path="/bankers"      element={<ProtectedRoute permission={PERMISSIONS.VIEW_BANKERS}><Bankers /></ProtectedRoute>} />
              <Route path="/collaborators" element={<ProtectedRoute permission={PERMISSIONS.VIEW_COLLABORATORS}><Collaborators /></ProtectedRoute>} />

              {/* ── Finance & Analytics ─────────────────────────────────── */}
              <Route path="/revenue"      element={<ProtectedRoute permission={PERMISSIONS.VIEW_REVENUE}><Revenue /></ProtectedRoute>} />
              <Route path="/reports"      element={<ProtectedRoute permission={PERMISSIONS.VIEW_REPORTS}><Reports /></ProtectedRoute>} />

              {/* ── Admin ───────────────────────────────────────────────── */}
              <Route path="/console"      element={<ProtectedRoute permission={PERMISSIONS.MANAGE_USERS}><UserManagement /></ProtectedRoute>} />
              <Route path="/settings"     element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              {/* ── Fallback ────────────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
