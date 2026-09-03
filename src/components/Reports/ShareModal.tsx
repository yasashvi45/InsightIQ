import React, { useState, useEffect } from 'react';
import { X, Copy, Mail, Download, Link as LinkIcon, Users, Lock, Clock, Check } from 'lucide-react';
import { Report } from '../../context/DataContext';

export function ShareModal({ report, isOpen, onClose }: { report: Report | null, isOpen: boolean, onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'email' | 'workspace'>('link');

  if (!isOpen || !report) return null;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] w-[calc(100vw-24px)] max-w-lg max-h-[calc(100vh-24px)] overflow-y-auto rounded-3xl shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-brand-border)] flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)]">Share Report</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-6 border-b border-[var(--color-brand-border)]">
          <button 
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'link' ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-text)]' : 'border-transparent text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}
            onClick={() => setActiveTab('link')}
          >
            <div className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Secure Link</div>
          </button>
          <button 
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'email' ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-text)]' : 'border-transparent text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}
            onClick={() => setActiveTab('email')}
          >
            <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email</div>
          </button>
          <button 
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'workspace' ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-text)]' : 'border-transparent text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}
            onClick={() => setActiveTab('workspace')}
          >
            <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Workspace</div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'link' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-muted)]">Generated Link</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-brand-muted)] truncate select-all">
                    https://app.insightiq.com/reports/{report.id || 'preview'}-{Math.random().toString(36).substring(7)}
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="px-4 py-2.5 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)] hover:text-[var(--color-brand-bg)] rounded-xl transition-colors font-medium flex items-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--color-brand-muted)] flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Expiration</label>
                  <select className="w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)]">
                    <option>7 Days</option>
                    <option>24 Hours</option>
                    <option>30 Days</option>
                    <option>Never</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--color-brand-muted)] flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Password</label>
                  <input type="password" placeholder="Optional" className="w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)]" />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="form-checkbox text-[var(--color-brand-primary)] rounded bg-[var(--color-brand-bg)] border-[var(--color-brand-border)] focus:ring-[var(--color-brand-primary)] focus:ring-offset-0 w-4 h-4" />
                  <span className="text-sm text-[var(--color-brand-text)] group-hover:text-[var(--color-brand-primary)] transition-colors">Allow viewers to download PDF</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-muted)]">Recipients</label>
                <input type="text" placeholder="name@company.com, team@company.com" className="w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-muted)]">Subject</label>
                <input type="text" defaultValue={`${report.type} - ${report.datasetName}`} className="w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-muted)]">Message</label>
                <textarea rows={3} placeholder="Add a custom message..." className="w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] resize-none"></textarea>
              </div>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="form-checkbox text-[var(--color-brand-primary)] rounded bg-[var(--color-brand-bg)] border-[var(--color-brand-border)] w-4 h-4" />
                  <span className="text-sm text-[var(--color-brand-text)]">Attach PDF</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="form-checkbox text-[var(--color-brand-primary)] rounded bg-[var(--color-brand-bg)] border-[var(--color-brand-border)] w-4 h-4" />
                  <span className="text-sm text-[var(--color-brand-text)]">Attach CSV</span>
                </label>
              </div>
              <div className="pt-2 flex justify-end">
                <button className="px-5 py-2.5 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-semibold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Send Email
                </button>
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-[var(--color-brand-muted)] mx-auto mb-3" />
                <h3 className="text-[var(--color-brand-text)] font-medium mb-1">Workspace Sharing</h3>
                <p className="text-sm text-[var(--color-brand-muted)] max-w-[250px] mx-auto">Manage permissions for team members within your organization.</p>
              </div>
              <button className="w-full py-2.5 border border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] text-[var(--color-brand-text)] rounded-xl hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-colors font-medium">
                Manage Workspace Access
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
