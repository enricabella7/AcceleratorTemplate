import { useState, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api } from '../lib/api';
import Modal from '../components/Modal';
import { Pencil, Trash2, Plus, Upload, Download } from 'lucide-react';
import { DOMAINS, getDomain } from '../lib/domains';
import toast from 'react-hot-toast';

const emptyForm = { name: '', domain: 'workforce_planning', definition: '', formula: '', benchmark: '', frequency: 'Monthly', importance: '' };

export default function AdminKpis() {
  const { data: kpis } = useSWR('/kpis', fetcher);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = (k) => {
    setForm({ name: k.name, domain: k.domain, definition: k.definition || '', formula: k.formula || '', benchmark: k.benchmark || '', frequency: k.frequency || 'Monthly', importance: k.importance || '' });
    setModal(k);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/kpis', form);
        toast.success('KPI created');
      } else {
        await api.put(`/kpis/${modal.id}`, form);
        toast.success('KPI updated');
      }
      mutate('/kpis');
      setModal(null);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this KPI?')) return;
    await api.delete(`/kpis/${id}`);
    toast.success('Deleted');
    mutate('/kpis');
  };

  const downloadTemplate = () => {
    const csv = 'name,domain,definition,formula,benchmark,frequency,importance\n"Time to Fill","talent_acquisition","Average days to fill a position","SUM(days) / fills","30-45 days","Monthly","Hiring velocity indicator"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kpi-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) { toast.error('CSV must have a header and at least one row'); return; }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const kpiList = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^,]+)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
      const row = {};
      headers.forEach((h, j) => { row[h] = values[j] || ''; });
      if (row.name && row.domain) kpiList.push(row);
    }

    if (!kpiList.length) { toast.error('No valid KPIs found in CSV'); return; }

    try {
      const res = await api.post('/kpis/import', { kpis: kpiList });
      toast.success(`Imported ${res.imported} KPIs`);
      mutate('/kpis');
    } catch (err) { toast.error(err.message); }
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-display text-xl text-white">KPI Manager</h3>
        <div className="flex gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10">
            <Download size={14} /> CSV Template
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10">
            <Upload size={14} /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-blue-600">
            <Plus size={16} /> Add KPI
          </button>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Domain</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Frequency</th>
                <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(kpis || []).map(k => (
                <tr key={k.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium">{k.name}</td>
                  <td className="px-4 py-3 text-slate-400">{getDomain(k.domain).label}</td>
                  <td className="px-4 py-3 text-slate-400">{k.frequency}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(k)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(k.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add KPI' : 'Edit KPI'} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Domain</label>
              <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50">
                {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Definition</label>
            <textarea value={form.definition} onChange={e => setForm(f => ({ ...f, definition: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Formula</label>
              <input type="text" value={form.formula} onChange={e => setForm(f => ({ ...f, formula: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-accent-blue/50" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Benchmark</label>
              <input type="text" value={form.benchmark} onChange={e => setForm(f => ({ ...f, benchmark: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Frequency</label>
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50">
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Semi-annually</option>
              <option>Annually</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Strategic Importance</label>
            <textarea value={form.importance} onChange={e => setForm(f => ({ ...f, importance: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name} className="px-4 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
