import  { useState, useMemo } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { AppNotification } from '../lib/NotificationService';
import { Bell, CheckCircle2, AlertTriangle, XCircle, Upload, FileText, Cpu, LineChart, Settings, Trash2, Archive, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Link } from 'react-router-dom';

export function Notifications() {
  const { notifications, markRead, markAllRead, deleteNotification, archiveNotification, unreadCount } = useNotifications();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  // Filter and sort logic
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(n => !n.archived)
      .filter(n => {
        if (search) {
          const lowerSearch = search.toLowerCase();
          return (
            n.title.toLowerCase().includes(lowerSearch) ||
            n.description.toLowerCase().includes(lowerSearch) ||
            (n.metadata?.datasetName && n.metadata.datasetName.toLowerCase().includes(lowerSearch)) ||
            (n.metadata?.reportName && n.metadata.reportName.toLowerCase().includes(lowerSearch))
          );
        }
        return true;
      })
      .filter(n => {
        switch (filter) {
          case 'unread': return !n.read;
          case 'read': return n.read;
          case 'success': return n.priority === 'success';
          case 'warning': return n.priority === 'warning';
          case 'error': return n.priority === 'error';
          case 'uploads': return n.type === 'upload';
          case 'reports': return n.type === 'report';
          case 'ai': return n.type === 'ai';
          case 'forecast': return n.type === 'forecast';
          case 'system': return n.type === 'system';
          case 'analytics': return n.type === 'analytics';
          default: return true;
        }
      })
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return sort === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [notifications, search, filter, sort]);

  // Group by date
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: AppNotification[] } = {
      'Today': [],
      'Yesterday': [],
      'Last 7 Days': [],
      'Earlier': []
    };

    filteredNotifications.forEach(n => {
      if (!n.createdAt) {
         groups['Today'].push(n);
         return;
      }
      const date = n.createdAt.toDate ? n.createdAt.toDate() : new Date(n.createdAt);
      if (isToday(date)) groups['Today'].push(n);
      else if (isYesterday(date)) groups['Yesterday'].push(n);
      else if (isThisWeek(date)) groups['Last 7 Days'].push(n);
      else groups['Earlier'].push(n);
    });

    return groups;
  }, [filteredNotifications]);

  const getIcon = (type: string, priority: string) => {
    if (priority === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (priority === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    if (priority === 'error') return <XCircle className="w-5 h-5 text-red-500" />;
    
    switch (type) {
      case 'upload': return <Upload className="w-5 h-5 text-blue-500" />;
      case 'report': return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'ai': return <Cpu className="w-5 h-5 text-purple-500" />;
      case 'forecast': return <LineChart className="w-5 h-5 text-cyan-500" />;
      case 'system': return <Settings className="w-5 h-5 text-slate-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'success': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'warning': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-brand-text)] flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-500" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-brand-500 text-[var(--color-brand-text)] text-xs px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-slate-400 mt-1">Manage all system events and updates.</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[var(--color-brand-text)] rounded-lg transition-colors border border-slate-700 hover:border-slate-600 text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-[var(--color-brand-text)] placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-brand-500 transition-all cursor-pointer appearance-none min-w-[140px]"
          >
            <option value="all">All Types</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="uploads">Uploads</option>
            <option value="reports">Reports</option>
            <option value="ai">AI Insights</option>
            <option value="forecast">Forecasts</option>
            <option value="system">System</option>
          </select>

          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-brand-500 transition-all cursor-pointer appearance-none min-w-[120px]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-8">
        {filteredNotifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center flex flex-col items-center justify-center bg-slate-900/20 border border-slate-800/50 rounded-2xl border-dashed"
          >
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-brand-text)] mb-2">You're all caught up.</h3>
            <p className="text-slate-400 max-w-md">No new notifications match your current filters. Take a deep breath and enjoy the silence.</p>
          </motion.div>
        ) : (
          Object.entries(groupedNotifications).map(([group, notifs]) => {
            if (notifs.length === 0) return null;
            return (
              <div key={group} className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider pl-2">
                  {group}
                </h3>
                <div className="space-y-3">
                  <AnimatePresence>
                    {notifs.map(notification => (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all ${
                          notification.read 
                            ? 'bg-slate-900/30 border-slate-800/50' 
                            : 'bg-slate-800/40 border-slate-700 shadow-sm'
                        }`}
                      >
                        {/* Unread indicator dot */}
                        {!notification.read && (
                          <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                        )}
                        
                        <div className="mt-1">
                          {getIcon(notification.type, notification.priority)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className={`font-medium ${notification.read ? 'text-slate-300' : 'text-[var(--color-brand-text)]'}`}>
                                {notification.title}
                              </h4>
                              <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                {notification.description}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-3 mt-3">
                                <span className="text-xs text-slate-500 font-medium">
                                  {notification.createdAt?.toDate 
                                    ? format(notification.createdAt.toDate(), 'h:mm a') 
                                    : 'Just now'}
                                </span>
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(notification.priority)}`}>
                                  {notification.priority}
                                </span>
                                
                                {notification.metadata?.datasetId && notification.actionUrl && (
                                  <Link to={notification.actionUrl} className="text-xs text-brand-400 hover:text-brand-300 hover:underline transition-all">
                                    View related item →
                                  </Link>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <button 
                                  onClick={() => markRead(notification.id)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors tooltip-trigger"
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => archiveNotification(notification.id)}
                                className="p-1.5 text-slate-400 hover:text-[var(--color-brand-text)] bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors tooltip-trigger"
                                title="Archive"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors tooltip-trigger"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
