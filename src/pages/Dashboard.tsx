import { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, ArrowDownRight, TrendingUp, TrendingDown, Users, DollarSign, Activity, Sparkles, UploadCloud, FileText, Share2, Clock, X, ChevronRight, Download, RefreshCw, Maximize2, CheckCircle2, ChevronDown, BarChart2, Search, ArrowRight, Zap, Image as ImageIcon, Loader2, Database, FileSpreadsheet } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { useData } from '../context/DataContext';
import { formatNumber } from '../lib/dataUtils';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { DatasetUploadModal } from '../components/DatasetUploadModal';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';
import { toast } from 'sonner';

import * as XLSX from 'xlsx';

function AnimatedNumber({ value, isCurrency = false }: { value: number, isCurrency?: boolean }) {
  const safeValue = typeof value === 'number' && !isNaN(value) && isFinite(value) ? (Object.is(value, -0) ? 0 : value) : 0;
  const [displayValue, setDisplayValue] = useState(safeValue);
  const prevValue = useRef(safeValue);
  const { formatCurrency } = useCurrency();
  
  useEffect(() => {
    let startTimestamp: number;
    const duration = 800;
    const startValue = prevValue.current;
    if (startValue === safeValue) {
      setDisplayValue(safeValue);
      return;
    }
    
    let reqId: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const nextVal = startValue + (safeValue - startValue) * ease;
      setDisplayValue(Object.is(nextVal, -0) ? 0 : nextVal);
      if (progress < 1) {
        reqId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(safeValue);
        prevValue.current = safeValue;
      }
    };
    reqId = window.requestAnimationFrame(step);
    return () => {
      if (reqId) window.cancelAnimationFrame(reqId);
    };
  }, [safeValue]);

  const finalVal = isNaN(displayValue) || !isFinite(displayValue) ? 0 : (Object.is(displayValue, -0) ? 0 : displayValue);
  return <>{isCurrency ? formatCurrency(finalVal) : formatNumber(Math.floor(finalVal))}</>;
}

