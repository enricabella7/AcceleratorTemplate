import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api } from '../lib/api';
import Modal from '../components/Modal';
import { Pencil, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { title: '', icon: '🤖', description: '', tags: '', demo_url: '', has_builtin_demo: false };

export default function AdminAIUseCases() {
  const { data: useCases } = useSWR('/ai-use-cases/all', fetcher);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = (uc) => {
    setForm({
      title: uc.title, icon: uc.icon || '🤖', description: uc.description || '',
      tags: (uc.tags || []).join(', '), demo_url: uc.demo_url || '',
      has_builtin_demo: !!uc.has_builtin_demo,
    });
    setModal(uc);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const body = { ...form, tags };
      if (modal === 'add') {
        await api.post('/ai-use-cases', body);
        toast.success('Use case created');
      } else {
        await api.put(`/ai-use-cases/${modal.id}`, body);
        toast.success('Use case updated');
      }
      mutate('/ai-use-cases/all');
      mutate('/ai-use-cases');
      setModal(null);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this use case?')) return;
    await api.delete(`/ai-use-cases/${id}`);
    toast.success('Deleted');
    mutate('/ai-use-cases/all');
    mutate('/ai-use-cases');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl text-white">AI Use Cases</h3>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-blue-600">
          <Plus size={16} /> Add Use Case
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Icon</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Built-in Demo</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Enabled</th>
              <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(useCases || []).map(uc => (
              <tr key={uc.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xl">{uc.icon}</td>
                <td className="px-4 py-3 text-white font-medium">{uc.title}</td>
                <td className="px-4 py-3 text-slate-400">{uc.has_builtin_demo ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-slate-400">{uc.enabled ? '✓' : '✗'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(uc)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(uc.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add AI Use Case' : 'Edit AI Use Case'}>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Icon</label>
              <input type="text" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm text-center focus:outline-none focus:border-accent-blue/50" />
            </div>
            <div className="col-span-3">
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Tags (comma-separated)</label>
            <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">External Demo URL (optional)</label>
            <input type="url" value={form.demo_url} onChange={e => setForm(f => ({ ...f, demo_url: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.has_builtin_demo} onChange={e => setForm(f => ({ ...f, has_builtin_demo: e.target.checked }))} className="rounded" />
            <span className="text-sm text-slate-300">Enable built-in demo (JD Generator)</span>
          </label>
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
