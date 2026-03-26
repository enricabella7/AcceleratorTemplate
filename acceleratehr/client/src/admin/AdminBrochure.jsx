import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api } from '../lib/api';
import Modal from '../components/Modal';
import { Pencil, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminBrochure() {
  const { data: assets, isLoading } = useSWR('/brochure/all', fetcher);
  const [modal, setModal] = useState(null); // null | 'add' | asset object
  const [form, setForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setForm({ title: '', description: '' });
    setFile(null);
    setModal('add');
  };

  const openEdit = (asset) => {
    setForm({ title: asset.title, description: asset.description || '' });
    setFile(null);
    setModal(asset);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') {
        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('description', form.description);
        if (file) fd.append('file', file);
        await api.post('/brochure', fd);
        toast.success('Asset uploaded');
      } else {
        await api.put(`/brochure/${modal.id}`, form);
        toast.success('Asset updated');
      }
      mutate('/brochure/all');
      mutate('/brochure');
      setModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this asset?')) return;
    await api.delete(`/brochure/${id}`);
    toast.success('Asset deleted');
    mutate('/brochure/all');
    mutate('/brochure');
  };

  const toggleVisibility = async (asset) => {
    await api.put(`/brochure/${asset.id}`, { visible: asset.visible ? 0 : 1 });
    mutate('/brochure/all');
    mutate('/brochure');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl text-white">Brochure Assets</h3>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-blue-600 transition-colors">
          <Plus size={16} /> Add Asset
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Size</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Visible</th>
              <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(assets || []).map(asset => (
              <tr key={asset.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white font-medium">{asset.title}</td>
                <td className="px-4 py-3 text-slate-400">{asset.file_type || '—'}</td>
                <td className="px-4 py-3 text-slate-400">{asset.file_size || '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleVisibility(asset)} className={`p-1 rounded ${asset.visible ? 'text-green-400' : 'text-slate-600'}`}>
                    {asset.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(asset)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(asset.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !assets?.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No assets yet. Click "Add Asset" to upload.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Upload Asset' : 'Edit Asset'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          {modal === 'add' && (
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">File</label>
              <input type="file" accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files[0])} className="text-sm text-slate-400" />
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title} className="px-4 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
