import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api, uploadUrl } from '../lib/api';
import Modal from '../components/Modal';
import { Pencil, Trash2, Plus, Upload, FileSpreadsheet, Image } from 'lucide-react';
import SortButtons from '../components/SortButtons';
import { useDomains, getDomain } from '../lib/domains';
import toast from 'react-hot-toast';

const emptyForm = { title: '', domain: 'workforce_planning', description: '', entities: '', relationships: '', tags: '' };

export default function AdminDataModels() {
  const { data: models, isLoading } = useSWR('/data-models', fetcher);
  const { domains } = useDomains();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [excelFile, setExcelFile] = useState(null);
  const [diagramFile, setDiagramFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadMode, setUploadMode] = useState('excel'); // 'excel' | 'manual'

  const openAdd = () => {
    setForm(emptyForm);
    setExcelFile(null);
    setDiagramFile(null);
    setUploadMode('excel');
    setModal('add');
  };

  const openEdit = (model) => {
    setForm({
      title: model.title,
      domain: model.domain,
      description: model.description || '',
      entities: JSON.stringify(model.entities || [], null, 2),
      relationships: JSON.stringify(model.relationships || [], null, 2),
      tags: (model.tags || []).join(', '),
    });
    setExcelFile(null);
    setDiagramFile(null);
    setUploadMode(model.tables_json ? 'excel' : 'manual');
    setModal(model);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();

      if (uploadMode === 'excel' && excelFile) {
        fd.append('excel', excelFile);
      }

      if (diagramFile) {
        fd.append('diagram', diagramFile);
      }

      // Always send form fields
      fd.append('title', form.title);
      fd.append('domain', form.domain);
      fd.append('description', form.description);

      if (uploadMode === 'manual') {
        fd.append('entities', form.entities);
        fd.append('relationships', form.relationships);
      }

      fd.append('tags', uploadMode === 'manual'
        ? JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean))
        : ''
      );

      if (modal === 'add') {
        await api.post('/data-models', fd);
        toast.success('Model created');
      } else {
        await api.put(`/data-models/${modal.id}`, fd);
        toast.success('Model updated');
      }
      mutate('/data-models');
      setModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this data model?')) return;
    await api.delete(`/data-models/${id}`);
    toast.success('Model deleted');
    mutate('/data-models');
  };

  const handleMove = async (fromIdx, toIdx) => {
    const items = [...(models || [])];
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    mutate('/data-models', items, false);
    try {
      await api.post('/data-models/reorder', { ids: items.map(m => m.id) });
      mutate('/data-models');
    } catch { toast.error('Reorder failed'); mutate('/data-models'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl text-white">Data Models</h3>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-blue-600">
          <Plus size={16} /> Add Model
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="w-10 px-2 py-3"></th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Domain</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Tables</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Source</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Diagram</th>
              <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(models || []).map((m, i) => (
              <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-2 py-3">
                  <SortButtons index={i} total={(models || []).length} onMove={handleMove} />
                </td>
                <td className="px-4 py-3 text-white font-medium">{m.title}</td>
                <td className="px-4 py-3 text-slate-400">{getDomain(m.domain).label}</td>
                <td className="px-4 py-3 text-slate-400">
                  {m.tables_json ? `${m.tables_json.length} tables` : `${(m.entities || []).length} entities`}
                </td>
                <td className="px-4 py-3">
                  {m.excel_name ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                      <FileSpreadsheet size={12} /> {m.excel_name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Manual</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {m.diagram_path ? (
                    <span className="inline-flex items-center gap-1 text-xs text-accent-blue">
                      <Image size={12} /> Uploaded
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Data Model' : 'Edit Data Model'} wide>
        <div className="space-y-5">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setUploadMode('excel')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                uploadMode === 'excel'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Upload size={14} /> Upload Excel
            </button>
            <button
              onClick={() => setUploadMode('manual')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                uploadMode === 'manual'
                  ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Pencil size={14} /> Manual Entry
            </button>
          </div>

          {/* Common fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">
                Title {uploadMode === 'excel' && <span className="normal-case text-slate-600">(auto-filled from Excel if blank)</span>}
              </label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={uploadMode === 'excel' ? 'Auto-generated from file…' : ''} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Domain</label>
              <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50">
                {domains.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">
              Description {uploadMode === 'excel' && <span className="normal-case text-slate-600">(auto-filled from Excel if blank)</span>}
            </label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder={uploadMode === 'excel' ? 'Auto-generated from file…' : ''} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>

          {/* Excel upload mode */}
          {uploadMode === 'excel' && (
            <div className="glass-light rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Excel File (.xlsx)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold cursor-pointer hover:bg-emerald-500/20 transition-colors">
                    <FileSpreadsheet size={16} />
                    {excelFile ? excelFile.name : 'Choose Excel file…'}
                    <input type="file" accept=".xlsx,.xls" onChange={e => setExcelFile(e.target.files[0])} className="hidden" />
                  </label>
                  {excelFile && (
                    <button onClick={() => setExcelFile(null)} className="text-xs text-slate-500 hover:text-red-400">Remove</button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Upload an Excel file following the AccelerateHR template: Summary sheet + individual table sheets with table settings and field definitions.
                </p>
                {modal !== 'add' && modal?.excel_name && !excelFile && (
                  <p className="text-xs text-emerald-400 mt-1">Current file: {modal.excel_name}</p>
                )}
              </div>
            </div>
          )}

          {/* Manual mode */}
          {uploadMode === 'manual' && (
            <>
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. Forecasting, FTE, Budgeting" className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Entities (JSON array)</label>
                <textarea value={form.entities} onChange={e => setForm(f => ({ ...f, entities: e.target.value }))} rows={6} placeholder='[{"name": "Employee", "fields": ["id (UUID)", "name (STRING)"]}]' className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-accent-blue/50" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Relationships (JSON array of strings)</label>
                <textarea value={form.relationships} onChange={e => setForm(f => ({ ...f, relationships: e.target.value }))} rows={4} placeholder='["Employee → Position (many-to-one)"]' className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-accent-blue/50" />
              </div>
            </>
          )}

          {/* Diagram upload (always shown) */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Diagram Image (PNG, JPG, SVG)</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue/15 border border-accent-blue/30 text-accent-blue text-sm font-semibold cursor-pointer hover:bg-accent-blue/20 transition-colors">
                <Image size={16} />
                {diagramFile ? diagramFile.name : 'Choose diagram…'}
                <input type="file" accept=".png,.jpg,.jpeg,.svg" onChange={e => setDiagramFile(e.target.files[0])} className="hidden" />
              </label>
              {diagramFile && (
                <button onClick={() => setDiagramFile(null)} className="text-xs text-slate-500 hover:text-red-400">Remove</button>
              )}
            </div>
            {modal !== 'add' && modal?.diagram_path && !diagramFile && (
              <div className="mt-2">
                <p className="text-xs text-accent-blue mb-1">Current diagram:</p>
                <img src={uploadUrl(modal.diagram_path)} alt="Diagram" className="max-h-32 rounded-lg border border-white/10" />
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || (uploadMode === 'excel' && !excelFile && modal === 'add')}
              className="px-4 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
