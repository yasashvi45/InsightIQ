import { sanitizeForFirestore } from '../lib/firestoreUtils';
import React, { useState, useEffect, useRef } from 'react';
import { User, Building2, Save, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { Combobox } from '../components/ui/Combobox';
import { ImageUploader } from '../components/ui/ImageUploader';
import { ROLES, INDUSTRIES, COMPANY_SIZES } from '../lib/constants';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type ProfileTab = 'profile' | 'workspace';

export function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<any>({
    profile: {
      name: '', email: '', role: '', avatarUrl: ''
    },
    workspace: {
      businessName: '', industry: '', companySize: '', website: '', logoUrl: '',
      businessEmail: '', businessPhone: '', address: '', taxNumber: ''
    }
  });

  const originalData = useRef<any>(null);

  useEffect(() => {
    const hash = location.hash.replace('#', '') as ProfileTab;
    if (['profile', 'workspace'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      setIsLoading(true);
      
      try {
        const tabs = ['profile', 'workspace'];
        const newData = { ...formData };
        
        for (const tab of tabs) {
          const docRef = doc(db, 'users', user.id, 'settings', tab);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            newData[tab] = { ...newData[tab], ...docSnap.data() };
          }
        }
        
        if (!newData.profile.name && user.name) newData.profile.name = user.name;
        if (!newData.profile.email && user.email) newData.profile.email = user.email;
        
        setFormData(newData);
        originalData.current = JSON.stringify(newData);
      } catch (err) {
        console.error('Failed to load profile settings:', err);
        toast.error('Failed to load profile settings.');
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

  const handleUpdate = (tab: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value
      }
    }));
  };

  const validate = () => {
    if (activeTab === 'workspace') {
      if (formData.workspace.website && !/^https?:\/\//i.test(formData.workspace.website)) {
        toast.error('Website must be a valid URL starting with http:// or https://');
        return false;
      }
      if (formData.workspace.businessName && formData.workspace.businessName.length < 3) {
        toast.error('Business Name must be at least 3 characters.');
        return false;
      }
    }
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
      
      // Update local auth context state for immediate reflection
      try {
         await updateProfile(formData[activeTab]);
      } catch (e) {
         console.warn('Silent local state update failed', e);
      }

      originalData.current = JSON.stringify(formData);
      setHasChanges(false);
      setSaveSuccess(true);
      toast.success(activeTab === 'profile' ? 'Profile saved successfully.' : 'Workspace saved successfully.');
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Personal Information', icon: User },
    { id: 'workspace', label: 'Workspace', icon: Building2 },
  ] as const;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[var(--color-brand-primary)] animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-[var(--color-brand-text)] mb-1">My Profile</h1>
        <p className="text-[var(--color-brand-muted)] text-sm">Manage your personal information and workspace details.</p>
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
                  
                  setActiveTab(tab.id as ProfileTab);
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
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-20">
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-1">Personal Information</h2>
                    <p className="text-sm text-[var(--color-brand-muted)]">Update your photo and personal details.</p>
                  </div>
                  
                  <div className="flex items-center gap-6 pb-6 border-b border-[var(--color-brand-border)]">
                    <div className="w-20 h-20 rounded-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center text-2xl font-bold text-[var(--color-brand-primary)] shrink-0 overflow-hidden relative group">
                        {formData.profile.avatarUrl ? (
                          <img src={formData.profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          formData.profile.name?.charAt(0) || 'U'
                        )}
                    </div>
                    <div className="flex-1 max-w-sm">
                      <ImageUploader
                        value={formData.profile.avatarUrl}
                        onChange={(url) => handleUpdate('profile', 'avatarUrl', url)}
                        storagePath="avatars"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Full Name</label>
                      <input type="text" value={formData.profile.name} onChange={e => handleUpdate('profile', 'name', e.target.value)} className="w-full px-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Role</label>
                      <Combobox
                        options={ROLES.map(r => ({ value: r, label: r }))}
                        value={formData.profile.role}
                        onChange={val => handleUpdate('profile', 'role', val)}
                        placeholder="Select Role"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Email Address</label>
                    <input type="email" value={formData.profile.email} readOnly disabled className="w-full px-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-muted)] cursor-not-allowed opacity-70 transition-all" />
                    <p className="text-xs text-[var(--color-brand-muted)] mt-2">Email address is your account identifier and cannot be changed here.</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'workspace' && (
                <motion.div key="workspace" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-20">
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-1">Workspace</h2>
                    <p className="text-sm text-[var(--color-brand-muted)]">Manage your organization details.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Business Logo</label>
                    <ImageUploader
                      value={formData.workspace.logoUrl}
                      onChange={(url) => handleUpdate('workspace', 'logoUrl', url)}
                      storagePath="logos"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Business Name</label>
                      <input type="text" value={formData.workspace.businessName} onChange={e => handleUpdate('workspace', 'businessName', e.target.value)} className="w-full px-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Tax Number</label>
                      <input type="text" value={formData.workspace.taxNumber} onChange={e => handleUpdate('workspace', 'taxNumber', e.target.value)} className="w-full px-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Industry</label>
                      <Combobox
                        options={INDUSTRIES.map(i => ({ value: i, label: i }))}
                        value={formData.workspace.industry}
                        onChange={val => handleUpdate('workspace', 'industry', val)}
                        placeholder="Select Industry"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Company Size</label>
                      <Combobox
                        options={COMPANY_SIZES.map(s => ({ value: s, label: s + ' Employees' }))}
                        value={formData.workspace.companySize}
                        onChange={val => handleUpdate('workspace', 'companySize', val)}
                        placeholder="Select Size"
                        searchPlaceholder="Search size..."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Business Email</label>
                      <input type="email" value={formData.workspace.businessEmail} onChange={e => handleUpdate('workspace', 'businessEmail', e.target.value)} className="w-full px-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Business Phone</label>
                      <input type="tel" value={formData.workspace.businessPhone} onChange={e => handleUpdate('workspace', 'businessPhone', e.target.value)} className="w-full px-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Website</label>
                    <input 
                      type="url" 
                      value={formData.workspace.website} 
                      onChange={e => handleUpdate('workspace', 'website', e.target.value)}
                      onBlur={(e) => {
                        let val = e.target.value;
                        if (val && !/^https?:\/\//i.test(val)) {
                          val = 'https://' + val;
                          handleUpdate('workspace', 'website', val);
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Address</label>
                    <textarea 
                      value={formData.workspace.address} 
                      onChange={e => handleUpdate('workspace', 'address', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all resize-none" 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Button (Sticky to bottom) */}
            <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 bg-[var(--color-brand-card)]/90 backdrop-blur border-t border-[var(--color-brand-border)] flex justify-between items-center z-10">
              <div className="flex items-center">
                {hasChanges ? (
                  <span className="text-sm text-[#FFBD2E] font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Unsaved changes
                  </span>
                ) : saveSuccess ? (
                  <span className="text-sm text-[var(--color-brand-primary)] font-medium">
                    {activeTab === 'profile' ? 'Profile saved successfully' : 'Workspace saved successfully'}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setFormData(JSON.parse(originalData.current))}
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
          </form>
        </div>
      </div>
    </div>
  );
}
