import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, User, Bot, Loader2, AlertCircle, ArrowRight, Database, Check, Copy, ThumbsUp, ThumbsDown, ChevronDown, Paperclip, Mic, FileText, Maximize2, X, Download, Trash, LayoutDashboard, MessageSquarePlus, Sparkles, RefreshCw, FileDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { computeMetrics, formatNumber } from '../lib/dataUtils';
import { cn } from '../lib/utils';
import { fetchCopilotIntent } from '../lib/api';
import { executeOperations, Operations } from '../lib/analyticsEngine';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';

type MessageAnalysis = {
  type: 'kpi' | 'table' | 'chart' | 'insight';
  title?: string;
  description?: string;
  kpiValue?: number | string;
  kpiChange?: number;
  kpiFormat?: 'currency' | 'number' | 'percentage';
  chartType?: 'line' | 'bar' | 'area' | 'pie' | 'scatter';
  data?: any[];
  columns?: string[];
  xAxisKey?: string;
  yAxisKey?: string;
  seriesKeys?: string[];
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'loading' | 'streaming' | 'complete' | 'error';
  analysis?: MessageAnalysis[];
  originalQuery?: string;
};

const COLORS = ['#12D18E', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

export function Assistant() {
  const { user } = useAuth();
  const { activeDataset, datasets, setActiveDataset, isFetchingActiveData, generateReport, deleteDataset } = useData();
  const navigate = useNavigate();
  
  const currencySymbol = useMemo(() => {
    const c = activeDataset?.detectedCurrency || activeDataset?.currency || user?.currency || 'USD';
    if (c === 'INR') return '₹';
    if (c === 'EUR') return '€';
    if (c === 'GBP') return '£';
    return '$';
  }, [user, activeDataset]);

  const [isPanelOpen, setIsPanelOpen] = useState(window.innerWidth >= 1024);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const [showDatasetDropdown, setShowDatasetDropdown] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [confirmNewChat, setConfirmNewChat] = useState(false);
  const [confirmDeleteChat, setConfirmDeleteChat] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeDatasetIdRef = useRef(activeDataset?.id);
  
  const [fullscreenChart, setFullscreenChart] = useState<{title: string, data: any, type: string, xAxisKey: string, seriesKeys: string[]} | null>(null);

  useEffect(() => { 
    const prevId = activeDatasetIdRef.current;
    activeDatasetIdRef.current = activeDataset?.id; 
    
    if (activeDataset && prevId !== activeDataset.id) {
      const stored = localStorage.getItem(`copilot_history_${activeDataset.id}`);
      if (stored) {
        try {
          setMessages(JSON.parse(stored));
        } catch(e) {
          setMessages([]);
        }
      } else {
        setMessages([{
          id: Date.now().toString(),
          role: 'assistant',
          content: `Dataset changed to **${activeDataset.name}**. Starting a new analysis context. How can I help you analyze this data?`,
          status: 'complete'
        }]);
      }
    } else if (!activeDataset) {
      setMessages([]);
    }
  }, [activeDataset]);

  const updateMessages = (updater: (prev: Message[]) => Message[]) => {
    setMessages(prev => {
      const next = updater(prev);
      if (activeDataset) {
        localStorage.setItem(`copilot_history_${activeDataset.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  };

  const handleRetry = (msgId: string) => {
    updateMessages(prev => {
       const newMessages = prev.filter(m => m.id !== msgId);
       return newMessages;
    });
    // The last message is now the user message
    const msg = messages.find(m => m.id === msgId);
    if (msg && msg.originalQuery) {
       handleSend(msg.originalQuery, true);
    }
  };

  const handleSend = async (text: string = inputValue, isRetry: boolean = false) => {
    if ((!text.trim() && attachments.length === 0) || !activeDataset || isFetchingActiveData || isTyping) return;
    
    const currentDatasetId = activeDataset.id;
    
    if (!isRetry) {
       const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim(), status: 'complete' };
       updateMessages(prev => [...prev, newUserMsg]);
       setInputValue('');
    }
    
    setIsTyping(true);
    
    try {
      const columns = activeDataset.columns?.length ? 
        activeDataset.columns.map((c: any) => typeof c === 'string' ? c : c.name) : 
        Object.keys(activeDataset.data?.[0] || {});
      
      const metrics = computeMetrics(activeDataset);
      const metricsSummary = {
         rows: activeDataset.rowCount || activeDataset.data?.length || 0,
         columns: columns.length,
         totalRevenue: metrics.hasRevenueData ? metrics.totalRevenue : null,
         uniqueOrders: metrics.hasOrderId ? metrics.uniqueOrders : null,
         uniqueCustomers: metrics.hasCustomerData ? metrics.totalCustomers : null,
         averageOrderValue: metrics.hasRevenueData && metrics.hasOrderId && metrics.uniqueOrders > 0 
                              ? metrics.totalRevenue / metrics.uniqueOrders 
                              : null,
         topProducts: metrics.hasProductData ? metrics.topProducts.slice(0, 5) : [],
         categories: metrics.hasCategoryData ? metrics.categoryData : [],
         recentTrends: metrics.hasDateData ? metrics.revenueData.slice(-10) : [],
         insights: metrics.aiInsights,
         datasetStats: metrics.datasetStats
      };

      const response = await fetchCopilotIntent(text, columns, metricsSummary, attachments, currencySymbol, messages.map(m => ({ role: m.role, content: m.content })).slice(-10));
      
      if (activeDatasetIdRef.current !== currentDatasetId) return;
      setAttachments([]);
      
      let analysisResults: MessageAnalysis[] = [];
      let replyContent = response.explanation || '';
      
      if (response.operations) {
         const res = executeOperations(activeDataset.data || [], columns, response.operations as Operations);
         if (res.type === 'error') {
            replyContent = res.error || 'Failed to analyze.';
   
      } else if (res.type === 'metric') {
            analysisResults.push({
               type: 'kpi',
               title: response.operations.metric + (response.operations.agg ? ` (${response.operations.agg})` : ''),
               kpiValue: res.value as number,
               kpiFormat: 'number'
            });
         } else if (res.type === 'chart') {
            analysisResults.push({
               type: response.visualType === 'table' ? 'table' : 'chart',
               title: `${response.operations.metric || 'Count'} by ${response.operations.groupBy}`,
               chartType: response.visualType === 'bar' ? 'bar' : response.visualType === 'pie' ? 'pie' : 'line',
               data: res.data,
               xAxisKey: res.columns?.[0],
               seriesKeys: [res.columns?.[1] || 'value'],
               columns: res.columns
            });
         }
      }

      const newAssistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyContent,
        status: 'complete',
        analysis: analysisResults
      };
      
      updateMessages(prev => [...prev, newAssistantMsg]);
    } catch (error) {
      console.error("Assistant Error:", error);
      if (activeDatasetIdRef.current === currentDatasetId) {
        updateMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Analysis couldn't be completed.",
          status: 'error',
          originalQuery: text
        }]);
      }
    } finally {
      if (activeDatasetIdRef.current === currentDatasetId) {
        setIsTyping(false);
      }
    }
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    setConfirmDeleteChat(true);
  };
  
  const handleNewChat = () => {
    if (messages.length === 0) return;
    setConfirmNewChat(true);
  };

  const handleExport = () => {
    if (messages.length === 0) {
      toast.info('Nothing to export yet.');
      return;
    }
    setShowExportMenu(true);
  };
  
  const handleDownloadChat = (format: "pdf"|"txt") => {
    toast.success(`Chat exported as ${format.toUpperCase()}`);
    setShowExportMenu(false);
  };

  const handleCopyResponse = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleRegenerate = async (msg: Message) => {
    const idx = messages.findIndex(m => m.id === msg.id);
    if (idx === -1) return;
    const previousUserMsg = messages.slice(0, idx).reverse().find(m => m.role === "user");
    if (previousUserMsg) {
      updateMessages(prev => prev.slice(0, idx));
      handleSend(previousUserMsg.content);
    }
  };
  
  const handleVoiceInput = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
       toast.error("Voice input isn't supported in this browser.");
       return;
    }
    
    if (window.isSecureContext === false) {
       toast.error("Voice input requires a secure context (HTTPS) or localhost.");
       return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      
      let baseInputValue = inputValue;
      if (baseInputValue.length > 0 && !baseInputValue.endsWith(' ') && !baseInputValue.endsWith('\n')) {
        baseInputValue += ' ';
      }

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
           baseInputValue += finalTranscript;
           if (!baseInputValue.endsWith(' ')) {
             baseInputValue += ' ';
           }
        }
        
        setInputValue(baseInputValue + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          toast.error("Microphone access blocked. Allow microphone access for Insight Copilot in your browser settings, then try again.", {
            action: {
              label: "Retry",
              onClick: () => handleVoiceInput()
            },
            duration: 7000
          });
        } else if (event.error === 'no-speech') {
          // return to idle silently
        } else if (event.error === 'aborted') {
          // aborted by user
        } else if (event.error === 'audio-capture') {
          toast.error("No microphone device found or microphone is unavailable.");
        } else if (event.error === 'network') {
          toast.error("Network error occurred during speech recognition.");
        } else {
          toast.error("Speech recognition error: " + event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e: any) {
      setIsListening(false);
      toast.error("Failed to start voice input: " + (e.message || "Unknown error"));
    }
  };
  
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
      toast.success(`Added ${e.target.files.length} file(s)`);
    }
  };

  const renderAnalysis = (analysis: MessageAnalysis, idx: number) => {
    if (analysis.type === 'kpi') {
      return (
        <div key={idx} className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl p-4 mt-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-brand-muted)] font-medium mb-1">{analysis.title}</p>
            <h4 className="text-2xl font-bold text-[var(--color-brand-text)]">
              {analysis.kpiFormat === 'currency' ? currencySymbol : ''}
              {typeof analysis.kpiValue === 'number' ? formatNumber(analysis.kpiValue) : analysis.kpiValue}
              {analysis.kpiFormat === 'percentage' ? '%' : ''}
            </h4>
          </div>
          {analysis.kpiChange !== undefined && (
            <div className={cn("flex items-center text-sm font-medium", analysis.kpiChange >= 0 ? "text-[#21E6A8]" : "text-[#F43F5E]")}>
              {analysis.kpiChange >= 0 ? <ArrowRight className="w-3 h-3 -rotate-45" /> : <ArrowRight className="w-3 h-3 rotate-45" />}
              <span>{Math.abs(analysis.kpiChange)}%</span>
            </div>
          )}
        </div>
      );
    }
    
    if (analysis.type === 'chart' && analysis.data) {
      const xKey = analysis.xAxisKey || analysis.columns?.[0] || '';
      const sKeys = analysis.seriesKeys || (analysis.columns ? analysis.columns.slice(1) : []);
      
      return (
        <div key={idx} className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl p-4 mt-3">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-[var(--color-brand-text)]">{analysis.title}</h4>
            <button onClick={() => setFullscreenChart({ title: analysis.title || 'Chart', data: analysis.data, type: analysis.chartType || 'bar', xAxisKey: xKey, seriesKeys: sKeys })} className="p-1.5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-card)] rounded-md transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          <div className="h-[300px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {analysis.chartType === 'line' ? (
                <RechartsLineChart data={analysis.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27313D" vertical={false} />
                  <XAxis dataKey={xKey} stroke="#8E9BAE" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8E9BAE" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#151B23', borderColor: '#27313D', borderRadius: '8px' }} itemStyle={{ color: '#F7FAFC' }} />
                  {sKeys.map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  ))}
                </RechartsLineChart>
              ) : analysis.chartType === 'pie' ? (
                <RechartsPieChart>
                  <Pie data={analysis.data} dataKey={sKeys[0]} nameKey={xKey} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {analysis.data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#151B23', borderColor: '#27313D', borderRadius: '8px' }} />
                </RechartsPieChart>
              ) : (
                <BarChart data={analysis.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27313D" vertical={false} />
                  <XAxis dataKey={xKey} stroke="#8E9BAE" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8E9BAE" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                  <RechartsTooltip cursor={{ fill: '#27313D', opacity: 0.4 }} contentStyle={{ backgroundColor: '#151B23', borderColor: '#27313D', borderRadius: '8px' }} />
                  {sKeys.map((key, i) => (
                    <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} maxBarSize={40} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    
    if (analysis.type === 'table' && analysis.data) {
      const cols = analysis.columns || Object.keys(analysis.data[0] || {});
      return (
        <div key={idx} className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl mt-3 overflow-hidden">
          {analysis.title && <div className="px-4 py-3 border-b border-[var(--color-brand-border)] text-sm font-medium text-[var(--color-brand-text)]">{analysis.title}</div>}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--color-brand-card)] text-[var(--color-brand-muted)] text-xs uppercase tracking-wider">
                <tr>
                  {cols.map((col, i) => (
                    <th key={i} className="px-4 py-3 font-medium">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-brand-border)]">
                {analysis.data.slice(0, 5).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-[var(--color-brand-card)]/50 transition-colors">
                    {cols.map((col, j) => (
                      <td key={j} className="px-4 py-2 text-[var(--color-brand-text)]">{typeof row[col] === 'number' ? formatNumber(row[col]) : row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {analysis.data.length > 5 && (
            <div className="px-4 py-2 bg-[var(--color-brand-card)] border-t border-[var(--color-brand-border)] text-xs text-[var(--color-brand-muted)] text-center">
              Showing 5 of {analysis.data.length} rows
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  const metrics = activeDataset ? computeMetrics(activeDataset) : null;
  const quickActions = [
    "Give me an executive summary",
    "Show revenue trends",
    "What are my top products?",
    "Which categories need attention?",
    "Find unusual patterns",
    "Give me recommendations"
  ];

  return (
    <div className="h-[calc(100dvh-96px)] md:h-[calc(100dvh-144px)] w-full max-w-full flex flex-col relative overflow-hidden bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] md:rounded-2xl shadow-xl">
      <header className="shrink-0 min-h-16 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-card)]/80 backdrop-blur-md px-4 lg:px-8 flex flex-row items-center justify-between gap-2 z-20 w-full min-w-0 max-w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-brand-primary)] to-emerald-600 flex items-center justify-center shadow-lg shadow-[var(--color-brand-primary)]/20">
            <Bot className="w-4 h-4 text-[var(--color-brand-text)]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--color-brand-text)] leading-tight">Insight Copilot</h1>
            <p className="text-[11px] text-[var(--color-brand-muted)] font-medium">AI Business Analyst</p>
          </div>
        </div>

        <div className="flex flex-row items-center gap-1 sm:gap-2 min-w-0">
          {activeDataset && (
             <div className="relative">
               <button 
                 onClick={() => setShowDatasetDropdown(!showDatasetDropdown)}
                 className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg text-xs mr-2 hover:bg-[var(--color-brand-card)] transition-colors min-w-0 flex-shrink">
                 <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)] animate-pulse" />
                 <span className="text-[var(--color-brand-muted)] shrink-0 hidden lg:inline">Connected:</span>
                 <span className="text-[var(--color-brand-text)] font-medium max-w-[80px] sm:max-w-[100px] lg:max-w-[150px] truncate min-w-0" title={activeDataset.name}>{activeDataset.name}</span>
                 <ChevronDown className="w-3 h-3 text-[var(--color-brand-muted)]" />
               </button>
               
               {showDatasetDropdown && (
                 <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-[var(--color-brand-border)]">
                       <h3 className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase">Switch Dataset</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {datasets.map(d => (
                         <button key={d.id} onClick={() => { setActiveDataset(d.id); setShowDatasetDropdown(false); }} className="w-full text-left px-3 py-2 text-sm text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] flex items-center justify-between">
                            <span className="truncate">{d.name}</span>
                            {d.id === activeDataset.id && <Check className="w-4 h-4 text-[var(--color-brand-primary)]" />}
                         </button>
                      ))}
                    </div>
                 </div>
               )}
             </div>
          )}

          <div className="relative">
             <button onClick={handleNewChat} className="p-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] rounded-xl transition-colors border border-transparent hover:border-[var(--color-brand-border)]" title="New Chat">
               <MessageSquarePlus className="w-5 h-5" />
             </button>
             {confirmNewChat && (
               <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl shadow-2xl p-4 z-50">
                 <h3 className="text-sm font-semibold text-[var(--color-brand-text)] mb-2">Start a new analysis?</h3>
                 <p className="text-xs text-[var(--color-brand-muted)] mb-4">Your current conversation will be cleared from this view.</p>
                 <div className="flex justify-end gap-2">
                   <button onClick={() => setConfirmNewChat(false)} className="px-3 py-1.5 text-xs text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] rounded-md">Cancel</button>
                   <button onClick={() => { updateMessages(() => []); setInputValue(''); setConfirmNewChat(false); }} className="px-3 py-1.5 text-xs bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] rounded-md font-medium">Start New Chat</button>
                 </div>
               </div>
             )}
          </div>

          <div className="relative">
             <button onClick={handleExport} className="p-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] rounded-xl transition-colors border border-transparent hover:border-[var(--color-brand-border)]" title="Export Chat">
               <Download className="w-5 h-5" />
             </button>
             {showExportMenu && (
               <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl shadow-2xl overflow-hidden z-50">
                 <button onClick={() => handleDownloadChat('pdf')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] flex items-center gap-2"><FileDown className="w-4 h-4" /> Download PDF</button>
                 <button onClick={() => handleDownloadChat('txt')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] flex items-center gap-2"><FileText className="w-4 h-4" /> Download TXT</button>
               </div>
             )}
          </div>

          <div className="relative">
             <button onClick={handleClearChat} className="p-2 text-[var(--color-brand-muted)] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 rounded-xl transition-colors border border-transparent hover:border-[#F43F5E]/20" title="Delete Conversation">
               <Trash className="w-5 h-5" />
             </button>
             {confirmDeleteChat && (
               <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl shadow-2xl p-4 z-50">
                 <h3 className="text-sm font-semibold text-[var(--color-brand-text)] mb-2">Delete this conversation?</h3>
                 <p className="text-xs text-[var(--color-brand-muted)] mb-4">This will permanently remove the current Copilot conversation.</p>
                 <div className="flex justify-end gap-2">
                   <button onClick={() => setConfirmDeleteChat(false)} className="px-3 py-1.5 text-xs text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] rounded-md">Cancel</button>
                   <button onClick={() => { updateMessages(() => []); setConfirmDeleteChat(false); }} className="px-3 py-1.5 text-xs bg-[#F43F5E] text-[var(--color-brand-text)] rounded-md font-medium">Delete</button>
                 </div>
               </div>
             )}
          </div>

          <div className="w-px h-6 bg-[var(--color-brand-border)] mx-1"></div>
          <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="p-2 shrink-0 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] rounded-xl transition-colors border border-transparent hover:border-[var(--color-brand-border)]" title={isPanelOpen ? "Close Quick Analysis" : "Open Quick Analysis"}>
            <LayoutDashboard className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-brand-bg)] relative h-full">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 min-h-0">
            <div className="max-w-5xl mx-auto w-full">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 md:py-20">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-brand-primary)] to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-[var(--color-brand-primary)]/20">
                    <Sparkles className="w-8 h-8 text-[var(--color-brand-text)]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--color-brand-text)] mb-3">Welcome to Insight Copilot</h2>
                  <p className="text-[var(--color-brand-muted)] max-w-md mb-8">
                    Your AI business analyst. Ask questions about your dataset, request executive summaries, or generate charts.
                  </p>
                  
                  {activeDataset && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                      {quickActions.map((action, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleSend(action)}
                          className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl p-4 text-left hover:border-[var(--color-brand-primary)]/50 hover:bg-[var(--color-brand-primary)]/5 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-[var(--color-brand-text)]">{action}</span>
                            <ArrowRight className="w-4 h-4 text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-primary)] transition-colors shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 md:space-y-8 pb-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex items-start gap-4 md:gap-6", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                      <div className="shrink-0 mt-1 hidden sm:block">
                        {msg.role === 'assistant' ? (
                           <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-brand-primary)]/20 border border-[var(--color-brand-primary)]/30 shadow-sm">
                             <Bot className="w-5 h-5 text-[var(--color-brand-primary)]" />
                           </div>
                        ) : (
                           <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-brand-card)] border border-[var(--color-brand-border)]">
                             <User className="w-5 h-5 text-[var(--color-brand-muted)]" />
                           </div>
                        )}
                      </div>
                      
                      <div className={cn(
                        "flex flex-col min-w-0 w-full",
                        msg.role === 'user' ? "max-w-[90%] md:max-w-[85%]" : "max-w-full",
                        msg.role === 'user' ? "items-end" : "items-start"
                      )}>
                        {msg.role === 'user' && (
                          <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] px-5 py-3.5 rounded-[20px] rounded-tr-sm shadow-sm inline-block max-w-[85%] break-words">
                            <p className="text-[15px] whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        )}
                        
                        {msg.role === 'assistant' && (
                          <div className={cn(
                            "w-full text-[15px] leading-relaxed text-[var(--color-brand-text)] prose prose-invert prose-headings:text-[var(--color-brand-text)] prose-a:text-[var(--color-brand-primary)] prose-strong:text-[var(--color-brand-text)] prose-li:marker:text-[var(--color-brand-primary)] max-w-none",
                            msg.status === 'error' && "text-[#F43F5E]"
                          )}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                table: ({ node, ...props }) => (
                                  <div className="w-full overflow-x-auto my-6 border border-[var(--color-brand-border)] rounded-xl shadow-sm">
                                    <table className="w-full text-left border-collapse min-w-[500px]" {...props} />
                                  </div>
                                ),
                                thead: ({ node, ...props }) => <thead className="bg-[var(--color-brand-card)] border-b border-[var(--color-brand-border)]" {...props} />,
                                th: ({ node, ...props }) => <th className="px-4 py-3 text-sm font-semibold text-[var(--color-brand-text)]/70 whitespace-nowrap" {...props} />,
                                td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-[var(--color-brand-text)] border-b border-[var(--color-brand-border)] last:border-0" {...props} />,
                                tr: ({ node, ...props }) => <tr className="hover:bg-[var(--color-brand-card)]/50 transition-colors" {...props} />,
                                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-8 mb-4 text-[var(--color-brand-text)] tracking-tight" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-8 mb-4 text-[var(--color-brand-text)] tracking-tight border-b border-[var(--color-brand-border)] pb-2" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-6 mb-3 text-[var(--color-brand-text)]" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-[var(--color-brand-text)]/90" {...props} />,
                                ul: ({ node, ...props }) => <ul className="mb-4 list-disc list-outside ml-5 space-y-2 text-[var(--color-brand-text)]/90" {...props} />,
                                ol: ({ node, ...props }) => <ol className="mb-4 list-decimal list-outside ml-5 space-y-2 text-[var(--color-brand-text)]/90" {...props} />,
                                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-semibold text-[var(--color-brand-text)]" {...props} />,
                                code: ({ node, ...props }: any) => {
                                  const inline = !props.className?.includes('language-');
                                  return inline 
                                    ? <code className="px-1.5 py-0.5 rounded-md bg-[var(--color-brand-card)] text-[var(--color-brand-primary)] text-sm font-mono border border-[var(--color-brand-border)]" {...props} />
                                    : <code className="block p-4 rounded-xl bg-[#0F172A] text-[var(--color-brand-text)] text-sm font-mono overflow-x-auto my-4 border border-[var(--color-brand-border)]" {...props} />;
                                },
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                            
                            {msg.analysis && msg.analysis.length > 0 && (
                              <div className="mt-4 flex flex-col gap-6">
                                {msg.analysis.map((analysis, idx) => renderAnalysis(analysis, idx))}
                              </div>
                            )}

                            {msg.status === 'error' && msg.originalQuery && (
                              <div className="mt-4 flex">
                                <button
                                  onClick={() => handleRetry(msg.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] hover:bg-[var(--color-brand-border)] rounded-md text-sm font-medium transition-colors"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Retry Analysis
                                </button>
                              </div>
                            )}

                            {msg.status !== 'error' && msg.status !== 'loading' && (
                              <div className="flex items-center justify-between mt-6 pt-3 border-t border-[var(--color-brand-border)]/50 opacity-80 hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-0.5">
                                  <button onClick={() => handleCopyResponse(msg.content)} className="flex items-center justify-center w-8 h-8 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] rounded-md hover:bg-[var(--color-brand-card)] transition-colors" title="Copy"><Copy className="w-4 h-4" /></button>
                                  <button onClick={() => handleRegenerate(msg)} className="flex items-center justify-center w-8 h-8 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] rounded-md hover:bg-[var(--color-brand-card)] transition-colors" title="Regenerate"><RefreshCw className="w-4 h-4" /></button>
                                  <div className="w-px h-4 bg-[var(--color-brand-border)] mx-2"></div>
                                  <button onClick={() => toast.success("Feedback submitted")} className="flex items-center justify-center w-8 h-8 text-[var(--color-brand-muted)] hover:text-[#12D18E] rounded-md hover:bg-[var(--color-brand-card)] transition-colors" title="Helpful"><ThumbsUp className="w-4 h-4" /></button>
                                  <button onClick={() => toast.success("Feedback submitted")} className="flex items-center justify-center w-8 h-8 text-[var(--color-brand-muted)] hover:text-[#F43F5E] rounded-md hover:bg-[var(--color-brand-card)] transition-colors" title="Not Helpful"><ThumbsDown className="w-4 h-4" /></button>
                                </div>
                                <button onClick={async () => {
                                   if (!activeDataset) return;
                                   const newReportData = {
                                     name: `AI Analysis - ${activeDataset.name}`,
                                     type: 'Executive Summary',
                                     datasetName: activeDataset.name,
                                     datasetId: activeDataset.id,
                                     generatedBy: user?.name || 'System User',
                                     status: 'Completed' as const,
                                     metricsSnapshot: activeDataset.metrics || computeMetrics(activeDataset)
                                   };
                                   await generateReport(newReportData);
                                   navigate('/reports');
                                }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20 rounded-md transition-colors" title="Generate Report">
                                  <FileText className="w-3.5 h-3.5" /> Generate Report
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex items-start gap-4 md:gap-6">
                      <div className="shrink-0 mt-1 hidden sm:block">
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-[var(--color-brand-primary)] animate-spin" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-5 py-3.5 bg-transparent text-[var(--color-brand-muted)] text-sm">
                        <span>Analyzing your dataset...</span>
                        <span className="flex gap-1 items-center h-full pt-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)] animate-pulse" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)] animate-pulse" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)] animate-pulse" style={{ animationDelay: '300ms' }}></span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-gradient-to-t from-[var(--color-brand-bg)] via-[var(--color-brand-bg)] to-transparent relative z-10 w-full mt-auto shrink-0">
            <div className="max-w-5xl mx-auto w-full">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex flex-col bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] focus-within:border-[var(--color-brand-primary)]/50 focus-within:shadow-[0_0_15px_rgba(18,209,142,0.1)] rounded-[20px] transition-all shadow-sm"
              >
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1 border-b border-[var(--color-brand-border)]/50">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] px-3 py-1.5 rounded-lg text-xs text-[var(--color-brand-muted)]">
                        {file.type.startsWith('image/') ? <div className="w-4 h-4 rounded overflow-hidden"><img src={URL.createObjectURL(file)} alt="attachment" className="w-full h-full object-cover" /></div> : <FileText className="w-3.5 h-3.5" />}
                        <span className="max-w-[80px] sm:max-w-[150px] truncate">{file.name}</span>
                        <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="hover:text-[var(--color-brand-text)]"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                
                <textarea
                  value={inputValue}
                  onChange={adjustTextareaHeight}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={activeDataset ? `Ask about ${activeDataset.name}...` : "Connect a dataset to start..."}
                  disabled={!activeDataset || isFetchingActiveData || isTyping}
                  className="w-full bg-transparent text-[var(--color-brand-text)] placeholder-[var(--color-brand-muted)] text-[15px] resize-none focus:outline-none px-5 py-4 min-h-[56px] disabled:opacity-50 scrollbar-hide rounded-[20px] min-w-0" style={{ overflowX: "hidden" }}
                  rows={1}
                />
                
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                  <div className="flex items-center gap-1">
                    <input type="file" id="file-upload" className="hidden" multiple accept=".csv,.xlsx,.pdf,.docx,.txt,.png,.jpg,.jpeg" onChange={handleFileAttach} />
                    <label htmlFor="file-upload" className={cn("p-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] rounded-xl transition-colors cursor-pointer", (!activeDataset || isFetchingActiveData) && "opacity-50 pointer-events-none")}>
                      <Paperclip className="w-4 h-4" />
                    </label>
                    <button 
                      type="button" 
                      onClick={handleVoiceInput} 
                      disabled={!activeDataset || isFetchingActiveData} 
                      className={cn("p-2 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center", 
                        isListening 
                          ? "text-[#F43F5E] bg-[#F43F5E]/10 hover:bg-[#F43F5E]/20 animate-pulse" 
                          : "text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)]"
                      )}
                      aria-label={isListening ? "Stop voice input" : "Start voice input"}
                      title={isListening ? "Stop voice input" : "Start voice input"}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-row items-center gap-1 sm:gap-2 min-w-0">
                    <button
                      type="submit"
                      disabled={(!inputValue.trim() && attachments.length === 0) || !activeDataset || isFetchingActiveData || isTyping}
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 text-black disabled:opacity-50 disabled:bg-[var(--color-brand-card)] disabled:border disabled:border-[var(--color-brand-border)] disabled:text-[var(--color-brand-muted)] transition-all hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-sm"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>
                </div>
              </form>
              <div className="text-center mt-3 hidden md:block">
                <span className="text-[11px] text-[var(--color-brand-muted)]">AI Copilot may produce inaccurate calculations. Verify important business metrics.</span>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          "shrink-0 bg-[var(--color-brand-card)] flex flex-col transition-all duration-300 absolute lg:relative right-0 top-0 bottom-0 z-40 shadow-2xl lg:shadow-none overflow-hidden",
          isPanelOpen ? "w-[264px] translate-x-0 border-l border-[var(--color-brand-border)] opacity-100" : "w-0 translate-x-full lg:translate-x-0 opacity-0 lg:border-none"
        )}>
          <div className="w-[264px] h-full flex flex-col">
            <div className="h-16 shrink-0 border-b border-[var(--color-brand-border)] px-4 flex items-center justify-between gap-2 bg-[var(--color-brand-card)]/80 backdrop-blur-md">
              <div className="flex flex-row items-center gap-1 sm:gap-2 min-w-0">
                <LayoutDashboard className="w-4 h-4 text-[var(--color-brand-primary)]" />
                <h2 className="text-xs sm:text-sm font-semibold text-[var(--color-brand-text)] uppercase tracking-wider">Quick Analysis</h2>
              </div>
              <button onClick={() => setIsPanelOpen(false)} className="p-1.5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5 min-h-0">
            {isFetchingActiveData ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--color-brand-muted)]">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--color-brand-primary)]" />
                <span className="text-sm mt-3">Loading context...</span>
              </div>
            ) : !activeDataset ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Database className="w-8 h-8 text-[var(--color-brand-muted)] mb-3 opacity-50" />
                <p className="text-sm text-[var(--color-brand-muted)]">Connect a dataset to view contextual insights.</p>
              </div>
            ) : metrics ? (
              <>
                <div className="bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)] p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] flex items-center justify-center shrink-0">
                      <Database className="w-4 h-4 text-[var(--color-brand-primary)]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--color-brand-text)] truncate" title={activeDataset.name}>{activeDataset.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)]"></span>
                        <span className="text-xs text-[var(--color-brand-muted)]">Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                    <div>
                      <span className="text-[var(--color-brand-muted)] block mb-0.5">Rows</span>
                      <span className="font-medium text-[var(--color-brand-text)]">{formatNumber(activeDataset.rowCount || activeDataset.data?.length || 0)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-brand-muted)] block mb-0.5">Columns</span>
                      <span className="font-medium text-[var(--color-brand-text)]">{activeDataset.columns.length}</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-[var(--color-brand-border)]">
                      <span className="text-[var(--color-brand-muted)] block mb-0.5">Last Updated</span>
                      <span className="font-medium text-[var(--color-brand-text)]">{new Date(activeDataset.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wider mb-3">Key Metrics</h3>
                  <div className="space-y-2">
                    {metrics.hasRevenueData ? (
                      <div className="bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)] p-3 flex justify-between items-center shadow-sm">
                        <span className="text-xs text-[var(--color-brand-muted)] font-medium">Total Revenue</span>
                        <span className="font-bold text-xs sm:text-sm text-[var(--color-brand-text)]">{currencySymbol}{formatNumber(metrics.totalRevenue)}</span>
                      </div>
                    ) : (
                      <div className="bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)] p-3 flex justify-between items-center shadow-sm opacity-50">
                        <span className="text-xs text-[var(--color-brand-muted)] flex flex-col gap-0.5">
                           <span>Total Revenue</span>
                           <span className="text-[10px]">Unavailable - no revenue field</span>
                        </span>
                        <span className="font-bold text-xs text-[var(--color-brand-text)]">-</span>
                      </div>
                    )}
                    
                    <div className="bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)] p-3 flex justify-between items-center shadow-sm">
                      <span className="text-xs text-[var(--color-brand-muted)] font-medium">Rows (Records)</span>
                      <span className="font-bold text-xs sm:text-sm text-[var(--color-brand-text)]">{formatNumber(activeDataset.data?.length || 0)}</span>
                    </div>

                    {metrics.hasCustomerData ? (
                      <div className="bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)] p-3 flex justify-between items-center shadow-sm">
                        <span className="text-xs text-[var(--color-brand-muted)] font-medium">Customers</span>
                        <span className="font-bold text-xs sm:text-sm text-[var(--color-brand-text)]">{formatNumber(metrics.totalCustomers)}</span>
                      </div>
                    ) : (
                      <div className="bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)] p-3 flex justify-between items-center shadow-sm opacity-50">
                        <span className="text-xs text-[var(--color-brand-muted)] flex flex-col gap-0.5">
                           <span>Customers</span>
                           <span className="text-[10px]">Unavailable - no customer field</span>
                        </span>
                        <span className="font-bold text-xs text-[var(--color-brand-text)]">-</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wider mb-3">Data Quality</h3>
                  <div className="bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)] p-4 shadow-sm">
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-[var(--color-brand-text)]">Completeness</span>
                        <span className="text-sm text-[#21E6A8]">
                          {(() => {
                             const totalCells = (metrics.datasetStats?.totalRows || activeDataset.data?.length || 0) * (metrics.datasetStats?.cols || activeDataset.columns?.length || 1);
                             const missing = metrics.datasetStats?.missing || 0;
                             if (totalCells === 0) return '0%';
                             return Math.round(((totalCells - missing) / totalCells) * 100) + '%';
                          })()}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--color-brand-card)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--color-brand-primary)]" style={{ width: (() => {
                             const totalCells = (metrics.datasetStats?.totalRows || activeDataset.data?.length || 0) * (metrics.datasetStats?.cols || activeDataset.columns?.length || 1);
                             const missing = metrics.datasetStats?.missing || 0;
                             if (totalCells === 0) return '0%';
                             return Math.round(((totalCells - missing) / totalCells) * 100) + '%';
                          })() }}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-brand-muted)] bg-[var(--color-brand-card)] p-2 rounded-lg border border-[var(--color-brand-border)]/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#21E6A8] shrink-0" />
                      <span>Dataset parsed and optimized for AI analysis.</span>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
          </div>
        </div>
      </div>
      
      {fullscreenChart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl w-full max-w-6xl h-full max-h-[800px] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-brand-border)]">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">{fullscreenChart.title}</h3>
                <div className="flex bg-[var(--color-brand-bg)] rounded-lg p-1 border border-[var(--color-brand-border)]">
                  <button onClick={() => setFullscreenChart({...fullscreenChart, type: 'bar'})} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${fullscreenChart.type === 'bar' ? 'bg-[var(--color-brand-card)] text-[var(--color-brand-text)] shadow-sm' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}>Bar</button>
                  <button onClick={() => setFullscreenChart({...fullscreenChart, type: 'line'})} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${fullscreenChart.type === 'line' ? 'bg-[var(--color-brand-card)] text-[var(--color-brand-text)] shadow-sm' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}>Line</button>
                  <button onClick={() => setFullscreenChart({...fullscreenChart, type: 'pie'})} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${fullscreenChart.type === 'pie' ? 'bg-[var(--color-brand-card)] text-[var(--color-brand-text)] shadow-sm' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}>Pie</button>
                </div>
              </div>
              <button onClick={() => setFullscreenChart(null)} className="p-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-6 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                {fullscreenChart.type === 'line' ? (
                  <RechartsLineChart data={fullscreenChart.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27313D" vertical={false} />
                    <XAxis dataKey={fullscreenChart.xAxisKey} stroke="#8E9BAE" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8E9BAE" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#151B23', borderColor: '#27313D', borderRadius: '8px' }} itemStyle={{ color: '#F7FAFC' }} />
                    {fullscreenChart.seriesKeys.map((key, i) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    ))}
                  </RechartsLineChart>
                ) : fullscreenChart.type === 'pie' ? (
                  <RechartsPieChart>
                    <Pie data={fullscreenChart.data} dataKey={fullscreenChart.seriesKeys[0]} nameKey={fullscreenChart.xAxisKey} cx="50%" cy="50%" innerRadius={80} outerRadius={140} paddingAngle={2}>
                      {fullscreenChart.data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#151B23', borderColor: '#27313D', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  </RechartsPieChart>
                ) : (
                  <BarChart data={fullscreenChart.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27313D" vertical={false} />
                    <XAxis dataKey={fullscreenChart.xAxisKey} stroke="#8E9BAE" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8E9BAE" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                    <RechartsTooltip cursor={{ fill: '#27313D', opacity: 0.4 }} contentStyle={{ backgroundColor: '#151B23', borderColor: '#27313D', borderRadius: '8px' }} />
                    {fullscreenChart.seriesKeys.map((key, i) => (
                      <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={60} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
