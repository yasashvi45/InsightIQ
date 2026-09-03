import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Database, DollarSign, Users, Package } from 'lucide-react';
import { useData } from '../context/DataContext';
import { computeMetrics, formatNumber } from '../lib/dataUtils';
import { useCurrency } from '../hooks/useCurrency';
import { toast } from 'sonner';

export function DatasetUploadModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successStats, setSuccessStats] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDataset } = useData();
  const { formatCurrency } = useCurrency();

  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    const isSupported = fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    if (!isSupported) {
      setError('Please upload a CSV or Excel (.xlsx, .xls) file.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadDataset(file, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      const metrics = computeMetrics(result.dataset);
      setSuccessStats({
        rows: result.dataset.data?.length || result.dataset.rowCount || 0,
        invalidRows: result.invalidRows,
        revenue: metrics.totalRevenue,
        customers: metrics.totalCustomers,
        products: metrics.topProducts.length
      });
      toast.success(`Dataset "${file.name}" uploaded successfully!`);
      // Simulating progress
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to upload dataset.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (successStats) {
      // Don't reload, let React reactivity handle it
      onClose();
      // Reset state for next time
      setTimeout(() => setSuccessStats(null), 300);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl w-[calc(100vw-24px)] max-w-md max-h-[calc(100vh-24px)] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-brand-border)]">
          <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)]">{successStats ? 'Upload Complete' : 'Upload Dataset'}</h2>
          <button onClick={handleClose} className="p-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors rounded-lg hover:bg-[var(--color-brand-bg)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {successStats ? (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-[var(--color-brand-primary)]/20 rounded-full flex items-center justify-center border border-[var(--color-brand-primary)]/40 shadow-[0_0_20px_rgba(18,209,142,0.3)]">
                  <CheckCircle2 className="w-8 h-8 text-[var(--color-brand-primary)]" />
                </div>
              </div>
              <h3 className="text-center font-semibold text-[var(--color-brand-text)] mb-6">Successfully analyzed your dataset.</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] p-4 rounded-2xl flex flex-col items-center justify-center">
                  <Database className="w-5 h-5 text-[var(--color-brand-muted)] mb-2" />
                  <span className="text-xl font-bold text-[var(--color-brand-text)]">{formatNumber(successStats.rows)}</span>
                  <span className="text-xs text-[var(--color-brand-muted)]">Rows Processed</span>
                </div>
                <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] p-4 rounded-2xl flex flex-col items-center justify-center">
                  <AlertCircle className={`w-5 h-5 mb-2 ${successStats.invalidRows > 0 ? 'text-[#FFBD2E]' : 'text-[var(--color-brand-muted)]'}`} />
                  <span className="text-xl font-bold text-[var(--color-brand-text)]">{formatNumber(successStats.invalidRows)}</span>
                  <span className="text-xs text-[var(--color-brand-muted)]">Invalid Rows</span>
                </div>
                <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] p-4 rounded-2xl flex flex-col items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[var(--color-brand-primary)] mb-2" />
                  <span className="text-xl font-bold text-[var(--color-brand-text)]">{formatCurrency(successStats.revenue)}</span>
                  <span className="text-xs text-[var(--color-brand-muted)]">Revenue Detected</span>
                </div>
                <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] p-4 rounded-2xl flex flex-col items-center justify-center">
                  <Users className="w-5 h-5 text-[var(--color-brand-secondary)] mb-2" />
                  <span className="text-xl font-bold text-[var(--color-brand-text)]">{formatNumber(successStats.customers)}</span>
                  <span className="text-xs text-[var(--color-brand-muted)]">Customers Detected</span>
                </div>
              </div>
              
              <button onClick={handleClose} className="w-full py-3 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-semibold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all flex items-center justify-center gap-2">
                View Dashboard
              </button>
            </div>
          ) : (
            <>
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden
                  ${isDragging ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5' : 'border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] hover:border-[var(--color-brand-muted)]'}
                  ${isUploading ? 'pointer-events-none opacity-80' : ''}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center text-center space-y-4 w-full px-8">
                    <Loader2 className="w-8 h-8 text-[var(--color-brand-primary)] animate-spin" />
                    <div className="text-sm font-medium text-[var(--color-brand-text)]">Uploading dataset... {uploadProgress}%</div>
                    <div className="w-full bg-[var(--color-brand-border)] rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-[var(--color-brand-primary)] h-full transition-all duration-300 ease-out rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-full flex items-center justify-center shadow-lg">
                      <FileSpreadsheet className="w-5 h-5 text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-primary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-brand-text)]">Click or drag & drop to upload</p>
                      <p className="text-xs text-[var(--color-brand-muted)] mt-1">Upload CSV or Excel files (max 10MB)</p>
                    </div>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-start gap-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400 font-medium">{error}</p>
                  </div>
                  <button 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors self-end"
                  >
                    Retry Upload
                  </button>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-muted)]">Supported Formats</h4>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-xs text-[var(--color-brand-text)]">
                    <CheckCircle2 className="w-3 h-3 text-[var(--color-brand-primary)]" /> CSV
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-xs text-[var(--color-brand-text)]">
                    <CheckCircle2 className="w-3 h-3 text-[var(--color-brand-primary)]" /> Excel (.xlsx, .xls)
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
