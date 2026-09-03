import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Download, Calendar, DollarSign, Users, 
  ShoppingCart, Percent, Filter, Maximize2, RefreshCw, BarChart2, Zap, 
  TrendingUp, TrendingDown, Target, ShieldAlert, CheckCircle2, Globe, CreditCard, Award, Activity, Database, AlertCircle, Lightbulb, MapPin, Briefcase, Lock,
  Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown
, Loader2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts';
import { motion } from 'motion/react';
import { useData } from '../context/DataContext';
import { formatNumber } from '../lib/dataUtils';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useCurrency } from '../hooks/useCurrency';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const COLORS = ['#12D18E', '#6366F1', '#FFBD2E', '#F43F5E', '#8B5CF6', '#14B8A6'];

// Animated Number Component
function AnimatedNumber({ value, isCurrency = false }: { value: number, isCurrency?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    let startTime: number;
    const duration = 1500;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (value - startValue) * easeOutQuart;
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {isCurrency 
        ? formatCurrency(displayValue)
        : formatNumber(Math.floor(displayValue))}
    </span>
  );
}



export function Analytics() {
  const [timeGroup, setTimeGroup] = useState('Daily');
  const [activeMetrics, setActiveMetrics] = useState({ revenue: true, orders: true, profit: false });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const { formatCurrency, currency } = useCurrency();
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const handleCustomEvent = () => {
      setShowDateDropdown(false);
      setShowExportMenu(false);
    };
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowDateDropdown(false);
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

  const downloadChart = () => {
    const svg = document.querySelector('.recharts-wrapper svg') as SVGElement;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const svgSize = svg.getBoundingClientRect();
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'chart.png';
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };
  
  const { activeDataset, isFetchingActiveData, dateFilter, setDateFilter, deleteDataset } = useData();
  const metrics = useDashboardMetrics(activeDataset, dateFilter, currency);

  const aggregatedRevenueData = useMemo(() => {
    if (metrics.getAggregatedData) {
      const agg = metrics.getAggregatedData(timeGroup as any);
      if (agg && agg.length > 0) return agg;
    }
    if (!metrics.revenueData.length) return [];
    
    let grouped: Record<string, { revenue: number, orders: number, profit: number }> = {};
    
    metrics.revenueData.forEach(d => {
      let key = d.name;
      const date = new Date(d.name);
      if (!isNaN(date.getTime())) {
        if (timeGroup === 'Weekly') {
          const firstDay = new Date(date.setDate(date.getDate() - date.getDay()));
          key = firstDay.toISOString().split('T')[0];
        } else if (timeGroup === 'Monthly') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else if (timeGroup === 'Quarterly') {
          const q = Math.floor(date.getMonth() / 3) + 1;
          key = `Q${q} ${date.getFullYear()}`;
        }
      }
      
      if (!grouped[key]) grouped[key] = { revenue: 0, orders: 0, profit: 0 };
      grouped[key].revenue += d.revenue || 0;
      grouped[key].orders += (d as any).orders !== undefined ? (d as any).orders : 1;
      grouped[key].profit += (d as any).profit !== undefined ? (d as any).profit : 0;
    });

    return Object.entries(grouped).map(([name, data]) => ({ name, ...data })).sort((a, b) => a.name.localeCompare(b.name));
  }, [metrics, timeGroup]);

  const revenueData = aggregatedRevenueData;
  const topProducts = metrics.topProducts;
  const categoryData = metrics.categoryData.length > 0 ? metrics.categoryData : [];
  const customerGrowthData = metrics.customerGrowthData.length > 0 ? metrics.customerGrowthData : [];

  const exportCSV = () => {
    if (!activeDataset || !activeDataset.data || activeDataset.data.length === 0) {
      toast.error("No active dataset to export.");
      return;
    }
    const headers = activeDataset.columns.join(',');
    const rows = activeDataset.data.map(row => 
      activeDataset.columns.map(col => `"${(row[col] || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeDataset.name}_analytics_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    if (!activeDataset || !activeDataset.data || activeDataset.data.length === 0) {
      toast.error("No active dataset to export.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(activeDataset.data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dataset");
    XLSX.writeFile(workbook, `${activeDataset.name}_analytics_export.xlsx`);
    toast.success('Exported Excel file successfully');
  };

  if (!activeDataset || isFetchingActiveData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--color-brand-primary)] animate-spin" />
      </div>
    );
  }

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8 bg-[var(--color-brand-card)] rounded-3xl border border-[var(--color-brand-border)]">
        <div className="w-24 h-24 mb-6 rounded-full bg-[var(--color-brand-bg)] flex items-center justify-center border-2 border-[var(--color-brand-border)] shadow-xl relative">
          <div className="absolute inset-0 bg-[var(--color-brand-primary)]/10 rounded-full blur-xl animate-pulse"></div>
          <Activity className="w-10 h-10 text-[var(--color-brand-muted)]" />
        </div>
        <h2 className="text-3xl font-heading font-bold text-[var(--color-brand-text)] mb-3">No datasets available</h2>
        <p className="text-[var(--color-brand-muted)] max-w-md mx-auto mb-8">Upload a CSV dataset to start analyzing your business data.</p>
        <button className="px-6 py-3 bg-[var(--color-brand-primary)] hover:bg-[#0ea872] text-[var(--color-brand-text)] font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(18,209,142,0.3)] hover:shadow-[0_0_30px_rgba(18,209,142,0.5)]">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ${isFullscreen ? 'fixed inset-0 z-50 bg-[var(--color-brand-bg)] p-6 overflow-y-auto' : ''}`}>
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[var(--color-brand-text)] mb-2 tracking-tight">Analytics Studio</h1>
          
          <div className="flex flex-wrap items-center gap-3 bg-[var(--color-brand-card)]/50 backdrop-blur-md border border-[var(--color-brand-border)] px-4 py-2.5 rounded-2xl shadow-sm mt-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[var(--color-brand-primary)]" />
              <span className="text-sm font-semibold text-[var(--color-brand-text)] max-w-[200px] truncate">{activeDataset.name}</span>
            </div>
            <div className="w-px h-4 bg-[var(--color-brand-border)] hidden sm:block"></div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[var(--color-brand-muted)]">Rows:</span>
              <span className="text-[var(--color-brand-text)] font-medium">{formatNumber(activeDataset.rowCount || activeDataset.data?.length || 0)}</span>
            </div>
            <div className="w-px h-4 bg-[var(--color-brand-border)] hidden sm:block"></div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[var(--color-brand-muted)]">Last Updated:</span>
              <span className="text-[var(--color-brand-text)] font-medium">{new Date(activeDataset.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="w-px h-4 bg-[var(--color-brand-border)] hidden sm:block"></div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)] animate-pulse"></span>
              <span className="text-[var(--color-brand-primary)] font-medium">Real-time Analysis</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 w-full xl:w-auto print:hidden min-w-0">
          <div className="relative dropdown-container">
            <button onClick={() => { if (!showDateDropdown) window.dispatchEvent(new Event('closeDropdowns')); setShowDateDropdown(!showDateDropdown); }} aria-haspopup="true" aria-expanded={showDateDropdown} className="w-full sm:w-auto justify-center px-4 py-2.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] text-sm font-semibold rounded-xl hover:border-[var(--color-brand-primary)]/50 transition-all flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]">
              <Calendar className="w-4 h-4 text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-primary)] transition-colors" aria-hidden="true" /> {dateFilter}
              <ChevronDown className="w-3 h-3 text-[var(--color-brand-muted)] ml-1" />
            </button>
            {showDateDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl shadow-xl z-50 overflow-hidden py-1" role="menu">
                {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Month', 'Last Month', 'This Year', 'Custom Range'].map(range => (
                  <button key={range} onClick={() => { setDateFilter(range); setShowDateDropdown(false); }} className="w-full text-left px-4 py-2 text-sm font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] focus:bg-[var(--color-brand-bg)] focus:text-[var(--color-brand-text)] transition-colors focus:outline-none" role="menuitem">
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative dropdown-container">
            <button onClick={() => { if (!showExportMenu) window.dispatchEvent(new Event('closeDropdowns')); setShowExportMenu(!showExportMenu); }} aria-haspopup="true" aria-expanded={showExportMenu} className="w-full sm:w-auto justify-center px-4 py-2.5 bg-[var(--color-brand-card)] text-[var(--color-brand-text)] text-sm font-semibold rounded-xl border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)]/50 transition-all flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]">
              <Download className="w-4 h-4 text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-text)] transition-colors" aria-hidden="true" /> Export
              <ChevronDown className="w-3 h-3 text-[var(--color-brand-muted)] ml-1" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl shadow-xl z-50 overflow-hidden py-1" role="menu">
                <button onClick={() => { exportCSV(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] focus:bg-[var(--color-brand-bg)] focus:text-[var(--color-brand-text)] transition-colors focus:outline-none" role="menuitem">
                  Export as CSV
                </button>
                <button onClick={() => { exportExcel(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] focus:bg-[var(--color-brand-bg)] focus:text-[var(--color-brand-text)] transition-colors focus:outline-none" role="menuitem">
                  Export as Excel
                </button>
                <button onClick={() => { window.print(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] focus:bg-[var(--color-brand-bg)] focus:text-[var(--color-brand-text)] transition-colors focus:outline-none" role="menuitem">
                  Export as PDF
                </button>
              </div>
            )}
          </div>
          <button onClick={() => setIsFullscreen(!isFullscreen)} aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} className="w-full sm:w-auto flex justify-center p-2.5 bg-[var(--color-brand-card)] text-[var(--color-brand-muted)] rounded-xl border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)]/50 hover:text-[var(--color-brand-text)] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] col-span-2 sm:col-span-1">
            <Maximize2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={metrics.hasRevenueData ? metrics.totalRevenue : "Unavailable"} isCurrency={metrics.hasRevenueData} change={metrics.hasRevenueData ? metrics.revenueChange : null} isPositive={metrics.revenueChange >= 0} icon={DollarSign} tooltip={metrics.hasRevenueData ? "Total generated revenue across all categories" : "Revenue column not detected"} subtitle="From uploaded dataset" />
        <StatCard title="Total Orders" value={metrics.totalSales} change={metrics.salesChange} isPositive={metrics.salesChange >= 0} icon={ShoppingCart} tooltip="Total number of completed transactions" subtitle="Total valid records" />
        <StatCard title={metrics.hasCustomerData ? "Unique Customers" : "Total Columns"} value={metrics.hasCustomerData ? metrics.totalCustomers : metrics.datasetStats.cols} change={metrics.hasCustomerData ? metrics.customersChange : 0} isPositive={true} icon={metrics.hasCustomerData ? Users : Database} tooltip={metrics.hasCustomerData ? "Number of distinct customers" : "Columns in dataset"} subtitle={metrics.hasCustomerData ? "From customer field" : "Available dimensions"} />
        <StatCard title="Avg. Order Value" value={metrics.hasRevenueData ? metrics.aov : "Unavailable"} isCurrency={metrics.hasRevenueData} change={metrics.hasRevenueData ? metrics.growth : null} isPositive={metrics.growth >= 0} icon={Target} tooltip={metrics.hasRevenueData ? "Average revenue per order" : "Revenue column not detected"} subtitle="Revenue / Orders" />
      </div>

      {/* Hero Revenue Chart */}
      <div className={`bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden group ${isChartFullscreen ? 'fixed inset-4 z-[60] shadow-2xl flex flex-col' : ''}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-primary)]/5 blur-[80px] -mr-20 -mt-20 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 relative z-10">
          <div>
            <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--color-brand-primary)]" />
              Performance Overview
            </h2>
            <p className="text-sm text-[var(--color-brand-muted)] mt-1">Multi-metric comparison and trend analysis.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 mr-2 print:hidden">
              <button onClick={downloadChart} className="p-1.5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg transition-colors" title="Download Chart">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setIsChartFullscreen(!isChartFullscreen)} className="p-1.5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg transition-colors" title="Toggle Fullscreen">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex bg-[var(--color-brand-bg)] p-1 rounded-xl border border-[var(--color-brand-border)]">
              {['Daily', 'Weekly', 'Monthly', 'Quarterly'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setTimeGroup(t)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${timeGroup === t ? 'bg-[var(--color-brand-card)] text-[var(--color-brand-text)] shadow-sm' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            
            <div className="flex bg-[var(--color-brand-bg)] p-1 rounded-xl border border-[var(--color-brand-border)]">
              <button onClick={() => setActiveMetrics(p => ({...p, revenue: !p.revenue}))} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeMetrics.revenue ? 'text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}>
                <div className={`w-2 h-2 rounded-full ${activeMetrics.revenue ? 'bg-[var(--color-brand-primary)]' : 'bg-transparent border border-[var(--color-brand-muted)]'}`}></div>
                Revenue
              </button>
              <button onClick={() => setActiveMetrics(p => ({...p, orders: !p.orders}))} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeMetrics.orders ? 'text-[var(--color-brand-secondary)] bg-[var(--color-brand-secondary)]/10' : 'text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]'}`}>
                <div className={`w-2 h-2 rounded-full ${activeMetrics.orders ? 'bg-[var(--color-brand-secondary)]' : 'bg-transparent border border-[var(--color-brand-muted)]'}`}></div>
                Orders
              </button>
            </div>
          </div>
        </div>
        
        <div className={`w-full relative z-10 overflow-hidden min-w-0 ${isChartFullscreen ? 'flex-1' : 'h-[400px]'}`}>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-secondary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-brand-secondary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-brand-border)" opacity={0.5} />
                <XAxis dataKey="name" stroke="var(--color-brand-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} minTickGap={30} />
                <YAxis yAxisId="left" stroke="var(--color-brand-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${formatNumber(value)}`} dx={-10} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--color-brand-muted)" fontSize={12} tickLine={false} axisLine={false} dx={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid var(--color-brand-border)', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', padding: '16px' }} 
                  itemStyle={{ color: 'var(--color-brand-text)', fontWeight: 600, padding: '4px 0' }} 
                  labelStyle={{ color: 'var(--color-brand-muted)', marginBottom: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} 
                  cursor={{ stroke: 'var(--color-brand-border)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                {activeMetrics.revenue && <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="var(--color-brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, fill: 'var(--color-brand-primary)', stroke: 'var(--color-brand-bg)', strokeWidth: 3 }} animationDuration={1500} />}
                {activeMetrics.orders && <Area yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="var(--color-brand-secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" activeDot={{ r: 6, fill: 'var(--color-brand-secondary)', stroke: 'var(--color-brand-bg)', strokeWidth: 3 }} animationDuration={1500} />}
                <Brush 
                  dataKey="name" 
                  height={30} 
                  stroke="var(--color-brand-muted)" 
                  fill="var(--color-brand-bg)"
                  travellerWidth={10}
                  tickFormatter={() => ''}
                  style={{ fill: 'var(--color-brand-bg)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col h-full items-center justify-center text-[var(--color-brand-muted)]">
               <Activity className="w-10 h-10 mb-4 opacity-50" />
               <p>No timeline data found in dataset.</p>
               <p className="text-xs mt-1">Requires a date/time column.</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Business Summary & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-[var(--color-brand-bg)] to-[var(--color-brand-card)] border border-[var(--color-brand-primary)]/30 rounded-3xl p-6 md:p-8 shadow-[0_10px_40px_rgba(18,209,142,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-primary)]/10 blur-[60px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-primary)]/10 flex items-center justify-center border border-[var(--color-brand-primary)]/20 shadow-[0_0_15px_rgba(18,209,142,0.2)] group-hover:scale-110 transition-transform duration-500">
              <Lightbulb className="w-5 h-5 text-[var(--color-brand-primary)]" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)]">Executive AI Summary</h2>
              <p className="text-xs text-[var(--color-brand-primary)] font-medium">Auto-generated from {activeDataset.name}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-4">
              {metrics.aiInsights.list && metrics.aiInsights.list.slice(0, 2).map((insight: any) => (
                <div key={insight.id} className="p-4 rounded-2xl bg-[var(--color-brand-bg)]/50 border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)]/30 transition-all group/card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {insight.type === 'success' ? <TrendingUp className="w-4 h-4 text-[var(--color-brand-primary)]" /> : 
                       insight.type === 'warning' ? <ShieldAlert className="w-4 h-4 text-[#FFBD2E]" /> : 
                       <Target className="w-4 h-4 text-[var(--color-brand-secondary)]" />}
                      <h4 className="text-sm font-semibold text-[var(--color-brand-text)]">{insight.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--color-brand-muted)] opacity-0 group-hover/card:opacity-100 transition-opacity">
                      {insight.confidence}% CONF
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-brand-muted)] leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {metrics.aiInsights.list && metrics.aiInsights.list.slice(2, 4).map((insight: any) => (
                <div key={insight.id} className="p-4 rounded-2xl bg-[var(--color-brand-bg)]/50 border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)]/30 transition-all group/card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {insight.type === 'success' ? <TrendingUp className="w-4 h-4 text-[var(--color-brand-primary)]" /> : 
                       insight.type === 'warning' ? <ShieldAlert className="w-4 h-4 text-[#FFBD2E]" /> : 
                       <Target className="w-4 h-4 text-[var(--color-brand-secondary)]" />}
                      <h4 className="text-sm font-semibold text-[var(--color-brand-text)]">{insight.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--color-brand-muted)] opacity-0 group-hover/card:opacity-100 transition-opacity">
                      {insight.confidence}% CONF
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-brand-muted)] leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              ))}
              {(!metrics.aiInsights.list || metrics.aiInsights.list.length <= 2) && (
                 <div className="p-4 rounded-2xl bg-[var(--color-brand-bg)]/50 border border-[var(--color-brand-border)] flex items-center justify-center h-24">
                   <p className="text-xs text-[var(--color-brand-muted)] text-center italic">More data needed for additional insights.</p>
                 </div>
              )}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 shadow-inner group/action cursor-pointer">
                <div>
                  <span className="text-xs text-[var(--color-brand-primary)] font-bold uppercase tracking-wider block mb-1">Recommended Action</span>
                  <span className="text-sm font-semibold text-[var(--color-brand-text)]">Generate Full Report</span>
                </div>
                <button className="w-10 h-10 rounded-full bg-[var(--color-brand-primary)] text-[var(--color-brand-text)] flex items-center justify-center group-hover/action:scale-110 transition-transform shadow-[0_0_15px_rgba(18,209,142,0.4)]">
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Business Insights Panel */}
        <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-heading font-semibold text-[var(--color-brand-text)]">Quick Findings</h2>
            <button className="text-xs font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-text)] transition-colors">View All</button>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {metrics.findings && metrics.findings.slice(0, 4).map((finding: any, idx: number) => (
              <InsightItem 
                key={idx}
                icon={finding.type === 'success' ? TrendingUp : finding.type === 'warning' ? AlertCircle : Activity} 
                title={finding.title} 
                desc={finding.desc.length > 50 ? finding.desc.substring(0, 50) + '...' : finding.desc}
                color={finding.type === 'success' ? "text-[var(--color-brand-primary)]" : finding.type === 'warning' ? "text-[#FFBD2E]" : "text-[var(--color-brand-secondary)]"}
                bg={finding.type === 'success' ? "bg-[var(--color-brand-primary)]/10" : finding.type === 'warning' ? "bg-[#FFBD2E]/10" : "bg-[var(--color-brand-secondary)]/10"}
                borderColor={finding.type === 'success' ? "border-[var(--color-brand-primary)]/20" : finding.type === 'warning' ? "border-[#FFBD2E]/20" : "border-[var(--color-brand-secondary)]/20"}
                time="Just now"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Customer Growth */}
        <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[var(--color-brand-secondary)]/5 blur-[40px] pointer-events-none"></div>
          <h2 className="text-lg font-heading font-semibold text-[var(--color-brand-text)] mb-6 flex items-center gap-2 relative z-10">
            <Users className="w-5 h-5 text-[var(--color-brand-secondary)]" />
            Customer Growth
          </h2>
          <div className="h-[250px] w-full relative z-10">
            {customerGrowthData.length > 0 ? (
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={customerGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-brand-border)" opacity={0.5} />
                  <XAxis dataKey="name" stroke="var(--color-brand-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'var(--color-brand-bg)', opacity: 0.5}} 
                    contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid var(--color-brand-border)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} 
                    itemStyle={{ color: 'var(--color-brand-text)', fontWeight: 600 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                  <Bar dataKey="new" name="New Customers" stackId="a" fill="var(--color-brand-primary)" radius={[0, 0, 4, 4]} animationDuration={1500} />
                  <Bar dataKey="returning" name="Returning" stackId="a" fill="var(--color-brand-secondary)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-center">
                <div className="w-12 h-12 bg-[var(--color-brand-bg)] rounded-full flex items-center justify-center border border-[var(--color-brand-border)] mb-3">
                  <Users className="w-5 h-5 text-[var(--color-brand-muted)]" />
                </div>
                <p className="text-sm font-medium text-[var(--color-brand-text)] mb-1">No customer data available</p>
                <p className="text-xs text-[var(--color-brand-muted)]">Upload a dataset with user identifiers to generate timeline.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Categories Pie Chart */}
        <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFBD2E]/5 blur-[40px] pointer-events-none"></div>
          <h2 className="text-lg font-heading font-semibold text-[var(--color-brand-text)] mb-2 flex items-center gap-2 relative z-10">
            <PieChartIcon className="w-5 h-5 text-[#FFBD2E]" />
            Revenue by Category
          </h2>
          <div className="h-[350px] sm:h-[280px] w-full flex flex-col justify-center items-center relative z-10">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie 
                    data={categoryData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={70} 
                    outerRadius={100} 
                    paddingAngle={5} 
                    dataKey="value"
                    animationDuration={1500}
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid var(--color-brand-border)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} 
                    itemStyle={{ color: 'var(--color-brand-text)', fontWeight: 600 }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-brand-text)', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-center">
                <div className="w-12 h-12 bg-[var(--color-brand-bg)] rounded-full flex items-center justify-center border border-[var(--color-brand-border)] mb-3">
                  <Database className="w-5 h-5 text-[var(--color-brand-muted)]" />
                </div>
                <p className="text-sm font-medium text-[var(--color-brand-text)] mb-1">No category data available</p>
                <p className="text-xs text-[var(--color-brand-muted)]">Upload a dataset with categories to view distribution.</p>
              </div>
            )}
            
            {/* Center Total */}
            {categoryData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-[50px] sm:mb-[20px]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-brand-muted)] tracking-wider">Total</span>
                <span className="text-lg font-heading font-bold text-[var(--color-brand-text)]">{formatCurrency(metrics.totalRevenue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Regional Analytics */}
        <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 shadow-sm xl:col-span-1 lg:col-span-2 relative overflow-hidden flex flex-col">
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[var(--color-brand-primary)]/5 to-transparent pointer-events-none"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-lg font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[var(--color-brand-primary)]" />
              Regional Analytics
            </h2>
            {metrics.hasRegionalData && <button className="text-xs font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-text)] transition-colors">Details</button>}
          </div>
          
          <div className="flex-1 flex flex-col justify-center relative z-10">
             {metrics.hasRegionalData && metrics.regionalData.length > 0 ? (
               <div className="space-y-4">
                 {metrics.regionalData.map((reg, idx) => (
                    <div key={idx}>
                      <RegionBar name={reg.name} value={reg.percentage} amount={formatCurrency(reg.value)} color={COLORS[idx % COLORS.length]} />
                    </div>
                 ))}
               </div>
             ) : (
               <div className="flex flex-col h-full items-center justify-center text-center">
                <div className="w-12 h-12 bg-[var(--color-brand-bg)] rounded-full flex items-center justify-center border border-[var(--color-brand-border)] mb-3">
                  <MapPin className="w-5 h-5 text-[var(--color-brand-muted)]" />
                </div>
                <p className="text-sm font-medium text-[var(--color-brand-text)] mb-1">Geographic data unavailable</p>
                <p className="text-xs text-[var(--color-brand-muted)]">Upload dataset with country/region columns.</p>
              </div>
             )}
          </div>
        </div>
      </div>

      {/* Top Performing Products */}
      <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FFBD2E]" />
              {metrics.hasProductData ? 'Top Performing Products' : 'Top Transactions'}
            </h2>
            <p className="text-sm text-[var(--color-brand-muted)] mt-1">Ranking based on revenue generation and sales volume.</p>
          </div>
          <button className="px-4 py-2 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] text-sm font-semibold rounded-xl hover:border-[var(--color-brand-primary)] transition-all">
            View All
          </button>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-[var(--color-brand-border)] text-[11px] text-[var(--color-brand-muted)] uppercase tracking-wider sticky top-0 bg-[var(--color-brand-card)] z-10">
                <th className="pb-4 font-semibold px-4 w-16">Rank</th>
                <th className="pb-4 font-semibold">{metrics.hasProductData ? 'Product Name' : 'Transaction ID'}</th>
                <th className="pb-4 font-semibold text-right">Revenue</th>
                <th className="pb-4 font-semibold text-right">Orders</th>
                <th className="pb-4 font-semibold text-right">Contribution %</th>
                <th className="pb-4 font-semibold text-right w-48">Performance</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length > 0 ? topProducts.map((product, idx) => (
                <tr key={idx} className={`border-b border-[var(--color-brand-border)]/50 last:border-0 hover:bg-[var(--color-brand-bg)] transition-colors group cursor-pointer ${idx === 0 ? 'bg-[var(--color-brand-bg)]/30' : ''}`}>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)]">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="text-[var(--color-brand-muted)]">#{idx + 1}</span>}
                    </div>
                  </td>
                  <td className="py-4 font-medium text-[var(--color-brand-text)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-primary)] transition-colors" />
                      </div>
                      <span className="truncate max-w-[250px] group-hover:text-[var(--color-brand-primary)] transition-colors">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right text-[var(--color-brand-text)] font-mono font-medium">{formatCurrency(product.revenue)}</td>
                  <td className="py-4 text-right text-[var(--color-brand-muted)] font-mono">{formatNumber(product.sales)}</td>
                  <td className="py-4 text-right">
                    <span className="text-[var(--color-brand-text)] font-medium text-sm">{product.contribution.toFixed(1)}%</span>
                  </td>
                  <td className="py-4 pr-4 pl-4">
                    <div className="w-full h-2 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-full overflow-hidden group-hover:bg-[var(--color-brand-border)] transition-colors">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-[#FFBD2E] shadow-[0_0_10px_rgba(255,189,46,0.5)]' : 'bg-[var(--color-brand-primary)]'}`} 
                        style={{ width: `${Math.max(5, (product.revenue / topProducts[0].revenue) * 100)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-[var(--color-brand-bg)] rounded-full flex items-center justify-center border border-[var(--color-brand-border)] mb-4 shadow-inner">
                        <Award className="w-6 h-6 text-[var(--color-brand-muted)]" />
                      </div>
                      <p className="text-sm font-medium text-[var(--color-brand-text)] mb-1">No products found</p>
                      <p className="text-xs text-[var(--color-brand-muted)]">Upload a dataset containing product and revenue columns.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Top Customers */}
        <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden relative group xl:col-span-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand-secondary)]/5 blur-[40px] pointer-events-none group-hover:bg-[var(--color-brand-secondary)]/10 transition-colors"></div>
          
          {metrics.hasCustomerData ? (
            <TopCustomersTable customers={metrics.topCustomersList} totalRevenue={metrics.totalRevenue} />
          ) : (
            <>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--color-brand-secondary)]" />
                  Top Customers
                </h2>
              </div>
              <div className="flex flex-col h-full items-center justify-center text-center min-h-[250px] relative z-10">
                <div className="w-12 h-12 bg-[var(--color-brand-bg)] rounded-full flex items-center justify-center border border-[var(--color-brand-border)] mb-3">
                  <Users className="w-5 h-5 text-[var(--color-brand-muted)]" />
                </div>
                <p className="text-sm font-medium text-[var(--color-brand-text)] mb-1">Customer data unavailable</p>
                <p className="text-xs text-[var(--color-brand-muted)]">Upload dataset with customer info.</p>
              </div>
            </>
          )}
        </div>

        {/* Payment Methods or Dataset Composition */}
        <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden relative group flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#14B8A6]/5 blur-[40px] pointer-events-none group-hover:bg-[#14B8A6]/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              {metrics.hasPaymentData ? (
                <><CreditCard className="w-5 h-5 text-[#14B8A6]" /> Payment Methods</>
              ) : (
                <><Database className="w-5 h-5 text-[#14B8A6]" /> Dataset Composition</>
              )}
            </h2>
            <button className="text-sm font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-text)] transition-colors">Details</button>
          </div>
          
          <div className="space-y-5 relative z-10 flex-1 flex flex-col justify-center min-h-[250px]">
             {metrics.hasPaymentData ? (
               metrics.paymentMethodsData.slice(0, 4).map((pay, idx) => (
                 <div key={idx}>
                   <RegionBar name={pay.name} value={pay.percentage} amount={`${pay.percentage.toFixed(1)}%`} color={COLORS[idx % COLORS.length]} />
                 </div>
               ))
             ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 <div className="bg-[var(--color-brand-bg)] rounded-xl p-3 border border-[var(--color-brand-border)]">
                   <p className="text-[10px] text-[var(--color-brand-muted)] font-semibold uppercase tracking-wider mb-1">Missing Values</p>
                   <p className="text-xl font-bold text-[#F43F5E] font-mono">{metrics.datasetStats.missing}</p>
                 </div>
                 <div className="bg-[var(--color-brand-bg)] rounded-xl p-3 border border-[var(--color-brand-border)]">
                   <p className="text-[10px] text-[var(--color-brand-muted)] font-semibold uppercase tracking-wider mb-1">Duplicate Rows</p>
                   <p className="text-xl font-bold text-[#FFBD2E] font-mono">{metrics.datasetStats.duplicate}</p>
                 </div>
                 <div className="bg-[var(--color-brand-bg)] rounded-xl p-3 border border-[var(--color-brand-border)]">
                   <p className="text-[10px] text-[var(--color-brand-muted)] font-semibold uppercase tracking-wider mb-1">Numeric Columns</p>
                   <p className="text-xl font-bold text-[var(--color-brand-text)] font-mono">{metrics.datasetStats.numCols}</p>
                 </div>
                 <div className="bg-[var(--color-brand-bg)] rounded-xl p-3 border border-[var(--color-brand-border)]">
                   <p className="text-[10px] text-[var(--color-brand-muted)] font-semibold uppercase tracking-wider mb-1">Categorical Cols</p>
                   <p className="text-xl font-bold text-[var(--color-brand-text)] font-mono">{metrics.datasetStats.catCols}</p>
                 </div>
                 <div className="bg-[var(--color-brand-bg)] rounded-xl p-3 border border-[var(--color-brand-border)]">
                   <p className="text-[10px] text-[var(--color-brand-muted)] font-semibold uppercase tracking-wider mb-1">Date Columns</p>
                   <p className="text-xl font-bold text-[var(--color-brand-text)] font-mono">{metrics.datasetStats.dateCols}</p>
                 </div>
                 <div className="bg-[var(--color-brand-bg)] rounded-xl p-3 border border-[var(--color-brand-border)] flex flex-col justify-center">
                   <p className="text-[10px] text-[var(--color-brand-muted)] font-semibold uppercase tracking-wider mb-1">Completeness</p>
                   <div className="flex items-center gap-2">
                     <p className="text-xl font-bold text-[var(--color-brand-primary)] font-mono">{metrics.aiInsights.dataScore}%</p>
                     <div className="flex-1 h-1.5 bg-[var(--color-brand-border)] rounded-full overflow-hidden">
                       <div className="h-full bg-[var(--color-brand-primary)] rounded-full" style={{ width: `${metrics.aiInsights.dataScore}%` }}></div>
                     </div>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, isPositive, icon: Icon, tooltip, isCurrency, subtitle }: any) {
  const { formatCurrency } = useCurrency();
  const sparklineData = isPositive ? "M0,15 L10,12 L20,18 L30,8 L40,10 L50,0" : "M0,0 L10,5 L20,2 L30,12 L40,10 L50,20";
  const strokeColor = isPositive ? "var(--color-brand-primary)" : "var(--color-brand-error)";

  return (
    <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-[var(--color-brand-primary)]/50 transition-all group relative overflow-hidden min-h-[160px] flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand-primary)]/5 blur-[50px] -mr-10 -mt-10 pointer-events-none group-hover:bg-[var(--color-brand-primary)]/10 transition-colors"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div>
          <span className="text-sm font-medium text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-text)] transition-colors cursor-help flex items-center gap-1.5" title={tooltip}>
            {title}
          </span>
          {subtitle && <p className="text-[10px] text-[var(--color-brand-muted)]/70 uppercase tracking-wider mt-0.5">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-bg)] flex items-center justify-center border border-[var(--color-brand-border)] group-hover:border-[var(--color-brand-primary)]/50 transition-colors group-hover:scale-110 duration-300 shadow-sm shrink-0">
          <Icon className="w-5 h-5 text-[var(--color-brand-primary)]" />
        </div>
      </div>
      
      <div className="flex items-end justify-between relative z-10 mt-4">
        <div>
          <div className="text-3xl font-heading font-bold text-[var(--color-brand-text)] tracking-tight mb-2">
            <AnimatedNumber value={value} isCurrency={isCurrency} />
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] w-fit ${isPositive ? 'text-[var(--color-brand-primary)] shadow-[0_0_10px_rgba(18,209,142,0.1)]' : 'text-[#F43F5E] shadow-[0_0_10px_rgba(244,63,94,0.1)]'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change > 0 ? '+' : ''}{change}% vs last
          </div>
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

function InsightItem({ icon: Icon, title, desc, color, bg, borderColor }: any) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${borderColor} bg-[var(--color-brand-bg)] hover:bg-[var(--color-brand-bg)]/80 transition-colors cursor-pointer group`}>
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-[var(--color-brand-text)] group-hover:text-[var(--color-brand-primary)] transition-colors">{title}</h4>
        <p className="text-xs text-[var(--color-brand-muted)] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function RegionBar({ name, value, amount, color }: { name: string, value: number, amount: string, color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-semibold text-[var(--color-brand-text)]">{name}</span>
        <span className="font-mono text-[var(--color-brand-muted)]">{amount}</span>
      </div>
      <div className="w-full h-2 bg-[var(--color-brand-bg)] rounded-full overflow-hidden border border-[var(--color-brand-border)]/50">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// Simple icon for PieChart
function PieChartIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

function TopCustomersTable({ customers, totalRevenue }: { customers: any[], totalRevenue: number }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const { formatCurrency } = useCurrency();
  const itemsPerPage = 5;

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const paginatedCustomers = sortedCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <div className="w-3 h-3 ml-1 opacity-0 group-hover/th:opacity-50 transition-opacity"><ChevronDown className="w-3 h-3" /></div>;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-[var(--color-brand-primary)]" /> : <ChevronDown className="w-3 h-3 ml-1 text-[var(--color-brand-primary)]" />;
  };

  const exportCSV = () => {
    const headers = ['Customer', 'Orders', 'Avg Order Value', 'LTV (Revenue)', 'Last Purchase', 'Contribution %'].join(',');
    const rows = sortedCustomers.map(c => 
      `"${c.name}",${c.orders},${c.aov},${c.revenue},"${c.lastDate}",${c.contribution.toFixed(2)}`
    ).join('\n');
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `top_customers_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--color-brand-secondary)]" />
          Top Customers
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--color-brand-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-sm text-[var(--color-brand-text)] rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-[var(--color-brand-secondary)]/50 transition-colors w-full sm:w-48"
            />
          </div>
          <button onClick={exportCSV} className="p-2 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg hover:border-[var(--color-brand-secondary)]/50 transition-colors text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]" title="Export CSV">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-[var(--color-brand-border)] text-[11px] text-[var(--color-brand-muted)] uppercase tracking-wider sticky top-0 bg-[var(--color-brand-card)]">
              <th className="pb-3 font-semibold px-2 cursor-pointer group/th hover:text-[var(--color-brand-text)] transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center">Customer {getSortIcon('name')}</div>
              </th>
              <th className="pb-3 font-semibold px-2 cursor-pointer group/th hover:text-[var(--color-brand-text)] transition-colors" onClick={() => handleSort('lastDate')}>
                <div className="flex items-center">Last Purchase {getSortIcon('lastDate')}</div>
              </th>
              <th className="pb-3 font-semibold text-right px-2 cursor-pointer group/th hover:text-[var(--color-brand-text)] transition-colors" onClick={() => handleSort('orders')}>
                <div className="flex items-center justify-end">Orders {getSortIcon('orders')}</div>
              </th>
              <th className="pb-3 font-semibold text-right px-2 cursor-pointer group/th hover:text-[var(--color-brand-text)] transition-colors" onClick={() => handleSort('aov')}>
                <div className="flex items-center justify-end">Avg Order {getSortIcon('aov')}</div>
              </th>
              <th className="pb-3 font-semibold text-right px-2 cursor-pointer group/th hover:text-[var(--color-brand-text)] transition-colors" onClick={() => handleSort('revenue')}>
                <div className="flex items-center justify-end">LTV {getSortIcon('revenue')}</div>
              </th>
              <th className="pb-3 font-semibold text-right px-2 cursor-pointer group/th hover:text-[var(--color-brand-text)] transition-colors" onClick={() => handleSort('contribution')}>
                <div className="flex items-center justify-end">Share {getSortIcon('contribution')}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length > 0 ? paginatedCustomers.map((cust, i) => (
              <tr key={i} className="border-b border-[var(--color-brand-border)]/50 last:border-0 hover:bg-[var(--color-brand-bg)] transition-colors cursor-pointer group/row">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center text-xs font-semibold text-[var(--color-brand-muted)] group-hover/row:text-[var(--color-brand-secondary)] group-hover/row:border-[var(--color-brand-secondary)]/50 transition-colors">
                      {cust.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[var(--color-brand-text)] truncate max-w-[150px]">{cust.name}</span>
                  </div>
                </td>
                <td className="py-3 text-[var(--color-brand-muted)] text-xs px-2">{cust.lastDate !== 'Unknown' ? cust.lastDate : 'N/A'}</td>
                <td className="py-3 text-right text-[var(--color-brand-muted)] font-mono text-sm px-2">{formatNumber(cust.orders)}</td>
                <td className="py-3 text-right text-[var(--color-brand-muted)] font-mono text-sm px-2">{formatCurrency(cust.aov)}</td>
                <td className="py-3 text-right text-[var(--color-brand-text)] font-mono text-sm px-2">{formatCurrency(cust.revenue)}</td>
                <td className="py-3 text-right px-2">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs font-medium text-[var(--color-brand-text)]">{cust.contribution.toFixed(1)}%</span>
                    <div className="w-12 h-1.5 bg-[var(--color-brand-bg)] rounded-full overflow-hidden border border-[var(--color-brand-border)]/50 hidden sm:block">
                      <div className="h-full bg-[var(--color-brand-secondary)] rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (cust.revenue / customers[0].revenue) * 100)}%` }}></div>
                    </div>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-[var(--color-brand-muted)]">
                  No customers match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-brand-border)]">
          <span className="text-xs text-[var(--color-brand-muted)]">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} entries</span>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:border-[var(--color-brand-secondary)]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-medium text-[var(--color-brand-text)] px-2">Page {currentPage} of {totalPages}</div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:border-[var(--color-brand-secondary)]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
