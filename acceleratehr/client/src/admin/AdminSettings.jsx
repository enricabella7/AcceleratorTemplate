import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher, api } from '../lib/api';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const { data: settings } = useSWR('/settings/all', fetcher);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  if (settings && !form) {
    setForm({
      portal_title: settings.portal_title || 'AccelerateHR',
      portal_tagline: settings.portal_tagline || '',
      company_name: settings.company_name || '',
      contact_email: settings.contact_email || '',
    });
  }

  const [pwForm, setPwForm] = useState({ current: '', newPw: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', form);
      toast.success('Settings saved');
      mutate('/settings/all');
      mutate('/settings');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (!pwForm.newPw) return;
    setPwSaving(true);
    try {
      await api.put('/settings', { admin_password_hash: pwForm.newPw });
      toast.success('Password updated. Use the new password on next login.');
      setPwForm({ current: '', newPw: '' });
    } catch (err) { toast.error(err.message); }
    finally { setPwSaving(false); }
  };

  if (!form) return null;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h3 className="font-display text-xl text-white mb-4">Portal Settings</h3>
        <div className="glass rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Portal Title</label>
            <input type="text" value={form.portal_title} onChange={e => setForm(f => ({ ...f, portal_title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Tagline</label>
            <input type="text" value={form.portal_tagline} onChange={e => setForm(f => ({ ...f, portal_tagline: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
            <input type="text" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Contact Email</label>
            <input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50">
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl text-white mb-4">Change Admin Password</h3>
        <div className="glass rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
            <input type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50" />
          </div>
          <button onClick={handlePasswordChange} disabled={pwSaving || !pwForm.newPw} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50">
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
