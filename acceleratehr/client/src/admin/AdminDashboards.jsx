import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api } from '../lib/api';
import Modal from '../components/Modal';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { DOMAINS, getDomain } from '../lib/domains';
import toast from 'react-hot-toast';

const emptyForm = { title: '', domain: 'workforce_planning', description: '', embed_url: '', status: 'coming_soon' };

export default function AdminDashboards() {
  const { data: dashboards, isLoading } = useSWR('/dashboards', fetcher);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = (d) => { setForm({ title: d.title, domain: d.domain, description: d.description || '', embed_url: d.embed_url || '', status: d.status }); setModal(d); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/dashboards', form);
        toast.success('Dashboard created');
      } else {
        await api.put(`/dashboards/${modal.id}`, form);
        toast.success('Dashboard updated');
      }
      mutate('/dashboards');
      setModal(null);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this dashboard?')) return;
    await api.delete(`/dashboards/${id}`);
    toast.success('Deleted');
    mutate('/dashboards');
  };

  const statusLabel = { live: 'Live', preview: 'Preview', coming_soon: 'Coming Soon' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl text-white">Dashboards</h3>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-blue-600">
          <Plus size={16} /> Add Dashboard
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Domain</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Embed URL</th>
              <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(dashboards || []).map(d => (
              <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white font-medium">{d.title}</td>
                <td className="px-4 py-3 text-slate-400">{getDomain(d.domain).label}</td>
                <td className="px-4 py-3 text-slate-400">{statusLabel[d.status] || d.status}</td>
                <td className="px-4 py-3 text-slate-400 truncate max-w-[200px]">{d.embed_url || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Dashboard' : 'Edit Dashboard'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Domain</label>
              <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50">
                {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50">
                <option value="live">Live</option>
                <option value="preview">Preview</option>
                <option value="coming_soon">Coming Soon</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Embed URL (optional)</label>
            <input type="url" value={form.embed_url} onChange={e => setForm(f => ({ ...f, embed_url: e.target.value }))} placeholder="https://app.powerbi.com/..." className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title} className="px-4 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
