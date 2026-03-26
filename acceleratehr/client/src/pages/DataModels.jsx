import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Modal from '../components/Modal';
import DomainBadge from '../components/DomainBadge';
import { CardSkeleton } from '../components/Skeleton';
import { Search, X } from 'lucide-react';
import { getDomain, DOMAINS } from '../lib/domains';

export default function DataModels() {
  const { data: models, isLoading } = useSWR('/data-models', fetcher);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = (models || []).filter(m => {
    const matchDomain = domainFilter === 'all' || m.domain === domainFilter;
    const matchSearch = !search || [m.title, m.description, ...(m.tags || [])].join(' ').toLowerCase().includes(search.toLowerCase());
    return matchDomain && matchSearch;
  });

  return (
    <div>
      <PageHeader
        title="Data Models"
        description="Search and explore HR data model cards. View sample schemas, entity relationships, and KPI coverage."
      >
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models, tags…"
              className="pl-9 pr-3 py-2.5 rounded-xl bg-navy-800 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-accent-blue/50 w-56"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-navy-800 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50"
          >
            <option value="all">All Domains</option>
            {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
      </PageHeader>

      {isLoading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((model, i) => {
            const domain = getDomain(model.domain);
            return (
              <Card key={model.id} delay={i * 0.05} onClick={() => setSelected(model)}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: domain.color }}>
                    <domain.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{model.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{model.description}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <DomainBadge domainId={model.domain} />
                      <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                        {model.entities?.length || 0} entities
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm font-bold text-accent-blue">
                  <span>View schema</span>
                  <span>→</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        subtitle={getDomain(selected?.domain)?.label}
        wide
      >
        {selected && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Description</div>
                <p className="text-slate-300 text-sm leading-relaxed">{selected.description}</p>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Entity Schema</div>
                <div className="space-y-3">
                  {(selected.entities || []).map((entity, i) => (
                    <div key={i} className="glass-light rounded-xl p-4">
                      <h4 className="font-semibold text-white text-sm mb-2">{entity.name}</h4>
                      <div className="space-y-1">
                        {(entity.fields || []).map((f, j) => (
                          <div key={j} className="text-xs font-mono text-slate-400 bg-navy-900/50 rounded px-2 py-1">
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-light rounded-xl p-4">
                <h4 className="font-semibold text-white text-sm mb-3">Relationships</h4>
                <div className="space-y-2">
                  {(selected.relationships || []).map((r, i) => (
                    <div key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-accent-blue mt-0.5">→</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-light rounded-xl p-4">
                <h4 className="font-semibold text-white text-sm mb-3">Tags</h4>
                <div className="flex gap-2 flex-wrap">
                  {(selected.tags || []).map((tag, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
