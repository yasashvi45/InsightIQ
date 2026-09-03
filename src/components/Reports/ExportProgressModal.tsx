import React from 'react';
import { Check } from 'lucide-react';

export function ExportProgressModal({ isOpen, stage, progress }: { isOpen: boolean, stage: string, progress: number }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] w-[calc(100vw-24px)] max-w-sm max-h-[calc(100vh-24px)] overflow-y-auto rounded-3xl p-6 shadow-2xl relative">
        <h2 className="text-lg font-heading font-semibold text-[var(--color-brand-text)] mb-6">Exporting Report</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-end text-sm">
            <span className="text-[var(--color-brand-text)] font-medium animate-pulse">{stage}</span>
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

        {progress === 100 && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--color-brand-primary)] animate-in fade-in slide-in-from-bottom-2">
            <Check className="w-5 h-5" />
            <span className="font-semibold">Download Complete</span>
          </div>
        )}
      </div>
    </div>
  );
}
