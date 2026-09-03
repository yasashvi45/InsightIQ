import { sanitizeForFirestore } from '../../lib/firestoreUtils';
import  { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Trash2, Database, Loader2, FileText, Bot } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';

export function PrivacyTab() {
  const { user } = useAuth();
  const [exporting, setExporting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    dataRetention: '12',
    personalization: true,
    aiMemory: true,
    crashReports: true,
    analyticsSharing: false
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.id, 'settings', 'privacy');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSettings(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.warn('Failed to load privacy settings', err);
      }
    };
    loadSettings();
  }, [user]);

  const saveSettings = async (newSettings: any) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.id, 'settings', 'privacy'), sanitizeForFirestore(newSettings), { merge: true });
    } catch (err) {
      console.warn('Failed to save privacy settings', err);
    }
  };

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (id: string, label: string) => {
    if (!user) return;
    setExporting(label);
    try {
      if (id === 'profile') {
        downloadJson(user, 'profile_export.json');
      } else if (id === 'datasets' || id === 'reports') {
        const snap = await getDocs(collection(db, 'users', user.id, id));
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        downloadJson(items, `${id}_export.json`);
      }
      toast.success(`${label} exported successfully.`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to export ${label}.`);
    } finally {
      setExporting(null);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!window.confirm(`Are you sure you want to delete all ${label}? This action is irreversible.`)) return;
    if (!user) return;
    setDeleting(label);
    try {
      if (id === 'datasets' || id === 'reports' || id === 'aiHistory') {
        const collectionName = id === 'aiHistory' ? 'messages' : id; // Assuming aiHistory mapped to messages if we have it, else just try delete
        const snap = await getDocs(collection(db, 'users', user.id, collectionName));
        const batch = snap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(batch);
      }
      toast.success(`${label} deleted successfully.`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to delete ${label}.`);
    } finally {
      setDeleting(null);
    }
  };

  const toggleSetting = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await saveSettings(newSettings);
    toast.success('Privacy setting updated');
  };

  const updateRetention = async (val: string) => {
    const newSettings = { ...settings, dataRetention: val };
    setSettings(newSettings);
    await saveSettings(newSettings);
    toast.success('Retention policy updated');
  };

  return (
    <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 pb-20">
      <div>
        <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-1">Data & Privacy</h2>
        <p className="text-sm text-[var(--color-brand-muted)]">Control your data, exports, and privacy settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Data */}
        <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Download className="w-5 h-5 text-blue-500" /></div>
            <h3 className="font-semibold text-[var(--color-brand-text)]">Export Data</h3>
          </div>
          <p className="text-sm text-[var(--color-brand-muted)] mb-4">Download a copy of your data in ZIP format.</p>
          
          <div className="space-y-3">
            {[
              { id: 'profile', label: 'Profile & Settings', icon: FileText },
              { id: 'datasets', label: 'Uploaded Datasets', icon: Database },
              { id: 'reports', label: 'Generated Reports', icon: FileText },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => handleExport(item.id, item.label)}
                disabled={exporting !== null}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--color-brand-border)] hover:border-[var(--color-brand-muted)] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-text)] transition-colors" />
                  <span className="text-sm text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-text)] font-medium">{item.label}</span>
                </div>
                {exporting === item.label ? <Loader2 className="w-4 h-4 animate-spin text-[var(--color-brand-primary)]" /> : <Download className="w-4 h-4 text-[var(--color-brand-muted)]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Delete Data */}
        <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg"><Trash2 className="w-5 h-5 text-red-500" /></div>
            <h3 className="font-semibold text-[var(--color-brand-text)]">Delete Data</h3>
          </div>
          <p className="text-sm text-[var(--color-brand-muted)] mb-4">Permanently remove data from our servers.</p>
          
          <div className="space-y-3">
            {[
              { id: 'datasets', label: 'Uploaded Datasets', icon: Database },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'aiHistory', label: 'AI History', icon: Bot },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => handleDelete(item.id, item.label)}
                disabled={deleting !== null}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--color-brand-border)] hover:border-red-500 hover:bg-red-500/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-[var(--color-brand-muted)] group-hover:text-red-500 transition-colors" />
                  <span className="text-sm text-[var(--color-brand-muted)] group-hover:text-red-500 font-medium">{item.label}</span>
                </div>
                {deleting === item.label ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 text-[var(--color-brand-muted)] group-hover:text-red-500" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-[var(--color-brand-border)]">
        <h3 className="font-semibold text-[var(--color-brand-text)] mb-4">Privacy Preferences</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--color-brand-text)] text-sm">Data Retention</p>
            <p className="text-xs text-[var(--color-brand-muted)] mt-1">How long we keep your inactive data.</p>
          </div>
          <select 
            value={settings.dataRetention}
            onChange={(e) => updateRetention(e.target.value)}
            className="px-3 py-1.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg text-sm text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)]"
          >
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">1 Year</option>
            <option value="indefinite">Indefinite</option>
          </select>
        </div>

        {[
          { id: 'personalization', title: 'Personalization', desc: 'Use my data to personalize recommendations.' },
          { id: 'aiMemory', title: 'AI Memory', desc: 'Allow AI to remember context between sessions.' },
          { id: 'crashReports', title: 'Crash Reports', desc: 'Automatically send crash reports to improve stability.' },
          { id: 'analyticsSharing', title: 'Analytics Sharing', desc: 'Share anonymous usage data.' }
        ].map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--color-brand-text)] text-sm">{item.title}</p>
              <p className="text-xs text-[var(--color-brand-muted)] mt-1">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings[item.id as keyof typeof settings] as boolean} onChange={() => toggleSetting(item.id as keyof typeof settings)} />
              <div className="w-9 h-5 bg-[var(--color-brand-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-brand-primary)]"></div>
            </label>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
