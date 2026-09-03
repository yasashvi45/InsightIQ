import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Globe2, FileSpreadsheet, Sparkles, CheckCircle2, ChevronRight, UploadCloud, PlayCircle, ArrowRight, Loader2, File, AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Combobox } from '../components/ui/Combobox';
import { ImageUploader } from '../components/ui/ImageUploader';
import { COUNTRIES, TIMEZONES, CURRENCIES, LANGUAGES, DATE_FORMATS, NUMBER_FORMATS, INDUSTRIES, COMPANY_SIZES, ROLES } from '../lib/constants';

const STEPS = [
  { id: 1, title: 'Business Profile' },
  { id: 2, title: 'Localization' },
  { id: 3, title: 'Data Import' },
  { id: 4, title: 'AI Processing' }
];

// Simple Confetti Component using Framer Motion
const Confetti = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 1, 
            y: -20, 
            x: '50%',
            rotate: 0,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            y: '100vh', 
            x: `${Math.random() * 100}%`,
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: Math.random() * 2 + 1.5, 
            ease: "easeOut",
            delay: Math.random() * 0.5
          }}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            width: '8px',
            height: '12px',
            backgroundColor: ['#12D18E', '#4285F4', '#FBBC05', '#EA4335', '#FFFFFF'][Math.floor(Math.random() * 5)]
          }}
        />
      ))}
    </div>
  );
};