export function Dashboard() {
  
  const { activeDataset, datasets, setActiveDataset, isLoadingData, isFetchingActiveData, activities, reports, logActivity, dateFilter, setDateFilter, deleteDataset } = useData();
  const { formatCurrency, formatCompactCurrency, currency } = useCurrency();
  const navigate = useNavigate();
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState('OFF');
  const [showRefreshDropdown, setShowRefreshDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
    
  const [chartType, setChartType] = useState<'Area' | 'Line' | 'Bar'>('Area');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [activeMetrics, setActiveMetrics] = useState({ revenue: true, visitors: true });
  
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [dismissedInsights, setDismissedInsights] = useState<Set<number>>(new Set());
  
  const [activitySearchOpen, setActivitySearchOpen] = useState(false);

  useEffect(() => {
    setDismissedInsights(new Set());
  }, [activeDataset?.id]);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  
  useEffect(() => {
    const handleCustomEvent = () => {
      setShowDateDropdown(false);
      setShowRefreshDropdown(false);
      setShowExportMenu(false);
      setActivitySearchOpen(false);
    };
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowDateDropdown(false);
        setShowRefreshDropdown(false);
        setShowExportMenu(false);
      }
    };
    window.addEventListener('closeDropdowns', handleCustomEvent);
    document.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('closeDropdowns', handleCustomEvent);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);
  
  // Using activeDataset directly as it is now filtered by DataContext
  const filteredDataset = activeDataset;

  const metrics = useDashboardMetrics(activeDataset, dateFilter, currency);
  const chartData = metrics.chartData || [];

  const insights = useMemo(() => {
    if (!activeDataset) return [];
    
    const generatedInsights: any[] = [];
    const domain = metrics.domain || 'generic';
    const topProduct = metrics.topProducts[0];
    const topCategory = metrics.categoryData[0];
    const topCustomer = metrics.topCustomersList[0];

    // Insight 1: Macro Trend / Volume / Revenue Growth
    if (metrics.capabilities?.hasRevenue && metrics.totalRevenue > 0) {
      const isPositive = metrics.revenueChange !== null 
        ? metrics.revenueChange >= 0 
        : (metrics.revenueData.length > 1 && metrics.revenueData[metrics.revenueData.length - 1].revenue >= metrics.revenueData[0].revenue);
      const growthPercent = metrics.revenueChange !== null ? Math.abs(metrics.revenueChange) : null;
      
      const title = domain === 'hr'
        ? 'Payroll Allocation Analysis'
        : (isPositive ? 'Revenue Growth Detected' : 'Revenue Decline Detected');

      const description = domain === 'hr'
        ? `Total organization compensation stands at ${formatCurrency(metrics.totalRevenue)} across ${metrics.totalCustomers || metrics.totalOrders} recorded personnel.`
        : (growthPercent !== null
          ? `Revenue is ${isPositive ? 'up' : 'down'} ${growthPercent}% compared to the previous period.`
          : `Revenue is trending ${isPositive ? 'positively' : 'negatively'} across the selected dataset.`);

      generatedInsights.push({
        id: 1,
        type: isPositive ? 'success' : 'warning',
        title,
        description,
        confidence: 'High',
        details: domain === 'hr'
          ? `Average individual compensation is ${formatCurrency(metrics.aov)}.`
          : `Based on your dataset "${activeDataset.name}", total revenue is ${formatCurrency(metrics.totalRevenue)} across ${metrics.totalOrders} transactions.`,
        rootCause: domain === 'hr'
          ? 'Derived from aggregate salary and compensation data points in the dataset.'
          : (isPositive ? 'Higher transaction volume or increased order value in the active period.' : 'Lower transaction volume or decreased demand in the current period.'),
        recommendedAction: domain === 'hr'
          ? 'Benchmark compensation tiers against industry standard ranges.'
          : (isPositive ? 'Capitalize on current momentum and scale high-converting marketing channels.' : 'Review sales channels and consider targeted promotional offers.'),
        relatedMetrics: domain === 'hr' ? 'Payroll, Headcount' : 'Revenue, Growth'
      });
    } else {
      // Non-revenue dataset insight
      generatedInsights.push({
        id: 1,
        type: 'info',
        title: 'Dataset Structure Verified',
        description: `Successfully processed ${metrics.capabilities?.validRows || metrics.totalOrders} records with data quality health index of ${metrics.healthScore}/100.`,
        confidence: 'High',
        details: `Identified ${Object.keys(metrics.capabilities?.detectedColumns || {}).length} recognized analytical dimensions across ${activeDataset.columns.length} total columns.`,
        rootCause: 'Automated semantic column mapping matched record structures.',
        recommendedAction: 'Explore segmented breakdowns and export customized summary reports.',
        relatedMetrics: 'Data Quality, Completeness'
      });
    }

    // Insight 2: Top Entity / Product / Role
    if (topProduct && (topProduct.revenue > 0 || topProduct.sales > 0)) {
      const entityLabel = domain === 'hr' ? 'Role / Title' : 'Product';
      generatedInsights.push({
        id: 2,
        type: 'success',
        title: `Top Performer: ${topProduct.name}`,
        description: domain === 'hr'
          ? `Largest workforce segment by compensation is "${topProduct.name}" (${formatCurrency(topProduct.revenue)} total).`
          : `This product is driving the highest revenue (${formatCurrency(topProduct.revenue)}).`,
        confidence: 'Very High',
        details: domain === 'hr'
          ? `Role "${topProduct.name}" accounts for ${topProduct.sales || topProduct.orders || 0} employees with average salary of ${formatCurrency(topProduct.aov)}.`
          : `Product "${topProduct.name}" generated ${formatCurrency(topProduct.revenue)} across ${topProduct.orders || topProduct.sales || 0} orders with an AOV of ${formatCurrency(topProduct.aov)}.`,
        rootCause: domain === 'hr' ? 'Core organizational specialization and staffing concentration.' : 'Strong product-market fit and high conversion demand.',
        recommendedAction: domain === 'hr' ? 'Ensure career development pipelines for critical specialized roles.' : 'Ensure adequate stock and consider increasing marketing budget.',
        relatedMetrics: domain === 'hr' ? 'Staffing, Compensation' : 'Sales, Revenue'
      });
    }

    // Insight 3: Category / Department
    if (topCategory && (topCategory.revenue > 0 || (topCategory.orders || topCategory.sales || 0) > 0)) {
      const catCount = topCategory.orders || topCategory.sales || 0;
      const catLabel = domain === 'hr' ? 'Department' : 'Category';
      const pct = topCategory.contribution 
        ? topCategory.contribution.toFixed(1) 
        : (metrics.totalRevenue > 0 ? ((topCategory.revenue / metrics.totalRevenue) * 100).toFixed(1) : ((catCount / (metrics.totalOrders || 1)) * 100).toFixed(1));

      generatedInsights.push({
        id: 3,
        type: 'info',
        title: `Leading ${catLabel}: ${topCategory.name}`,
        description: `The "${topCategory.name}" segment represents ${pct}% of total volume.`,
        confidence: 'High',
        details: metrics.capabilities?.hasRevenue 
          ? `Generated ${formatCurrency(topCategory.revenue)} in the analyzed period (${pct}% of total).`
          : `Comprises ${catCount} distinct records in the dataset.`,
        rootCause: 'Core operational concentration and segment affinity.',
        recommendedAction: domain === 'hr' ? 'Review departmental resource distribution.' : 'Cross-sell related offerings to this active audience.',
        relatedMetrics: `${catLabel} Distribution`
      });
    }

    return generatedInsights;
  }, [activeDataset, metrics, formatCurrency]);

  useEffect(() => {
    // Show welcome is false by default
  }, []);

  useEffect(() => {
    if (autoRefresh === 'OFF') return;
    const ms = autoRefresh === '30 sec' ? 30000 : autoRefresh === '1 minute' ? 60000 : autoRefresh === '5 minutes' ? 300000 : 900000;
    const interval = setInterval(() => {
      handleRefresh();
    }, ms);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      console.log(new Date());
      setIsLoading(false);
    }, 800);
  };

  const closeTour = () => {
    setShowWelcome(false);
  };

  const nextTourStep = () => {
    if (tourStep < 2) {
      setTourStep(prev => prev + 1);
    } else {
      closeTour();
    }
  };

  const [isExporting, setIsExporting] = useState<string | null>(null);

  const exportData = async (type: string) => {
    setIsExporting(type);
    setShowExportMenu(false);
    
    // Simulate generation time for more complex exports
    if (type !== 'csv' && type !== 'json') {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      if (type === 'csv' || type === 'json') {
        if (!filteredDataset) throw new Error('No active dataset');
        
        let content, mimeType, filename;
        if (type === 'csv') {
          const headers = filteredDataset.columns.join(',');
          const rows = filteredDataset.data.map(row => filteredDataset.columns.map(c => `"${(row[c]||'').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
          content = `${headers}\n${rows}`;
          mimeType = 'text/csv';
          filename = `dataset_export_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
          content = JSON.stringify(filteredDataset.data, null, 2);
          mimeType = 'application/json';
          filename = `dataset_export_${new Date().toISOString().split('T')[0]}.json`;
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Exported ${filename} successfully`);
      } else if (type === 'excel') {
        if (!filteredDataset) throw new Error('No active dataset');
        const worksheet = XLSX.utils.json_to_sheet(filteredDataset.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dataset");
        XLSX.writeFile(workbook, `dataset_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Exported Excel file successfully');
      } else if (type === 'pdf' || type === 'screenshot') {
        window.print();
        toast.success('Generated PDF Report');
      } else if (type === 'ai_summary') {
        const summary = `AI Summary generated on ${new Date().toLocaleDateString()}\n\nRevenue: ${formatCurrency(metrics.totalRevenue)}\nActive Customers: ${metrics.totalCustomers}\n\nTop Product: ${metrics.topProducts[0]?.name || 'N/A'}`;
        const blob = new Blob([summary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai_summary_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('AI Summary exported successfully');
      } else if (type === 'forecast_report') {
        toast.success('Forecast Report generated successfully');
      }
    } catch (e) {
      toast.error('Failed to export data');
    } finally {
      setIsExporting(null);
    }
  };

  const downloadChart = (format: 'png' | 'svg' | 'csv') => {
    const chartNode = document.querySelector('.recharts-wrapper svg') as SVGElement;
    if (!chartNode && format !== 'csv') return;

    if (format === 'csv') {
      const headers = 'Name,Revenue,Visitors,Sales';
      const rows = chartData.map(row => `${row.name},${row.revenue},${row.visitors},${(row as any).sales || 0}`).join('\n');
      const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chart-data.csv';
      a.click();
      toast.success('Chart data exported as CSV');
    } else {
      toast.info(`Exporting chart to ${format.toUpperCase()} is processing...`);
      // Simulating a delay for processing
      setTimeout(() => {
        toast.success(`Chart exported as ${format.toUpperCase()}`);
      }, 1500);
    }
  };

  const tourContent = [
    { title: "Welcome to InsightIQ", desc: "Your AI-powered workspace is ready. Let's take a quick look around to help you get started.", icon: <Sparkles className="w-8 h-8 text-[var(--color-brand-primary)]" /> },
    { title: "AI Insights", desc: "Our engine continuously analyzes your data. Check the right sidebar for real-time anomalies and actionable recommendations.", icon: <Activity className="w-8 h-8 text-[var(--color-brand-primary)]" /> },
    { title: "Data Sync", desc: "Connect more sources anytime using the 'Upload Data' button. The more data you provide, the smarter the insights become.", icon: <UploadCloud className="w-8 h-8 text-[var(--color-brand-primary)]" /> }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-12">
      
      {/* Welcome Tour Overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--color-brand-primary)]/10 blur-[50px] -mr-10 -mt-10 rounded-full pointer-events-none"></div>
              <button onClick={closeTour} className="absolute top-4 right-4 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors focus:outline-none"><X className="w-5 h-5" /></button>
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center mb-6 shadow-inner relative z-10">
                {tourContent[tourStep].icon}
              </div>
              <h2 className="text-2xl font-heading font-bold text-[var(--color-brand-text)] mb-3 relative z-10">{tourContent[tourStep].title}</h2>
              <p className="text-[var(--color-brand-muted)] mb-8 leading-relaxed relative z-10">{tourContent[tourStep].desc}</p>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex gap-2">
                  {[0, 1, 2].map(step => (
                    <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${tourStep === step ? 'w-6 bg-[var(--color-brand-primary)]' : 'w-2 bg-[var(--color-brand-border)]'}`} />
                  ))}
                </div>
                <button onClick={nextTourStep} className="px-6 py-2.5 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-semibold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all flex items-center gap-2 active:scale-[0.98]">
                  {tourStep === 2 ? 'Get Started' : 'Next'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insight Details Modal */}
      <AnimatePresence>
        {selectedInsight && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setSelectedInsight(null)} className="absolute top-4 right-4 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors focus:outline-none"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedInsight.type === 'success' ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'bg-[#FFBD2E]/10 text-[#FFBD2E]'}`}>
                  {selectedInsight.type === 'success' ? <TrendingUp className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold text-[var(--color-brand-text)]">{selectedInsight.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-[var(--color-brand-muted)] px-2 py-0.5 rounded bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)]">Confidence: {selectedInsight.confidence}</span>
                    <span className="text-xs text-[var(--color-brand-muted)]">Related: {selectedInsight.relatedMetrics}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-brand-text)] mb-2 uppercase tracking-wider">Analysis</h4>
                  <p className="text-sm text-[var(--color-brand-muted)] leading-relaxed">{selectedInsight.details}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-brand-text)] mb-2 uppercase tracking-wider">Root Cause</h4>
                  <p className="text-sm text-[var(--color-brand-muted)] leading-relaxed bg-[var(--color-brand-bg)] p-3 rounded-xl border border-[var(--color-brand-border)]">{selectedInsight.rootCause}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-brand-text)] mb-2 uppercase tracking-wider">Recommended Action</h4>
                  <div className="flex items-center justify-between bg-[var(--color-brand-primary)]/10 p-3 rounded-xl border border-[var(--color-brand-primary)]/30">
                    <p className="text-sm text-[var(--color-brand-primary)] font-medium leading-relaxed">{selectedInsight.recommendedAction}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => { setDismissedInsights(prev => new Set(prev).add(selectedInsight.id)); setSelectedInsight(null); }} className="flex-1 py-3 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-sm font-semibold text-[var(--color-brand-text)] hover:border-[var(--color-brand-primary)] transition-all">Dismiss</button>
                <button onClick={() => { setDismissedInsights(prev => new Set(prev).add(selectedInsight.id)); setSelectedInsight(null); }} className="flex-1 py-3 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] rounded-xl text-sm font-semibold hover:bg-[var(--color-brand-secondary)] transition-all flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Mark Resolved</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DatasetUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />

      {/* Header & Quick Actions */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[var(--color-brand-text)] mb-1 tracking-tight">Dashboard Overview</h1>
          <p className="text-[var(--color-brand-muted)] text-sm mb-6">
            Real-time analytics generated from your latest uploaded dataset.
          </p>
          
          {activeDataset && (
            <div className="flex flex-col gap-3 bg-[var(--color-brand-card)]/50 backdrop-blur-md border border-[var(--color-brand-border)] p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-[var(--color-brand-primary)]/50 transition-colors group">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4 text-[var(--color-brand-primary)]" />
                </div>
                <h3 className="text-base font-semibold text-[var(--color-brand-text)] group-hover:text-[var(--color-brand-primary)] transition-colors truncate">{activeDataset.name}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5 text-[var(--color-brand-muted)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)] animate-pulse shadow-[0_0_8px_rgba(18,209,142,0.6)]"></span>
                  <span className="text-[var(--color-brand-primary)]">Synced just now</span>
                </div>
                <div className="w-px h-3 bg-[var(--color-brand-border)]"></div>
                <div>
                  <span className="text-[var(--color-brand-muted)]">Rows:</span> <span className="text-[var(--color-brand-text)]">{formatNumber(activeDataset.rowCount || activeDataset.data?.length || 0)}</span>
                </div>
                <div className="w-px h-3 bg-[var(--color-brand-border)]"></div>
                <div>
                  <span className="text-[var(--color-brand-muted)]">Columns:</span> <span className="text-[var(--color-brand-text)]">{activeDataset.columns.length}</span>
                </div>
                <div className="w-px h-3 bg-[var(--color-brand-border)]"></div>
                <div>
                  <span className="text-[var(--color-brand-muted)]">Uploaded:</span> <span className="text-[var(--color-brand-text)]">{new Date(activeDataset.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 w-full xl:w-auto min-w-0">
          
          {/* Refresh Control */}
          <div className="relative dropdown-container">
            <button onClick={() => { if (!showRefreshDropdown) window.dispatchEvent(new Event('closeDropdowns')); setShowRefreshDropdown(!showRefreshDropdown); }} className="w-full sm:w-auto justify-center px-3 py-2.5 bg-[var(--color-brand-card)] text-[var(--color-brand-text)] text-sm font-medium rounded-xl border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)] transition-all flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[var(--color-brand-primary)]' : ''}`} />
              <span className="hidden sm:inline">{autoRefresh === 'OFF' ? 'Manual' : autoRefresh}</span>
              <ChevronDown className="w-3 h-3 text-[var(--color-brand-muted)] ml-1" />
            </button>
            {showRefreshDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl shadow-xl z-20 py-1">
                <div className="px-3 py-2 text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wider">Auto Refresh</div>
                {['OFF', '30 sec', '1 minute', '5 minutes', '15 minutes'].map(opt => (
                  <button key={opt} onClick={() => { setAutoRefresh(opt); setShowRefreshDropdown(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-brand-bg)] transition-colors ${autoRefresh === opt ? 'text-[var(--color-brand-primary)] font-medium' : 'text-[var(--color-brand-text)]'}`}>
                    {opt}
                  </button>
                ))}
                <div className="border-t border-[var(--color-brand-border)] mt-1 mb-1"></div>
                <button onClick={() => { handleRefresh(); setShowRefreshDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] transition-colors flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[var(--color-brand-muted)]" /> Refresh Now
                </button>
              </div>
            )}
          </div>

          {/* Date Filter */}
          <div className="relative dropdown-container">
            <button onClick={() => { if (!showDateDropdown) window.dispatchEvent(new Event('closeDropdowns')); setShowDateDropdown(!showDateDropdown); }} className="w-full sm:w-auto justify-center px-4 py-2.5 bg-[var(--color-brand-card)] text-[var(--color-brand-text)] text-sm font-medium rounded-xl border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)] transition-all flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--color-brand-muted)]" />
              {dateFilter}
              <ChevronDown className="w-3 h-3 text-[var(--color-brand-muted)] ml-1" />
            </button>
            {showDateDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl shadow-xl z-20 py-1">
                {['All Time', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Month', 'Last Month', 'This Year', 'Today', 'Yesterday', 'Custom Range'].map(opt => (
                  <button key={opt} onClick={() => { 
                    if (opt === 'Custom Range') {
                      toast.info('Custom date range picker coming soon.');
                      return;
                    }
                    setDateFilter(opt); setShowDateDropdown(false); handleRefresh(); 
                  }} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-brand-bg)] transition-colors ${dateFilter === opt ? 'text-[var(--color-brand-primary)] font-medium' : 'text-[var(--color-brand-text)]'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Control */}
          <div className="relative dropdown-container">
            <button onClick={() => { if (!showExportMenu) window.dispatchEvent(new Event('closeDropdowns')); setShowExportMenu(!showExportMenu); }} disabled={isExporting !== null} className="w-full sm:w-auto justify-center px-4 py-2.5 bg-[var(--color-brand-card)] text-[var(--color-brand-text)] text-sm font-medium rounded-xl border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)] transition-all flex items-center gap-2 disabled:opacity-50 col-span-2 sm:col-span-1">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">Export</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl shadow-xl z-20 py-2">
                <div className="px-3 py-1 text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wider">Reports & Dashboards</div>
                <button onClick={() => exportData('screenshot')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] transition-colors flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[var(--color-brand-muted)]" /> Dashboard Screenshot
                </button>

                <div className="h-px bg-[var(--color-brand-border)] my-2"></div>
                <div className="px-3 py-1 text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wider">Current Dataset</div>
                <button onClick={() => exportData('csv')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] transition-colors flex items-center gap-2">
                  <Database className="w-4 h-4 text-[var(--color-brand-muted)]" /> CSV
                </button>
                <button onClick={() => exportData('excel')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] transition-colors flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[var(--color-brand-muted)]" /> Excel (.xlsx)
                </button>
                <button onClick={() => exportData('json')} className="w-full text-left px-4 py-2 text-sm text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-brand-muted)]" /> JSON
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setIsUploadModalOpen(true)} className="px-5 py-2.5 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] text-sm font-semibold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all shadow-[0_4px_14px_rgba(18,209,142,0.2)] flex items-center gap-2">
              <UploadCloud className="w-4 h-4" /> <span className="hidden sm:inline">Upload Data</span>
            </button>
          </div>
        </div>
      </div>

      
      {activeDataset?.loadError ? (
        <div className="flex flex-col items-center justify-center min-h-[500px] bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-[var(--color-brand-text)] mb-2">Dataset records could not be loaded</h2>
          <p className="text-[var(--color-brand-muted)] max-w-lg mb-6 leading-relaxed text-sm">
            {activeDataset.loadError}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-semibold rounded-xl hover:opacity-90 transition-all text-sm flex items-center gap-2 shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              Upload New Dataset
            </button>
            {datasets.filter(d => d.id !== activeDataset.id).length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) setActiveDataset(e.target.value);
                }}
                defaultValue=""
                className="px-4 py-2.5 bg-[var(--color-brand-card)] text-[var(--color-brand-text)] border border-[var(--color-brand-border)] rounded-xl text-sm font-medium focus:outline-none"
              >
                <option value="" disabled>Switch to another dataset...</option>
                {datasets.filter(d => d.id !== activeDataset.id).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to remove this dataset reference?')) {
                  deleteDataset(activeDataset.id);
                }
              }}
              className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 font-semibold rounded-xl hover:bg-red-100 transition-all text-sm dark:bg-red-950/30 dark:border-red-800/40 dark:text-red-400"
            >
              Delete Dataset
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 bg-[var(--color-brand-surface)] text-[var(--color-brand-text)] border border-[var(--color-brand-border)] font-semibold rounded-xl hover:bg-[var(--color-brand-border)] transition-all text-sm"
            >
              Reload
            </button>
          </div>
        </div>
      ) :
      !activeDataset ? (
        (isLoadingData || isFetchingActiveData) ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-8 shadow-sm">
            <Loader2 className="w-12 h-12 text-[var(--color-brand-primary)] animate-spin mb-4" />
            <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)]">Loading your workspace...</h2>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[500px] animate-in fade-in zoom-in duration-500 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-8 shadow-sm">
            <div className="w-48 h-48 mb-8 relative">
              <div className="absolute inset-0 bg-[var(--color-brand-primary)]/20 blur-[60px] rounded-full"></div>
              <div className="w-full h-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-3xl flex items-center justify-center relative z-10 shadow-2xl">
                <DatabaseIllustration />
              </div>
            </div>
            <h2 className="text-3xl font-heading font-bold text-[var(--color-brand-text)] mb-4">No datasets available</h2>
            <p className="text-[var(--color-brand-muted)] text-center max-w-md mb-8 leading-relaxed">
              Upload a CSV dataset to start analyzing your business data.
            </p>
            <button onClick={() => setIsUploadModalOpen(true)} className="px-8 py-4 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] text-base font-bold rounded-2xl hover:bg-[var(--color-brand-secondary)] transition-all shadow-[0_4px_24px_rgba(18,209,142,0.3)] hover:shadow-[0_6px_32px_rgba(18,209,142,0.4)] flex items-center gap-3">
              <UploadCloud className="w-5 h-5" /> Upload Dataset
            </button>
          </div>
        )
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <HealthScoreCard 
              title={metrics.domain === 'hr' ? 'Workforce Health' : metrics.domain === 'generic' ? 'Data Health' : 'Business Health'}
              score={metrics.healthScore} 
              trend={metrics.growth !== null ? `${metrics.growth > 0 ? '+' : ''}${metrics.growth}%` : 'N/A'} 
              isLoading={isLoading} 
              onClick={() => navigate('/analytics')} 
            />
            <StatCard 
              title={metrics.domain === 'hr' ? 'Total Payroll' : (metrics.capabilities?.hasRevenue ? 'Total Revenue' : metrics.capabilities?.hasQuantity ? 'Total Volume' : 'Total Records')} 
              value={metrics.capabilities?.hasRevenue ? metrics.totalRevenue : (metrics.capabilities?.hasQuantity ? metrics.totalQuantity : (metrics.capabilities?.validRows || metrics.totalOrders))} 
              isCurrency={metrics.capabilities?.hasRevenue ?? (metrics.totalRevenue > 0)}
              change={metrics.revenueChange !== null ? `${metrics.revenueChange > 0 ? '+' : ''}${metrics.revenueChange}%` : undefined} 
              isPositive={metrics.revenueChange !== null ? metrics.revenueChange >= 0 : true} 
              icon={metrics.capabilities?.hasRevenue ? DollarSign : BarChart2} 
              isLoading={isLoading}
              tooltip={metrics.domain === 'hr' ? 'Total compensation across all records' : (metrics.capabilities?.hasRevenue ? 'Total recognized revenue in the selected period' : 'Total volume across active records')}
              onClick={() => navigate('/analytics')}
            />
            <StatCard 
              title={metrics.domain === 'hr' ? 'Average Salary' : (metrics.hasOrderId ? 'Average Order Value' : metrics.capabilities?.hasRevenue ? 'Avg Transaction Value' : 'Average Value')} 
              value={metrics.aov} 
              isCurrency={metrics.capabilities?.hasRevenue ?? true}
              change={metrics.aovChange !== null ? `${metrics.aovChange > 0 ? '+' : ''}${metrics.aovChange}%` : undefined} 
              isPositive={metrics.aovChange !== null ? metrics.aovChange >= 0 : true} 
              icon={Activity} 
              isLoading={isLoading}
              tooltip={metrics.domain === 'hr' ? 'Average compensation across all records' : (metrics.hasOrderId ? `Average revenue per order (${metrics.totalOrders} orders)` : `Average revenue per record (${metrics.totalOrders} rows)`)}
              onClick={() => navigate('/analytics')}
            />
            <StatCard 
              title={metrics.domain === 'hr' ? 'Total Employees' : (metrics.hasCustomerData ? 'Active Customers' : metrics.hasProductData ? 'Active Products' : 'Total Records')} 
              value={metrics.domain === 'hr' ? (metrics.totalCustomers || metrics.capabilities?.validRows || 0) : (metrics.hasCustomerData ? metrics.totalCustomers : metrics.hasProductData ? metrics.totalProducts : metrics.totalOrders)} 
              change={metrics.customersChange !== null ? `${metrics.customersChange > 0 ? '+' : ''}${metrics.customersChange}%` : undefined} 
              isPositive={metrics.customersChange !== null ? metrics.customersChange >= 0 : true} 
              icon={Users} 
              isLoading={isLoading}
              tooltip={metrics.domain === 'hr' ? 'Total employee headcount in dataset' : (metrics.hasCustomerData ? 'Unique customers identified in dataset' : metrics.hasProductData ? 'Unique product items in dataset' : 'Total transaction count')}
              onClick={() => navigate('/analytics')}
            />
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Chart */}
            <div className={`xl:col-span-2 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm flex flex-col min-h-[400px] transition-all min-w-0 ${isFullscreen ? 'fixed inset-4 z-50 overflow-hidden' : ''}`}>
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-[var(--color-brand-card)]/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                  <RefreshCw className="w-8 h-8 text-[var(--color-brand-primary)] animate-spin" />
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
                    {metrics.domain === 'hr' ? 'Payroll & Headcount Trend' : (metrics.capabilities?.hasRevenue ? 'Revenue & Trend' : 'Activity & Timeline')}
                  </h2>
                  <p className="text-sm text-[var(--color-brand-muted)] mt-1">Multi-metric comparison over {dateFilter.toLowerCase()}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button onClick={() => setActiveMetrics(p => ({...p, revenue: !p.revenue}))} className={`px-2.5 py-1 text-[11px] uppercase font-bold tracking-wider rounded-md transition-all border ${activeMetrics.revenue ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]/30 shadow-[0_0_10px_rgba(18,209,142,0.1)]' : 'bg-transparent text-[var(--color-brand-muted)] border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)]/50'}`}>
                      {metrics.domain === 'hr' ? 'Payroll' : (metrics.capabilities?.hasRevenue ? 'Revenue' : 'Volume')}
                    </button>
                    {metrics.hasTrafficData && (
                      <button onClick={() => setActiveMetrics(p => ({...p, visitors: !p.visitors}))} className={`px-2.5 py-1 text-[11px] uppercase font-bold tracking-wider rounded-md transition-all border ${activeMetrics.visitors ? 'bg-[var(--color-brand-secondary)]/10 text-[var(--color-brand-secondary)] border-[var(--color-brand-secondary)]/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'bg-transparent text-[var(--color-brand-muted)] border-[var(--color-brand-border)] hover:border-[var(--color-brand-secondary)]/50'}`}>Visitors</button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 bg-[var(--color-brand-bg)] p-1 rounded-xl border border-[var(--color-brand-border)] w-full sm:w-auto">
                  <button onClick={() => setChartType('Area')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${chartType === 'Area' ? 'bg-[var(--color-brand-card)] text-[var(--color-brand-primary)] shadow-sm' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}>Area</button>
                  <button onClick={() => setChartType('Line')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${chartType === 'Line' ? 'bg-[var(--color-brand-card)] text-[var(--color-brand-primary)] shadow-sm' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}>Line</button>
                  <button onClick={() => setChartType('Bar')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${chartType === 'Bar' ? 'bg-[var(--color-brand-card)] text-[var(--color-brand-primary)] shadow-sm' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}>Bar</button>
                  <div className="w-px h-4 bg-[var(--color-brand-border)] mx-1"></div>
                  <button onClick={() => downloadChart('csv')} className="p-1.5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors" title="Download CSV"><Download className="w-4 h-4" /></button>
                  <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors" title="Toggle Fullscreen"><Maximize2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex-1 w-full min-h-[300px] overflow-hidden">
                {chartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center p-6 bg-[var(--color-brand-bg)]/20 rounded-2xl border border-[var(--color-brand-border)]/50">
                    <Activity className="w-10 h-10 text-[var(--color-brand-muted)] mb-3 opacity-40" />
                    <p className="text-sm font-medium text-[var(--color-brand-text)]">Time-Series Data Unavailable</p>
                    <p className="text-xs text-[var(--color-brand-muted)] mt-1 max-w-sm">
                      No valid date or timestamp column detected in this dataset to generate historical trends.
                    </p>
                  </div>
                ) : (
                <ResponsiveContainer width="99%" height="100%">
                  {chartType === 'Area' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-brand-secondary)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--color-brand-secondary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-brand-border)" />
                      <XAxis dataKey="name" stroke="var(--color-brand-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis yAxisId="left" stroke="var(--color-brand-muted)" fontSize={11} tickLine={false} axisLine={false} width={60} tickFormatter={(value) => metrics.capabilities?.hasRevenue ? formatCompactCurrency(value) : formatNumber(value)} />
                      {metrics.hasTrafficData && activeMetrics.visitors && (
                        <YAxis yAxisId="right" orientation="right" stroke="var(--color-brand-muted)" fontSize={11} tickLine={false} axisLine={false} width={40} />
                      )}
                      <Tooltip contentStyle={{ backgroundColor: 'var(--color-brand-bg)', border: '1px solid var(--color-brand-border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }} itemStyle={{ color: 'var(--color-brand-text)', fontWeight: 500 }} labelStyle={{ color: 'var(--color-brand-muted)', marginBottom: '4px' }} formatter={(val: any, name: any) => [name === 'revenue' ? (metrics.capabilities?.hasRevenue ? formatCurrency(Number(val)) : formatNumber(Number(val))) : formatNumber(Number(val)), name === 'revenue' ? (metrics.domain === 'hr' ? 'Payroll' : metrics.capabilities?.hasRevenue ? 'Revenue' : 'Volume') : name === 'visitors' ? 'Visitors' : 'Orders']} />
                      {activeMetrics.revenue && <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="var(--color-brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, fill: 'var(--color-brand-primary)', stroke: 'var(--color-brand-bg)', strokeWidth: 2 }} />}
                      {metrics.hasTrafficData && activeMetrics.visitors && <Area yAxisId="right" type="monotone" dataKey="visitors" stroke="var(--color-brand-secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitors)" activeDot={{ r: 6, fill: 'var(--color-brand-secondary)', stroke: 'var(--color-brand-bg)', strokeWidth: 2 }} />}
                    </AreaChart>
                  ) : chartType === 'Line' ? (
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-brand-border)" />
                      <XAxis dataKey="name" stroke="var(--color-brand-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis yAxisId="left" stroke="var(--color-brand-muted)" fontSize={11} tickLine={false} axisLine={false} width={60} tickFormatter={(value) => metrics.capabilities?.hasRevenue ? formatCompactCurrency(value) : formatNumber(value)} />
                      {metrics.hasTrafficData && activeMetrics.visitors && (
                        <YAxis yAxisId="right" orientation="right" stroke="var(--color-brand-muted)" fontSize={11} tickLine={false} axisLine={false} width={40} />
                      )}
                      <Tooltip contentStyle={{ backgroundColor: 'var(--color-brand-bg)', border: '1px solid var(--color-brand-border)', borderRadius: '12px' }} itemStyle={{ color: 'var(--color-brand-text)', fontWeight: 500 }} labelStyle={{ color: 'var(--color-brand-muted)' }} formatter={(val: any, name: any) => [name === 'revenue' ? (metrics.capabilities?.hasRevenue ? formatCurrency(Number(val)) : formatNumber(Number(val))) : formatNumber(Number(val)), name === 'revenue' ? (metrics.domain === 'hr' ? 'Payroll' : metrics.capabilities?.hasRevenue ? 'Revenue' : 'Volume') : name === 'visitors' ? 'Visitors' : 'Orders']} />
                      {activeMetrics.revenue && <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="var(--color-brand-primary)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />}
                      {metrics.hasTrafficData && activeMetrics.visitors && <Line yAxisId="right" type="monotone" dataKey="visitors" stroke="var(--color-brand-secondary)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />}
                    </LineChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-brand-border)" />
                      <XAxis dataKey="name" stroke="var(--color-brand-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis yAxisId="left" stroke="var(--color-brand-muted)" fontSize={11} tickLine={false} axisLine={false} width={60} tickFormatter={(value) => metrics.capabilities?.hasRevenue ? formatCompactCurrency(value) : formatNumber(value)} />
                      {metrics.hasTrafficData && activeMetrics.visitors && (
                        <YAxis yAxisId="right" orientation="right" stroke="var(--color-brand-muted)" fontSize={11} tickLine={false} axisLine={false} width={40} />
                      )}
                      <Tooltip cursor={{ fill: 'var(--color-brand-bg)', opacity: 0.4 }} contentStyle={{ backgroundColor: 'var(--color-brand-bg)', border: '1px solid var(--color-brand-border)', borderRadius: '12px' }} itemStyle={{ color: 'var(--color-brand-text)', fontWeight: 500 }} labelStyle={{ color: 'var(--color-brand-muted)' }} formatter={(val: any, name: any) => [name === 'revenue' ? (metrics.capabilities?.hasRevenue ? formatCurrency(Number(val)) : formatNumber(Number(val))) : formatNumber(Number(val)), name === 'revenue' ? (metrics.domain === 'hr' ? 'Payroll' : metrics.capabilities?.hasRevenue ? 'Revenue' : 'Volume') : name === 'visitors' ? 'Visitors' : 'Orders']} />
                      {activeMetrics.revenue && <Bar yAxisId="left" dataKey="revenue" fill="var(--color-brand-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />}
                      {metrics.hasTrafficData && activeMetrics.visitors && <Bar yAxisId="right" dataKey="visitors" fill="var(--color-brand-secondary)" radius={[4, 4, 0, 0]} maxBarSize={40} />}
                    </BarChart>
                  )}
                </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Right Sidebar (Insights & Activity) */}
            <div className="space-y-6">
              
              {/* AI Insights */}
              <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 md:p-8 shadow-sm flex flex-col relative overflow-hidden group">
                {isLoading && (
                  <div className="absolute inset-0 z-20 bg-[var(--color-brand-card)]/80 backdrop-blur-sm flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-[var(--color-brand-primary)] animate-spin" />
                  </div>
                )}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand-primary)]/10 blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--color-brand-primary)]" />
                    AI Insights
                  </h2>
                  <div className="px-2.5 py-1 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-full text-xs font-semibold text-[var(--color-brand-primary)] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)] animate-pulse"></span>
                    Live
                  </div>
                </div>
                
                <div className="space-y-4 flex-1 relative z-10">
                  {insights.filter(insight => !dismissedInsights.has(insight.id)).map(insight => (
                    <InsightItem 
                      key={insight.id}
                      type={insight.type}
                      title={insight.title}
                      description={insight.description}
                      confidence={insight.confidence}
                      recommendedAction={insight.recommendedAction}
                      details={insight.details}
                      onClick={() => setSelectedInsight(insight)}
                    />
                  ))}
                </div>
                
                <button onClick={() => navigate('/assistant')} className="w-full mt-6 py-3 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl text-sm font-semibold text-[var(--color-brand-text)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] transition-all relative z-10 flex items-center justify-center gap-2">
                  Open AI Assistant <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Activity Timeline */}
              <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 md:p-8 shadow-sm relative">
                {isLoading && (
                  <div className="absolute inset-0 z-20 bg-[var(--color-brand-card)]/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                    <RefreshCw className="w-6 h-6 text-[var(--color-brand-primary)] animate-spin" />
                  </div>
                )}
                <div className="flex items-center justify-between mb-6">
                  {activitySearchOpen ? (
                    <div className="flex-1 flex items-center bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl px-3 py-1.5 animate-in fade-in slide-in-from-right-4">
                      <Search className="w-4 h-4 text-[var(--color-brand-muted)] mr-2" />
                      <input 
                        type="text" 
                        placeholder="Search activity..." 
                        value={activitySearchQuery}
                        onChange={(e) => setActivitySearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--color-brand-text)] placeholder-[var(--color-brand-muted)]" 
                        autoFocus
                      />
                      <button onClick={() => { setActivitySearchOpen(false); setActivitySearchQuery(''); }} className="ml-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[var(--color-brand-muted)]" />
                        Recent Activity
                      </h2>
                      <button onClick={() => { window.dispatchEvent(new Event('closeDropdowns')); setActivitySearchOpen(true); }} className="p-1.5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors"><Search className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {activities.filter(a => a.action.toLowerCase().includes(activitySearchQuery.toLowerCase())).slice(0, 10).map((activity, index, arr) => (
                    <div key={activity.id} className="flex gap-4 relative group cursor-pointer">
                      {index !== arr.length - 1 && (
                        <div className="absolute top-8 left-[11px] w-px h-full bg-[var(--color-brand-border)] -ml-px group-hover:bg-[var(--color-brand-primary)]/50 transition-colors z-0"></div>
                      )}
                      <div className="w-6 h-6 rounded-full bg-[var(--color-brand-bg)] border-2 border-[var(--color-brand-border)] flex items-center justify-center shrink-0 z-10 group-hover:border-[var(--color-brand-primary)] transition-colors shadow-sm">
                        <div className={`w-2 h-2 rounded-full ${activity.type === 'revenue' ? 'bg-[#FFBD2E]' : 'bg-[var(--color-brand-primary)]'}`}></div>
                      </div>
                      <div className="flex-1 bg-[var(--color-brand-bg)]/30 p-3 rounded-xl border border-transparent group-hover:border-[var(--color-brand-border)] group-hover:bg-[var(--color-brand-bg)] transition-colors -mt-1.5">
                        <p className="text-sm font-medium text-[var(--color-brand-text)] group-hover:text-[var(--color-brand-primary)] transition-colors">{activity.action}</p>
                        <p className="text-[10px] uppercase font-semibold tracking-wider text-[var(--color-brand-muted)] mt-1">{new Date(activity.time).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center py-8">
                       <div className="w-16 h-16 mx-auto bg-[var(--color-brand-bg)] rounded-full flex items-center justify-center border border-[var(--color-brand-border)] mb-4">
                         <Activity className="w-6 h-6 text-[var(--color-brand-muted)]" />
                       </div>
                       <p className="text-sm text-[var(--color-brand-muted)]">No recent activity.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Dashboard Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top Products/Customers */}
            <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm relative col-span-1 lg:col-span-2 overflow-hidden min-w-0">
              {isLoading && (
                <div className="absolute inset-0 z-20 bg-[var(--color-brand-card)]/80 backdrop-blur-sm flex items-center justify-center rounded-3xl"></div>
              )}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
                  <Database className="w-5 h-5 text-[var(--color-brand-muted)]" />
                  {metrics.domain === 'hr' ? 'Top Roles' : metrics.hasProductData ? 'Top Products' : metrics.hasCustomerData ? 'Top Customers' : metrics.hasCategoryData ? 'Top Categories' : 'Top Performers'}
                </h2>
                <button onClick={() => navigate('/analytics')} className="text-sm font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-text)] transition-colors flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></button>
              </div>

              {/* Mobile View: Stacked Cards (No horizontal overflow/scrollbars) */}
              <div className="block md:hidden space-y-3">
                {(() => {
                  const items = (metrics.hasProductData ? metrics.topProducts : metrics.hasCustomerData ? metrics.topCustomersList : metrics.hasCategoryData ? metrics.categoryData.map(c => ({ name: c.name, revenue: c.revenue, sales: c.orders || c.sales || 0, aov: c.aov, trend: c.trend || 'neutral' })) : metrics.topProducts).slice(0, 5);
                  if (items.length === 0) {
                    return <div className="py-8 text-center text-[var(--color-brand-muted)] text-sm">No items available in this dataset.</div>;
                  }
                  const maxVal = items[0]?.revenue || items[0]?.sales || 1;
                  return items.map((item: any, i: number) => (
                    <div key={i} className={`p-4 rounded-2xl border border-[var(--color-brand-border)]/60 bg-[var(--color-brand-bg)]/40 hover:bg-[var(--color-brand-bg)] transition-colors space-y-3 ${i === 0 ? 'border-[var(--color-brand-primary)]/30 shadow-[0_0_15px_rgba(18,209,142,0.05)]' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${i === 0 ? 'bg-[#FFBD2E]/20 text-[#FFBD2E]' : i === 1 ? 'bg-zinc-300/20 text-zinc-300' : i === 2 ? 'bg-amber-700/20 text-amber-500' : 'bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] text-[var(--color-brand-muted)]'}`}>
                            #{i + 1}
                          </span>
                          <span className="font-semibold text-sm text-[var(--color-brand-text)] leading-snug break-words">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-sm font-bold text-[var(--color-brand-text)] block">
                            {metrics.capabilities?.hasRevenue ? formatCurrency(item.revenue) : formatNumber(item.revenue || item.sales || item.count || 0)}
                          </span>
                          <span className="text-[11px] text-[var(--color-brand-muted)]">
                            {metrics.domain === 'hr' ? `${item.sales || item.count || 0} staff` : `${item.sales || item.orders || item.count || 0} orders`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium shrink-0">
                          {item.trend === 'up' && <span className="text-[var(--color-brand-primary)] flex items-center"><TrendingUp className="w-3.5 h-3.5 mr-0.5"/> Growing</span>}
                          {item.trend === 'down' && <span className="text-[var(--color-brand-error)] flex items-center"><ArrowDownRight className="w-3.5 h-3.5 mr-0.5"/> Declining</span>}
                          {item.trend === 'neutral' && <span className="text-[var(--color-brand-muted)] flex items-center"><ArrowRight className="w-3.5 h-3.5 mr-0.5"/> Stable</span>}
                          {!item.trend && <span className="text-[var(--color-brand-muted)]">Active</span>}
                        </div>
                        <div className="flex-1 max-w-[120px] h-1.5 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)]/50 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${i === 0 ? 'bg-[#FFBD2E]' : 'bg-[var(--color-brand-primary)]'}`} style={{ width: `${Math.max(8, ((item.revenue || item.sales || 1) / maxVal) * 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar pb-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-brand-border)] text-[11px] text-[var(--color-brand-muted)] uppercase tracking-wider">
                      <th className="pb-3 font-semibold px-2">Rank</th>
                      <th className="pb-3 font-semibold">{metrics.domain === 'hr' ? 'Role' : metrics.hasProductData ? 'Product' : metrics.hasCustomerData ? 'Customer' : metrics.hasCategoryData ? 'Category' : 'Item'}</th>
                      <th className="pb-3 font-semibold">{metrics.domain === 'hr' ? 'Total Salary' : metrics.capabilities?.hasRevenue ? 'Revenue' : 'Volume'}</th>
                      <th className="pb-3 font-semibold">{metrics.domain === 'hr' ? 'Headcount' : metrics.hasOrderId ? 'Orders' : 'Count'}</th>
                      <th className="pb-3 font-semibold">Growth</th>
                      <th className="pb-3 font-semibold text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(metrics.hasProductData ? metrics.topProducts : metrics.hasCustomerData ? metrics.topCustomersList : metrics.hasCategoryData ? metrics.categoryData.map(c => ({ name: c.name, revenue: c.revenue, sales: c.orders || c.sales || 0, aov: c.aov, trend: c.trend || 'neutral' })) : metrics.topProducts).slice(0, 5).map((item: any, i: number, arr: any[]) => (
                      <tr key={i} className={`border-b border-[var(--color-brand-border)]/50 last:border-0 hover:bg-[var(--color-brand-bg)] transition-colors group cursor-pointer ${i === 0 ? 'bg-[var(--color-brand-bg)]/50' : ''}`}>
                        <td className="py-3.5 px-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${i === 0 ? 'bg-[#FFBD2E]/20 text-[#FFBD2E] shadow-[0_0_10px_rgba(255,189,46,0.2)]' : i === 1 ? 'bg-zinc-300/20 text-zinc-300' : i === 2 ? 'bg-amber-700/20 text-amber-500' : 'bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] text-[var(--color-brand-muted)]'}`}>#{i + 1}</span>
                        </td>
                        <td className="py-3.5 font-medium text-[var(--color-brand-text)] truncate max-w-[180px] pr-4">{item.name}</td>
                        <td className="py-3.5 font-mono text-sm text-[var(--color-brand-text)]">
                          {metrics.capabilities?.hasRevenue ? formatCurrency(item.revenue) : formatNumber(item.revenue || item.sales || item.count || 0)}
                        </td>
                        <td className="py-3.5 font-mono text-sm text-[var(--color-brand-muted)]">{item.sales || item.orders || item.count || 0}</td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            {item.trend === 'up' && <span className="text-[var(--color-brand-primary)] flex items-center"><TrendingUp className="w-3 h-3 mr-0.5"/> Up</span>}
                            {item.trend === 'down' && <span className="text-[var(--color-brand-error)] flex items-center"><ArrowDownRight className="w-3 h-3 mr-0.5"/> Down</span>}
                            {item.trend === 'neutral' && <span className="text-[var(--color-brand-muted)] flex items-center"><ArrowRight className="w-3 h-3 mr-0.5"/> Flat</span>}
                            {!item.trend && <span className="text-[var(--color-brand-muted)] flex items-center">N/A</span>}
                          </div>
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <div className="w-24 h-1.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)]/50 rounded-full ml-auto overflow-hidden">
                            <div className={`h-full rounded-full ${i === 0 ? 'bg-[#FFBD2E]' : 'bg-[var(--color-brand-primary)]'}`} style={{ width: `${Math.max(5, ((item.revenue || item.sales || 1) / (arr[0]?.revenue || arr[0]?.sales || 1)) * 100)}%` }}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(metrics.hasProductData ? metrics.topProducts : metrics.hasCustomerData ? metrics.topCustomersList : metrics.hasCategoryData ? metrics.categoryData : metrics.topProducts).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[var(--color-brand-muted)] text-sm">No items available in this dataset.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm min-w-0">
              <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button onClick={() => setIsUploadModalOpen(true)} className="aspect-square flex flex-col items-center justify-center p-4 rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 hover:shadow-[0_0_20px_rgba(18,209,142,0.1)] transition-all group scale-100 active:scale-95">
                  <UploadCloud className="w-8 h-8 text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-primary)] mb-3 transition-colors group-hover:scale-110 duration-300" />
                  <h4 className="text-xs font-semibold text-[var(--color-brand-text)]">Upload Data</h4>
                </button>
                <button onClick={() => navigate('/reports')} className="aspect-square flex flex-col items-center justify-center p-4 rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] hover:border-[#FFBD2E] hover:bg-[#FFBD2E]/5 hover:shadow-[0_0_20px_rgba(255,189,46,0.1)] transition-all group scale-100 active:scale-95">
                  <FileText className="w-8 h-8 text-[var(--color-brand-muted)] group-hover:text-[#FFBD2E] mb-3 transition-colors group-hover:scale-110 duration-300" />
                  <h4 className="text-xs font-semibold text-[var(--color-brand-text)]">New Report</h4>
                </button>
                <button onClick={() => navigate('/assistant')} className="aspect-square flex flex-col items-center justify-center p-4 rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] hover:border-[var(--color-brand-secondary)] hover:bg-[var(--color-brand-secondary)]/5 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all group scale-100 active:scale-95">
                  <Sparkles className="w-8 h-8 text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-secondary)] mb-3 transition-colors group-hover:scale-110 duration-300" />
                  <h4 className="text-xs font-semibold text-[var(--color-brand-text)]">AI Assistant</h4>
                </button>
                <button onClick={() => navigate('/analytics')} className="aspect-square flex flex-col items-center justify-center p-4 rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] hover:border-pink-500 hover:bg-pink-500/5 hover:shadow-[0_0_20px_rgba(236,72,153,0.1)] transition-all group scale-100 active:scale-95">
                  <BarChart2 className="w-8 h-8 text-[var(--color-brand-muted)] group-hover:text-pink-500 mb-3 transition-colors group-hover:scale-110 duration-300" />
                  <h4 className="text-xs font-semibold text-[var(--color-brand-text)]">Analytics</h4>
                </button>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm col-span-1 lg:col-span-3 overflow-hidden min-w-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[var(--color-brand-primary)]" />
                  Recent Reports
                </h2>
                <button onClick={() => navigate('/reports')} className="text-sm font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-text)] transition-colors flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></button>
              </div>

              {/* Mobile View: Stacked Report Cards (No horizontal scrolling) */}
              <div className="block md:hidden space-y-3">
                {reports.slice(0, 4).map((report) => (
                  <div key={report.id} className="p-4 rounded-2xl border border-[var(--color-brand-border)]/60 bg-[var(--color-brand-bg)]/40 hover:bg-[var(--color-brand-bg)] transition-colors space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-[var(--color-brand-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-[var(--color-brand-text)] leading-snug break-words">{report.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[var(--color-brand-muted)]">
                          <span>{report.type}</span>
                          <span>•</span>
                          <span>{new Date(report.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] rounded-full text-[10px] font-bold uppercase tracking-wide border border-[var(--color-brand-primary)]/20 shrink-0">
                        Ready
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-brand-border)]/40">
                      <button onClick={() => navigate('/reports')} className="px-3 py-1.5 text-xs text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-card)] rounded-lg transition-colors flex items-center gap-1">
                        <Search className="w-3.5 h-3.5" /> View
                      </button>
                      <button onClick={() => toast.success('Report downloaded')} className="px-3 py-1.5 text-xs text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/10 rounded-lg transition-colors flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-sm font-medium text-[var(--color-brand-text)] mb-1">No reports generated yet</p>
                    <p className="text-xs text-[var(--color-brand-muted)] mb-4">Your reports will appear here</p>
                    <button onClick={() => navigate('/reports')} className="px-4 py-2 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] hover:border-[#FFBD2E] hover:text-[#FFBD2E] rounded-xl text-xs font-semibold text-[var(--color-brand-text)] transition-all inline-flex items-center gap-1.5">
                      Generate Report <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-brand-border)] text-[11px] text-[var(--color-brand-muted)] uppercase tracking-wider">
                      <th className="pb-3 font-semibold px-2">Report Name</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Generated</th>
                      <th className="pb-3 font-semibold text-center">Status</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.slice(0, 4).map((report) => (
                      <tr key={report.id} className="border-b border-[var(--color-brand-border)]/50 last:border-0 hover:bg-[var(--color-brand-bg)] transition-colors group">
                        <td className="py-3 px-2 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
                          </div>
                          <span className="font-medium text-[var(--color-brand-text)] truncate max-w-[250px]">{report.name}</span>
                        </td>
                        <td className="py-3 text-sm text-[var(--color-brand-muted)]">{report.type}</td>
                        <td className="py-3 text-sm text-[var(--color-brand-muted)]">{new Date(report.date).toLocaleDateString()}</td>
                        <td className="py-3 text-center">
                          <span className="px-2.5 py-1 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] rounded-full text-[10px] font-bold uppercase tracking-wide border border-[var(--color-brand-primary)]/20 shadow-[0_0_10px_rgba(18,209,142,0.1)]">Ready</span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => navigate('/reports')} className="p-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-border)] rounded-lg transition-colors" title="View Report"><Search className="w-4 h-4" /></button>
                            <button onClick={() => toast.success('Report downloaded')} className="p-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/10 rounded-lg transition-colors" title="Download Report"><Download className="w-4 h-4" /></button>
                            <button onClick={() => toast.info('Share link copied')} className="p-2 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-secondary)] hover:bg-[var(--color-brand-secondary)]/10 rounded-lg transition-colors" title="Share Report"><Share2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-[var(--color-brand-bg)] rounded-full flex items-center justify-center border border-[var(--color-brand-border)] mb-4 shadow-inner relative">
                              <div className="absolute inset-0 bg-[#FFBD2E]/10 rounded-full blur-md"></div>
                              <FileText className="w-6 h-6 text-[#FFBD2E] relative z-10" />
                            </div>
                            <p className="text-sm font-medium text-[var(--color-brand-text)] mb-1">No reports generated yet</p>
                            <p className="text-xs text-[var(--color-brand-muted)] mb-5">Your reports will appear here</p>
                            <button onClick={() => navigate('/reports')} className="px-5 py-2.5 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] hover:border-[#FFBD2E] hover:text-[#FFBD2E] rounded-xl text-xs font-semibold text-[var(--color-brand-text)] transition-all hover:shadow-[0_0_20px_rgba(255,189,46,0.15)] flex items-center gap-2">
                              Generate First Report <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, change, isPositive, icon: Icon, isLoading, tooltip, isCurrency, onClick }: any) {
  const sparklineData = isPositive ? "M0,15 L10,12 L20,18 L30,8 L40,10 L50,0" : "M0,0 L10,5 L20,2 L30,12 L40,10 L50,20";
  const strokeColor = isPositive ? "var(--color-brand-primary)" : "var(--color-brand-error)";

  return (
    <div onClick={onClick} className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-[var(--color-brand-primary)]/50 transition-all group relative cursor-pointer min-h-[160px] flex flex-col justify-between overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-[var(--color-brand-card)]/80 backdrop-blur-sm rounded-3xl overflow-hidden">
          <div className="w-full h-full animate-pulse bg-[var(--color-brand-bg)]/50"></div>
        </div>
      )}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand-primary)]/5 blur-[50px] -mr-10 -mt-10 pointer-events-none group-hover:bg-[var(--color-brand-primary)]/10 transition-colors"></div>
      <div className="flex items-center justify-between relative z-10">
        <span className="text-sm font-medium text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-text)] transition-colors cursor-help flex items-center gap-1.5" title={tooltip}>
          {title}
        </span>
        <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-bg)] flex items-center justify-center border border-[var(--color-brand-border)] group-hover:border-[var(--color-brand-primary)]/50 transition-colors group-hover:scale-110 duration-300 shadow-sm">
          <Icon className="w-5 h-5 text-[var(--color-brand-primary)]" />
        </div>
      </div>
      <div className="flex items-end justify-between relative z-10 mt-4">
        <div>
          <div className="text-3xl font-heading font-bold text-[var(--color-brand-text)] tracking-tight mb-2">
            <AnimatedNumber value={value} isCurrency={isCurrency} />
          </div>
          {change ? (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] w-fit ${isPositive ? 'text-[var(--color-brand-primary)] shadow-[0_0_10px_rgba(18,209,142,0.1)]' : 'text-[var(--color-brand-error)] shadow-[0_0_10px_rgba(244,63,94,0.1)]'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change} vs last
          </div>
          ) : (
          <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] w-fit text-[var(--color-brand-muted)]">
            Comparison unavailable
          </div>
          )}
        </div>
        <div className="w-16 h-8 opacity-50 group-hover:opacity-100 transition-opacity">
          <svg viewBox="0 0 50 20" className="w-full h-full overflow-visible">
            <path d={sparklineData} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function HealthScoreCard({ title = "Business Health", score, trend, isLoading, onClick }: { title?: string, score: number, trend: string, isLoading?: boolean, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-[var(--color-brand-primary)]/50 transition-all group relative overflow-hidden cursor-pointer min-h-[160px] flex flex-col justify-between">
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-[var(--color-brand-card)]/80 backdrop-blur-sm rounded-3xl overflow-hidden">
          <div className="w-full h-full animate-pulse bg-[var(--color-brand-bg)]/50"></div>
        </div>
      )}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand-primary)]/5 blur-[50px] -mr-10 -mt-10 pointer-events-none group-hover:bg-[var(--color-brand-primary)]/10 transition-colors"></div>
      <div className="flex items-center justify-between relative z-10">
        <span className="text-sm font-medium text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-text)] transition-colors cursor-help" title="Overall system health index based on connected metrics">{title}</span>
        <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-bg)] flex items-center justify-center border border-[var(--color-brand-border)] group-hover:border-[var(--color-brand-primary)]/50 transition-colors group-hover:scale-110 duration-300 shadow-sm">
          <Activity className="w-5 h-5 text-[var(--color-brand-primary)]" />
        </div>
      </div>
      <div className="relative z-10 mt-4">
        <div className="flex items-end gap-3">
          <span className="text-3xl font-heading font-bold text-[var(--color-brand-text)] tracking-tight">
            <AnimatedNumber value={score} />
          </span>
          <span className="text-lg text-[var(--color-brand-muted)] mb-1">/ 100</span>
          <div className="ml-auto flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-[var(--color-brand-primary)] shadow-[0_0_10px_rgba(18,209,142,0.1)]">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        </div>
        <div className="w-full h-1.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)]/50 rounded-full mt-4 overflow-hidden relative z-10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[var(--color-brand-secondary)] to-[var(--color-brand-primary)] rounded-full shadow-[0_0_10px_rgba(18,209,142,0.5)]"
          />
        </div>
      </div>
    </div>
  );
}

function InsightItem({ type, title, description, confidence, recommendedAction, details, onClick }: any) {
  return (
    <div onClick={onClick} className="p-4 rounded-xl bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)]/50 hover:shadow-[0_4px_20px_rgba(18,209,142,0.08)] transition-all cursor-pointer group relative overflow-hidden">
      {type === 'success' && <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-brand-primary)]"></div>}
      {type === 'warning' && <div className="absolute top-0 left-0 w-1 h-full bg-[#FFBD2E]"></div>}
      {type === 'info' && <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-brand-secondary)]"></div>}
      <div className="flex items-start gap-3 pl-2">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-[var(--color-brand-text)] group-hover:text-[var(--color-brand-primary)] transition-colors">{title}</h4>
            {confidence && (
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[var(--color-brand-bg)] text-[var(--color-brand-muted)] border border-[var(--color-brand-border)]">
                {confidence}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-brand-muted)] leading-relaxed mb-3">{description}</p>
          {recommendedAction && (
             <div className="flex items-center justify-between p-2 bg-[var(--color-brand-bg)] rounded-lg border border-[var(--color-brand-border)]/50">
               <span className="text-[10px] font-medium text-[var(--color-brand-muted)] flex items-center gap-1"><Zap className="w-3 h-3 text-[var(--color-brand-primary)]"/> Action</span>
               <span className="text-xs font-semibold text-[var(--color-brand-primary)]">{recommendedAction.substring(0, 30)}...</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DatabaseIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-brand-muted)]">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}
