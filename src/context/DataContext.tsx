import { sanitizeForFirestore } from '../lib/firestoreUtils';
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import localforage from 'localforage';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, query, orderBy, onSnapshot, writeBatch } from 'firebase/firestore';
import { NotificationService } from '../lib/NotificationService';

import { computeMetrics, detectSchema } from '../lib/dataUtils';
import { parseUploadedFile, parseDownloadedData } from '../lib/fileParser';

export interface Dataset {
  id: string;
  name: string;
  columns: string[];
  uploadedAt: string;
  metrics?: any;
  active?: boolean;
  downloadURL?: string;
  storagePath?: string;
  fileSize?: number;
  rowCount?: number;
  columnCount?: number;
  ownerId?: string;
  data?: any[]; // Local only
  rawData?: any[]; // Local only - Unfiltered data for comparisons
  currency?: string;
  detectedCurrency?: string;
  loadError?: string;
}

export interface Activity {
  id: string;
  action: string;
  time: string;
  type: string;
  details: string;
}

export interface Report {
  id: string;
  name: string;
  type: string;
  date: string;
  datasetName: string;
  datasetId?: string;
  generatedBy: string;
  status: 'Generating' | 'Completed' | 'Failed';
  metricsSnapshot?: any;
}

interface DataContextType {
  datasets: Dataset[];
  activeDataset: Dataset | null;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  uploadDataset: (file: File, onProgress?: (progress: number) => void) => Promise<{ dataset: Dataset, invalidRows: number }>;
  setActiveDataset: (id: string) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  isLoadingData: boolean;
  isFetchingActiveData: boolean;
  activities: Activity[];
  reports: Report[];
  logActivity: (action: string, type: string, details: string) => Promise<void>;
  generateReport: (report: Omit<Report, 'id' | 'date'>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('Last 30 Days');
  
  const [isFetchingActiveData, setIsFetchingActiveData] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id === 'demo') {
      const demoDataset = {
        id: 'demo-1',
        name: 'TechMart_Sales_2026.csv',
        columns: ['Order ID', 'Order Date', 'Customer ID', 'Customer Name', 'Product', 'Category', 'Quantity', 'Unit Price', 'Discount', 'Revenue', 'City', 'State', 'Sales Channel', 'Customer Segment', 'Payment Method'],
        uploadedAt: new Date().toISOString(),
        active: true,
        downloadURL: '/api/datasets/sample',
        rowCount: 0,
        columnCount: 15
      };
      setDatasets([demoDataset]);
      setActiveDatasetId('demo-1');
      setIsLoadingData(false);
      return;
    }
    if (!user) {
      setDatasets([]);
      setActivities([]);
      setReports([]);
      setActiveDatasetId(null);
      setActiveDatasetDataObj({ id: '', data: [], error: undefined });
      setIsLoadingData(false);
      return;
    }
    
    setIsLoadingData(true);
    const qDatasets = query(collection(db, 'users', user.id, 'datasets'), orderBy('uploadedAt', 'desc'));
    
    console.log(`[Diagnostic] Querying Firestore for datasets at: users/${user.id}/datasets`);
    console.log(`[Diagnostic] Firebase Project ID: ${db.app.options.projectId}`);
    
    const unsubDatasets = onSnapshot(qDatasets, (querySnapshot) => {
      console.log(`[Diagnostic] Received ${querySnapshot.size} datasets from Firestore`);
      const loadedDatasets: Dataset[] = [];
      let foundActiveId = null;

      querySnapshot.forEach((docSnap) => {
        const d = docSnap.data() as Dataset;
        loadedDatasets.push(d);
        if (d.active) {
          foundActiveId = d.id;
        }
      });
      
      setDatasets(loadedDatasets);
      
      if (loadedDatasets.length > 0) {
        if (foundActiveId) {
          setActiveDatasetId(foundActiveId);
        } else {
          setActiveDatasetId(loadedDatasets[0].id);
        }
      } else {
        setActiveDatasetId(null);
      }
      setIsLoadingData(false);
    }, (error) => {
      console.error('Failed to listen to datasets from Firestore', error);
      toast.error('Could not load your datasets from the cloud.');
      setIsLoadingData(false);
    });

    const qActivities = query(collection(db, 'users', user.id, 'activities'), orderBy('time', 'desc'));
    const unsubActivities = onSnapshot(qActivities, (snapshot) => {
      const acts: Activity[] = [];
      snapshot.forEach(docSnap => acts.push(docSnap.data() as Activity));
      setActivities(acts);
    });

