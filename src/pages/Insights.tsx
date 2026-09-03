import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { useData } from "../context/DataContext";
import { formatNumber } from "../lib/dataUtils";
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useCurrency } from '../hooks/useCurrency';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  BrainCircuit,
  Zap,
  CheckCircle2,
  Clock,
  BarChart2,
  FileText,
  Download,
  Share2,
  Eye,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  Send,
  HelpCircle,
  Activity,
  Target,
  Crosshair,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  ShieldCheck,
  AlertCircle,
  Calendar,
  LineChart,
  Lightbulb,
  Layers,
  FileSpreadsheet,
  Box,
  Map,
  RefreshCcw,
  Users,
  Bot, 
  User, 
  Copy, 
  RotateCcw, 
  MoreHorizontal, 
  Play, 
  ChevronDown, 
  Check, 
  DownloadCloud,
  CheckCircle,
  Search,
  Filter,
  X,
  FileIcon
, Loader2 } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import Markdown from 'react-markdown';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

function SectionHeader({ icon: Icon, title, desc, action }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center shadow-[0_0_15px_rgba(33,230,168,0.1)]">
            <Icon className="w-4 h-4 text-[#21E6A8]" />
          </div>
          <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] tracking-tight">{title}</h2>
        </div>
        <p className="text-sm text-[var(--color-brand-muted)] max-w-xl leading-relaxed">{desc}</p>
      </div>
      {action && (
        <div className="shrink-0">{action}</div>
      )}
    </div>
  );
}

