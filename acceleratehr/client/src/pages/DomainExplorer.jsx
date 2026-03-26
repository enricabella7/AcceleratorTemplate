import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { CardSkeleton } from '../components/Skeleton';
import { useDomains, getIcon } from '../lib/domains';
import { Database, BarChart3, Target, Bot, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DomainExplorer() {
  const { domains, isLoading: domainsLoading } = useDomains();
  const { data: dataModels } = useSWR('/data-models', fetcher);
  const { data: dashboards } = useSWR('/dashboards', fetcher);
  const { data: kpis } = useSWR('/kpis', fetcher);
  const { data: aiUseCases } = useSWR('/ai-use-cases', fetcher);
  const [expandedDomain, setExpandedDomain] = useState(null);

  if (domainsLoading) return <CardSkeleton count={3} />;

  const getContentForDomain = (domainId) => {
    const models = (dataModels || []).filter(m => m.domain === domainId);
    const dashes = (dashboards || []).filter(d => d.domain === domainId);
    const domainKpis = (kpis || []).filter(k => k.domain === domainId);
    return { models, dashes, domainKpis };
  };

  return (
    <div>
      <PageHeader
        title="Domain Explorer"
        description="Browse all accelerator content organized by domain. Click a domain to explore its data models, dashboards, and KPIs."
      />

      <div className="space-y-3">
        {domains.map((domain, i) => {
          const Icon = getIcon(domain.icon);
          const isExpanded = expandedDomain === domain.id;
          const content = getContentForDomain(domain.id);
          const totalItems = content.models.length + content.dashes.length + content.domainKpis.length;

          return (
            <motion.div
              key={domain.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl overflow-hidden"
            >
              {/* Domain header */}
              <button
                onClick={() => setExpandedDomain(isExpanded ? null : domain.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="text-slate-400">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: domain.color }}>
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg text-white">{domain.label}</h3>
                  <div className="flex gap-4 mt-1">
                    {content.models.length > 0 && (
                      <span className="text-xs text-slate-500">{content.models.length} data model{content.models.length !== 1 ? 's' : ''}</span>
                    )}
                    {content.dashes.length > 0 && (
                      <span className="text-xs text-slate-500">{content.dashes.length} dashboard{content.dashes.length !== 1 ? 's' : ''}</span>
                    )}
                    {content.domainKpis.length > 0 && (
                      <span className="text-xs text-slate-500">{content.domainKpis.length} KPI{content.domainKpis.length !== 1 ? 's' : ''}</span>
                    )}
                    {totalItems === 0 && (
                      <span className="text-xs text-slate-600">No content yet</span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: `${domain.color}20`, color: domain.color }}>
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-6">
                      {/* Data Models */}
                      {content.models.length > 0 && (
                        <ContentSection
                          title="Data Models"
                          icon={Database}
                          color={domain.color}
                          items={content.models.map(m => ({
                            title: m.title,
                            subtitle: m.tables_json ? `${m.tables_json.length} tables` : `${(m.entities || []).length} entities`,
                            description: m.description,
                            tags: m.tags,
                          }))}
                        />
                      )}

                      {/* Dashboards */}
                      {content.dashes.length > 0 && (
                        <ContentSection
                          title="Dashboards"
                          icon={BarChart3}
                          color={domain.color}
                          items={content.dashes.map(d => ({
                            title: d.title,
                            subtitle: d.status === 'live' ? 'Live' : d.status === 'preview' ? 'Preview' : 'Coming Soon',
                            description: d.description,
                          }))}
                        />
                      )}

                      {/* KPIs */}
                      {content.domainKpis.length > 0 && (
                        <ContentSection
                          title="KPIs"
                          icon={Target}
                          color={domain.color}
                          items={content.domainKpis.map(k => ({
                            title: k.name,
                            subtitle: k.frequency || '',
                            description: k.definition,
                          }))}
                        />
                      )}

                      {totalItems === 0 && (
                        <div className="text-center py-8 text-slate-500 text-sm">
                          No content has been added to this domain yet. Use the Admin Panel to add data models, dashboards, or KPIs.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ContentSection({ title, icon: SectionIcon, color, items }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <SectionIcon size={16} style={{ color }} />
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{title}</span>
        <span className="text-xs text-slate-600">({items.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div key={i} className="glass-light rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-white text-sm">{item.title}</h4>
              {item.subtitle && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 shrink-0">{item.subtitle}</span>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{item.description}</p>
            )}
            {item.tags?.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {item.tags.map((tag, j) => (
                  <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
