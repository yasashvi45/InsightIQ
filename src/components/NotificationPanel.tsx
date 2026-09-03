import React, { useState } from 'react';
import { X, Trash2, CheckCircle2, AlertCircle, Info, TrendingUp, Filter, Check, Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { format } from 'date-fns';

export function NotificationPanel({ isOpen, onClose, onNavigate }: { isOpen: boolean, onClose: () => void, onNavigate: (url: string) => void }) {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification, deleteAllNotifications, archiveNotification } = useNotifications();
  const [filter, setFilter] = useState<'All' | 'Unread' | 'System' | 'Dataset' | 'AI'>('All');
  
  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'Unread') return !n.read;
    if (filter === 'System') return n.type === 'system';
    if (filter === 'Dataset') return n.type === 'upload' || n.type === 'analytics';
    if (filter === 'AI') return n.type === 'ai' || n.type === 'forecast';
    return true;
  });

  const getIcon = (priority: string) => {
    switch(priority) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end" onClick={onClose}>
      <div 
        className="bg-[var(--color-brand-bg)] w-full max-w-sm md:max-w-md h-full shadow-2xl flex flex-col border-l border-[var(--color-brand-border)] animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-[var(--color-brand-border)] flex items-center justify-between sticky top-0 bg-[var(--color-brand-bg)]/95 backdrop-blur z-10">
          <div>
            <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <Bell className="w-5 h-5" /> Notifications
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={() => markAllRead()} className="text-xs text-[var(--color-brand-primary)] hover:text-[var(--color-brand-text)] transition-colors">
                Mark all as read
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-[var(--color-brand-card)] rounded-lg text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors" title="Close">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="px-4 md:px-6 py-4 flex items-start sm:items-center justify-between border-b border-[var(--color-brand-border)] gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {['All', 'Unread', 'System', 'Dataset', 'AI'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-[var(--color-brand-primary)] text-gray-900' : 'bg-[var(--color-brand-card)] text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] border border-[var(--color-brand-border)]'}`}
              >
                {f}
              </button>
            ))}
          </div>
          {filteredNotifications.length > 0 && (
            <button onClick={() => {
              if (window.confirm('Delete all notifications?')) {
                deleteAllNotifications();
              }
            }} className="p-1.5 ml-2 hover:bg-[var(--color-brand-card)] rounded-lg text-[var(--color-brand-muted)] hover:text-red-400 transition-colors shrink-0" title="Delete All">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-brand-muted)] flex flex-col items-center">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p>No {filter !== 'All' ? filter.toLowerCase() : ''} notifications.</p>
            </div>
          ) : (
            filteredNotifications.map(n => (
              <div 
                key={n.id} 
                className={`p-4 border rounded-xl transition-all group relative ${n.read ? 'bg-[var(--color-brand-card)]/50 border-[var(--color-brand-border)] opacity-70' : 'bg-[var(--color-brand-card)] border-[var(--color-brand-primary)]/30'}`}
              >
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0">
                    {getIcon(n.priority)}
                  </div>
                  <div className="flex-1 cursor-pointer" onClick={() => {
                    markRead(n.id);
                    if (n.actionUrl) {
                      onNavigate(n.actionUrl);
                      onClose();
                    }
                  }}>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className={`text-sm font-semibold transition-colors group-hover:text-[var(--color-brand-primary)] ${n.read ? 'text-[var(--color-brand-muted)]' : 'text-[var(--color-brand-text)]'}`}>{n.title}</h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)] shrink-0 mt-1 shadow-[0_0_8px_rgba(56,189,248,0.6)] animate-pulse"></span>
                      )}
                    </div>
                    <p className={`text-xs mb-2 leading-relaxed ${n.read ? 'text-[var(--color-brand-muted)]/70' : 'text-[var(--color-brand-muted)]'}`}>
                      {n.description}
                    </p>
                    <span className="text-[10px] text-[var(--color-brand-muted)]/50 font-medium tracking-wider">
                      {n.createdAt?.toDate ? format(n.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                    </span>
                  </div>
                  
                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }} className="p-1.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] rounded-md text-[var(--color-brand-muted)] transition-colors" title="Mark as read">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="p-1.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] hover:border-red-500 hover:text-red-500 rounded-md text-[var(--color-brand-muted)] transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
