import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Modal from '../components/Modal';
import DomainBadge from '../components/DomainBadge';
import { CardSkeleton } from '../components/Skeleton';
import { Search, X, Key, ArrowRight, Database, Table2, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { getDomain, useDomains } from '../lib/domains';
import { motion, AnimatePresence } from 'framer-motion';

export default function DataModels() {
  const { data: models, isLoading } = useSWR('/data-models', fetcher);
  const { domains } = useDomains();
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
        description="Explore HR data model schemas. Upload Excel design files to see full table structures, field definitions, and entity relationships."
      >
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search models, tags…"
              className="pl-9 pr-3 py-2.5 rounded-xl bg-navy-800 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-accent-blue/50 w-56" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
          <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-navy-800 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50">
            <option value="all">All Domains</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
      </PageHeader>

      {isLoading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((model, i) => {
            const domain = getDomain(model.domain);
            const tableCount = model.tables_json?.length || 0;
            const entityCount = model.entities?.length || 0;
            return (
              <Card key={model.id} delay={i * 0.05} onClick={() => setSelected(model)}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: domain.color }}>
                    <Database size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{model.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{model.description}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <DomainBadge domainId={model.domain} />
                      {tableCount > 0 && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          {tableCount} tables
                        </span>
                      )}
                      {!tableCount && entityCount > 0 && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                          {entityCount} entities
                        </span>
                      )}
                      {model.diagram_path && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                          Diagram
                        </span>
                      )}
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
          selected.tables_json
            ? <ExcelModelView model={selected} />
            : <ManualModelView model={selected} />
        )}
      </Modal>
    </div>
  );
}

