import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Modal from '../components/Modal';
import DomainBadge from '../components/DomainBadge';
import { CardSkeleton } from '../components/Skeleton';
import { getDomain } from '../lib/domains';
import { BarChart3, ExternalLink } from 'lucide-react';

const statusStyles = {
  live: { bg: 'bg-green-500/15', text: 'text-green-400', label: 'Live' },
  preview: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Preview' },
  coming_soon: { bg: 'bg-slate-500/15', text: 'text-slate-400', label: 'Coming Soon' },
};

export default function Dashboards() {
  const { data: dashboards, isLoading } = useSWR('/dashboards', fetcher);
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <PageHeader
        title="Observation Deck"
        description="Executive dashboards for real-time workforce insights. Open a dashboard to preview visuals or access live embeds."
      />

      {isLoading ? (
        <CardSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(dashboards || []).map((dash, i) => {
            const domain = getDomain(dash.domain);
            const status = statusStyles[dash.status] || statusStyles.coming_soon;
            return (
              <Card key={dash.id} delay={i * 0.05} onClick={() => setSelected(dash)}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: domain.color }}>
                    <BarChart3 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{dash.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{dash.description}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <DomainBadge domainId={dash.domain} />
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm font-bold text-accent-blue">
                  <span>View Dashboard</span>
                  <span>→</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        subtitle={getDomain(selected?.domain)?.label}
        wide
      >
        {selected && (
          <div>
            <p className="text-slate-400 text-sm mb-5">{selected.description}</p>
            {selected.embed_url ? (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: 480 }}>
                  <iframe
                    src={selected.embed_url}
                    className="w-full h-full"
                    title={selected.title}
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
                <a
                  href={selected.embed_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent-blue hover:underline"
                >
                  <ExternalLink size={14} />
                  Open in new tab
                </a>
              </div>
            ) : (
              <DashboardPlaceholder domain={selected.domain} status={selected.status} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function DashboardPlaceholder({ domain, status }) {
  const d = getDomain(domain);
  const isLive = status === 'live' || status === 'preview';

  return (
    <div className="rounded-xl border border-white/10 bg-navy-900/60 p-6" style={{ minHeight: 360 }}>
      {/* Mock dashboard header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: d.color }}>
            <d.icon size={16} />
          </div>
          <span className="text-sm font-semibold text-white">{d.label} Dashboard</span>
        </div>
        <span className="text-xs text-slate-500">Last updated: Demo data</span>
      </div>

      {/* Mock KPI cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {['Total Headcount', 'Attrition Rate', 'Open Positions'].map((label, i) => (
          <div key={i} className="glass-light rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{['2,847', '8.3%', '142'][i]}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Mock chart area */}
      <div className="glass-light rounded-xl p-4 mb-4" style={{ height: 140 }}>
        <div className="text-xs text-slate-500 mb-3">Monthly Trend (Sample)</div>
        <div className="flex items-end gap-2 h-20">
          {[40, 55, 45, 65, 58, 72, 68, 80, 75, 85, 78, 90].map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${v}%`, background: `${d.color}${i === 11 ? '' : '60'}` }}
            />
          ))}
        </div>
      </div>

      {!isLive && (
        <div className="text-center py-3">
          <span className="text-sm text-slate-500">Configure an embed URL in Admin to display a live dashboard</span>
        </div>
      )}
    </div>
  );
}
