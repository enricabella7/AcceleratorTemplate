import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api } from '../lib/api';
import Modal from '../components/Modal';
import { Pencil, Trash2, Plus, GripVertical } from 'lucide-react';
import { ICON_OPTIONS, getIcon } from '../lib/domains';
import toast from 'react-hot-toast';

const emptyForm = { id: '', label: '', color: '#3B82F6', icon: 'Folder' };

export default function AdminDomains() {
  const { data: domains } = useSWR('/domains', fetcher);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = (d) => {
    setForm({ id: d.id, label: d.label, color: d.color || '#3B82F6', icon: d.icon || 'Folder' });
    setModal(d);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/domains', form);
        toast.success('Domain created');
      } else {
        await api.put(`/domains/${modal.id}`, { label: form.label, color: form.color, icon: form.icon });
        toast.success('Domain updated');
      }
      mutate('/domains');
      setModal(null);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this domain? Content using this domain will still exist but may show a generic label.')) return;
    await api.delete(`/domains/${id}`);
    toast.success('Deleted');
    mutate('/domains');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-xl text-white">Domains</h3>
          <p className="text-sm text-slate-500 mt-1">Configure the content domains/categories used across the portal.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-blue-600">
          <Plus size={16} /> Add Domain
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Domain</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">ID</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Color</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Icon</th>
              <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(domains || []).map(d => {
              const Icon = getIcon(d.icon);
              return (
                <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: d.color }}>
                        <Icon size={14} />
                      </div>
                      <span className="text-white font-medium">{d.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ background: d.color }} />
                      <span className="text-xs text-slate-400">{d.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{d.icon}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Domain' : 'Edit Domain'}>
        <div className="space-y-4">
          {modal === 'add' && (
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Label (used to generate ID)</label>
              <input type="text" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value, id: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_') }))} placeholder="e.g. Workforce Planning" className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
              {form.id && <p className="text-xs text-slate-500 mt-1">ID: <span className="font-mono text-slate-400">{form.id}</span></p>}
            </div>
          )}
          {modal !== 'add' && (
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Label</label>
              <input type="text" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                <input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="flex-1 px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-accent-blue/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Icon</label>
              <select value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50">
                {ICON_OPTIONS.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: form.color }}>
                  {(() => { const I = getIcon(form.icon); return <I size={16} />; })()}
                </div>
                <span className="text-xs text-slate-500">Preview</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.label} className="px-4 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
