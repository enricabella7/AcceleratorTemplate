import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, FileText, Database, BarChart3, Bot, Target,
  Shield, Menu, X, Layers
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/brochure', icon: FileText, label: 'Brochure' },
  { to: '/data-models', icon: Database, label: 'Data Models' },
  { to: '/dashboards', icon: BarChart3, label: 'Observation Deck' },
  { to: '/ai-use-cases', icon: Bot, label: 'AI Use Cases' },
  { to: '/kpi-hub', icon: Target, label: 'KPI Hub' },
  { to: '/domains', icon: Layers, label: 'Domain Explorer' },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const linkClass = (isActive) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-accent-blue/15 text-accent-blue shadow-lg shadow-accent-blue/5'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl glass text-white"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40 flex flex-col
        bg-navy-900/95 backdrop-blur-xl border-r border-white/5
        transition-transform duration-300
        lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="p-6 pb-4">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-blue-700 flex items-center justify-center text-white font-black text-sm">
              HR
            </div>
            <div>
              <span className="font-display text-lg text-white tracking-tight">
                Accelerate<span className="text-accent-blue">HR</span>
              </span>
            </div>
          </NavLink>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">
            Portal
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => linkClass(isActive)}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mt-6 mb-2">
            Management
          </div>
          <NavLink
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => linkClass(isActive)}
          >
            <Shield size={18} />
            Admin Panel
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="text-xs text-slate-500 text-center">
            AccelerateHR Platform
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
