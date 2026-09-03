import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  maxSizeMB?: number; 
  storagePath?: string;
}

export function ImageUploader({ value, onChange, className = '', maxSizeMB = 5, storagePath = 'uploads' }: ImageUploaderProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

  const handleUpload = async (file: File) => {
    if (!user) return;
    setError(null);

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PNG, JPG, WEBP, or SVG.');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    setIsProcessing(true);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const fullPath = `users/${user.id}/${storagePath}/${fileName}`;
      const storageRef = ref(storage, fullPath);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onChange(url);
    } catch (err) {
      console.warn('Firebase storage upload fallback to local data URL:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  }, [user]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div 
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden
          ${isDragging ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5' : 'border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] hover:border-[var(--color-brand-muted)]'}
          ${isProcessing ? 'pointer-events-none opacity-80' : ''}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".png,.jpg,.jpeg,.webp,.svg"
          onChange={onFileChange}
        />
        
        {value ? (
          <div className="relative w-full h-32 flex items-center justify-center">
            <img src={value} alt="Uploaded preview" className="max-h-full max-w-full object-contain rounded-lg" />
            <button 
              onClick={removeImage}
              className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-[var(--color-brand-text)] rounded-full hover:bg-red-600 transition-colors shadow-lg"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            {isProcessing ? (
              <>
                <Loader2 className="w-8 h-8 text-[var(--color-brand-primary)] animate-spin" />
                <div className="text-sm font-medium text-[var(--color-brand-text)]">Uploading...</div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-full flex items-center justify-center shadow-lg">
                  <Upload className="w-5 h-5 text-[var(--color-brand-muted)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-brand-text)]">Click or drag & drop to upload</p>
                  <p className="text-xs text-[var(--color-brand-muted)] mt-1">SVG, PNG, JPG or WEBP (max. {maxSizeMB}MB)</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}
