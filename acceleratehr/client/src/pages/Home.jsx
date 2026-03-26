import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Database, BarChart3, Bot, Target } from 'lucide-react';

const modules = [
  { to: '/brochure', icon: FileText, label: 'Brochure & Resources', desc: 'Strategic documents, presentations, and reference guides.', color: '#3B82F6' },
  { to: '/data-models', icon: Database, label: 'Data Models', desc: 'Comprehensive repository of HR data structures and schemas.', color: '#8B5CF6' },
  { to: '/dashboards', icon: BarChart3, label: 'Observation Deck', desc: 'Executive dashboards for real-time workforce insights.', color: '#6366F1' },
  { to: '/ai-use-cases', icon: Bot, label: 'AI Use Cases', desc: 'AI-powered tools for recruitment and performance management.', color: '#10B981' },
  { to: '/kpi-hub', icon: Target, label: 'KPI Hub', desc: 'HR metric definitions, formulas, and strategic benchmarks.', color: '#F59E0B' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl min-h-[380px] flex items-center mb-12"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-accent-blue blur-[100px]" />
          <div className="absolute bottom-10 left-20 w-48 h-48 rounded-full bg-accent-gold blur-[80px]" />
        </div>
        <div className="absolute inset-0 border border-white/5 rounded-3xl" />

        <div className="relative z-10 px-8 md:px-14 py-16 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex gap-2 items-center px-4 py-1.5 rounded-full bg-accent-blue/15 border border-accent-blue/25 text-accent-blue text-sm font-semibold mb-5"
          >
            <span className="text-accent-gold">✦</span>
            Your HR Intelligence Platform
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl text-white leading-[1.05] tracking-tight mb-4"
          >
            Empowering Talent Through Data & Innovation
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-slate-400 max-w-xl"
          >
            Explore our comprehensive ecosystem of HR solutions — from advanced data modeling to AI-driven operational tools and executive dashboards.
          </motion.p>
        </div>
      </motion.div>

      {/* Modules */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl text-white tracking-tight">Our Ecosystem</h2>
        <p className="text-slate-400 mt-2">Select a module to dive deeper into our built content.</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {modules.map((mod) => (
          <motion.div key={mod.to} variants={item}>
            <Link
              to={mod.to}
              className="glass rounded-2xl p-5 block transition-all duration-200 hover:border-accent-blue/20 hover:shadow-lg hover:shadow-accent-blue/5 group"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ background: mod.color }}
                >
                  <mod.icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-accent-blue transition-colors">
                    {mod.label}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">{mod.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 text-sm font-bold text-accent-blue">
                <span>Open module</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
