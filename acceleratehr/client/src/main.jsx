import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Brochure from './pages/Brochure';
import DataModels from './pages/DataModels';
import Dashboards from './pages/Dashboards';
import AIUseCases from './pages/AIUseCases';
import KpiHub from './pages/KpiHub';
import Login from './admin/Login';
import AdminLayout from './admin/AdminLayout';
import AdminOverview from './admin/AdminOverview';
import AdminBrochure from './admin/AdminBrochure';
import AdminDataModels from './admin/AdminDataModels';
import AdminDashboards from './admin/AdminDashboards';
import AdminAIUseCases from './admin/AdminAIUseCases';
import AdminKpis from './admin/AdminKpis';
import AdminSettings from './admin/AdminSettings';

function PortalLayout() {
  return (
    <div className="grain">
      <Sidebar />
      <div className="lg:ml-64">
        <main className="min-h-screen p-4 md:p-8 pt-16 lg:pt-8">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
          <footer className="text-center text-xs text-slate-600 py-8 mt-12 border-t border-white/5">
            AccelerateHR Platform &middot; Last updated: {new Date().toLocaleDateString()}
          </footer>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1E293B', color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.06)' },
        }}
      />
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route element={<PortalLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/brochure" element={<Brochure />} />
          <Route path="/data-models" element={<DataModels />} />
          <Route path="/dashboards" element={<Dashboards />} />
          <Route path="/ai-use-cases" element={<AIUseCases />} />
          <Route path="/kpi-hub" element={<KpiHub />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="brochure" element={<AdminBrochure />} />
            <Route path="data-models" element={<AdminDataModels />} />
            <Route path="dashboards" element={<AdminDashboards />} />
            <Route path="ai-use-cases" element={<AdminAIUseCases />} />
            <Route path="kpis" element={<AdminKpis />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
