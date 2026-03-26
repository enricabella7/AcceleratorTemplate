import useSWR from 'swr';
import { fetcher } from '../lib/api';
import { FileText, Database, BarChart3, Bot, Target } from 'lucide-react';

export default function AdminOverview() {
  const { data: brochure } = useSWR('/brochure', fetcher);
  const { data: models } = useSWR('/data-models', fetcher);
  const { data: dashboards } = useSWR('/dashboards', fetcher);
  const { data: aiCases } = useSWR('/ai-use-cases', fetcher);
  const { data: kpis } = useSWR('/kpis', fetcher);

  const stats = [
    { icon: FileText, label: 'Brochure Assets', count: brochure?.length || 0, color: '#0EA5E9' },
    { icon: Database, label: 'Data Models', count: models?.length || 0, color: '#8B5CF6' },
    { icon: BarChart3, label: 'Dashboards', count: dashboards?.length || 0, color: '#6366F1' },
    { icon: Bot, label: 'AI Use Cases', count: aiCases?.length || 0, color: '#10B981' },
    { icon: Target, label: 'KPIs', count: kpis?.length || 0, color: '#F59E0B' },
  ];

  return (
    <div>
      <h3 className="font-display text-xl text-white mb-4">Dashboard</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-white" style={{ background: s.color }}>
              <s.icon size={20} />
            </div>
            <div className="text-2xl font-bold text-white">{s.count}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-5 mt-6">
        <h4 className="font-semibold text-white mb-2">Quick Start</h4>
        <ul className="space-y-2 text-sm text-slate-400">
          <li>• Use the tabs above to manage each section of the portal</li>
          <li>• Upload brochure assets (PDF, PPT) via the Brochure Assets tab</li>
          <li>• Add live dashboard URLs in the Dashboards tab to embed Power BI / Tableau</li>
          <li>• Import KPIs in bulk via CSV in the KPI Manager tab</li>
          <li>• Update portal settings, title, and admin password in Settings</li>
        </ul>
      </div>
    </div>
  );
}
