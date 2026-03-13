import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LeadList from './pages/LeadList';
import Customers from './pages/Customers';
import LeadDetails from './pages/LeadDetails';
import FollowUps from './pages/FollowUps';
import Settings from './pages/Settings';
import Bankers from './pages/Bankers';
import Collaborators from './pages/Collaborators';
import Revenue from './pages/Revenue';
import Calls from './pages/Calls';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Documents from './pages/Documents';
import LoanApps from './pages/LoanApps';

// Placeholder components for pages
const UnderConstruction = ({ title }) => (
  <div className="glass-card p-12 rounded-2xl text-center border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto mt-20 animate-float">
    <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
      <div className="size-10 bg-primary rounded-lg"></div>
    </div>
    <h2 className="text-2xl font-bold mb-4">{title} Page</h2>
    <p className="text-slate-500">I am currently migrating this feature from the static HTML version to React. Check back soon!</p>
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<LeadList />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/follow-ups" element={<FollowUps />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/loan-apps" element={<LoanApps />} />
          <Route path="/bankers" element={<Bankers />} />
          <Route path="/collaborators" element={<Collaborators />} />
          <Route path="/revenue" element={<Revenue />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