export function SetupWizard() {
  const { user, updateProfile, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(() => {
    if (user?.uploads && user.uploads.length > 0) return 4;
    if (user?.country) return 3;
    if (user?.industry && user?.role) return 2;
    return 1;
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Step 1: Business Profile State
  const [profileData, setProfileData] = useState({
    businessName: user?.businessName || '',
    industry: user?.industry || '',
    companySize: user?.companySize || '',
    role: user?.role || '',
    website: user?.website || '',
    logoUrl: user?.avatarUrl || ''
  });

  // Step 2: Localization State
  const [localData, setLocalData] = useState({
    country: user?.country || '',
    currency: user?.currency || '',
    timezone: user?.timezone || '',
    language: user?.language || '',
    dateFormat: user?.dateFormat || '',
    numberFormat: user?.numberFormat || '',
    locale: user?.locale || ''
  });

  // Auto-detect country based on browser timezone
  useEffect(() => {
    if (currentStep === 2 && !localData.country) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const matchedCountry = COUNTRIES.find(c => c.timezone === tz) || COUNTRIES.find(c => c.code === 'US');
      if (matchedCountry) {
        setLocalData({
          country: matchedCountry.code,
          currency: matchedCountry.currency,
          timezone: matchedCountry.timezone,
          language: matchedCountry.language,
          dateFormat: matchedCountry.dateFormat,
          numberFormat: matchedCountry.numberFormat,
          locale: matchedCountry.locale
        });
      }
    }
  }, [currentStep, localData.country]);

  // Update other localization fields when country changes
  const handleCountryChange = (countryCode: string) => {
    const matchedCountry = COUNTRIES.find(c => c.code === countryCode);
    if (matchedCountry) {
      setLocalData({
        country: countryCode,
        currency: matchedCountry.currency,
        timezone: matchedCountry.timezone,
        language: matchedCountry.language,
        dateFormat: matchedCountry.dateFormat,
        numberFormat: matchedCountry.numberFormat,
        locale: matchedCountry.locale
      });
    } else {
      setLocalData(prev => ({ ...prev, country: countryCode }));
    }
  };

  // Step 3: Data Import State
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgresses, setUploadProgresses] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4: AI Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [showConfetti, setShowConfetti] = useState(false);

  const processingMessages = [
    "Reading File...",
    "Cleaning Data...",
    "Finding Trends...",
    "Generating Insights...",
    "Forecasting...",
    "Done"
  ];

  // Auto-start processing if resuming at step 4
  useEffect(() => {
    if (currentStep === 4 && !isProcessing && processingStage === 0) {
      setIsProcessing(true);
    }
  }, [currentStep, isProcessing, processingStage]);

  // AI Processing Simulation
  useEffect(() => {
    if (isProcessing && processingStage < processingMessages.length - 1) {
      const stageTimer = setTimeout(() => {
        setProcessingStage(prev => prev + 1);
      }, 3000); // 3s per stage
      return () => clearTimeout(stageTimer);
    }
    
    if (isProcessing && processingStage === processingMessages.length - 1 && !showConfetti) {
       setShowConfetti(true);
    }
  }, [isProcessing, processingStage, processingMessages.length, showConfetti]);

  // AI Processing Countdown
  useEffect(() => {
    if (isProcessing && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isProcessing, timeLeft]);

  const handleNext = async () => {
    setIsSaving(true);
    try {
      // Auto-save progress
      const uploadsMeta = files.map(f => ({ name: f.name, size: f.size, type: f.type, uploadedAt: new Date().toISOString() }));
      await updateProfile({
        ...profileData,
        ...localData,
        uploads: uploadsMeta
      });
      
      if (currentStep < 3) {
        setCurrentStep(curr => curr + 1);
      } else if (currentStep === 3) {
        startProcessing();
      }
    } catch (error) {
      console.error("Failed to save progress", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFileErrors([]);
    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    validateAndSetFiles(droppedFiles);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileErrors([]);
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFiles(Array.from(e.target.files) as File[]);
    }
  };

  const validateAndSetFiles = (newFiles: File[]) => {
    const validExtensions = ['.csv', '.xlsx', '.xls', '.tsv', '.json'];
    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach(f => {
      const isDuplicate = files.some(existing => existing.name === f.name && existing.size === f.size);
      if (isDuplicate) {
        errors.push(`File ${f.name} is a duplicate.`);
        return;
      }
      const hasValidExtension = validExtensions.some(ext => f.name.toLowerCase().endsWith(ext));
      if (!hasValidExtension) {
        errors.push(`File ${f.name} has an unsupported format.`);
        return;
      }
      validFiles.push(f);
    });

    if (errors.length > 0) setFileErrors(errors);
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      simulateUploads(validFiles);
    }
  };

  const simulateUploads = (filesToUpload: File[]) => {
    setIsUploading(true);
    filesToUpload.forEach(f => {
      setUploadProgresses(prev => ({ ...prev, [f.name]: 0 }));
    });
    
    const interval = setInterval(() => {
      setUploadProgresses(prev => {
        let allDone = true;
        const newProgresses = { ...prev };
        filesToUpload.forEach(f => {
          if ((newProgresses[f.name] || 0) < 100) {
            newProgresses[f.name] = Math.min((newProgresses[f.name] || 0) + 10, 100);
            allDone = false;
          }
        });
        if (allDone) {
          clearInterval(interval);
          setIsUploading(false);
        }
        return newProgresses;
      });
    }, 200);
  };

  const startProcessing = () => {
    setIsProcessing(true);
    setCurrentStep(4);
  };

  const handleFinish = async () => {
    try {
      console.log('Saving onboarding...');
      await completeOnboarding();
      console.log('Onboarding saved.');
      console.log('Navigating to dashboard.');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Onboarding save failed:', error);
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      toast.error(`Failed to save onboarding progress: ${error.code || error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg)] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {showConfetti && <Confetti />}
      
      {/* Header/Progress */}
      <div className="w-full max-w-3xl mb-8 sm:mb-12 relative z-10">
        <div className="flex items-center justify-center mb-8 sm:mb-12">
           <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-primary)] flex items-center justify-center shadow-[0_0_15px_rgba(18,209,142,0.3)]">
              <Sparkles className="w-6 h-6 text-[var(--color-brand-bg)]" />
           </div>
        </div>
        
        <div className="flex items-center justify-between relative px-2">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[var(--color-brand-card)] rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--color-brand-primary)] rounded-full z-0 transition-all duration-500 ease-in-out shadow-[0_0_10px_rgba(18,209,142,0.5)]"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          ></div>
          
          {STEPS.map((step) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2 transition-all duration-500 bg-[var(--color-brand-bg)]",
                currentStep > step.id ? "border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] shadow-[0_0_15px_rgba(18,209,142,0.2)]" : 
                currentStep === step.id ? "border-[var(--color-brand-primary)] text-[var(--color-brand-text)] bg-[var(--color-brand-primary)] shadow-[0_0_15px_rgba(18,209,142,0.4)]" : 
                "border-[var(--color-brand-border)] text-[var(--color-brand-muted)]"
              )}>
                {currentStep > step.id ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : step.id}
              </div>
              <span className={cn(
                "absolute top-10 sm:top-12 text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors duration-300",
                currentStep >= step.id ? "text-[var(--color-brand-text)]" : "text-[var(--color-brand-muted)]"
              )}>{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-2xl bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 sm:p-12 shadow-2xl relative z-10 flex flex-col min-h-[500px]">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center shadow-inner">
                  <Building2 className="w-6 h-6 text-[var(--color-brand-primary)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-[var(--color-brand-text)]">Business Profile</h2>
                  <p className="text-[var(--color-brand-muted)] text-sm">Tell us about your organization.</p>
                </div>
              </div>
              
              <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Business Name</label>
                    <input type="text" value={profileData.businessName} onChange={e => setProfileData({...profileData, businessName: e.target.value})} className="w-full px-4 py-3 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Industry</label>
                    <Combobox
                      options={INDUSTRIES.map(i => ({ value: i, label: i }))}
                      value={profileData.industry}
                      onChange={val => setProfileData({ ...profileData, industry: val })}
                      placeholder="Select Industry"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Company Size</label>
                    <Combobox
                      options={COMPANY_SIZES.map(s => ({ value: s, label: s + ' Employees' }))}
                      value={profileData.companySize}
                      onChange={val => setProfileData({ ...profileData, companySize: val })}
                      placeholder="Select Size"
                      searchPlaceholder="Search size..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Your Role</label>
                    <Combobox
                      options={ROLES.map(r => ({ value: r, label: r }))}
                      value={profileData.role}
                      onChange={val => setProfileData({ ...profileData, role: val })}
                      placeholder="Select Role"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Website <span className="opacity-50">(Optional)</span></label>
                  <input 
                    type="url" 
                    placeholder="https://example.com" 
                    value={profileData.website} 
                    onChange={e => {
                      let val = e.target.value;
                      setProfileData({...profileData, website: val});
                    }}
                    onBlur={(e) => {
                      let val = e.target.value;
                      if (val && !/^https?:\/\//i.test(val)) {
                        val = 'https://' + val;
                        setProfileData({...profileData, website: val});
                      }
                    }}
                    className="w-full px-4 py-3 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-[var(--color-brand-text)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Business Logo <span className="opacity-50">(Optional)</span></label>
                  <ImageUploader
                    value={profileData.logoUrl}
                    onChange={(url) => setProfileData({ ...profileData, logoUrl: url })}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center shadow-inner">
                  <Globe2 className="w-6 h-6 text-[var(--color-brand-primary)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-[var(--color-brand-text)]">Localization</h2>
                  <p className="text-[var(--color-brand-muted)] text-sm">Set your regional preferences for accurate reporting.</p>
                </div>
              </div>

              <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2 flex items-center justify-between">Country</label>
                    <Combobox
                      options={COUNTRIES.map(c => ({ value: c.code, label: c.name }))}
                      value={localData.country}
                      onChange={handleCountryChange}
                      placeholder="Select Country"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Timezone</label>
                    <Combobox
                      options={TIMEZONES.map(t => ({ value: t, label: t }))}
                      value={localData.timezone}
                      onChange={val => setLocalData({ ...localData, timezone: val })}
                      placeholder="Select Timezone"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Primary Currency</label>
                    <Combobox
                      options={CURRENCIES.map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` }))}
                      value={localData.currency}
                      onChange={val => setLocalData({ ...localData, currency: val })}
                      placeholder="Select Currency"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Language</label>
                    <Combobox
                      options={LANGUAGES.map(l => ({ value: l, label: l }))}
                      value={localData.language}
                      onChange={val => setLocalData({ ...localData, language: val })}
                      placeholder="Select Language"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Date Format</label>
                    <Combobox
                      options={DATE_FORMATS.map(f => ({ value: f, label: f }))}
                      value={localData.dateFormat}
                      onChange={val => setLocalData({ ...localData, dateFormat: val })}
                      placeholder="Select Date Format"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-brand-muted)] mb-2">Number Format</label>
                    <Combobox
                      options={NUMBER_FORMATS.map(f => ({ value: f, label: f }))}
                      value={localData.numberFormat}
                      onChange={val => setLocalData({ ...localData, numberFormat: val })}
                      placeholder="Select Number Format"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center shadow-inner">
                  <FileSpreadsheet className="w-6 h-6 text-[var(--color-brand-primary)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-[var(--color-brand-text)]">Import Data</h2>
                  <p className="text-[var(--color-brand-muted)] text-sm">Connect your initial dataset to power the AI engine.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                {files.length === 0 ? (
                  <>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      className="border-2 border-dashed border-[var(--color-brand-border)] rounded-2xl bg-[var(--color-brand-bg)] hover:border-[var(--color-brand-primary)]/50 hover:bg-[var(--color-brand-primary)]/5 transition-all cursor-pointer p-10 flex flex-col items-center text-center group relative"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".csv, .xlsx, .xls, .tsv, .json" multiple />
                      <UploadCloud className="w-12 h-12 text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-primary)] mb-4 transition-colors" />
                      <h3 className="text-lg font-medium text-[var(--color-brand-text)] mb-2">Upload Files</h3>
                      <p className="text-sm text-[var(--color-brand-muted)]">Drag and drop your files here, or click to browse. Supported formats: CSV, Excel, TSV, JSON.</p>
                    </div>
                    {fileErrors.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {fileErrors.map((err, i) => (
                          <div key={i} className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-400/10 rounded-lg border border-red-400/20">
                            <AlertCircle className="w-4 h-4" /> {err}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <h3 className="text-lg font-medium text-[var(--color-brand-text)]">Uploaded Files</h3>
                       <button onClick={() => fileInputRef.current?.click()} className="text-sm text-[var(--color-brand-primary)] hover:underline">Add more files</button>
                       <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".csv, .xlsx, .xls, .tsv, .json" multiple />
                    </div>
                    
                    {fileErrors.length > 0 && (
                      <div className="flex flex-col gap-2 mb-4">
                        {fileErrors.map((err, i) => (
                          <div key={i} className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-400/10 rounded-lg border border-red-400/20">
                            <AlertCircle className="w-4 h-4" /> {err}
                          </div>
                        ))}
                      </div>
                    )}

                    {files.map(file => {
                       const progress = uploadProgresses[file.name] || 0;
                       const isDone = progress >= 100;
                       return (
                         <div key={file.name} className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl p-4 flex flex-col gap-3">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-primary)]/20 flex items-center justify-center">
                                 <File className="w-5 h-5 text-[var(--color-brand-primary)]" />
                               </div>
                               <div>
                                 <p className="font-medium text-[var(--color-brand-text)]">{file.name}</p>
                                 <p className="text-xs text-[var(--color-brand-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
                               </div>
                             </div>
                             {!isUploading && (
                               <div className="flex gap-3">
                                 <button onClick={() => setFiles(prev => prev.filter(f => f.name !== file.name))} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                               </div>
                             )}
                           </div>
                           
                           {!isDone ? (
                             <div className="space-y-2 mt-2">
                               <div className="flex justify-between text-xs text-[var(--color-brand-muted)]">
                                 <span>Uploading...</span>
                                 <span>{Math.round(progress)}%</span>
                               </div>
                               <div className="h-1.5 w-full bg-[var(--color-brand-card)] rounded-full overflow-hidden border border-[var(--color-brand-border)]">
                                 <motion.div 
                                   className="h-full bg-[var(--color-brand-primary)]" 
                                   initial={{ width: 0 }} 
                                   animate={{ width: `${progress}%` }} 
                                 />
                               </div>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 text-xs text-[var(--color-brand-success)] mt-1">
                               <CheckCircle2 className="w-4 h-4" /> Ready for processing
                             </div>
                           )}
                         </div>
                       );
                    })}
                  </div>
                )}

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--color-brand-border)]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[var(--color-brand-card)] text-[var(--color-brand-muted)]">OR</span>
                  </div>
                </div>

                <button onClick={startProcessing} className="w-full py-4 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] font-medium rounded-xl hover:border-[var(--color-brand-primary)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] group">
                  <PlayCircle className="w-5 h-5 text-[var(--color-brand-secondary)] group-hover:scale-110 transition-transform" /> Use Demo Dataset
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center py-8">
               
               <div className="relative w-40 h-40 mb-10">
                  <div className="absolute inset-0 border-4 border-[var(--color-brand-border)] rounded-full"></div>
                  
                  {processingStage < processingMessages.length - 1 ? (
                    <motion.div 
                      className="absolute inset-0 border-4 border-[var(--color-brand-primary)] rounded-full border-t-transparent shadow-[0_0_30px_rgba(18,209,142,0.3)]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 bg-[var(--color-brand-primary)] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(18,209,142,0.4)]"
                    >
                      <CheckCircle2 className="w-16 h-16 text-[var(--color-brand-bg)]" />
                    </motion.div>
                  )}
                  
                  {processingStage < processingMessages.length - 1 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-3xl font-heading font-bold text-[var(--color-brand-text)]">{Math.round((processingStage / (processingMessages.length - 1)) * 100)}%</span>
                       <span className="text-[10px] text-[var(--color-brand-muted)] mt-1">~{timeLeft}s remaining</span>
                    </div>
                  )}
               </div>

               <h2 className="text-3xl font-heading font-bold text-[var(--color-brand-text)] mb-3 text-center tracking-tight">
                 {processingStage === processingMessages.length - 1 ? "Workspace Ready!" : "AI is working..."}
               </h2>
               
               <div className="h-10 overflow-hidden relative w-full flex justify-center">
                 <AnimatePresence mode="popLayout">
                    <motion.p 
                      key={processingStage}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="text-[var(--color-brand-muted)] text-lg absolute font-medium"
                    >
                      {processingMessages[processingStage]}
                    </motion.p>
                 </AnimatePresence>
               </div>

               {processingStage === processingMessages.length - 1 && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.5 }}
                   className="mt-6 p-4 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl w-full max-w-sm text-center"
                 >
                   <p className="text-sm text-[var(--color-brand-muted)] mb-1">Created for</p>
                   <p className="font-medium text-[var(--color-brand-text)]">{profileData.businessName || `${user?.name || 'Your'}'s Workspace`}</p>
                 </motion.div>
               )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        {(currentStep < 4 || (currentStep === 4 && processingStage < processingMessages.length - 1)) && (
          <div className="mt-6 pt-6 border-t border-[var(--color-brand-border)] flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-4 w-full sm:w-auto">
              <button 
                onClick={() => {
                  if (currentStep === 4) {
                    setIsProcessing(false);
                    setProcessingStage(0);
                    setTimeLeft(15);
                  }
                  setCurrentStep(prev => prev - 1);
                }}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-medium transition-colors w-full sm:w-auto",
                  currentStep === 1 ? "opacity-0 pointer-events-none absolute" : "text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] hover:border-[var(--color-brand-muted)]"
                )}
              >
                Back
              </button>
              {currentStep === 3 && (
                 <button onClick={startProcessing} className="px-6 py-2.5 rounded-xl font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors w-full sm:w-auto">
                   Skip Import
                 </button>
              )}
            </div>
            
            {currentStep < 4 && (
              <button 
                onClick={handleNext}
                disabled={isSaving || (currentStep === 3 && files.length === 0 && !isUploading)}
                className={cn(
                  "w-full sm:w-auto px-8 py-3 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-semibold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]",
                  (currentStep === 3 && files.length === 0 && !isUploading) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : currentStep === 3 ? "Process Data" : "Continue"} 
                {!isSaving && <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}
        
        {currentStep === 4 && processingStage === processingMessages.length - 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-6 border-t border-[var(--color-brand-border)] flex justify-center"
          >
            <button 
              onClick={handleFinish}
              className="w-full sm:w-auto px-10 py-4 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-bold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all shadow-[0_4px_20px_rgba(18,209,142,0.3)] hover:shadow-[0_4px_25px_rgba(18,209,142,0.5)] flex items-center justify-center gap-3 active:scale-[0.98] group"
            >
              Enter Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