export function Insights() {
  const { activeDataset, isFetchingActiveData, dateFilter, deleteDataset } = useData();
  const { formatCurrency, currency } = useCurrency();
  const metrics = useDashboardMetrics(activeDataset, dateFilter, currency);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAll = () => {
    if (!activeDataset || !metrics) return;
    setIsExporting(true);
    toast.promise(
      new Promise((resolve) => setTimeout(() => {
        try {
          const wb = XLSX.utils.book_new();
          
          // Original Data
          const wsData = XLSX.utils.json_to_sheet(activeDataset.data || []);
          XLSX.utils.book_append_sheet(wb, wsData, "Raw Data");
          
          // Recommendations
          const recsData = (metrics.recommendations || []).map((r: any) => ({
            Title: r.title,
            Description: r.desc,
            Impact: r.impact,
            Confidence: r.conf + "%",
            ROI: r.roi,
            Difficulty: r.difficulty
          }));
          const wsRecs = XLSX.utils.json_to_sheet(recsData);
          XLSX.utils.book_append_sheet(wb, wsRecs, "Recommendations");
          
          // Risks
          const risksData = (metrics.risks || []).map((r: any) => ({
            Title: r.title,
            Severity: r.severity,
            Description: r.desc,
            Recommended_Action: r.action
          }));
          const wsRisks = XLSX.utils.json_to_sheet(risksData);
          XLSX.utils.book_append_sheet(wb, wsRisks, "Risks");
          
          XLSX.writeFile(wb, `${activeDataset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ai_insights.xlsx`);
          resolve(true);
        } catch (e) {
          throw e;
        }
      }, 800)),
      {
        loading: 'Generating AI Insights export...',
        success: 'Export downloaded successfully',
        error: 'Failed to generate export',
        finally: () => setIsExporting(false)
      }
    );
  };

  if (isFetchingActiveData) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-[var(--color-brand-primary)] animate-spin" /></div>;
  }

  if (activeDataset?.loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-8 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)] mb-2">Dataset records could not be loaded</h2>
        <p className="text-[var(--color-brand-muted)] text-center max-w-md mb-6 leading-relaxed">
          {activeDataset.loadError}
        </p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)] font-bold rounded-xl hover:bg-[var(--color-brand-secondary)] transition-all">
           Reload Page
        </button>
      </div>
    );
  }
  if (!activeDataset || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-full flex items-center justify-center mb-6 relative overflow-hidden shadow-[0_0_50px_rgba(33,230,168,0.15)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#21E6A8]/20 to-transparent"></div>
          <Sparkles className="w-10 h-10 text-[#21E6A8] relative z-10" />
        </motion.div>
        <h2 className="text-2xl font-heading font-semibold text-[var(--color-brand-text)] mb-2">
          No datasets available
        </h2>
        <p className="text-[var(--color-brand-muted)] max-w-md mx-auto mb-8">
          Upload a CSV dataset to start analyzing your business data.
        </p>
      </div>
    );
  }

  const hasBusinessData = metrics.capabilities?.hasRevenue || metrics.capabilities?.hasOrders || metrics.capabilities?.domain === 'hr';
  const businessScore = hasBusinessData ? metrics.healthScore : null;
  const dataQualityScore = metrics.datasetStats?.dataQualityScore ?? 100;
  const confScore = Math.min(99, Math.max(75, Math.round((dataQualityScore + (businessScore ?? 80)) / 2)));
  const healthStatus =
    dataQualityScore >= 90 ? "Excellent" : dataQualityScore >= 75 ? "Good" : "Needs Review";

  // Simulated timeline
  const timeline = [
    { time: "0ms", label: "Dataset ingested", status: "done" },
    { time: "400ms", label: "Schema inferred", status: "done" },
    { time: "1.2s", label: "Anomalies detected", status: "done" },
    { time: "2.1s", label: "Predictive models run", status: "done" },
    { time: "2.4s", label: "Insights generated", status: "done" },
  ];

  return (
    <div className="space-y-16 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 1. AI Executive Summary (Hero) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-[22px] p-8 shadow-sm overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-brand-primary)]/5 blur-[100px] -mr-40 -mt-40 pointer-events-none group-hover:bg-[var(--color-brand-primary)]/10 transition-colors duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#21E6A8]/50 to-transparent opacity-50"></div>

        <div className="flex flex-col lg:flex-row gap-8 relative z-10">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--color-brand-primary)] blur-md opacity-40 rounded-full animate-pulse"></div>
                <div className="w-10 h-10 bg-[var(--color-brand-bg)] border border-[#21E6A8]/30 rounded-full flex items-center justify-center relative z-10">
                  <BrainCircuit className="w-5 h-5 text-[#21E6A8]" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-heading font-semibold text-[var(--color-brand-text)] tracking-tight">
                  AI Executive Summary
                </h1>
                <p className="text-sm text-[#21E6A8] font-medium tracking-wide">
                  InsightIQ Copilot Analysis Complete
                </p>
              </div>
            </div>

            <p className="text-lg text-[var(--color-brand-muted)] leading-relaxed mb-8">
              {metrics.executiveSummary?.summaryText || `InsightIQ analyzed your dataset containing ${metrics.datasetStats.totalRows} records.`}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[var(--color-brand-bg)]/50 border border-[var(--color-brand-border)] rounded-xl p-4">
                <p className="text-xs text-[var(--color-brand-muted)] uppercase tracking-wider mb-1 font-semibold">
                  Business Health
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-[var(--color-brand-text)]">
                    {businessScore !== null ? businessScore : 'N/A'}
                  </span>
                  {businessScore !== null && (
                    <span className="text-sm text-[var(--color-brand-muted)] mb-1">
                      /100
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-[var(--color-brand-bg)]/50 border border-[var(--color-brand-border)] rounded-xl p-4">
                <p className="text-xs text-[var(--color-brand-muted)] uppercase tracking-wider mb-1 font-semibold">
                  Data Quality
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-[var(--color-brand-text)]">
                    {dataQualityScore}
                  </span>
                  <span className="text-sm text-[var(--color-brand-muted)] mb-1">
                    /100
                  </span>
                </div>
              </div>
              <div className="bg-[var(--color-brand-bg)]/50 border border-[var(--color-brand-border)] rounded-xl p-4">
                <p className="text-xs text-[var(--color-brand-muted)] uppercase tracking-wider mb-1 font-semibold">
                  Dataset Health
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {healthStatus === "Excellent" ? (
                    <CheckCircle2 className="w-5 h-5 text-[#21E6A8]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-[#FFBD2E]" />
                  )}
                  <span className="text-lg font-bold text-[var(--color-brand-text)]">
                    {healthStatus}
                  </span>
                </div>
              </div>
              <div className="bg-[var(--color-brand-bg)]/50 border border-[var(--color-brand-border)] rounded-xl p-4">
                <p className="text-xs text-[var(--color-brand-muted)] uppercase tracking-wider mb-1 font-semibold">
                  Confidence
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-[var(--color-brand-text)]">
                    {confScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-72 bg-[var(--color-brand-bg)]/50 border border-[var(--color-brand-border)] rounded-xl p-5 flex flex-col">
            <h3 className="text-sm font-semibold text-[var(--color-brand-text)] mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#21E6A8]" />
              Analysis Timeline
            </h3>
            <div className="flex-1 space-y-4">
              {timeline.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)] shadow-[0_0_8px_rgba(33,230,168,0.6)]"></div>
                    {idx < timeline.length - 1 && (
                      <div className="w-px h-full bg-[var(--color-brand-primary)]/20 my-1"></div>
                    )}
                  </div>
                  <div className="-mt-1.5 pb-2">
                    <p className="text-xs font-medium text-[var(--color-brand-text)]">
                      {step.label}
                    </p>
                    <p className="text-[10px] text-[var(--color-brand-muted)] font-mono">
                      {step.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Key Business Findings */}
      <div>
        <SectionHeader 
          icon={Target} 
          title="Key Business Findings" 
          desc="Automated analysis of primary drivers, anomalies, and performance metrics across your dataset."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {metrics.findings && metrics.findings.length > 0 ? (
            metrics.findings.map((finding: any, idx: number) => (
              <FindingCard
                key={idx}
                icon={finding.type === 'success' ? TrendingUp : finding.type === 'warning' ? ShieldAlert : Calendar}
                title={finding.title}
                desc={finding.desc}
                conf={finding.conf}
                priority={finding.priority}
                type={finding.type}
              />
            ))
          ) : (
             <div className="col-span-4 p-8 text-center bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl">
               <p className="text-[var(--color-brand-muted)]">No findings generated for this dataset.</p>
             </div>
          )}
        </div>
      </div>

      {/* 3. AI Recommendations */}
      <div>
        <SectionHeader 
          icon={Lightbulb} 
          title="AI Recommendations" 
          desc="High-impact strategic actions simulated and ranked by our predictive models."
        />
        <div className="space-y-6">
          {metrics.recommendations && metrics.recommendations.length > 0 ? (
            (metrics.recommendations || []).map((rec: any, idx: number) => (
              <RecommendationPanel
                key={idx}
                title={rec.title}
                desc={rec.desc}
                impact={rec.impact}
                conf={rec.conf}
                roi={rec.roi}
                difficulty={rec.difficulty}
              />
            ))
          ) : (
            <div className="p-8 text-center bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl">
              <p className="text-[var(--color-brand-muted)]">No strong recommendations found for this dataset.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Predictive Intelligence & 6. Business Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <SectionHeader 
            icon={LineChart} 
            title="Predictive Intelligence" 
            desc="Forward-looking forecasts based on historical trajectory."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {metrics.predictions && metrics.predictions.length > 0 ? (
              (metrics.predictions || []).map((pred: any, idx: number) => (
                <PredictionCard
                  key={idx}
                  title={pred.title}
                  value={pred.value}
                  trend={pred.trend}
                  conf={pred.conf}
                  type={pred.trend === 'up' ? 'success' : pred.trend === 'down' ? 'warning' : 'info'}
                  change={pred.change}
                />
              ))
            ) : (
              <div className="col-span-2 p-8 text-center bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl">
                <p className="text-[var(--color-brand-muted)]">No predictive models generated.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionHeader 
            icon={ShieldCheck} 
            title="Business Risks" 
            desc="Identified vulnerabilities requiring immediate attention."
          />
          <div className="space-y-4">
            {metrics.risks && metrics.risks.length > 0 ? (
              metrics.risks.map((risk: any, idx: number) => (
                <RiskCard
                  key={idx}
                  title={risk.title}
                  severity={risk.severity}
                  desc={risk.desc}
                  rec={risk.action}
                />
              ))
            ) : (
              <div className="p-8 text-center bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl">
                <p className="text-[var(--color-brand-muted)] flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#21E6A8]" />
                  No severe business risks identified.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Strategic Opportunities & Live Insight Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionHeader 
              icon={Crosshair} 
              title="Strategic Opportunities" 
              desc="Untapped growth vectors derived from market and user behavior."
            />
            <a href="/assistant" className="px-4 py-2 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] hover:border-[#21E6A8]/50 text-[var(--color-brand-text)] hover:text-[#21E6A8] text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
              Open AI Assistant →
            </a>
          </div>
          <div className="space-y-5">
            {metrics.recommendations && metrics.recommendations.length > 0 ? (
              metrics.recommendations.slice(0, 4).map((rec: any, idx: number) => (
                <OpportunityCard
                  key={idx}
                  title={rec.title}
                  impact={rec.impact}
                  conf={rec.conf}
                  desc={rec.desc}
                />
              ))
            ) : (
              <div className="p-8 text-center bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-2xl">
                <p className="text-[var(--color-brand-muted)]">No strategic opportunities identified.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionHeader 
            icon={Activity} 
            title="Live Insight Feed" 
            desc="Real-time stream of notable events, anomalies, and tactical observations."
            action={
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] hover:border-[#21E6A8]/50 text-xs font-semibold text-[var(--color-brand-text)] rounded-lg transition-colors shadow-sm">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
            }
          />
          <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl p-2 h-[500px] overflow-y-auto custom-scrollbar shadow-sm hover:border-white/10 transition-colors">
            <div className="space-y-1">
              {metrics.aiInsights && metrics.aiInsights.list.length > 0 ? (
                metrics.aiInsights.list.map((insight: any) => (
                  <FeedItem
                    key={insight.id}
                    title={insight.title}
                    desc={insight.description}
                    time="Just now"
                    type={insight.type}
                  />
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-[var(--color-brand-muted)] text-sm">No recent insights.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Data Quality Audit */}
      <div>
        <SectionHeader 
          icon={Database} 
          title="Data Quality Audit" 
          desc="Automated validation of dataset health, completeness, and structure."
        />
        <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl p-8 relative overflow-hidden group hover:border-[#21E6A8]/30 transition-colors shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-primary)]/5 blur-[80px] -mr-32 -mt-32 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-6 border-b border-[var(--color-brand-border)] gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-[var(--color-brand-text)]">Overall Quality Score</h3>
                  {(() => {
                    let isVerified = metrics.aiInsights.dataScore >= 95 && metrics.datasetStats.missing === 0 && metrics.datasetStats.duplicate === 0;
                    let isWarning = metrics.aiInsights.dataScore < 70 || metrics.datasetStats.missing > 100 || metrics.datasetStats.duplicate > 100;
                    
                    if (isVerified) {
                      return (
                        <span className="px-2 py-0.5 bg-[var(--color-brand-primary)]/10 text-[#21E6A8] border border-[#21E6A8]/20 text-[10px] font-bold rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> VERIFIED
                        </span>
                      );
                    } else if (isWarning) {
                      return (
                        <span className="px-2 py-0.5 bg-[#F43F5E]/10 text-[#F43F5E] border border-[#F43F5E]/20 text-[10px] font-bold rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> WARNING
                        </span>
                      );
                    } else {
                      return (
                        <span className="px-2 py-0.5 bg-[#FFBD2E]/10 text-[#FFBD2E] border border-[#FFBD2E]/20 text-[10px] font-bold rounded flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> NEEDS REVIEW
                        </span>
                      );
                    }
                  })()}
                </div>
                <p className="text-sm text-[var(--color-brand-muted)]">
                  Based on completeness, consistency, and freshness.
                </p>
              </div>
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-[var(--color-brand-bg)] stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                  <circle className="text-[#21E6A8] progress-ring stroke-current drop-shadow-[0_0_8px_rgba(33,230,168,0.5)]" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * dataQualityScore) / 100}></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-[var(--color-brand-text)]">{dataQualityScore}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              <AuditWidget
                label="Dataset Completeness"
                value={
                  100 -
                  (metrics.datasetStats.missing /
                    Math.max(
                      1,
                      metrics.datasetStats.cols * metrics.totalSales,
                    )) *
                    100
                }
                format="percent"
                status={metrics.datasetStats.missing > 0 ? "ok" : "good"}
              />
              <AuditWidget
                label="Duplicate Records"
                value={metrics.datasetStats.duplicate}
                format="number"
                inverse
                status={metrics.datasetStats.duplicate > 0 ? "warning" : "good"}
              />
              <AuditWidget
                label="Missing Values"
                value={metrics.datasetStats.missing}
                format="number"
                inverse
                status={metrics.datasetStats.missing > 0 ? "ok" : "good"}
              />
              {(() => {
                let freshnessVal: number | string = "N/A";
                let fStatus = "ok";
                if (metrics.datasetStats.latestDateMs > 0) {
                  const daysDiff = (Date.now() - metrics.datasetStats.latestDateMs) / (1000 * 60 * 60 * 24);
                  freshnessVal = Math.max(0, Math.round(100 - (daysDiff / 30) * 10));
                  if (freshnessVal > 80) fStatus = "good";
                  else if (freshnessVal > 50) fStatus = "ok";
                  else fStatus = "bad";
                }
                return (
                  <AuditWidget 
                    label="Data Freshness" 
                    value={freshnessVal} 
                    format={typeof freshnessVal === 'number' ? 'percent' : 'string'} 
                    status={fStatus} 
                  />
                );
              })()}
            </div>
          </div>
        </div>

      {/* 9. AI Generated Report */}
      <div>
        <SectionHeader 
          icon={FileText} 
          title="AI Generated Reports" 
          desc="Exportable, presentation-ready business summaries and technical readouts."
          action={
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setPreviewReport({ title: 'AI Executive Summary', content: `Dataset contains ${metrics.datasetStats.totalRows} records. Total revenue: ${formatCurrency(metrics.totalRevenue)}.` }); setIsPreviewOpen(true); }} className="px-4 py-2 bg-[var(--color-brand-bg)] hover:bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-text)] border border-[var(--color-brand-border)] hover:border-[#21E6A8]/50 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-sm">
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button onClick={handleExportAll} disabled={isExporting} className="px-4 py-2 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-secondary)] text-[var(--color-brand-bg)] border border-transparent text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(33,230,168,0.3)] disabled:opacity-50">
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />} Export All
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ReportCard
            title="Executive Report"
            desc="High-level summary of performance."
            icon={FileText}
            onClick={() => { setPreviewReport({ title: 'Executive Report', content: `Dataset contains ${metrics.datasetStats.totalRows} records. Total revenue: ${formatCurrency(metrics.totalRevenue)}.` }); setIsPreviewOpen(true); }}
          />
          <ReportCard
            title="Business Summary"
            desc="Detailed breakdown of metrics."
            icon={BarChart2}
            onClick={() => { setPreviewReport({ title: 'Business Summary', content: `Dataset: ${activeDataset.name}\nRecords: ${metrics.totalSales}\nColumns: ${metrics.datasetStats.cols}\nRevenue: ${formatCurrency(metrics.totalRevenue)}` }); setIsPreviewOpen(true); }}
          />
          <ReportCard
            title="Strategic Recommendations"
            desc="Actionable steps and ROI."
            icon={Target}
            onClick={() => { setPreviewReport({ title: 'Strategic Recommendations', content: (metrics.recommendations || []).map((r: any) => `- ${r.title}: ${r.impact}`).join('\n') }); setIsPreviewOpen(true); }}
          />
          <ReportCard
            title="Forecast Report"
            desc="Predictive models and trends."
            icon={TrendingUp}
            onClick={() => { setPreviewReport({ title: 'Forecast Report', content: (metrics.predictions || []).map((p: any) => `- ${p.title}: ${p.value} (${p.trend})`).join('\n') }); setIsPreviewOpen(true); }}
          />
        </div>
      </div>

      <AnimatePresence>
        {isPreviewOpen && previewReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-brand-border)]">
                <h3 className="text-xl font-semibold text-[var(--color-brand-text)]">{previewReport.title}</h3>
                <button onClick={() => setIsPreviewOpen(false)} className="text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto whitespace-pre-wrap text-[var(--color-brand-muted)] text-sm leading-relaxed">
                {previewReport.content}
              </div>
              <div className="p-6 border-t border-[var(--color-brand-border)] bg-[var(--color-brand-bg)]/50 flex justify-end">
                <button onClick={() => setIsPreviewOpen(false)} className="px-4 py-2 bg-[var(--color-brand-bg)] hover:bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-text)] border border-[var(--color-brand-border)] hover:border-[#21E6A8]/50 text-sm font-semibold rounded-xl transition-all shadow-sm">
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FindingCard({ icon: Icon, title, desc, conf, priority, type }: any) {
  const isHigh = priority === "High";
  const colorClass =
    type === "success"
      ? "text-[#21E6A8]"
      : type === "warning"
        ? "text-[#FFBD2E]"
        : "text-[#3B82F6]";
  const bgClass =
    type === "success"
      ? "bg-[var(--color-brand-primary)]/10"
      : type === "warning"
        ? "bg-[#FFBD2E]/10"
        : "bg-[#3B82F6]/10";
  const borderClass =
    type === "success"
      ? "group-hover:border-[#21E6A8]/50"
      : type === "warning"
        ? "group-hover:border-[#FFBD2E]/50"
        : "group-hover:border-[#3B82F6]/50";

  return (
    <div
      className={`bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-[18px] p-5 relative group overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-sm ${borderClass}`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${bgClass} blur-[40px] -mr-16 -mt-16 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`}
      ></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div
          className={`w-10 h-10 rounded-xl ${bgClass} border border-white/5 flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-1 rounded bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-[10px] font-mono text-[var(--color-brand-muted)]">
            {conf}% CONF
          </span>
          <span
            className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${isHigh ? "bg-[#F43F5E]/10 text-[#F43F5E] border border-[#F43F5E]/20" : "bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-[var(--color-brand-muted)]"}`}
          >
            {priority}
          </span>
        </div>
      </div>

      <h3 className="text-base font-semibold text-[var(--color-brand-text)] mb-2 relative z-10">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-brand-muted)] leading-relaxed relative z-10">
        {desc}
      </p>
    </div>
  );
}

function RecommendationPanel({
  title,
  desc,
  impact,
  conf,
  roi,
  difficulty,
}: any) {
  return (
    <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-[20px] p-6 relative group overflow-hidden transition-all duration-300 hover:border-[#21E6A8]/50 hover:shadow-[0_0_30px_rgba(33,230,168,0.1)]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-primary)]/5 blur-[80px] -mr-32 -mt-32 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#21E6A8] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="flex flex-col md:flex-row gap-6 justify-between items-start relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-[var(--color-brand-text)] group-hover:text-[#21E6A8] transition-colors">
              {title}
            </h3>
            <span className="px-2 py-0.5 bg-[var(--color-brand-primary)]/10 text-[#21E6A8] border border-[#21E6A8]/20 text-[10px] uppercase font-bold rounded">
              High Priority
            </span>
          </div>
          <p className="text-[var(--color-brand-muted)] text-sm leading-relaxed mb-6">
            {desc}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-brand-muted)] font-semibold block mb-1">
                Est. Impact
              </span>
              <span className="text-sm font-bold text-[#21E6A8]">{impact}</span>
            </div>
            <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-brand-muted)] font-semibold block mb-1">
                Confidence
              </span>
              <span className="text-sm font-bold text-[var(--color-brand-text)] font-mono">
                {conf}%
              </span>
            </div>
            <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-brand-muted)] font-semibold block mb-1">
                Time to Impact
              </span>
              <span className="text-sm font-bold text-[var(--color-brand-text)]">2 Weeks</span>
            </div>
            <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-brand-muted)] font-semibold block mb-1">
                Difficulty
              </span>
              <span className="text-sm font-bold text-[var(--color-brand-text)]">{difficulty}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 min-w-[160px] border-l border-[var(--color-brand-border)] pl-6">
          <button className="px-4 py-2 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-secondary)] text-[var(--color-brand-bg)] border border-transparent text-xs font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(33,230,168,0.2)] flex items-center justify-center gap-2">
            <Play className="w-3.5 h-3.5" />
            Run Simulation
          </button>
          <button className="px-4 py-2 bg-[var(--color-brand-bg)] hover:bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-text)] hover:text-[#21E6A8] border border-[var(--color-brand-border)] hover:border-[#21E6A8]/50 text-xs font-semibold rounded-xl transition-all w-full text-center">
            View Details
          </button>
          <button className="px-4 py-2 bg-transparent hover:bg-white/5 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] text-xs font-semibold rounded-xl transition-all w-full text-center mt-1">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function PredictionCard({ title, value, trend, conf, type, risk }: any) {
  const isUp = trend === "up";
  const color =
    type === "success"
      ? "text-[#21E6A8]"
      : type === "warning"
        ? "text-[#FFBD2E]"
        : "text-[#3B82F6]";
  const bg =
    type === "success"
      ? "bg-[var(--color-brand-primary)]/10"
      : type === "warning"
        ? "bg-[#FFBD2E]/10"
        : "bg-[#3B82F6]/10";

  return (
    <div className={`bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl p-5 relative overflow-hidden transition-all duration-300 shadow-sm group ${type === 'success' ? 'hover:border-[#21E6A8]/50 hover:-translate-y-1' : type === 'warning' ? 'hover:border-[#FFBD2E]/50 hover:-translate-y-1' : 'hover:border-[#3B82F6]/50 hover:-translate-y-1'}`}>
      <div className={`absolute top-0 right-0 w-32 h-32 ${bg} blur-[40px] -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      <div className="flex justify-between items-start mb-3 relative z-10">
        <p className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wider">
          {title}
        </p>
        <span className="text-[10px] font-mono text-[var(--color-brand-muted)] bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] px-1.5 py-0.5 rounded">
          {conf}%
        </span>
      </div>
      <div className="flex items-end gap-3 relative z-10">
        <span className="text-2xl font-bold text-[var(--color-brand-text)]">{value}</span>
        {trend !== "flat" && (
          <span
            className={`flex items-center text-xs font-medium mb-1 px-1.5 py-0.5 rounded ${bg} ${color}`}
          >
            {isUp ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
          </span>
        )}
      </div>
      {risk && (
        <div className="mt-3 pt-3 border-t border-[var(--color-brand-border)] flex items-center justify-between relative z-10">
          <span className="text-xs text-[var(--color-brand-muted)]">
            Risk Level
          </span>
          <span
            className={`text-xs font-semibold ${risk === "High" ? "text-[#F43F5E]" : risk === "Medium" ? "text-[#FFBD2E]" : "text-[#21E6A8]"}`}
          >
            {risk}
          </span>
        </div>
      )}
    </div>
  );
}

function RiskCard({ title, severity, desc, rec }: any) {
  const isHigh = severity === "High";
  const isMedium = severity === "Medium";
  const color = isHigh
    ? "text-[#F43F5E]"
    : isMedium
      ? "text-[#FFBD2E]"
      : "text-[#21E6A8]";
  const bg = isHigh
    ? "bg-[#F43F5E]/10"
    : isMedium
      ? "bg-[#FFBD2E]/10"
      : "bg-[var(--color-brand-primary)]/10";

  return (
    <div className={`bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl p-5 flex gap-4 items-start relative overflow-hidden transition-all duration-300 shadow-sm group ${isHigh ? 'hover:border-[#F43F5E]/50 hover:-translate-y-1' : isMedium ? 'hover:border-[#FFBD2E]/50 hover:-translate-y-1' : 'hover:border-[#21E6A8]/50 hover:-translate-y-1'}`}>
      <div className={`absolute top-0 right-0 w-32 h-32 ${bg} blur-[40px] -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      <div
        className={`w-2 h-2 rounded-full mt-2 shrink-0 relative z-10 ${isHigh ? "bg-[#F43F5E] shadow-[0_0_8px_rgba(244,63,94,0.6)]" : isMedium ? "bg-[#FFBD2E] shadow-[0_0_8px_rgba(255,189,46,0.6)]" : "bg-[var(--color-brand-primary)] shadow-[0_0_8px_rgba(33,230,168,0.6)]"}`}
      ></div>
      <div className="flex-1 relative z-10">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-sm font-semibold text-[var(--color-brand-text)]">{title}</h4>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${bg} ${color}`}
          >
            {severity}
          </span>
        </div>
        <p className="text-xs text-[var(--color-brand-muted)] mb-2">{desc}</p>
        <div className="flex items-start gap-1.5 text-xs text-[var(--color-brand-text)]/80 bg-[var(--color-brand-bg)] p-2 rounded-lg border border-white/5">
          <Lightbulb className="w-3.5 h-3.5 text-[#21E6A8] shrink-0 mt-0.5" />
          <span>{rec}</span>
        </div>
      </div>
    </div>
  );
}

function FeedItem({ title, desc, time, type }: any) {
  const isSuccess = type === "success";
  const isWarning = type === "warning";
  const color = isSuccess
    ? "text-[#21E6A8]"
    : isWarning
      ? "text-[#FFBD2E]"
      : "text-[#3B82F6]";
  const bg = isSuccess
    ? "bg-[var(--color-brand-primary)]/10 border-[#21E6A8]/20"
    : isWarning
      ? "bg-[#FFBD2E]/10 border-[#FFBD2E]/20"
      : "bg-[#3B82F6]/10 border-[#3B82F6]/20";
  const Icon = isSuccess ? TrendingUp : isWarning ? AlertTriangle : Activity;

  return (
    <div className="p-4 hover:bg-[var(--color-brand-bg)]/50 rounded-xl transition-colors cursor-pointer group flex gap-4 items-start relative">
      <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${bg} relative`}>
        {type === 'warning' && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#FFBD2E] rounded-full animate-ping"></div>}
        {type === 'warning' && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#FFBD2E] rounded-full border-2 border-[var(--color-brand-card)]"></div>}
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1.5">
          <h4 className="text-sm font-semibold text-[var(--color-brand-text)] truncate flex items-center gap-2">
            {title}
            {type === 'warning' && <span className="px-1.5 py-0.5 bg-[#FFBD2E]/10 text-[#FFBD2E] text-[9px] font-bold uppercase rounded">New</span>}
          </h4>
          <span className="text-[10px] text-[var(--color-brand-muted)] shrink-0 ml-2 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" /> {time}
          </span>
        </div>
        <p className="text-sm text-[var(--color-brand-muted)] line-clamp-2 leading-snug mb-2">
          {desc}
        </p>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-[10px] text-[var(--color-brand-muted)] rounded flex items-center gap-1">
            {type === 'success' ? 'Opportunity' : type === 'warning' ? 'Risk Alert' : 'System'}
          </span>
        </div>
      </div>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-md text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] absolute right-4 top-1/2 -translate-y-1/2">
        <Check className="w-4 h-4" />
      </button>
    </div>
  );
}

function OpportunityCard({ title, impact, conf, desc }: any) {
  return (
    <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl p-6 hover:-translate-y-1 hover:border-[#21E6A8]/30 transition-all duration-300 shadow-sm relative group overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand-primary)]/5 blur-[30px] -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-3 relative z-10">
        <h3 className="text-base font-semibold text-[var(--color-brand-text)] group-hover:text-[#21E6A8] transition-colors">
          {title}
        </h3>
        <span className="px-2 py-1 bg-[var(--color-brand-primary)]/10 text-[#21E6A8] border border-[#21E6A8]/20 text-xs font-bold rounded">
          {impact}
        </span>
      </div>
      
      <p className="text-sm text-[var(--color-brand-muted)] mb-5 relative z-10 leading-relaxed">
        {desc}
      </p>
      
      <div className="flex flex-wrap gap-2 relative z-10">
        <div className="px-2.5 py-1 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-md flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-semibold text-[var(--color-brand-muted)]">Conf</span>
          <span className="text-xs font-bold text-[var(--color-brand-text)] font-mono">{conf}%</span>
        </div>
      </div>
    </div>
  );
}

function AuditWidget({ label, value, format, inverse, status }: any) {
  const displayValue = format === "percent" && typeof value === 'number' ? `${value.toFixed(1)}%` : value;
  
  const isGood = status === "good";
  const isOk = status === "ok";
  const color = isGood
    ? "text-[#21E6A8] bg-[var(--color-brand-primary)]/10 border-[#21E6A8]/30"
    : isOk
      ? "text-[#FFBD2E] bg-[#FFBD2E]/10 border-[#FFBD2E]/30"
      : "text-[#F43F5E] bg-[#F43F5E]/10 border-[#F43F5E]/30";
      
  const Icon = isGood ? CheckCircle2 : isOk ? AlertTriangle : AlertCircle;

  return (
    <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <span className="text-sm font-medium text-[var(--color-brand-text)] block">{label}</span>
          <span className="text-xs text-[var(--color-brand-muted)]">{isGood ? "Passed" : isOk ? "Warning" : "Critical"}</span>
        </div>
      </div>
      <span className="text-lg font-bold text-[var(--color-brand-text)] font-mono">{displayValue}</span>
    </div>
  );
}

function ReportCard({ title, desc, icon: Icon, onClick }: any) {
  return (
    <div onClick={onClick} className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-2xl p-5 hover:bg-[var(--color-brand-bg)]/50 transition-colors cursor-pointer group flex flex-col relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl flex items-center justify-center group-hover:border-[#21E6A8]/50 transition-colors shadow-sm relative">
          <Icon className="w-5 h-5 text-[var(--color-brand-muted)] group-hover:text-[#21E6A8] transition-colors relative z-10" />
        </div>
        <button className="text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] transition-colors p-1 opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-brand-text)] mb-1.5">{title}</h3>
      <p className="text-xs text-[var(--color-brand-muted)] leading-relaxed mb-4 line-clamp-2 flex-1">
        {desc}
      </p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--color-brand-border)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase text-[var(--color-brand-muted)] font-semibold">Ready for Export</span>
        </div>
        <span className="px-1.5 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-[9px] font-bold rounded">AI Generated</span>
      </div>
      
      {/* Hover Actions Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <button className="w-10 h-10 bg-white/10 hover:bg-white/20 text-[var(--color-brand-text)] rounded-full flex items-center justify-center transition-colors" title="Preview">
          <Eye className="w-4 h-4" />
        </button>
        <button className="w-10 h-10 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-secondary)] text-[var(--color-brand-bg)] rounded-full flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(33,230,168,0.4)]" title="Download">
          <DownloadCloud className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
