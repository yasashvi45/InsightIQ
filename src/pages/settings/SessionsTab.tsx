import { sanitizeForFirestore } from '../../lib/firestoreUtils';
import  { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Monitor, Smartphone, Globe, LogOut, Loader2, Search, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export function SessionsTab() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // For demo, we might need to mock current session if empty
  const currentSessionId = 'current-device-id';

  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;
      try {
        const snapshot = await getDocs(collection(db, 'users', user.id, 'sessions'));
        let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (data.length === 0) {
          // Generate current session from browser data
          const ua = navigator.userAgent;
          const isMobile = /Mobile|Android|iP(ad|hone)/.test(ua);
          const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Unknown Browser';
          const os = ua.includes('Win') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : 'Unknown OS';
          
          const newSession = {
            id: currentSessionId,
            device: isMobile ? 'Mobile Device' : 'Desktop',
            os,
            browser,
            loginTime: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            isCurrent: true
          };
          try {
            await setDoc(doc(db, 'users', user.id, 'sessions', currentSessionId), sanitizeForFirestore(newSession));
          } catch(e) {
            console.warn('Could not save initial session', e);
          }
          data = [newSession];
        }
        setSessions(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, [user]);

  const handleSignOut = async (id: string) => {
    if (!window.confirm('Are you sure you want to sign out of this device?')) return;
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.id, 'sessions', id));
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Signed out successfully');
    } catch (err) {
      toast.error('Failed to sign out');
    }
  };

  const handleSignOutAllOther = async () => {
    if (!window.confirm('Are you sure you want to sign out of all other devices?')) return;
    if (!user) return;
    try {
      const otherSessions = sessions.filter(s => !s.isCurrent);
      for (const s of otherSessions) {
        await deleteDoc(doc(db, 'users', user.id, 'sessions', s.id));
      }
      setSessions(prev => prev.filter(s => s.isCurrent));
      toast.success('Signed out of all other devices');
    } catch (err) {
      toast.error('Failed to sign out of other devices');
    }
  };

  const filteredSessions = sessions.filter(s => 
    (s.device || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.browser || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div key="sessions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-1">Session Management</h2>
          <p className="text-sm text-[var(--color-brand-muted)]">Manage your active sessions across devices.</p>
        </div>
        <button
          type="button"
          onClick={handleSignOutAllOther}
          className="px-4 py-2 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] hover:border-red-500 hover:text-red-500 rounded-lg text-sm font-medium transition-colors"
        >
          Sign Out Other Devices
        </button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" />
        <input 
          type="text" 
          placeholder="Search sessions..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-primary)]" /></div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center p-8 border border-[var(--color-brand-border)] rounded-2xl bg-[var(--color-brand-bg)]">
          <p className="text-[var(--color-brand-muted)]">No sessions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div key={session.id} className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[var(--color-brand-card)] rounded-xl border border-[var(--color-brand-border)] shrink-0">
                  {session.os?.toLowerCase().includes('ios') || session.os?.toLowerCase().includes('android') ? (
                    <Smartphone className="w-6 h-6 text-[var(--color-brand-muted)]" />
                  ) : (
                    <Monitor className="w-6 h-6 text-[var(--color-brand-muted)]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[var(--color-brand-text)]">{session.device || 'Unknown Device'}</h3>
                    {session.isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
                        Current Device
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-brand-muted)] flex items-center gap-2 mb-1">
                    <Globe className="w-3.5 h-3.5" /> {session.browser || 'Unknown Browser'} on {session.os || 'Unknown OS'}
                  </p>
                  {(session.location || session.ip) && (
                    <p className="text-xs text-[var(--color-brand-muted)] flex items-center gap-2 mb-1">
                      <MapPin className="w-3 h-3" /> 
                      {session.location && <span>{session.location}</span>}
                      {session.location && session.ip && <span>({session.ip})</span>}
                      {!session.location && session.ip && <span>IP: {session.ip}</span>}
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-brand-muted)]">
                    Login: {new Date(session.loginTime).toLocaleString()} &bull; Last active: {new Date(session.lastActive).toLocaleString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleSignOut(session.id)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-brand-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
