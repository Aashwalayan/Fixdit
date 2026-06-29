import React, { useEffect, useState } from 'react';
import { Moon, SunMedium, Palette, Shield, BellRing, Save } from 'lucide-react';

interface SettingsPanelProps {
  token: string;
  user: any;
  onUserUpdated: (user: any) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ token, user, onUserUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: user?.username || '',
    displayName: user?.displayName || '',
    profilePicture: user?.profilePicture || '',
    anonymousReportingDefault: !!user?.anonymousReportingDefault,
    showProfilePublicly: user?.showProfilePublicly !== false,
    showActivity: user?.showActivity !== false,
    notificationPreferences: {
      emailNotifications: user?.notificationPreferences?.emailNotifications !== false,
      pushNotifications: !!user?.notificationPreferences?.pushNotifications,
      commentNotifications: user?.notificationPreferences?.commentNotifications !== false,
      statusUpdates: user?.notificationPreferences?.statusUpdates !== false,
      officialUpdates: user?.notificationPreferences?.officialUpdates !== false,
    },
  });
  const [theme, setTheme] = useState(localStorage.getItem('fixdit_theme') || 'System');

  useEffect(() => {
    localStorage.setItem('fixdit_theme', theme);
    document.documentElement.dataset.fixditTheme = theme.toLowerCase().replace(/\s+/g, '-');
  }, [theme]);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not save settings.');
      }

      onUserUpdated(data.user);
      setMessage('Settings saved successfully.');
    } catch (saveError: any) {
      setError(saveError.message || 'Unable to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Settings</p>
        <h3 className="text-xl font-black text-slate-950 mt-1">Personalize your Fixdit experience</h3>
      </div>

      {message && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">{message}</div>}
      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">{error}</div>}

      <form onSubmit={saveSettings} className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900"><Palette className="w-4 h-4 text-orange-500" />Appearance</div>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm">
            <option>Light</option>
            <option>Dark</option>
            <option>System</option>
            <option>Fixdit Orange</option>
            <option>Midnight Blue</option>
            <option>Forest Green</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Username</span>
            <input value={form.username} onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Name</span>
            <input value={form.displayName} onChange={(e) => setForm((current) => ({ ...current, displayName: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile Picture URL</span>
            <input value={form.profilePicture} onChange={(e) => setForm((current) => ({ ...current, profilePicture: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200">
            <div>
              <div className="text-sm font-bold text-slate-900">Anonymous reporting default</div>
              <div className="text-xs text-slate-500">Prefill new reports as anonymous.</div>
            </div>
            <input type="checkbox" checked={form.anonymousReportingDefault} onChange={(e) => setForm((current) => ({ ...current, anonymousReportingDefault: e.target.checked }))} />
          </label>
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200">
            <div>
              <div className="text-sm font-bold text-slate-900">Show profile publicly</div>
              <div className="text-xs text-slate-500">Let other users see your public identity.</div>
            </div>
            <input type="checkbox" checked={form.showProfilePublicly} onChange={(e) => setForm((current) => ({ ...current, showProfilePublicly: e.target.checked }))} />
          </label>
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200">
            <div>
              <div className="text-sm font-bold text-slate-900">Show activity</div>
              <div className="text-xs text-slate-500">Display community activity on your profile.</div>
            </div>
            <input type="checkbox" checked={form.showActivity} onChange={(e) => setForm((current) => ({ ...current, showActivity: e.target.checked }))} />
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900"><BellRing className="w-4 h-4 text-orange-500" />Notifications</div>
          {Object.entries(form.notificationPreferences).map(([key, value]) => (
            <label key={key} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200">
              <span className="text-sm font-semibold text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    notificationPreferences: {
                      ...current.notificationPreferences,
                      [key]: e.target.checked,
                    },
                  }))
                }
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm flex items-center gap-2 disabled:bg-slate-300">
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
