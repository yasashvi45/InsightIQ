import React, { useState } from 'react';
import { X, Settings, Layout, Palette, FileText, Globe, Image as ImageIcon } from 'lucide-react';

export function CustomizeDialog({ isOpen, onClose, templateName }: { isOpen: boolean, onClose: () => void, templateName: string }) {
  const [activeTab, setActiveTab] = useState('sections');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] w-full max-w-3xl rounded-3xl shadow-2xl relative flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-brand-border)] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)]">Customize Report</h2>
            <p className="text-sm text-[var(--color-brand-muted)]">Configure settings for {templateName}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-[var(--color-brand-border)] bg-[var(--color-brand-bg)]/50 p-4 space-y-1 overflow-y-auto">
            {[
              { id: 'sections', icon: Layout, label: 'Report Sections' },
              { id: 'theme', icon: Palette, label: 'Theme & Styling' },
              { id: 'branding', icon: ImageIcon, label: 'Branding' },
              { id: 'formatting', icon: FileText, label: 'Formatting' },
              { id: 'localization', icon: Globe, label: 'Localization' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-card)]'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'sections' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">Include Sections</h3>
                <div className="space-y-3">
                  {['Executive Summary', 'Key Performance Indicators (KPIs)', 'Charts & Visualizations', 'Data Tables', 'Forecast & Predictive Trends', 'AI Recommendations', 'Appendix'].map(section => (
                    <label key={section} className="flex items-center gap-3 p-3 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl cursor-pointer hover:border-[var(--color-brand-primary)]/50 transition-colors">
                      <input type="checkbox" defaultChecked className="form-checkbox text-[var(--color-brand-primary)] rounded bg-[var(--color-brand-card)] border-[var(--color-brand-border)] w-4 h-4" />
                      <span className="text-sm text-[var(--color-brand-text)]">{section}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'theme' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">Theme Selection</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['Light Corporate', 'Dark Analytics', 'High Contrast', 'Minimalist'].map(theme => (
                    <div key={theme} className={`p-4 border rounded-xl cursor-pointer transition-colors ${theme === 'Light Corporate' ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5' : 'border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] hover:border-[var(--color-brand-muted)]'}`}>
                      <div className="h-20 rounded bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] mb-3 flex items-center justify-center overflow-hidden">
                         <div className={`w-full h-full ${theme.includes('Light') ? 'bg-white' : 'bg-gray-900'} p-2 space-y-1`}>
                            <div className={`h-2 w-1/3 rounded ${theme.includes('Light') ? 'bg-gray-200' : 'bg-gray-700'}`}></div>
                            <div className={`h-1 w-full rounded ${theme.includes('Light') ? 'bg-gray-100' : 'bg-gray-800'}`}></div>
                            <div className={`h-1 w-2/3 rounded ${theme.includes('Light') ? 'bg-gray-100' : 'bg-gray-800'}`}></div>
                         </div>
                      </div>
                      <span className="text-sm font-medium text-[var(--color-brand-text)]">{theme}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">Branding Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-muted)] block mb-2">Company Logo</label>
                    <div className="border-2 border-dashed border-[var(--color-brand-border)] rounded-xl p-6 text-center hover:bg-[var(--color-brand-bg)] transition-colors cursor-pointer">
                      <ImageIcon className="w-8 h-8 text-[var(--color-brand-muted)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--color-brand-muted)]">Click to upload logo</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-muted)] block mb-2">Brand Color</label>
                    <div className="flex gap-2">
                      {['#12D18E', '#3B82F6', '#8B5CF6', '#F43F5E', '#F59E0B'].map(color => (
                        <div key={color} className="w-8 h-8 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-[var(--color-brand-card)] hover:scale-110 transition-transform" style={{ backgroundColor: color, '--tw-ring-color': color === '#12D18E' ? color : 'transparent' } as React.CSSProperties}></div>
                      ))}
                      <div className="w-8 h-8 rounded-full border border-[var(--color-brand-border)] flex items-center justify-center cursor-pointer text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors text-xl font-light leading-none pb-1">+</div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="form-checkbox text-[var(--color-brand-primary)] rounded bg-[var(--color-brand-bg)] border-[var(--color-brand-border)] w-4 h-4" />
                      <span className="text-sm text-[var(--color-brand-text)] group-hover:text-[var(--color-brand-primary)] transition-colors">Add "CONFIDENTIAL" watermark</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'formatting' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">Document Formatting</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-muted)] block mb-2">Orientation</label>
                    <select className="w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)]">
                      <option>Portrait</option>
                      <option>Landscape</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-muted)] block mb-2">Page Size</label>
                    <select className="w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)]">
                      <option>A4</option>
                      <option>Letter</option>
                      <option>Legal</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-muted)] block mb-2">Margins</label>
                    <select className="w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)]">
                      <option>Normal</option>
                      <option>Narrow</option>
                      <option>Wide</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'localization' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">Localization</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-muted)] block mb-2">Language</label>
                    <select className="w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)]">
                      <option>English (US)</option>
                      <option>English (UK)</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] flex justify-end gap-3 shrink-0 rounded-b-3xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--color-brand-text)] hover:bg-[var(--color-brand-card)] rounded-xl transition-colors">Cancel</button>
          <button onClick={onClose} className="px-5 py-2 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] text-sm font-semibold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-colors">Apply Configuration</button>
        </div>
      </div>
    </div>
  );
}
