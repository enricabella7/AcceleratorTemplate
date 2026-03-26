import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Modal from '../components/Modal';
import DomainBadge from '../components/DomainBadge';
import { CardSkeleton } from '../components/Skeleton';
import { Search, X, Download, Star } from 'lucide-react';
import { DOMAINS, getDomain } from '../lib/domains';

export default function KpiHub() {
  const [domain, setDomain] = useState('all');
  const [search, setSearch] = useState('');
  const { data: kpis, isLoading } = useSWR(`/kpis?domain=${domain}&search=${search}`, fetcher);
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ahr_kpi_fav') || '[]'); } catch { return []; }
  });

  const toggleFav = (id) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('ahr_kpi_fav', JSON.stringify(next));
  };

  const exportCSV = () => {
    if (!kpis?.length) return;
    const headers = ['Name', 'Domain', 'Definition', 'Formula', 'Benchmark', 'Frequency', 'Importance'];
    const rows = kpis.map(k => [k.name, getDomain(k.domain).label, k.definition, k.formula, k.benchmark, k.frequency, k.importance]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kpi-library.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="KPI Hub"
        description="A curated library of HR metric definitions, formulas, and strategic benchmarks across all domains."
      >
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search KPIs…"
              className="pl-9 pr-3 py-2.5 rounded-xl bg-navy-800 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-accent-blue/50 w-48"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-navy-800 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50"
          >
            <option value="all">All Domains</option>
            {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </PageHeader>

      {isLoading ? (
        <CardSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(kpis || []).map((kpi, i) => {
            const isFav = favorites.includes(kpi.id);
            return (
              <Card key={kpi.id} delay={i * 0.03}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 text-lg">
                    🎯
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-white">{kpi.name}</h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFav(kpi.id); }}
                        className={`p-1 rounded-lg transition-colors ${isFav ? 'text-accent-gold' : 'text-slate-600 hover:text-slate-400'}`}
                      >
                        <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{kpi.definition}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <DomainBadge domainId={kpi.domain} />
                      {kpi.frequency && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                          {kpi.frequency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setSelected(kpi)}
                    className="text-sm font-bold text-accent-blue hover:underline"
                  >
                    View details →
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        subtitle={getDomain(selected?.domain)?.label}
        wide
      >
        {selected && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Definition</div>
                <p className="text-slate-300 text-sm leading-relaxed">{selected.definition}</p>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Formula</div>
                <div className="font-mono text-sm text-emerald-400 bg-navy-900 border border-white/10 rounded-xl p-3">
                  {selected.formula}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Benchmark</div>
                <p className="text-slate-300 text-sm">{selected.benchmark}</p>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-light rounded-xl p-4">
                <h4 className="font-semibold text-white text-sm mb-2">Why It Matters</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{selected.importance}</p>
              </div>
              <div className="glass-light rounded-xl p-4">
                <h4 className="font-semibold text-white text-sm mb-2">Measurement</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-accent-blue/15 text-accent-blue font-semibold">
                    {selected.frequency}
                  </span>
                </div>
              </div>
              <div className="glass-light rounded-xl p-4">
                <h4 className="font-semibold text-white text-sm mb-2">Domain</h4>
                <DomainBadge domainId={selected.domain} size="md" />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
