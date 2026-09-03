import { sanitizeForFirestore } from '../../lib/firestoreUtils';
import { Search, Bell, User, LogOut, Settings as SettingsIcon, Building, CreditCard, Menu, Database, Plus, Check, ChevronDown, Loader2, MoreVertical, Edit2, Download, Trash2, FileText, Upload, CheckCircle2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNotifications } from '../../context/NotificationContext';
import { toast } from 'sonner';
import { DatasetUploadModal } from '../DatasetUploadModal';
import { GlobalSearch } from '../GlobalSearch';
import { NotificationPanel } from '../NotificationPanel';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref, getBlob, getDownloadURL } from 'firebase/storage';

export function DashboardNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDatasetDropdown, setShowDatasetDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [renameModal, setRenameModal] = useState<{isOpen: boolean, id: string, currentName: string}>({isOpen: false, id: '', currentName: ''});
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, name: string}>({isOpen: false, id: '', name: ''});
  const [renameInput, setRenameInput] = useState('');
  const [loadingText, setLoadingText] = useState('Processing...');
  const [datasetSearch, setDatasetSearch] = useState('');
  const [activeMenu, setActiveMenu] = useState<{ id: string, dataset: any, x: number, y: number } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const dropdownRef = useRef<HTMLDivElement>(null);
  const datasetDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout, isDemoMode, exitDemoMode } = useAuth();

  const handleToggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.id, 'settings', 'appearance'), sanitizeForFirestore({
          theme: newMode ? 'dark' : 'light'
        }), { merge: true });
      } catch (e) {
        console.warn('Failed to save theme preference', e);
      }
    }
  };
  const { datasets, activeDataset, setActiveDataset, deleteDataset, isFetchingActiveData } = useData();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  useEffect(() => {
    if (isFetchingActiveData) {
      let step = 0;
      const texts = ["Processing...", "Parsing dataset", "Calculating metrics", "Generating insights"];
      setLoadingText(texts[0]);
      const interval = setInterval(() => {
        step = (step + 1) % texts.length;
        setLoadingText(texts[step]);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isFetchingActiveData]);

  useEffect(() => {
    const handleScroll = () => setActiveMenu(null);
    const handleClick = () => setActiveMenu(null);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  const handleMenuClick = (e: React.MouseEvent, dataset: any) => {
    e.stopPropagation();
    if (activeMenu?.id === dataset.id) {
      setActiveMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.right;
    let y = rect.bottom + 4;
    
    // Check if it overflows bottom of screen (assuming menu is ~160px tall)
    if (y + 160 > window.innerHeight) {
      y = rect.top - 160 - 4;
    }
    
    setActiveMenu({ id: dataset.id, dataset, x, y });
  };

  const handleRename = async () => {
    const newName = renameInput.trim();
    if (!newName || newName === renameModal.currentName) {
       setRenameModal({isOpen: false, id: '', currentName: ''});
       return;
    }
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.id, 'datasets', renameModal.id), sanitizeForFirestore({
          name: newName
        }));
        toast.success('Dataset renamed successfully.');
      } catch (error) {
        console.error("Error renaming dataset", error);
        toast.error('Failed to rename dataset.');
      }
    }
    setRenameModal({isOpen: false, id: '', currentName: ''});
  };

  const handleDownload = async (dataset: any) => {
    try {
      const candidatePaths = [
        dataset.storagePath,
        user ? `datasets/${user.id}/${dataset.id}_${dataset.name}` : undefined,
        dataset.ownerId ? `datasets/${dataset.ownerId}/${dataset.id}_${dataset.name}` : undefined,
      ].filter(Boolean) as string[];

      for (const path of candidatePaths) {
        try {
          const ownerId = path.split('/')[1] || user?.id || '';
          const res = await fetch(`/api/datasets/download?userId=${encodeURIComponent(ownerId)}&storagePath=${encodeURIComponent(path)}`);
          if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = dataset.name || 'dataset.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Download started');
            return;
          }
        } catch (e) {
          // fallback to next
        }
      }

      // 2. Direct valid external download URL
      if (dataset.downloadURL && (dataset.downloadURL.startsWith('https://firebasestorage') || dataset.downloadURL.startsWith('https://storage'))) {
        const a = document.createElement('a');
        a.href = dataset.downloadURL;
        a.download = dataset.name || 'dataset.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Download started');
        return;
      }

      // 3. Fallback to downloadURL if local or different
      if (dataset.downloadURL) {
         try {
             const res = await fetch(dataset.downloadURL);
             if (res.ok) {
                 const blob = await res.blob();
                 const url = URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = dataset.name || 'dataset.csv';
                 document.body.appendChild(a);
                 a.click();
                 document.body.removeChild(a);
                 URL.revokeObjectURL(url);
                 toast.success('Download started');
                 return;
             }
         } catch(e) {}
      }

      // 4. Reconstruct from in-memory dataset rows if present
      if (dataset.data && Array.isArray(dataset.data) && dataset.data.length > 0) {
        const headers = (dataset.columns || Object.keys(dataset.data[0] || {})).join(',');
        const rows = dataset.data.map((row: any) => 
          (dataset.columns || Object.keys(row)).map((c: string) => `"${(row[c]||'').toString().replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = dataset.name || 'dataset.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Download started');
        return;
      }

      toast.error('Dataset data not available for download.');
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error('Failed to download dataset.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDataset(deleteModal.id);
      const remaining = datasets.filter(d => d.id !== deleteModal.id);
      if (remaining.length > 0) {
        const hasActive = remaining.some(d => d.active && d.id !== deleteModal.id);
        if (!hasActive) setActiveDataset(remaining[0].id);
      }
    } catch (e) {
      console.error(e);
    }
    setDeleteModal({isOpen: false, id: '', name: ''});
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (datasetDropdownRef.current && !datasetDropdownRef.current.contains(event.target as Node)) {
        setShowDatasetDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowDatasetDropdown(false);
        setShowDropdown(false);
        setShowNotifications(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setShowDropdown(false);
      await logout();
      navigate('/', { replace: true });
      toast.success('Logged out successfully.');
    } catch (error) {
      toast.error('Failed to log out.');
    }
  };

  const handleNotificationClick = (n: any) => {
    markRead(n.id);
    if (n.actionUrl) {
      navigate(n.actionUrl);
    }
    setShowNotifications(false);
  };

  const latestNotifications = notifications.slice(0, 5);

  return (
    <>
      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} onNavigate={(url) => navigate(url)} />
      <DatasetUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
            <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between bg-[var(--color-brand-bg)] border-b border-[var(--color-brand-border)] sticky top-0 z-50">
        <div className="flex items-center flex-1 min-w-0 gap-2 md:gap-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors rounded-lg hover:bg-[var(--color-brand-card)]"
          >
            <Menu className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <div className="relative group/dataset" ref={datasetDropdownRef}>
            <button 
              onClick={() => setShowDatasetDropdown(!showDatasetDropdown)}
              className="flex items-center gap-3 px-3 py-1.5 md:py-2 bg-[var(--color-brand-card)]/50 backdrop-blur-sm border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)]/50 rounded-xl text-sm text-[var(--color-brand-text)] transition-all shadow-sm"
            >
              <div className="w-6 h-6 rounded-md bg-[var(--color-brand-primary)]/10 flex items-center justify-center shrink-0">
                <Database className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
              </div>
              <div className="flex flex-col items-start justify-center">
                <span className="truncate max-w-[80px] sm:max-w-[150px] md:max-w-[100px] lg:max-w-[150px] font-medium leading-none mb-1">
                  {activeDataset ? activeDataset.name : 'No Dataset'}
                </span>
                {activeDataset && (
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-brand-muted)] leading-none">
                    <span>{activeDataset.rowCount || activeDataset.data?.length || 0} Rows</span>
                    {isFetchingActiveData ? (
                      <>
                        <span className="w-1 h-1 rounded-full bg-[#FFBD2E] animate-pulse"></span>
                        <span className="text-[#FFBD2E] flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {loadingText}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-1 h-1 rounded-full bg-[var(--color-brand-primary)] animate-pulse"></span>
                        <span className="text-[var(--color-brand-primary)]">Synced</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <ChevronDown className="w-3 h-3 text-[var(--color-brand-muted)] ml-1" />
            </button>
            
            {activeDataset && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-[var(--color-brand-card)]/90 backdrop-blur-xl border border-[var(--color-brand-border)] rounded-xl shadow-2xl opacity-0 invisible group-hover/dataset:opacity-100 group-hover/dataset:visible transition-all z-50 w-64 pointer-events-none transform translate-y-2 group-hover/dataset:translate-y-0">
                <div className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wider mb-2">Dataset Details</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--color-brand-muted)]">ID</span> <span className="text-[var(--color-brand-text)] font-mono">{activeDataset.id.substring(0,8)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--color-brand-muted)]">Uploaded</span> <span className="text-[var(--color-brand-text)]">{new Date(activeDataset.uploadedAt).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--color-brand-muted)]">Rows</span> <span className="text-[var(--color-brand-text)]">{activeDataset.rowCount || activeDataset.data?.length || 0}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--color-brand-muted)]">Columns</span> <span className="text-[var(--color-brand-text)]">{activeDataset.columns.length}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--color-brand-muted)]">Size</span> <span className="text-[var(--color-brand-text)]">{activeDataset.fileSize ? (activeDataset.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown'}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--color-brand-muted)]">Synced</span> <span className="text-[var(--color-brand-text)] text-right break-all">Just now</span></div>
                </div>
              </div>
            )}
            
            {showDatasetDropdown && (
              <div className="absolute top-full left-0 sm:left-0 mt-2 w-[calc(100vw-32px)] sm:w-[440px] max-w-[calc(100vw-32px)] sm:max-w-none bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-[100] flex flex-col max-h-[80vh] overflow-hidden">
                {datasets.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center">
                    <Database className="w-12 h-12 text-[var(--color-brand-muted)] mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-[var(--color-brand-text)] mb-2">No datasets uploaded yet</h3>
                    <p className="text-sm text-[var(--color-brand-muted)] mb-6">Upload your first CSV file to begin generating analytics.</p>
                    <button 
                      onClick={() => {
                        setShowDatasetDropdown(false);
                        setIsUploadModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-brand-primary)] text-gray-900 font-semibold text-sm rounded-lg hover:bg-[var(--color-brand-primary)]/90 transition-colors shadow-lg"
                    >
                      <Upload className="w-4 h-4" /> Upload Dataset
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="shrink-0 p-4 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-card)] z-20 flex flex-col gap-4 rounded-t-xl">
                      <div className="relative">
                        <Search className="w-4 h-4 text-[var(--color-brand-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          placeholder="Search datasets..." 
                          value={datasetSearch}
                          onChange={(e) => setDatasetSearch(e.target.value)}
                          className="w-full bg-[var(--color-brand-bg)] text-sm text-[var(--color-brand-text)] border border-[var(--color-brand-border)] rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-brand-primary)] transition-all placeholder:text-[var(--color-brand-muted)] shadow-sm"
                        />
                      </div>
                      
                      {activeDataset && !datasetSearch && (
                        <div className="flex flex-col gap-2">
                          <div className="px-1 text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wider">Current Dataset</div>
                          <div className="p-4 bg-[var(--color-brand-bg)] border border-[var(--color-brand-primary)]/30 rounded-xl relative group shadow-sm transition-all hover:border-[var(--color-brand-primary)]/60">
                            <div className="flex items-start justify-between mb-3 gap-2">
                              <div className="flex items-center gap-2 text-base font-medium text-[var(--color-brand-text)] min-w-0">
                                <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
                                <span className="truncate" title={activeDataset.name}>{activeDataset.name}</span>
                              </div>
                              <button 
                                onClick={(e) => handleMenuClick(e, activeDataset)}
                                className="p-1.5 shrink-0 hover:bg-[var(--color-brand-card)] rounded-md text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--color-brand-muted)]">
                              <div className="flex items-center gap-1.5 bg-[var(--color-brand-card)] px-2 py-0.5 rounded-full border border-[var(--color-brand-border)]">
                                {isFetchingActiveData ? <span className="w-1.5 h-1.5 rounded-full bg-[#FFBD2E] animate-pulse" /> : <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)]" />}
                                {isFetchingActiveData ? 'Processing...' : 'Active'}
                              </div>
                              <div className="flex items-center">{activeDataset.rowCount || activeDataset.data?.length || 0} Rows &middot; {activeDataset.columns.length} Cols</div>
                              <div className="flex items-center">{new Date(activeDataset.uploadedAt).toLocaleString()}</div>
                              <div className="flex items-center">{activeDataset.fileSize ? (activeDataset.fileSize / 1024).toFixed(0) + ' KB' : '--'}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-[var(--color-brand-card)] custom-scrollbar relative z-10">
                      <div className="px-1 mb-3 text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wider">{datasetSearch ? 'Search Results' : 'Recent Datasets'}</div>
                      <div className="flex flex-col gap-3 pb-2">
                        {datasets.filter(d => d.name.toLowerCase().includes(datasetSearch.toLowerCase())).map(dataset => {
                          if (dataset.id === activeDataset?.id && !datasetSearch) return null;
                          
                          return (
                            <div key={dataset.id} className="relative group/item flex flex-col">
                              <button
                                onClick={() => {
                                  setActiveDataset(dataset.id);
                                  setShowDatasetDropdown(false);
                                }}
                                className="w-full flex flex-col p-4 text-left text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] rounded-xl transition-all border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)]/50 shadow-sm"
                              >
                                <div className="flex items-start justify-between w-full mb-3 pr-8 gap-2 min-w-0">
                                  <span className="truncate font-medium text-sm text-[var(--color-brand-text)] flex-1 min-w-0" title={dataset.name}>{dataset.name}</span>
                                  {activeDataset?.id === dataset.id && (
                                    <span className="text-[10px] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] px-2 py-0.5 rounded border border-[var(--color-brand-primary)]/20 shrink-0 mt-0.5">Active</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between w-full text-xs opacity-80 gap-2 min-w-0">
                                  <span className="truncate flex-1 min-w-0">{dataset.rowCount || dataset.data?.length || 0} Rows &middot; {dataset.columns.length} Cols</span>
                                  <span className="shrink-0">{new Date(dataset.uploadedAt).toLocaleDateString()}</span>
                                </div>
                              </button>
                              
                              <div className="absolute right-3 top-4 transition-opacity">
                                <button 
                                  onClick={(e) => handleMenuClick(e, dataset)}
                                  className="p-1.5 bg-[var(--color-brand-card)] hover:bg-[var(--color-brand-border)] border border-[var(--color-brand-border)] rounded-md text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors shadow-sm"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="shrink-0 p-4 border-t border-[var(--color-brand-border)] bg-[var(--color-brand-card)] z-20 rounded-b-xl">
                      <button 
                        onClick={() => {
                          setShowDatasetDropdown(false);
                          setIsUploadModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--color-brand-text)] bg-[var(--color-brand-bg)] hover:bg-[var(--color-brand-border)] border border-[var(--color-brand-border)] rounded-lg transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4 text-[var(--color-brand-muted)]" /> Upload New Dataset
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <GlobalSearch />
        </div>

      <div className="flex items-center gap-3 sm:gap-6 ml-auto sm:ml-4">
        <GlobalSearch isMobileButton={true} />
        {isDemoMode && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full cursor-pointer hover:bg-yellow-500/20 transition-colors" onClick={exitDemoMode}>
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">DEMO MODE</span>
            <span className="text-xs text-yellow-600/70 dark:text-yellow-400/70 ml-1 hover:underline">Exit</span>
          </div>
        )}
        <div className="relative">
          <button onClick={() => setShowNotifications(true)} className="relative p-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-[var(--color-brand-error)] rounded-full border-2 border-[var(--color-brand-bg)]"></span>
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-3 pl-3 sm:pl-6 border-l border-[var(--color-brand-border)] relative" ref={dropdownRef}>
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-[var(--color-brand-text)]">{user?.name || 'User'}</span>
            <span className="text-xs text-[var(--color-brand-muted)]">{user?.role || 'Admin'}</span>
          </div>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] flex items-center justify-center overflow-hidden text-[var(--color-brand-muted)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute top-full right-0 mt-3 w-56 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-[var(--color-brand-border)] sm:hidden">
                 <p className="text-sm font-medium text-[var(--color-brand-text)]">{user?.name || 'User'}</p>
                 <p className="text-xs text-[var(--color-brand-muted)]">{user?.role || 'Admin'}</p>
              </div>
              <div className="p-2 space-y-1">
                <Link to="/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-brand-text)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] rounded-lg transition-colors">
                  <User className="w-4 h-4" /> My Profile
                </Link>
                <Link to="/settings" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-brand-text)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] rounded-lg transition-colors">
                  <SettingsIcon className="w-4 h-4" /> Settings
                </Link>
                <Link to="/billing" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-brand-text)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] rounded-lg transition-colors">
                  <CreditCard className="w-4 h-4" /> Billing & Plan
                </Link>
              </div>
              <div className="p-2 border-t border-[var(--color-brand-border)]">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-brand-error)] hover:bg-[var(--color-brand-error)]/10 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[var(--color-brand-text)] mb-4">Rename Dataset</h3>
            <input 
              type="text" 
              value={renameInput} 
              onChange={e => setRenameInput(e.target.value)} 
              className="w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-brand-primary)] mb-6"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setRenameModal({isOpen: false, id: '', currentName: ''})} className="px-4 py-2 text-sm font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors">Cancel</button>
              <button onClick={handleRename} className="px-4 py-2 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] text-sm font-bold rounded-lg hover:bg-[var(--color-brand-secondary)] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[var(--color-brand-text)] mb-2">Delete dataset?</h3>
            <p className="text-sm text-[var(--color-brand-muted)] mb-6">This will permanently remove this dataset and its associated analysis data. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModal({isOpen: false, id: '', name: ''})} className="px-4 py-2 text-sm font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-500/10 text-red-500 text-sm font-bold rounded-lg hover:bg-red-500 hover:text-[var(--color-brand-text)] transition-colors">Delete Dataset</button>
            </div>
          </div>
        </div>
      )}
    </header>
      {activeMenu && createPortal(
        <div 
          className="fixed bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-lg shadow-2xl py-1 z-[110] w-48 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: activeMenu.y, left: activeMenu.x - 192 }}
        >
          <button onClick={() => { setActiveDataset(activeMenu.dataset.id); setActiveMenu(null); setShowDatasetDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] flex items-center gap-2"><Check className="w-4 h-4 text-[var(--color-brand-muted)]" /> Use Dataset</button>
          <button onClick={() => { setRenameInput(activeMenu.dataset.name); setRenameModal({isOpen: true, id: activeMenu.dataset.id, currentName: activeMenu.dataset.name}); setActiveMenu(null); setShowDatasetDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] flex items-center gap-2"><Edit2 className="w-4 h-4 text-[var(--color-brand-muted)]" /> Rename</button>
          <button onClick={() => { handleDownload(activeMenu.dataset); setActiveMenu(null); setShowDatasetDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] flex items-center gap-2"><Download className="w-4 h-4 text-[var(--color-brand-muted)]" /> Download CSV</button>
          <div className="h-px bg-[var(--color-brand-border)] my-1"></div>
          <button onClick={() => { setDeleteModal({isOpen: true, id: activeMenu.dataset.id, name: activeMenu.dataset.name}); setActiveMenu(null); setShowDatasetDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-400" /> Delete Dataset</button>
        </div>,
        document.body
      )}
    </>
  );
}