/** Renders an Excel-parsed data model with full table details */
function ExcelModelView({ model }) {
  const [expandedTable, setExpandedTable] = useState(null);
  const tables = model.tables_json || [];

  return (
    <div className="space-y-6">
      {/* Description + Download */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-slate-400 text-sm flex-1">{model.description}</p>
        {model.excel_path && (
          <a
            href={`/uploads/${model.excel_path}`}
            download={model.excel_name || 'data-model.xlsx'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-colors shrink-0"
          >
            <Download size={14} />
            Download Excel
          </a>
        )}
      </div>

      {/* Diagram */}
      {model.diagram_path && (
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Entity Relationship Diagram</div>
          <div className="rounded-xl border border-white/10 overflow-hidden bg-white p-2">
            <img
              src={`/uploads/${model.diagram_path}`}
              alt="Data model diagram"
              className="w-full rounded-lg"
              style={{ maxHeight: 400, objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-light rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{tables.length}</div>
          <div className="text-xs text-slate-500">Tables</div>
        </div>
        <div className="glass-light rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{tables.reduce((sum, t) => sum + (t.fields?.length || 0), 0)}</div>
          <div className="text-xs text-slate-500">Total Fields</div>
        </div>
        <div className="glass-light rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">
            {tables.reduce((sum, t) => sum + (t.fields?.filter(f => f.primaryKey)?.length || 0), 0)}
          </div>
          <div className="text-xs text-slate-500">Primary Keys</div>
        </div>
        <div className="glass-light rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">
            {tables.reduce((sum, t) => sum + (t.fields?.filter(f => f.foreignKey)?.length || 0), 0)}
          </div>
          <div className="text-xs text-slate-500">Foreign Keys</div>
        </div>
      </div>

      {/* Tables list */}
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Tables</div>
        <div className="space-y-2">
          {tables.map((table, idx) => {
            const isExpanded = expandedTable === idx;
            const pkFields = (table.fields || []).filter(f => f.primaryKey);
            const fkFields = (table.fields || []).filter(f => f.foreignKey);

            return (
              <div key={idx} className="glass-light rounded-xl overflow-hidden">
                {/* Table header */}
                <button
                  onClick={() => setExpandedTable(isExpanded ? null : idx)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-accent-blue/15 flex items-center justify-center text-accent-blue shrink-0">
                    <Table2 size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">{table.businessName || table.sheetName}</span>
                      <span className="text-xs font-mono text-slate-500">{table.tableName}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{table.description}</p>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500 shrink-0">
                    <span>{(table.fields || []).length} fields</span>
                    {table.volume && <span>{table.volume}</span>}
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
                      <div className="px-4 pb-4 space-y-4">
                        {/* Table metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {table.schema && (
                            <MetaItem label="Schema" value={table.schema} />
                          )}
                          {table.granularity && (
                            <MetaItem label="Granularity" value={table.granularity} />
                          )}
                          {table.volume && (
                            <MetaItem label="Volume" value={table.volume} />
                          )}
                          {table.scalability && (
                            <MetaItem label="Scalability" value={table.scalability} />
                          )}
                        </div>

                        {/* Foreign key relationships */}
                        {fkFields.length > 0 && (
                          <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Relationships</div>
                            <div className="flex gap-2 flex-wrap">
                              {fkFields.map((f, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                  <ArrowRight size={10} />
                                  {f.fieldName} → {f.foreignKey}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Field table */}
                        <div className="rounded-xl border border-white/5 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-navy-900/50">
                                  <th className="text-left px-3 py-2 text-slate-500 font-semibold uppercase tracking-wider">#</th>
                                  <th className="text-left px-3 py-2 text-slate-500 font-semibold uppercase tracking-wider">Field Name</th>
                                  <th className="text-left px-3 py-2 text-slate-500 font-semibold uppercase tracking-wider">DWH Column</th>
                                  <th className="text-left px-3 py-2 text-slate-500 font-semibold uppercase tracking-wider">Type</th>
                                  <th className="text-left px-3 py-2 text-slate-500 font-semibold uppercase tracking-wider">Keys</th>
                                  <th className="text-left px-3 py-2 text-slate-500 font-semibold uppercase tracking-wider min-w-[200px]">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(table.fields || []).map((field, fi) => (
                                  <tr key={fi} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
                                    <td className="px-3 py-2 text-slate-600">{field.number || fi + 1}</td>
                                    <td className="px-3 py-2 text-white font-medium whitespace-nowrap">{field.fieldName}</td>
                                    <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap">{field.dwhFieldName}</td>
                                    <td className="px-3 py-2">
                                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-mono">
                                        {field.datatype}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                      <div className="flex gap-1">
                                        {field.primaryKey && (
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold">
                                            <Key size={9} /> PK
                                          </span>
                                        )}
                                        {field.foreignKey && (
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent-blue/15 text-accent-blue font-semibold">
                                            FK
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-slate-400">{field.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Source info if present */}
                        {(table.sourceTables || table.relationships) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {table.sourceTables && (
                              <MetaItem label="Source Tables" value={table.sourceTables} />
                            )}
                            {table.relationships && (
                              <MetaItem label="Join Logic" value={table.relationships} />
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      {model.tags?.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Tags</div>
          <div className="flex gap-2 flex-wrap">
            {model.tags.map((tag, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="bg-navy-900/40 rounded-lg p-2.5">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-xs text-slate-300">{value}</div>
    </div>
  );
}

/** Renders the original manual data model view (backwards compatible) */
function ManualModelView({ model }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-5">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Description</div>
          <p className="text-slate-300 text-sm leading-relaxed">{model.description}</p>
        </div>

        {model.diagram_path && (
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Diagram</div>
            <div className="rounded-xl border border-white/10 overflow-hidden bg-white p-2">
              <img src={`/uploads/${model.diagram_path}`} alt="Diagram" className="w-full rounded-lg" style={{ maxHeight: 300, objectFit: 'contain' }} />
            </div>
          </div>
        )}

        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Entity Schema</div>
          <div className="space-y-3">
            {(model.entities || []).map((entity, i) => (
              <div key={i} className="glass-light rounded-xl p-4">
                <h4 className="font-semibold text-white text-sm mb-2">{entity.name}</h4>
                <div className="space-y-1">
                  {(entity.fields || []).map((f, j) => (
                    <div key={j} className="text-xs font-mono text-slate-400 bg-navy-900/50 rounded px-2 py-1">{f}</div>
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
            {(model.relationships || []).map((r, i) => (
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
            {(model.tags || []).map((tag, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
