import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api, uploadUrl } from '../lib/api';
import Modal from '../components/Modal';
import SortButtons from '../components/SortButtons';
import { Pencil, Trash2, Plus, Image, Sparkles, Save } from 'lucide-react';
import { useDomains, getDomain } from '../lib/domains';
import toast from 'react-hot-toast';

const emptyForm = { title: '', domain: 'workforce_planning', description: '', embed_url: '', status: 'coming_soon' };

export default function AdminDashboards() {
  const { data: dashboards, isLoading } = useSWR('/dashboards', fetcher);
  const { data: settings } = useSWR('/settings/all', fetcher);
  const { domains } = useDomains();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaSaving, setFigmaSaving] = useState(false);

  useEffect(() => {
    if (settings?.dashboards_figma_url) setFigmaUrl(settings.dashboards_figma_url);
  }, [settings]);

  const saveFigmaUrl = async () => {
    setFigmaSaving(true);
    try {
      await api.put('/settings', { dashboards_figma_url: figmaUrl });
      toast.success('Figma URL saved');
      mutate('/settings/all');
      mutate('/settings');
    } catch (err) { toast.error(err.message); }
    finally { setFigmaSaving(false); }
  };

  const openAdd = () => { setForm(emptyForm); setImageFile(null); setModal('add'); };
  const openEdit = (d) => {
    setForm({
      title: d.title,
      domain: d.domain,
      description: d.description || '',
      embed_url: d.embed_url || '',
      status: d.status,
    });
    setImageFile(null);
    setModal(d);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('domain', form.domain);
      fd.append('description', form.description);
      fd.append('embed_url', form.embed_url);
      fd.append('status', form.status);
      if (imageFile) fd.append('image', imageFile);

      if (modal === 'add') {
        await api.post('/dashboards', fd);
        toast.success('Dashboard created');
      } else {
        await api.put(`/dashboards/${modal.id}`, fd);
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

  const handleMove = async (fromIdx, toIdx) => {
    const items = [...(dashboards || [])];
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    // Optimistic update
    mutate('/dashboards', items, false);
    try {
      await api.post('/dashboards/reorder', { ids: items.map(d => d.id) });
      mutate('/dashboards');
    } catch (err) { toast.error('Reorder failed'); mutate('/dashboards'); }
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

      {/* Global Figma Immersive Experience URL */}
      <div className="glass rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-white">Immersive Experience (Figma)</span>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Set a Figma prototype URL to show an "Immersive Experience" button at the top of the Observation Deck page.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={figmaUrl}
            onChange={e => setFigmaUrl(e.target.value)}
            placeholder="https://www.figma.com/proto/..."
            className="flex-1 px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={saveFigmaUrl}
            disabled={figmaSaving}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 text-sm font-semibold hover:bg-purple-500/20 disabled:opacity-50"
          >
            <Save size={14} />
            {figmaSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="w-10 px-2 py-3"></th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Domain</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Image</th>
              <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(dashboards || []).map((d, i) => (
              <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-2 py-3">
                  <SortButtons index={i} total={(dashboards || []).length} onMove={handleMove} />
                </td>
                <td className="px-4 py-3 text-white font-medium">{d.title}</td>
                <td className="px-4 py-3 text-slate-400">{getDomain(d.domain).label}</td>
                <td className="px-4 py-3 text-slate-400">{statusLabel[d.status] || d.status}</td>
                <td className="px-4 py-3">
                  {d.image_path ? (
                    <span className="inline-flex items-center gap-1 text-xs text-accent-blue"><Image size={12} /> Yes</span>
                  ) : (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </td>
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

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Dashboard' : 'Edit Dashboard'} wide>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Domain</label>
              <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50">
                {domains.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
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
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Dashboard Image (PNG, JPG)</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue/15 border border-accent-blue/30 text-accent-blue text-sm font-semibold cursor-pointer hover:bg-accent-blue/20 transition-colors">
                <Image size={16} />
                {imageFile ? imageFile.name : 'Choose image…'}
                <input type="file" accept=".png,.jpg,.jpeg" onChange={e => setImageFile(e.target.files[0])} className="hidden" />
              </label>
              {imageFile && (
                <button onClick={() => setImageFile(null)} className="text-xs text-slate-500 hover:text-red-400">Remove</button>
              )}
            </div>
            {modal !== 'add' && modal?.image_path && !imageFile && (
              <div className="mt-2">
                <p className="text-xs text-accent-blue mb-1">Current image:</p>
                <img src={uploadUrl(modal.image_path)} alt="Dashboard" className="max-h-24 rounded-lg border border-white/10" />
              </div>
            )}
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
