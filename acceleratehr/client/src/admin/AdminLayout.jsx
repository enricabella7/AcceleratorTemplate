import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isAuthenticated, setToken } from '../lib/api';
import { useEffect } from 'react';
import {
  FileText, Database, BarChart3, Bot, Target, Settings, LogOut, ArrowLeft, Layers
} from 'lucide-react';

const adminNav = [
  { to: '/admin', end: true, icon: Settings, label: 'Overview' },
  { to: '/admin/brochure', icon: FileText, label: 'Brochure Assets' },
  { to: '/admin/data-models', icon: Database, label: 'Data Models' },
  { to: '/admin/dashboards', icon: BarChart3, label: 'Dashboards' },
  { to: '/admin/ai-use-cases', icon: Bot, label: 'AI Use Cases' },
  { to: '/admin/kpis', icon: Target, label: 'KPI Manager' },
  { to: '/admin/domains', icon: Layers, label: 'Domains' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) navigate('/admin/login');
  }, [navigate]);

  if (!isAuthenticated()) return null;

  const logout = () => {
    setToken(null);
    navigate('/admin/login');
  };

  return (
    <div>
      {/* Admin header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <NavLink
            to="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={16} />
            Portal
          </NavLink>
          <div className="w-px h-6 bg-white/10" />
          <h2 className="font-display text-xl text-white">Admin Panel</h2>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* Admin tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {adminNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-accent-blue/15 text-accent-blue'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet />
      </motion.div>
    </div>
  );
}
