import React from 'react';
import { X, Activity as ActivityIcon, FileText, Download, Share2, Trash2, Calendar, Settings, Eye } from 'lucide-react';
import { Activity } from '../../context/DataContext';

export function ActivityPanel({ isOpen, onClose, activities }: { isOpen: boolean, onClose: () => void, activities: Activity[] }) {
  if (!isOpen) return null;

  const getIcon = (action: string) => {
    if (action.includes('Generated')) return <FileText className="w-4 h-4 text-[#21E6A8]" />;
    if (action.includes('Downloaded')) return <Download className="w-4 h-4 text-[#3B82F6]" />;
    if (action.includes('Shared')) return <Share2 className="w-4 h-4 text-[#8B5CF6]" />;
    if (action.includes('Deleted')) return <Trash2 className="w-4 h-4 text-[#F43F5E]" />;
    if (action.includes('Scheduled')) return <Calendar className="w-4 h-4 text-[#F59E0B]" />;
    if (action.includes('Edited')) return <Settings className="w-4 h-4 text-[var(--color-brand-muted)]" />;
    if (action.includes('Viewed')) return <Eye className="w-4 h-4 text-[var(--color-brand-muted)]" />;
    return <ActivityIcon className="w-4 h-4 text-[var(--color-brand-muted)]" />;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-[var(--color-brand-card)] border-l border-[var(--color-brand-border)] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-6 py-5 border-b border-[var(--color-brand-border)] flex items-center justify-between shrink-0 bg-[var(--color-brand-bg)]/50">
          <div>
            <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-[var(--color-brand-primary)]" />
              Recent Activity
            </h2>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {activities.length === 0 ? (
              <div className="text-center text-[var(--color-brand-muted)] py-8">
                No recent activity.
              </div>
            ) : (
              <div className="relative border-l border-[var(--color-brand-border)] ml-3 space-y-8 pb-4">
                {activities.map((activity, i) => (
                  <div key={activity.id} className="relative pl-6">
                    <div className="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center">
                      {getIcon(activity.action)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-brand-text)] mb-0.5">{activity.action}</p>
                      <p className="text-xs text-[var(--color-brand-muted)]">{activity.details}</p>
                      <span className="text-[10px] font-semibold text-[var(--color-brand-muted)] uppercase tracking-wider block mt-2">
                        {new Date(activity.time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
