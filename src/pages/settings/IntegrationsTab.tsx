import  { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link2, Unlink, RefreshCw, Loader2, Search, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { GoogleAuthProvider, GithubAuthProvider, linkWithPopup, unlink } from 'firebase/auth';
import { toast } from 'sonner';

const PROVIDERS = [
  { id: 'google.com', name: 'Google', desc: 'Sync with Google Workspace', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg' },
  { id: 'github.com', name: 'GitHub', desc: 'Import repositories and issues', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg', darkIcon: true },
];

export function IntegrationsTab() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    const loadIntegrations = async () => {
      if (!user) return;
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const linkedProviders: Record<string, any> = {};
          currentUser.providerData.forEach(p => {
            if (p.providerId === 'google.com' || p.providerId === 'github.com') {
              linkedProviders[p.providerId] = {
                connectedAt: new Date().toISOString(),
                lastSynced: new Date().toISOString(),
                status: 'active'
              };
            }
          });
          setIntegrations(linkedProviders);
        }
      } catch (err) {
        toast.error('Failed to load integrations');
      } finally {
        setLoading(false);
      }
    };
    loadIntegrations();
  }, [user]);

  const handleConnect = async (provider: typeof PROVIDERS[0]) => {
    setActionId(provider.id);
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      let authProvider;
      if (provider.id === 'google.com') authProvider = new GoogleAuthProvider();
      else if (provider.id === 'github.com') authProvider = new GithubAuthProvider();
      else throw new Error('Unsupported provider');

      await linkWithPopup(auth.currentUser, authProvider);
      
      const newIntegrations = {
        ...integrations,
        [provider.id]: {
          connectedAt: new Date().toISOString(),
          lastSynced: new Date().toISOString(),
          status: 'active'
        }
      };
      setIntegrations(newIntegrations);
      toast.success(`Connected to ${provider.name}`);
      
      import('../../lib/NotificationService').then(({ NotificationService }) => {
        NotificationService.createNotification(user!.id, {
          title: 'Account Connected',
          description: `Successfully connected ${provider.name} account.`,
          type: 'system',
          priority: 'success'
        }).catch(console.warn);
      });
    } catch (err: any) {
      if (err.code === 'auth/credential-already-in-use') {
        toast.error(`This ${provider.name} account is already linked to another user.`);
      } else if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(`Failed to connect to ${provider.name}`);
      }
    } finally {
      setActionId(null);
    }
  };

  const handleDisconnect = async (provider: typeof PROVIDERS[0]) => {
    if (!window.confirm(`Are you sure you want to disconnect ${provider.name}?`)) return;
    setActionId(provider.id);
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      await unlink(auth.currentUser, provider.id);
      
      const newIntegrations = { ...integrations };
      delete newIntegrations[provider.id];
      setIntegrations(newIntegrations);
      toast.success(`Disconnected from ${provider.name}`);
      
      import('../../lib/NotificationService').then(({ NotificationService }) => {
        NotificationService.createNotification(user!.id, {
          title: 'Account Disconnected',
          description: `Disconnected ${provider.name} account.`,
          type: 'system',
          priority: 'warning'
        }).catch(console.warn);
      });
    } catch (err: any) {
      if (err.code === 'auth/no-such-provider') {
         toast.error(`Not connected to ${provider.name}`);
      } else {
         toast.error(`Failed to disconnect from ${provider.name}`);
      }
    } finally {
      setActionId(null);
    }
  };

  const filteredProviders = PROVIDERS.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div key="integrations" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-20">
      <div>
        <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-1">Connected Accounts</h2>
        <p className="text-sm text-[var(--color-brand-muted)]">Connect third-party apps and services to InsightIQ.</p>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" />
        <input 
          type="text" 
          placeholder="Search integrations..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-primary)]" /></div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center p-8 border border-[var(--color-brand-border)] rounded-2xl bg-[var(--color-brand-bg)]">
          <p className="text-[var(--color-brand-muted)]">No integrations found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProviders.map(provider => {
            const isConnected = !!integrations[provider.id];
            const data = integrations[provider.id];
            
            return (
              <div key={provider.id} className="p-5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl p-2.5 flex items-center justify-center shrink-0">
                    <img src={provider.icon} alt={provider.name} className={`w-full h-full object-contain ${provider.darkIcon ? '' : ''}`} />
                  </div>
                  {isConnected ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                      Disconnected
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-[var(--color-brand-text)] mb-1">{provider.name}</h3>
                <p className="text-sm text-[var(--color-brand-muted)] mb-4 flex-1">{provider.desc}</p>
                
                {isConnected && data && (
                  <p className="text-xs text-[var(--color-brand-muted)] mb-4">
                    Last synced: {new Date(data.lastSynced).toLocaleString()}
                  </p>
                )}
                
                <div className="mt-auto pt-4 border-t border-[var(--color-brand-border)]">
                  {isConnected ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDisconnect(provider)}
                        disabled={actionId === provider.id}
                        className="flex-1 py-2 text-sm font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] border border-[var(--color-brand-border)] hover:bg-[var(--color-brand-card)] rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {actionId === provider.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                        Disconnect
                      </button>
                      <button 
                        disabled={actionId === provider.id}
                        className="p-2 text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 hover:bg-[var(--color-brand-primary)]/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Sync Now"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleConnect(provider)}
                      disabled={actionId === provider.id}
                      className="w-full py-2 text-sm font-medium text-[var(--color-brand-bg)] bg-white hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionId === provider.id ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Link2 className="w-4 h-4" />}
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
