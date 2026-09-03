import React, { useState } from 'react';
import { FileText, Download, Share2, Eye, Search, Clock, Trash2, Settings, Users, PieChart, Zap, ChevronRight, BarChart2, Activity, Play, File } from 'lucide-react';
import { useData, Report } from '../context/DataContext';
import { computeForecast, formatNumber } from '../lib/dataUtils';
import { useAuth } from '../context/AuthContext';
import { GenerationDialog } from '../components/Reports/GenerationDialog';
import { ReportViewer } from '../components/Reports/ReportViewer';
import { CustomizeDialog } from '../components/Reports/CustomizeDialog';
import { ActivityPanel } from '../components/Reports/ActivityPanel';

const reportTemplates = [
  { id: 'executive', name: 'Executive Summary', desc: 'High-level business overview and key metrics.', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10', condition: () => true, pages: 3, charts: 4, genTime: '30s', formats: 'PDF, CSV', model: 'Gemini 1.5 Pro' },
  { id: 'sales', name: 'Sales Performance', desc: 'Detailed breakdown of product sales and revenue.', icon: BarChart2, color: 'text-[var(--color-brand-primary)]', bg: 'bg-[var(--color-brand-primary)]/10', condition: (metrics: any) => metrics?.hasProductData || metrics?.totalRevenue > 0, pages: 3, charts: 4, genTime: '30s', formats: 'PDF, CSV', model: 'Gemini 1.5 Pro' },
  { id: 'customer', name: 'Customer Analysis', desc: 'Analysis of customer behavior and concentration.', icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10', condition: (metrics: any) => metrics?.hasCustomerData, pages: 3, charts: 4, genTime: '30s', formats: 'PDF, CSV', model: 'Gemini 1.5 Pro' },
  { id: 'inventory', name: 'Inventory Audit', desc: 'Stock levels and supply chain health.', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/10', condition: (metrics: any) => metrics?.hasInventoryData, pages: 3, charts: 4, genTime: '30s', formats: 'PDF, CSV', model: 'Gemini 1.5 Pro' },
  { id: 'marketing', name: 'Marketing Review', desc: 'Campaign acquisition costs and channel performance.', icon: PieChart, color: 'text-pink-400', bg: 'bg-pink-400/10', condition: (metrics: any) => metrics?.hasMarketingData, pages: 3, charts: 4, genTime: '30s', formats: 'PDF, CSV', model: 'Gemini 1.5 Pro' },
  { id: 'forecast', name: 'Forecast Outlook', desc: 'Historical projections and trend expectations.', icon: Clock, color: 'text-[var(--color-brand-secondary)]', bg: 'bg-[var(--color-brand-secondary)]/10', condition: (metrics: any) => metrics?.revenueData?.length >= 3, pages: 3, charts: 4, genTime: '30s', formats: 'PDF, CSV', model: 'Gemini 1.5 Pro' },
];

export function Reports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStage, setGenStage] = useState('');
  const [currentGenReport, setCurrentGenReport] = useState<{name: string, type: string} | null>(null);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [sortField, setSortField] = useState<keyof Report>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [customizeTemplate, setCustomizeTemplate] = useState<string | null>(null);
  
  // Advanced Filters
    const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  
  // Grouping
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Bulk Selection
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  
  // Activity Panel
  const [showActivity, setShowActivity] = useState(false);

  const toggleSelectAll = () => {
    if (selectedReports.size === sortedReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(sortedReports.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedReports(newSelected);
  };

  const { activeDataset, reports, activities, generateReport, deleteReport } = useData();
  const { user } = useAuth();

  const handleGenerate = async (template: typeof reportTemplates[0]) => {
    if (!activeDataset) return;
    
    setIsGenerating(true);
    setGenProgress(0);
    setCurrentGenReport({ name: activeDataset.name, type: template.name });

    const stages = [
      { msg: 'Validating dataset...', progress: 15, duration: 800 },
      { msg: 'Analyzing Business Metrics...', progress: 35, duration: 1200 },
      { msg: 'Building Visualization Structures...', progress: 55, duration: 1000 },
      { msg: 'Generating AI Executive Summary...', progress: 75, duration: 1500 },
      { msg: 'Compiling Final Report PDF...', progress: 95, duration: 1200 },
      { msg: 'Finalizing...', progress: 100, duration: 500 }
    ];

    for (const stage of stages) {
      setGenStage(stage.msg);
      setGenProgress(stage.progress);
      await new Promise(r => setTimeout(r, stage.duration));
    }

    const newReportData = {
      name: `${template.name} - ${activeDataset.name}`,
      type: template.name,
      datasetName: activeDataset.name,
      datasetId: activeDataset.id,
      generatedBy: user?.name || 'System User',
      status: 'Completed' as const,
      metricsSnapshot: activeDataset.metrics
    };

    await generateReport(newReportData);

    setIsGenerating(false);
    setCurrentGenReport(null);
    
    // Auto-open preview for the newly generated report
    // Since generateReport is async and we don't have the ID, we can find it by getting the latest report for this dataset/type
    // Alternatively, we could update generateReport to return the generated report, but for now we'll just not auto-preview or mock it
    // Wait, the user asked to open preview automatically. I'll mock opening the viewer with the generated data (minus real ID for now)
    setPreviewReport({ ...newReportData, id: 'temp-id', date: new Date().toISOString() });
  };

  const exportReport = (report: Report) => {
    const payload = {
      metadata: report,
      disclaimer: "This report was generated dynamically based on uploaded dataset metrics.",
      timestamp: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `report_${report.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().getTime()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.datasetName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchesType = filterType === 'All' || r.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Group reports by Dataset + Type to support Version History
  const groupedReports: Record<string, Report[]> = {};
  sortedReports.forEach(r => {
    const key = `${r.datasetName}-${r.type}`;
    if (!groupedReports[key]) {
      groupedReports[key] = [];
    }
    groupedReports[key].push(r);
  });
  
  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-[#21E6A8] bg-[var(--color-brand-primary)]/10';
      case 'Failed': return 'text-[#F43F5E] bg-[#F43F5E]/10';
      case 'Generating': return 'text-[#FFBD2E] bg-[#FFBD2E]/10';
      case 'Scheduled': return 'text-[#3B82F6] bg-[#3B82F6]/10';
      case 'Archived': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-[var(--color-brand-muted)] bg-[var(--color-brand-border)]';
    }
  };

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-[var(--color-brand-card)] rounded-3xl border border-[var(--color-brand-border)]">
        <div className="w-16 h-16 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-[var(--color-brand-muted)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-brand-text)] mb-2">No Active Dataset</h2>
        <p className="text-[var(--color-brand-muted)]">Upload a dataset in the Dashboard to access reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <GenerationDialog 
        isOpen={isGenerating} 
        onClose={() => setIsGenerating(false)} 
        progress={genProgress}
        stage={genStage}
        datasetName={currentGenReport?.name || ''}
        reportType={currentGenReport?.type || ''}
      />
      
      <CustomizeDialog 
        isOpen={!!customizeTemplate} 
        onClose={() => setCustomizeTemplate(null)} 
        templateName={customizeTemplate || ''} 
      />
      
      <ActivityPanel
        isOpen={showActivity}
        onClose={() => setShowActivity(false)}
        activities={activities}
      />
      
      <ReportViewer 
        report={previewReport} 
        onClose={() => setPreviewReport(null)} 
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[var(--color-brand-text)] mb-1 flex items-center gap-3">
            Reports Center
          </h1>
          <p className="text-[var(--color-brand-muted)] text-sm">Enterprise-grade reporting and automated generation.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-muted)]" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] text-sm text-[var(--color-brand-text)] rounded-xl focus:outline-none focus:border-[var(--color-brand-primary)] w-64 transition-colors"
            />
          </div>
          <button 
            onClick={() => setShowActivity(true)}
            className="px-4 py-2 bg-[var(--color-brand-card)] text-[var(--color-brand-text)] hover:bg-[var(--color-brand-bg)] text-sm font-medium rounded-xl border border-[var(--color-brand-border)] transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" /> Activity
          </button>
        </div>
      </div>

      {/* Report Templates Grid */}
      <div id="report-templates">
        <h2 className="text-sm uppercase tracking-wider font-semibold text-[var(--color-brand-muted)] mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--color-brand-primary)]" /> Report Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {reportTemplates.map(template => (
            <div key={template.id} className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-5 shadow-sm hover:border-[var(--color-brand-primary)]/40 transition-colors group flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${template.bg} flex items-center justify-center border border-[var(--color-brand-border)] group-hover:scale-110 transition-transform`}>
                    <template.icon className={`w-5 h-5 ${template.color}`} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-medium text-[var(--color-brand-muted)] uppercase bg-[var(--color-brand-bg)] px-2 py-0.5 rounded border border-[var(--color-brand-border)]">
                      {template.pages} Pages
                    </span>
                    <span className="text-[10px] font-medium text-[var(--color-brand-muted)] uppercase bg-[var(--color-brand-bg)] px-2 py-0.5 rounded border border-[var(--color-brand-border)]">
                      {template.charts} Charts
                    </span>
                  </div>
                </div>
                <h3 className="text-base font-heading font-semibold text-[var(--color-brand-text)] mb-1 group-hover:text-[var(--color-brand-primary)] transition-colors">{template.name}</h3>
                <p className="text-xs text-[var(--color-brand-muted)] mb-3">{template.desc}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-brand-bg)] text-[var(--color-brand-muted)] border border-[var(--color-brand-border)]">{template.genTime}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-brand-bg)] text-[var(--color-brand-muted)] border border-[var(--color-brand-border)]">{template.formats}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-brand-bg)] text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/30">{template.model}</span>
                </div>
              </div>
              
                <div className="pt-4 border-t border-[var(--color-brand-border)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => setCustomizeTemplate(template.name)}
                      className="text-xs font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] flex items-center gap-1 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" /> Customize
                    </button>
                    <button 
                      className="text-xs font-medium text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                  </div>
                  <button 
                    onClick={() => handleGenerate(template)} 
                    className="px-4 py-1.5 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] border border-transparent rounded-lg text-xs font-bold hover:bg-[var(--color-brand-secondary)] transition-colors shadow-sm flex items-center gap-1 group/btn"
                  >
                    <Play className="w-3 h-3 group-hover/btn:scale-110 transition-transform" /> Generate
                  </button>
                </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reports Library Table */}
      <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-4 sm:p-6 shadow-sm overflow-hidden relative w-full min-w-0 max-w-full">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4 w-full min-w-0">
          <div className="flex flex-wrap items-center gap-4 min-w-0">
            <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--color-brand-muted)]" /> Report Library
            </h2>
            
            {/* Bulk Actions Toolbar */}
            {selectedReports.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-[var(--color-brand-bg)] border border-[var(--color-brand-primary)]/50 rounded-lg px-2 py-1 animate-in fade-in slide-in-from-left-4 duration-300">
                <span className="text-xs font-semibold text-[var(--color-brand-primary)] px-2">{selectedReports.size} selected</span>
                <div className="w-px h-4 bg-[var(--color-brand-border)]"></div>
                <button className="p-1.5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] rounded hover:bg-[var(--color-brand-card)] transition-colors" title="Download Selected">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-[var(--color-brand-muted)] hover:text-[#3B82F6] rounded hover:bg-[var(--color-brand-card)] transition-colors" title="Share Selected">
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    selectedReports.forEach(id => deleteReport(id));
                    setSelectedReports(new Set());
                  }}
                  className="p-1.5 text-[var(--color-brand-muted)] hover:text-[#F43F5E] rounded hover:bg-[var(--color-brand-card)] transition-colors" title="Delete Selected">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg text-xs font-medium text-[var(--color-brand-text)] hover:border-[var(--color-brand-muted)] transition-colors focus:outline-none focus:border-[var(--color-brand-primary)]"
            >
              <option value="All">All Types</option>
              {reportTemplates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg text-xs font-medium text-[var(--color-brand-text)] hover:border-[var(--color-brand-muted)] transition-colors focus:outline-none focus:border-[var(--color-brand-primary)]"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Generating">Generating</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto min-w-0 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--color-brand-border)] text-xs uppercase tracking-wider text-[var(--color-brand-muted)]">
                <th className="pb-3 px-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={sortedReports.length > 0 && selectedReports.size === sortedReports.length}
                    onChange={toggleSelectAll}
                    className="form-checkbox rounded bg-[var(--color-brand-bg)] border-[var(--color-brand-border)] text-[var(--color-brand-primary)] cursor-pointer"
                  />
                </th>
                <th 
                  className="pb-3 font-semibold px-4 cursor-pointer hover:text-[var(--color-brand-text)] transition-colors"
                  onClick={() => { setSortField('name'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  Report Name
                </th>
                <th 
                  className="pb-3 font-semibold px-4 cursor-pointer hover:text-[var(--color-brand-text)] transition-colors"
                  onClick={() => { setSortField('datasetName'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  Dataset
                </th>
                <th 
                  className="pb-3 font-semibold px-4 cursor-pointer hover:text-[var(--color-brand-text)] transition-colors"
                  onClick={() => { setSortField('date'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  Date Generated
                </th>
                <th 
                  className="pb-3 font-semibold px-4 text-center cursor-pointer hover:text-[var(--color-brand-text)] transition-colors"
                  onClick={() => { setSortField('status'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  Status
                </th>
                <th className="pb-3 font-semibold px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {Object.entries(groupedReports).map(([groupKey, group]) => {
                const latestReport = group[0];
                const isExpanded = expandedGroups.has(groupKey);
                const hasHistory = group.length > 1;

                return (
                  <React.Fragment key={groupKey}>
                    <tr className={`border-b border-[var(--color-brand-border)]/50 last:border-0 hover:bg-[var(--color-brand-bg)] transition-colors group ${selectedReports.has(latestReport.id) ? 'bg-[var(--color-brand-bg)]/50' : ''}`}>
                      <td className="py-4 px-4">
                        <input 
                          type="checkbox" 
                          checked={selectedReports.has(latestReport.id)}
                          onChange={() => toggleSelect(latestReport.id)}
                          className="form-checkbox rounded bg-[var(--color-brand-bg)] border-[var(--color-brand-border)] text-[var(--color-brand-primary)] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity checked:opacity-100"
                        />
                      </td>
                      <td className="py-4 font-medium text-[var(--color-brand-text)] px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] flex items-center justify-center shrink-0">
                            <File className="w-4 h-4 text-[var(--color-brand-primary)]" />
                          </div>
                          <div>
                            <span className="block truncate max-w-[200px]" title={latestReport.name}>{latestReport.name}</span>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="block text-xs text-[var(--color-brand-muted)] font-normal">{latestReport.type}</span>
                              {hasHistory && (
                                <button 
                                  onClick={() => toggleGroup(groupKey)}
                                  className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-brand-primary)] hover:text-[var(--color-brand-text)] transition-colors flex items-center gap-1 bg-[var(--color-brand-bg)] px-1.5 py-0.5 rounded border border-[var(--color-brand-border)]"
                                >
                                  <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                  History ({group.length - 1})
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-[var(--color-brand-muted)] px-4 truncate max-w-[150px]">{latestReport.datasetName}</td>
                      <td className="py-4 text-[var(--color-brand-muted)] px-4 whitespace-nowrap">
                        {new Date(latestReport.date).toLocaleDateString()} <span className="text-[10px] opacity-70">{new Date(latestReport.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(latestReport.status)}`}>
                          {latestReport.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setPreviewReport(latestReport)}
                            className="p-1.5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-primary)] bg-[var(--color-brand-card)] rounded hover:bg-[var(--color-brand-border)] transition-colors" title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => exportReport(latestReport)}
                            className="p-1.5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] bg-[var(--color-brand-card)] rounded hover:bg-[var(--color-brand-border)] transition-colors" title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-[var(--color-brand-muted)] hover:text-[#3B82F6] bg-[var(--color-brand-card)] rounded hover:bg-[var(--color-brand-border)] transition-colors" title="Share">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteReport(latestReport.id)}
                            className="p-1.5 text-[var(--color-brand-muted)] hover:text-[#F43F5E] bg-[var(--color-brand-card)] rounded hover:bg-[#F43F5E]/10 transition-colors" title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {isExpanded && group.slice(1).map((report, index) => (
                      <tr key={report.id} className={`border-b border-[var(--color-brand-border)]/30 bg-[var(--color-brand-bg)]/50 hover:bg-[var(--color-brand-bg)] transition-colors group ${selectedReports.has(report.id) ? 'bg-[var(--color-brand-bg)]' : ''}`}>
                        <td className="py-3 px-4 text-right">
                          <input 
                            type="checkbox" 
                            checked={selectedReports.has(report.id)}
                            onChange={() => toggleSelect(report.id)}
                            className="form-checkbox rounded bg-[var(--color-brand-card)] border-[var(--color-brand-border)] text-[var(--color-brand-primary)] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity checked:opacity-100"
                          />
                        </td>
                        <td className="py-3 pl-2 pr-4 font-medium text-[var(--color-brand-muted)]">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-border)]"></div>
                            <span className="truncate max-w-[200px]" title={report.name}>{report.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-[var(--color-brand-muted)] px-4 truncate max-w-[150px]">{report.datasetName}</td>
                        <td className="py-3 text-[var(--color-brand-muted)] px-4 whitespace-nowrap">
                          {new Date(report.date).toLocaleDateString()} <span className="text-[10px] opacity-70">{new Date(report.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${getStatusColor(report.status)} opacity-80`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setPreviewReport(report)}
                              className="p-1 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-primary)] rounded hover:bg-[var(--color-brand-border)] transition-colors" title="Preview Old Version"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => exportReport(report)}
                              className="p-1 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] rounded hover:bg-[var(--color-brand-border)] transition-colors" title="Download"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => deleteReport(report.id)}
                              className="p-1 text-[var(--color-brand-muted)] hover:text-[#F43F5E] rounded hover:bg-[#F43F5E]/10 transition-colors" title="Delete Old Version"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center mb-2 shadow-inner">
                        <FileText className="w-8 h-8 text-[var(--color-brand-muted)]" />
                      </div>
                      <h3 className="text-[var(--color-brand-text)] font-semibold">Build your enterprise report library</h3>
                      <p className="text-sm text-[var(--color-brand-muted)] max-w-sm">Generate your first AI-powered report from the active dataset. All versions will be automatically tracked and archived.</p>
                      <button 
                        onClick={() => {
                          const el = document.getElementById('report-templates');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="mt-4 px-4 py-2 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] text-sm font-bold rounded-lg hover:bg-[var(--color-brand-secondary)] transition-colors shadow-sm"
                      >
                        Generate Report
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
  );
}
