import { sanitizeForFirestore } from '../lib/firestoreUtils';
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Shield, Trash2, ChevronRight, Save, Loader2, Moon, Globe, Key, AlertCircle, Monitor, Database, Link2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { Combobox } from '../components/ui/Combobox';
import { COUNTRIES, TIMEZONES, CURRENCIES, LANGUAGES, DATE_FORMATS, NUMBER_FORMATS, INDUSTRIES, COMPANY_SIZES } from '../lib/constants';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';

import { SessionsTab } from './settings/SessionsTab';
import { PrivacyTab } from './settings/PrivacyTab';
import { IntegrationsTab } from './settings/IntegrationsTab';

type SettingsTab = 'notifications' | 'security' | 'preferences' | 'appearance' | 'sessions' | 'privacy' | 'integrations';

export function Settings() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<any>({
    
    notifications: {
      weeklyReports: true, aiAlerts: true, productUpdates: false, emailNotifications: true,
      pushNotifications: false, browserNotifications: false, forecastAlerts: true,
      datasetUploadAlerts: true, systemMaintenanceAlerts: true
    },
    appearance: {
      theme: 'dark', accentColor: 'green', roundedCorners: true, compactMode: false,
      animations: true, reducedMotion: false, fontSize: 'medium'
    },
    preferences: {
      country: '', timezone: '', currency: '', language: '', dateFormat: '',
      numberFormat: '', weekStart: 'monday', measurementSystem: 'metric',
      twentyFourHourTime: false, autosaveInterval: 5
    }
  });

  const originalData = useRef<any>(null);

  useEffect(() => {
    const hash = location.hash.replace('#', '') as SettingsTab;
    if (['notifications', 'security', 'preferences', 'appearance', 'sessions', 'privacy', 'integrations'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      setIsLoading(true);
      
      try {
        const tabs = ['notifications', 'appearance', 'preferences'];
        const newData = { ...formData };
        
        for (const tab of tabs) {
          const docRef = doc(db, 'users', user.id, 'settings', tab);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            newData[tab] = { ...newData[tab], ...docSnap.data() };
          }
        }
        
        setFormData(newData);
        originalData.current = JSON.stringify(newData);
      } catch (err) {
        console.error('Failed to load settings:', err);
        toast.error('Failed to load settings.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);

  useEffect(() => {
    if (originalData.current) {
      setHasChanges(JSON.stringify(formData) !== originalData.current);
    }
  }, [formData]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const { preferences, setPreferences, savePreferences, savedPreferences } = useTheme();
  
  const handleUpdate = (tab: string, field: string, value: any) => {
    setFormData((prev: any) => {
      const newData = {
        ...prev,
        [tab]: {
          ...prev[tab],
          [field]: value
        }
      };
      
      // Update theme context immediately for preview
      if (tab === 'appearance') {
        setTimeout(() => setPreferences(newData.appearance), 0);
      }
      
      return newData;
    });
  };

  const handleCountryChange = (countryCode: string) => {
    const matchedCountry = COUNTRIES.find(c => c.code === countryCode);
    if (matchedCountry) {
      setFormData((prev: any) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          country: countryCode,
          currency: matchedCountry.currency,
          timezone: matchedCountry.timezone,
          language: matchedCountry.language,
          dateFormat: matchedCountry.dateFormat,
          numberFormat: matchedCountry.numberFormat
        }
      }));
    } else {
      handleUpdate('preferences', 'country', countryCode);
    }
  };

  const validate = () => {
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasChanges) return;
    if (!validate()) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const docRef = doc(db, 'users', user.id, 'settings', activeTab);
      await setDoc(docRef, sanitizeForFirestore(formData[activeTab]), { merge: true });
      
      if (['preferences'].includes(activeTab)) {
        try {
           await updateProfile(formData[activeTab]);
        } catch (e) {
           console.warn('Silent local state update failed', e);
        }
      }

      originalData.current = JSON.stringify(formData);
      setHasChanges(false);
      setSaveSuccess(true);
      toast.success('Settings saved successfully.');
      
      import('../lib/NotificationService').then(({ NotificationService }) => {
        NotificationService.createNotification(user.id, {
          title: 'Settings Updated',
          description: `Your ${activeTab} settings have been updated successfully.`,
          type: 'system',
          priority: 'success'
        }).catch(console.warn);
      });

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (getPasswordStrength(newPassword) < 5) {
      toast.error('Password does not meet strength requirements.');
      return;
    }
    setSecurityLoading(true);
    try {
      if (!auth.currentUser || !auth.currentUser.email) throw new Error('No user found');
      const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
      toast.success('Password updated successfully.');
      
      import('../lib/NotificationService').then(({ NotificationService }) => {
        if (auth.currentUser) {
          NotificationService.createNotification(auth.currentUser.uid, {
            title: 'Security Alert',
            description: 'Your account password was recently changed. If this wasn\'t you, please contact support immediately.',
            type: 'system',
            priority: 'warning'
          }).catch(console.warn);
        }
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update password. Please check your current password.');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (prompt('Type DELETE to confirm account deletion:') !== 'DELETE') {
      toast.error('Confirmation failed.');
      return;
    }
    try {
      if (!auth.currentUser) return;
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      await deleteUser(auth.currentUser);
      await logout();
      navigate('/');
      toast.success('Account deleted.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete account. Please try logging in again.');
    }
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'sessions', label: 'Sessions', icon: Monitor },
    { id: 'privacy', label: 'Data & Privacy', icon: Database },
    { id: 'integrations', label: 'Connected Accounts', icon: Link2 },
  ] as const;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[var(--color-brand-primary)] animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-[var(--color-brand-text)] mb-1">Settings</h1>
        <p className="text-[var(--color-brand-muted)] text-sm">Manage your account and workspace preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (hasChanges && !window.confirm('You have unsaved changes. Discard?')) return;
                  if (hasChanges) setFormData(JSON.parse(originalData.current));
                  
                  setActiveTab(tab.id as SettingsTab);
                  navigate(`#${tab.id}`, { replace: true });
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                  activeTab === tab.id 
                    ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/20" 
                    : "text-[var(--color-brand-muted)] hover:bg-[var(--color-brand-card)] hover:text-[var(--color-brand-text)] border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </div>
                {activeTab === tab.id && <ChevronRight className="w-4 h-4" />}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <form onSubmit={handleSave} className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden relative min-h-[500px]">
            <AnimatePresence mode="wait">
              

              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 pb-20">
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-1">Security</h2>
                    <p className="text-sm text-[var(--color-brand-muted)]">Keep your account secure.</p>
                  </div>
                  
                  <div className="space-y-4 pb-6 border-b border-[var(--color-brand-border)]">
                    <h3 className="text-sm font-medium text-[var(--color-brand-text)] flex items-center gap-2"><Key className="w-4 h-4 text-[var(--color-brand-primary)]"/> Change Password</h3>
                    <div className="grid grid-cols-1 gap-4 max-w-sm">
                      <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current Password" className="w-full px-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all" />
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="w-full px-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all" />
                      {newPassword && (
                        <div className="flex gap-1 mt-1">
                           {[1,2,3,4,5].map(i => (
                             <div key={i} className={`h-1.5 flex-1 rounded-full ${getPasswordStrength(newPassword) >= i ? 'bg-[var(--color-brand-primary)]' : 'bg-[var(--color-brand-border)]'}`}></div>
                           ))}
                        </div>
                      )}
                      <p className="text-xs text-[var(--color-brand-muted)]">Must be 8+ chars, uppercase, lowercase, number, special char.</p>
                      
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full px-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all" />
                      
                      <button type="button" onClick={handleChangePassword} disabled={securityLoading || !currentPassword || !newPassword || !confirmPassword} className="px-4 py-2 bg-[var(--color-brand-bg)] text-[var(--color-brand-text)] text-sm font-medium rounded-xl border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)] transition-all mt-2 self-start disabled:opacity-50">
                        {securityLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-medium text-red-500 flex items-center gap-2"><Trash2 className="w-4 h-4"/> Danger Zone</h3>
                    <p className="text-xs text-[var(--color-brand-muted)]">Permanently delete your account and all of your data.</p>
                    <button type="button" onClick={handleDeleteAccount} className="px-4 py-2 bg-red-500/10 text-red-500 text-sm font-medium rounded-xl border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50 transition-all self-start">
                      Delete Account
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'appearance' && (
                <motion.div key="appearance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-20">
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-1">Appearance</h2>
                    <p className="text-sm text-[var(--color-brand-muted)]">Customize how InsightIQ looks on your device.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-[var(--color-brand-border)]">
                    <button type="button" onClick={() => handleUpdate('appearance', 'theme', 'dark')} className={`p-4 rounded-xl border-2 bg-[var(--color-brand-bg)] text-left flex flex-col gap-3 group transition-colors ${formData.appearance.theme === 'dark' ? 'border-[var(--color-brand-primary)]' : 'border-[var(--color-brand-border)] hover:border-[var(--color-brand-muted)]'}`}>
                      <div className="w-full h-24 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center mb-2 overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black"></div>
                         <div className="w-3/4 h-3/4 bg-gray-900 border border-gray-700 rounded shadow-sm relative z-10"></div>
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-[var(--color-brand-text)] mb-1">Dark Mode</span>
                        <span className="block text-xs text-[var(--color-brand-muted)]">Premium default dark theme</span>
                      </div>
                    </button>
                    <button type="button" onClick={() => handleUpdate('appearance', 'theme', 'light')} className={`p-4 rounded-xl border-2 bg-[var(--color-brand-bg)] text-left flex flex-col gap-3 group transition-colors ${formData.appearance.theme === 'light' ? 'border-[var(--color-brand-primary)]' : 'border-[var(--color-brand-border)] hover:border-[var(--color-brand-muted)]'}`}>
                      <div className="w-full h-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mb-2 overflow-hidden relative">
                         <div className="absolute inset-0 bg-white"></div>
                         <div className="w-3/4 h-3/4 bg-white border border-gray-200 rounded shadow-sm relative z-10"></div>
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-[var(--color-brand-text)] mb-1">Light Mode</span>
                        <span className="block text-xs text-[var(--color-brand-muted)]">Clean bright theme</span>
                      </div>
                    </button>
                    <button type="button" onClick={() => handleUpdate('appearance', 'theme', 'system')} className={`p-4 rounded-xl border-2 bg-[var(--color-brand-bg)] text-left flex flex-col gap-3 group transition-colors ${formData.appearance.theme === 'system' ? 'border-[var(--color-brand-primary)]' : 'border-[var(--color-brand-border)] hover:border-[var(--color-brand-muted)]'}`}>
                      <div className="w-full h-24 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-2 overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600"></div>
                         <div className="w-3/4 h-3/4 bg-white/10 backdrop-blur border border-white/20 rounded shadow-sm relative z-10"></div>
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-[var(--color-brand-text)] mb-1">System Default</span>
                        <span className="block text-xs text-[var(--color-brand-muted)]">Matches OS settings</span>
                      </div>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-3">Accent Color</label>
                        <div className="flex gap-3">
                           {['green', 'blue', 'purple', 'cyan'].map(color => (
                              <button key={color} type="button" onClick={() => handleUpdate('appearance', 'accentColor', color)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${formData.appearance.accentColor === color ? 'ring-2 ring-offset-2 ring-offset-[var(--color-brand-bg)] ring-white' : 'hover:scale-110'}`}>
                                 <span className={`w-full h-full rounded-full ${color === 'green' ? 'bg-[#12D18E]' : color === 'blue' ? 'bg-blue-500' : color === 'purple' ? 'bg-purple-500' : 'bg-cyan-500'}`}></span>
                              </button>
                           ))}
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-3">Font Size</label>
                        <div className="flex gap-2">
                           {['small', 'medium', 'large'].map(size => (
                              <button key={size} type="button" onClick={() => handleUpdate('appearance', 'fontSize', size)} className={`px-4 py-1.5 rounded-lg text-sm transition-all ${formData.appearance.fontSize === size ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-medium' : 'bg-[var(--color-brand-bg)] text-[var(--color-brand-muted)] border border-[var(--color-brand-border)] hover:text-[var(--color-brand-text)]'}`}>
                                 {size.charAt(0).toUpperCase() + size.slice(1)}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-[var(--color-brand-border)]">
                     {[
                       { id: 'roundedCorners', title: 'Rounded Corners', desc: 'Use softer, rounded corners on UI elements.' },
                       { id: 'compactMode', title: 'Compact Mode', desc: 'Reduce padding and margins to fit more content.' },
                       { id: 'animations', title: 'Enable Animations', desc: 'Show transition effects when navigating.' },
                       { id: 'reducedMotion', title: 'Reduced Motion', desc: 'Minimize animations for accessibility.' }
                     ].map((item) => (
                       <div key={item.id} className="flex items-center justify-between">
                         <div>
                           <p className="font-medium text-[var(--color-brand-text)] text-sm">{item.title}</p>
                           <p className="text-xs text-[var(--color-brand-muted)] mt-1">{item.desc}</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" className="sr-only peer" checked={formData.appearance[item.id]} onChange={e => handleUpdate('appearance', item.id, e.target.checked)} />
                           <div className="w-9 h-5 bg-[var(--color-brand-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-brand-primary)]"></div>
                         </label>
                       </div>
                     ))}
                  </div>

                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div key="preferences" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-20">
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-1">Preferences</h2>
                    <p className="text-sm text-[var(--color-brand-muted)]">Customize your experience.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Country</label>
                      <Combobox
                        options={COUNTRIES.map(c => ({ value: c.code, label: c.name }))}
                        value={formData.preferences.country}
                        onChange={handleCountryChange}
                        placeholder="Select Country"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Timezone</label>
                      <Combobox
                        options={TIMEZONES.map(t => ({ value: t, label: t }))}
                        value={formData.preferences.timezone}
                        onChange={val => handleUpdate('preferences', 'timezone', val)}
                        placeholder="Select Timezone"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Currency</label>
                      <Combobox
                        options={CURRENCIES.map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` }))}
                        value={formData.preferences.currency}
                        onChange={val => handleUpdate('preferences', 'currency', val)}
                        placeholder="Select Currency"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Language</label>
                      <Combobox
                        options={LANGUAGES.map(l => ({ value: l, label: l }))}
                        value={formData.preferences.language}
                        onChange={val => handleUpdate('preferences', 'language', val)}
                        placeholder="Select Language"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Date Format</label>
                      <Combobox
                        options={DATE_FORMATS.map(f => ({ value: f, label: f }))}
                        value={formData.preferences.dateFormat}
                        onChange={val => handleUpdate('preferences', 'dateFormat', val)}
                        placeholder="Select Date Format"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Number Format</label>
                      <Combobox
                        options={NUMBER_FORMATS.map(f => ({ value: f, label: f }))}
                        value={formData.preferences.numberFormat}
                        onChange={val => handleUpdate('preferences', 'numberFormat', val)}
                        placeholder="Select Number Format"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Week Start</label>
                      <Combobox
                        options={[{value: 'sunday', label: 'Sunday'}, {value: 'monday', label: 'Monday'}]}
                        value={formData.preferences.weekStart}
                        onChange={val => handleUpdate('preferences', 'weekStart', val)}
                        placeholder="Select Week Start"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Measurement System</label>
                      <Combobox
                        options={[{value: 'metric', label: 'Metric'}, {value: 'imperial', label: 'Imperial'}]}
                        value={formData.preferences.measurementSystem}
                        onChange={val => handleUpdate('preferences', 'measurementSystem', val)}
                        placeholder="Select Measurement System"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 pt-4 border-t border-[var(--color-brand-border)]">
                     <div className="flex items-center justify-between">
                         <div>
                           <p className="font-medium text-[var(--color-brand-text)] text-sm">24-Hour Time</p>
                           <p className="text-xs text-[var(--color-brand-muted)] mt-1">Use 24-hour format instead of AM/PM.</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" className="sr-only peer" checked={formData.preferences.twentyFourHourTime} onChange={e => handleUpdate('preferences', 'twentyFourHourTime', e.target.checked)} />
                           <div className="w-9 h-5 bg-[var(--color-brand-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-brand-primary)]"></div>
                         </label>
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-20">
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-1">Notifications</h2>
                    <p className="text-sm text-[var(--color-brand-muted)]">Manage how you receive alerts.</p>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'weeklyReports', title: 'Weekly Reports', desc: 'Receive a summary of your workspace performance.' },
                      { id: 'aiAlerts', title: 'AI Alerts', desc: 'Get notified immediately when AI detects data anomalies.' },
                      { id: 'productUpdates', title: 'Product Updates', desc: 'Hear about new features and improvements.' },
                      { id: 'emailNotifications', title: 'Email Notifications', desc: 'Send alerts directly to your email.' },
                      { id: 'pushNotifications', title: 'Push Notifications', desc: 'Enable push notifications on your devices.' },
                      { id: 'browserNotifications', title: 'Browser Notifications', desc: 'Show desktop notifications in browser.' },
                      { id: 'forecastAlerts', title: 'Forecast Alerts', desc: 'Get notified when forecasts change significantly.' },
                      { id: 'datasetUploadAlerts', title: 'Dataset Upload Alerts', desc: 'Notifications for successful dataset imports.' },
                      { id: 'systemMaintenanceAlerts', title: 'System Maintenance Alerts', desc: 'Important notices about planned downtime.' }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl">
                        <div>
                          <p className="font-medium text-[var(--color-brand-text)] text-sm">{item.title}</p>
                          <p className="text-xs text-[var(--color-brand-muted)] mt-1">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={formData.notifications[item.id]} onChange={e => handleUpdate('notifications', item.id, e.target.checked)} />
                          <div className="w-9 h-5 bg-[var(--color-brand-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-brand-primary)]"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'sessions' && <SessionsTab />}
              {activeTab === 'privacy' && <PrivacyTab />}
              {activeTab === 'integrations' && <IntegrationsTab />}
            </AnimatePresence>

            {/* Save Button (Sticky to bottom) */}
            {['appearance', 'preferences', 'notifications'].includes(activeTab) && (
              <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 bg-[var(--color-brand-card)]/90 backdrop-blur border-t border-[var(--color-brand-border)] flex justify-between items-center z-10">
                <div className="flex items-center">
                  {hasChanges ? (
                    <span className="text-sm text-[#FFBD2E] font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Unsaved changes
                    </span>
                  ) : saveSuccess ? (
                    <span className="text-sm text-[var(--color-brand-primary)] font-medium">
                      Settings saved successfully
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      const restored = JSON.parse(originalData.current);
                      setFormData(restored);
                      setPreferences(restored.appearance);
                    }}
                    disabled={!hasChanges || isSaving}
                    className="px-4 py-2 text-[var(--color-brand-muted)] font-medium hover:text-[var(--color-brand-text)] transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving || !hasChanges}
                    className="px-6 py-2 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-semibold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all flex items-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