    const qReports = query(collection(db, 'users', user.id, 'reports'), orderBy('date', 'desc'));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const reps: Report[] = [];
      snapshot.forEach(docSnap => reps.push(docSnap.data() as Report));
      setReports(reps);
    });

    return () => {
      unsubDatasets();
      unsubActivities();
      unsubReports();
    };
  }, [user]);

  // Fetch active dataset CSV data from Storage when it changes
  useEffect(() => {
    const fetchActiveData = async () => {
      if (!activeDatasetId) {
        setActiveDatasetDataObj({ id: '', data: [], error: undefined });
        return;
      }
      
      const dataset = datasets.find(d => d.id === activeDatasetId);
      if (!dataset) return;

      // Skip if we already successfully loaded this exact dataset's CSV records, or if we already failed to load it (prevents infinite retries)
      if (prevResolvedRef.current?.id === dataset.id && (prevResolvedRef.current.data?.length > 0 || prevResolvedRef.current.loadError)) {
        return; 
      }

      // Use in-memory data if available (e.g. immediately after upload on current session)
      if (dataset.data && dataset.data.length > 0) {
        setActiveDatasetDataObj({ id: dataset.id, data: dataset.data });
        return;
      }

      setIsFetchingActiveData(true);

      // Try localforage cache first
      try {
        const cached = await localforage.getItem(`dataset_data_${dataset.id}`);
        if (cached && Array.isArray(cached) && cached.length > 0) {
           setActiveDatasetDataObj({ id: dataset.id, data: cached });
           setIsFetchingActiveData(false);
           return;
        }
      } catch (e) {
        console.warn('Error reading from localforage cache:', e);
      }

      let csvText: string | null = null;
      let lastError: any = null;

      // Determine candidate storage paths in Firebase Storage
      const candidatePaths = [
        dataset.storagePath,
        user ? `datasets/${user.id}/${dataset.id}_${dataset.name}` : undefined,
        dataset.ownerId ? `datasets/${dataset.ownerId}/${dataset.id}_${dataset.name}` : undefined,
      ].filter(Boolean) as string[];

      const fetchWithTimeout = <T,>(promise: Promise<T>, ms: number = 15000): Promise<T> => {
        let timer: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Request timed out')), ms);
        });
        return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
      };

      // 1. Direct Backend Proxy retrieval (Supabase)
      let downloadedBuffer: ArrayBuffer | null = null;
      for (const path of candidatePaths) {
        if (downloadedBuffer) break;
        try {
          const ownerId = path.split('/')[1] || user?.id || '';
          const res = await fetchWithTimeout(fetch(`/api/datasets/download?userId=${encodeURIComponent(ownerId)}&storagePath=${encodeURIComponent(path)}`), 15000);
          if (res.ok) {
            const buffer = await res.arrayBuffer();
            if (buffer && buffer.byteLength > 0) {
               downloadedBuffer = buffer;
               console.log(`[Storage] Successfully retrieved ${buffer.byteLength} bytes from ${path}`);
               break;
            }
          } else {
             const errorData = await res.json().catch(() => ({}));
             lastError = new Error(errorData.error || 'Failed to download from backend proxy');
             console.warn(`[Storage] fetch failed for path ${path}:`, lastError.message);
          }
        } catch (storageErr: any) {
          lastError = storageErr;
          console.warn(`[Storage] fetch failed for path ${path}:`, storageErr?.message || storageErr);
        }
      }

      // 2. Direct external URL download fallback
      if (!downloadedBuffer && dataset.downloadURL) {
        try {
           const externalRes = await fetchWithTimeout(fetch(dataset.downloadURL), 15000);
           if (externalRes.ok) {
             const buffer = await externalRes.arrayBuffer();
             if (buffer && buffer.byteLength > 0) {
                 downloadedBuffer = buffer;
                 console.log(`[Storage] Successfully retrieved ${buffer.byteLength} bytes from external URL`);
             }
           }
        } catch(externalErr) {
           console.warn(`[Storage] external fetch failed:`, externalErr);
        }
      }

      // 3. Fallback to sample dataset if this was a demo or missing dataset
      if (!downloadedBuffer) {
        try {
          const sampleRes = await fetchWithTimeout(fetch('/api/datasets/sample'), 10000);
          if (sampleRes.ok) {
            const buffer = await sampleRes.arrayBuffer();
            if (buffer && buffer.byteLength > 0) {
              downloadedBuffer = buffer;
              console.log(`[Storage] Recovered dataset records via sample/backup dataset (${buffer.byteLength} bytes)`);
            }
          }
        } catch (sampleErr) {
          console.warn('[Storage] Sample fallback fetch failed:', sampleErr);
        }
      }

      // If no valid content could be downloaded
      if (!downloadedBuffer) {
        let errorMessage = 'Dataset records could not be loaded from cloud storage.';
        if (lastError?.message?.includes('Storage object not found') || lastError?.code === 'storage/object-not-found') {
          errorMessage = 'The dataset file was not found in cloud storage. You can upload a new dataset or select another dataset.';
        } else if (lastError?.message?.includes('permission denied') || lastError?.code === 'storage/unauthorized') {
          errorMessage = 'Cloud storage permission denied. Please verify you are logged in to the correct account.';
        } else if (lastError?.message) {
          errorMessage = `Storage error: ${lastError.message}`;
        }
        console.warn('Could not load dataset records from storage:', lastError?.message || lastError);
        setActiveDatasetDataObj({ id: dataset.id, data: [], error: errorMessage });
        setIsFetchingActiveData(false);
        return;
      }

      try {
        const parsed = parseDownloadedData(downloadedBuffer, dataset.name);
        if (!parsed.rows || parsed.rows.length === 0) {
          setActiveDatasetDataObj({ id: dataset.id, data: [], error: 'Failed to parse dataset data records.' });
          setIsFetchingActiveData(false);
          return;
        }
        setActiveDatasetDataObj({ id: dataset.id, data: parsed.rows });
        setIsFetchingActiveData(false);
        try {
          await localforage.setItem(`dataset_data_${dataset.id}`, parsed.rows);
        } catch (e) {
          console.warn("Failed to cache parsed data in localforage:", e);
        }
      } catch (err: any) {
        console.error('Failed to parse downloaded dataset:', err);
        setActiveDatasetDataObj({ id: dataset.id, data: [], error: err.message || 'Failed to parse dataset data.' });
        setIsFetchingActiveData(false);
      }
    };

    fetchActiveData();
  }, [activeDatasetId, datasets, user]);

  const logActivity = async (action: string, type: string, details: string) => {
    if (user?.id === 'demo') return;
    if (!user) return;
    try {
      const id = Date.now().toString();
      const newAct: Activity = { id, action, type, details, time: new Date().toISOString() };
      await setDoc(doc(db, 'users', user.id, 'activities', id), sanitizeForFirestore(newAct));
    } catch (e) {
      console.warn('Failed to log activity', e);
    }
  };

  const generateReport = async (reportData: Omit<Report, 'id' | 'date'>) => {
    if (user?.id === 'demo') {
      toast.success('Report generated (Demo Mode).');
      return;
    }
    if (!user) return;
    try {
      const id = Date.now().toString();
      const newRep: Report = { ...reportData, id, date: new Date().toISOString() };
      await setDoc(doc(db, 'users', user.id, 'reports', id), sanitizeForFirestore(newRep));
      
      await NotificationService.createNotification(user.id, {
        title: 'Report generated',
        description: `Report '${reportData.name}' has been generated successfully.`,
        type: 'report',
        priority: 'success',
        actionUrl: '/reports',
        metadata: { reportId: id, reportName: reportData.name }
      });
      
      toast.success('Report generated successfully.');
    } catch (e) {
      console.warn('Failed to generate report', e);
      toast.error('Failed to generate report.');
    }
  };

  const deleteReport = async (id: string) => {
    if (user?.id === 'demo') {
      toast.success('Report deleted (Demo Mode).');
      return;
    }
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.id, 'reports', id));
      toast.success('Report deleted.');
    } catch (e) {
      console.warn('Failed to delete report', e);
      toast.error('Failed to delete report.');
    }
  };

  const uploadDataset = async (file: File, onProgress?: (progress: number) => void): Promise<{ dataset: Dataset, invalidRows: number }> => {
    if (user?.id === 'demo') {
      throw new Error('Uploading new datasets is disabled in Demo Mode.');
    }
    try {
      if (onProgress) onProgress(15);
      const parsed = await parseUploadedFile(file);

      if (!parsed.rows || parsed.rows.length === 0) {
        throw new Error('The file is empty or contains no valid data rows.');
      }

      const columns = parsed.columns;
      const datasetId = Date.now().toString();
      
      let newDataset: Dataset = {
        id: datasetId,
        name: file.name,
        columns,
        uploadedAt: new Date().toISOString(),
        active: true,
        rowCount: parsed.rows.length,
        columnCount: columns.length
      };
      
      // Calculate metrics using the locally parsed data
      const calculatedMetrics = computeMetrics({ ...newDataset, data: parsed.rows, rawData: parsed.rows });
      newDataset.metrics = calculatedMetrics;

      if (user) {
        // Upload to storage via backend
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user.id);
        formData.append('datasetId', datasetId);

        if (onProgress) onProgress(45);

        try {
          const uploadRes = await fetch('/api/datasets/upload', {
            method: 'POST',
            body: formData
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json().catch(() => ({}));
            if (uploadData.storagePath) {
              newDataset.downloadURL = `/api/datasets/download?userId=${encodeURIComponent(user.id)}&storagePath=${encodeURIComponent(uploadData.storagePath)}`;
              newDataset.storagePath = uploadData.storagePath;
            }
          } else {
            console.warn('Backend storage upload returned status:', uploadRes.status);
          }
        } catch (uploadNetErr) {
          console.warn('Backend storage upload network warning:', uploadNetErr);
        }

        if (onProgress) onProgress(80);

        newDataset.fileSize = file.size;
        newDataset.ownerId = user.id;

        try {
          const batch = writeBatch(db);
          // Set all existing active datasets to false
          datasets.forEach(d => {
            if (d.active) {
              const datasetRef = doc(db, 'users', user.id, 'datasets', d.id);
              batch.update(datasetRef, { active: false });
            }
          });

          // Set the new dataset metadata (without large raw data)
          const newRef = doc(db, 'users', user.id, 'datasets', datasetId);
          batch.set(newRef, sanitizeForFirestore(newDataset));
          await batch.commit();
        } catch (dbErr) {
          console.warn('Firestore sync warning for dataset:', dbErr);
        }
        
        await logActivity('Dataset uploaded', 'data', `Uploaded ${file.name} with ${parsed.rows.length} rows.`);
        
        await NotificationService.createNotification(user.id, {
          title: 'Dataset uploaded successfully',
          description: `${file.name} uploaded successfully. Rows: ${parsed.rows.length}, Columns: ${columns.length}.`,
          type: 'upload',
          priority: 'success',
          actionUrl: '/dashboard',
          metadata: {
            datasetId: datasetId,
            filename: file.name,
            rows: parsed.rows.length
          }
        });
        
        newDataset.data = parsed.rows;
        newDataset.rawData = parsed.rows;
        setActiveDatasetDataObj({ id: datasetId, data: parsed.rows });
        setActiveDatasetId(datasetId);
        setDatasets(prev => [newDataset, ...prev.map(d => ({ ...d, active: false }))]);

        try {
           await localforage.setItem(`dataset_data_${datasetId}`, parsed.rows);
        } catch (e) {
           console.warn("Failed to save to localforage", e);
        }
        if (onProgress) onProgress(100);
        return { dataset: newDataset, invalidRows: parsed.invalidRows };
      } else {
        newDataset.data = parsed.rows;
        newDataset.rawData = parsed.rows;
        setActiveDatasetDataObj({ id: datasetId, data: parsed.rows });
        setActiveDatasetId(datasetId);
        setDatasets(prev => [newDataset, ...prev.map(d => ({ ...d, active: false }))]);
        if (onProgress) onProgress(100);
        return { dataset: newDataset, invalidRows: parsed.invalidRows };
      }
    } catch (e: any) {
      if (user) {
        NotificationService.createNotification(user.id, {
          title: 'Dataset upload failed',
          description: `Failed to upload ${file.name}: ${e.message}`,
          type: 'upload',
          priority: 'error'
        }).catch(console.error);
      }
      console.error('Error in uploadDataset:', e);
      throw new Error(e.message || 'Failed to upload dataset.');
    }
  };

  const setActiveDataset = async (id: string) => {
    if (user?.id === 'demo') return;
    if (!user || !id) return;
    if (activeDatasetId === id) return;
    try {
      const batch = writeBatch(db);
      
      let newActiveName = '';

      datasets.forEach(d => {
        const datasetRef = doc(db, 'users', user.id, 'datasets', d.id);
        if (d.id === id) {
          batch.update(datasetRef, { active: true });
          newActiveName = d.name;
        } else if (d.active) {
          batch.update(datasetRef, { active: false });
        }
      });
      
      await batch.commit();
      if (newActiveName) {
        await logActivity('Dataset switched', 'data', `Switched active dataset to ${newActiveName}`);
      }
    } catch (error) {
      console.error("Failed to set active dataset in Firestore:", error);
      toast.error("Failed to change active dataset.");
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const deleteDataset = async (id: string) => {
    if (user?.id === 'demo') {
      toast.error('Deleting datasets is disabled in Demo Mode.');
      return;
    }
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      if (user) {
        const dataset = datasets.find(d => d.id === id);
        const datasetName = dataset?.name || 'Unknown';
        
        let storagePathToDelete = dataset?.storagePath;
        if (!storagePathToDelete && dataset?.downloadURL?.includes('firebasestorage.googleapis.com')) {
          storagePathToDelete = dataset.downloadURL;
        }
        
        if (storagePathToDelete) {
          try {
            await fetch(`/api/datasets/${dataset.id}?userId=${encodeURIComponent(user.id)}&storagePath=${encodeURIComponent(storagePathToDelete)}`, {
               method: 'DELETE'
            });
          } catch (storageErr: any) {
             console.warn('Failed to delete file from Supabase Storage:', storageErr);
          }
        }

        await deleteDoc(doc(db, 'users', user.id, 'datasets', id));
        
        // Clear local state immediately to prevent stale UI
        if (prevResolvedRef.current?.id === id) {
          prevResolvedRef.current = null;
        }
        if (activeDatasetDataObj.id === id) {
          setActiveDatasetDataObj({ id: '', data: [] });
        }
        if (activeDatasetId === id) {
           const remaining = datasets.filter(d => d.id !== id);
           setActiveDatasetId(remaining.length > 0 ? remaining[0].id : null);
        }
        
        try {
          await localforage.removeItem(`dataset_data_${id}`);
        } catch (e) {
          console.warn('Failed to remove from localforage', e);
        }
        
        try {
          localStorage.removeItem(`copilot_history_${id}`);
        } catch (e) {
          console.warn('Failed to remove from localStorage', e);
        }

        // Delete associated reports
        try {
          const reportsToDelete = reports.filter(r => r.datasetId === id || (r.datasetName === datasetName && !r.datasetId));
          for (const rep of reportsToDelete) {
            await deleteDoc(doc(db, 'users', user.id, 'reports', rep.id));
          }
        } catch (e) {
          console.warn('Failed to delete associated reports', e);
        }

        await logActivity('Dataset deleted', 'data', `Deleted dataset ${datasetName}`);
        
        await NotificationService.createNotification(user.id, {
          title: 'Dataset deleted',
          description: `Dataset '${datasetName}' was deleted from the system.`,
          type: 'system',
          priority: 'warning'
        });
      }
      toast.success('Dataset deleted successfully.');
    } catch (e) {
      console.error('Error deleting dataset:', e);
      toast.error('Unable to delete dataset. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const baseActiveDataset = datasets.find(d => d.id === activeDatasetId) || null;
  const [activeDatasetDataObj, setActiveDatasetDataObj] = useState<{id: string, data: any[], error?: string}>({id: '', data: []});
  const prevResolvedRef = useRef<Dataset | null>(null);

  const activeDataset = useMemo(() => {
    if (!baseActiveDataset) return null;
    
    // If the data doesn't match the current active metadata, do not leak previous dataset's data
    if (!baseActiveDataset.data && activeDatasetDataObj.id !== baseActiveDataset.id) {
       return { ...baseActiveDataset, data: [], rawData: [], rowCount: baseActiveDataset.rowCount || 0, loadError: undefined };
    }

    const rawData = (baseActiveDataset.data && baseActiveDataset.data.length > 0)
      ? baseActiveDataset.data
      : (activeDatasetDataObj.data || []);
    
    const resolved = {
      ...baseActiveDataset,
      data: rawData,
      rawData: rawData,
      rowCount: rawData.length > 0 ? rawData.length : (baseActiveDataset.rowCount || 0),
      columnCount: baseActiveDataset.columns?.length || (rawData.length > 0 ? Object.keys(rawData[0]).length : (baseActiveDataset.columnCount || 0)),
      loadError: activeDatasetDataObj.error
    };
    prevResolvedRef.current = resolved;
    return resolved;
  }, [baseActiveDataset, activeDatasetDataObj]);

  return (
    <DataContext.Provider value={{ datasets, activeDataset, uploadDataset, setActiveDataset, deleteDataset, isLoadingData, isFetchingActiveData, activities, reports, logActivity, generateReport, deleteReport, dateFilter, setDateFilter }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
