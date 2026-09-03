import React from 'react';
export function GenerationDialog({ 
  isOpen, 
  onClose, 
  progress, 
  stage, 
  datasetName, 
  reportType 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  progress: number, 
  stage: string,
  datasetName: string,
  reportType: string
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
        <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-2">Generating Report</h2>
        <p className="text-sm text-[var(--color-brand-muted)] mb-8">
          Analyzing <span className="text-[var(--color-brand-text)] font-medium">{datasetName}</span> for <span className="text-[var(--color-brand-primary)] font-medium">{reportType}</span>.
        </p>

        <div className="space-y-4">
          <div className="flex justify-between items-end text-sm">
            <span className="text-[var(--color-brand-text)] font-medium animate-pulse">{stage}...</span>
            <span className="text-[var(--color-brand-primary)] font-bold">{Math.round(progress)}%</span>
          </div>
          
          <div className="w-full bg-[var(--color-brand-bg)] rounded-full h-2 overflow-hidden border border-[var(--color-brand-border)]">
            <div 
              className="bg-[var(--color-brand-primary)] h-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
