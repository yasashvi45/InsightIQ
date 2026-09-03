import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  TrendingUp,
  DollarSign,
  Users,
  ShieldCheck,
  Activity,
  Target,
  Download,
  Calendar,
  AlertTriangle,
  GitPullRequest,
  Settings,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Server,
  BarChart2,
  Info,
  Clock,
  Play,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { useData } from "../context/DataContext";
import { X } from "lucide-react";
import {
  computeForecast,
  formatNumber,
} from "../lib/dataUtils";
import { useCurrency } from '../hooks/useCurrency';

export function Forecast() {
  const [timeframe, setTimeframe] = useState("Monthly");
  const [scenarioMultiplier, setScenarioMultiplier] = useState(1);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const { activeDataset, isFetchingActiveData, deleteDataset } = useData();
  const { formatCurrency } = useCurrency();

  const forecast = useMemo(
    () => computeForecast(activeDataset, timeframe),
    [activeDataset, timeframe],
  );

  if (!activeDataset || !forecast.isValid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-[var(--color-brand-card)] rounded-3xl border border-[var(--color-brand-border)] animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-[#FFBD2E]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-brand-text)] mb-2">NOT ENOUGH DATA</h2>
        <p className="text-[var(--color-brand-muted)] max-w-md mx-auto mb-8">
          {forecast.reason ||
            "Reliable forecasting requires sufficient historical observations."}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left w-full max-w-2xl bg-[var(--color-brand-bg)] p-6 rounded-2xl border border-[var(--color-brand-border)] mb-8">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-brand-text)] mb-4 uppercase tracking-wider">Required</h3>
            <ul className="space-y-3 text-sm text-[var(--color-brand-muted)]">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#21E6A8]" /> Date field</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#21E6A8]" /> Numeric metric</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#21E6A8]" /> Multiple historical observations</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-brand-text)] mb-4 uppercase tracking-wider">Detected</h3>
            <ul className="space-y-3 text-sm text-[var(--color-brand-muted)]">
              <li className="flex items-center gap-2">
                {forecast.hasDate ? <CheckCircle2 className="w-4 h-4 text-[#21E6A8]" /> : <X className="w-4 h-4 text-red-400" />} 
                Date availability
              </li>
              <li className="flex items-center gap-2">
                {forecast.observations >= 3 ? <CheckCircle2 className="w-4 h-4 text-[#21E6A8]" /> : <AlertTriangle className="w-4 h-4 text-[#FFBD2E]" />} 
                {forecast.observations || 0} observations
              </li>
              <li className="flex items-center gap-2">
                {forecast.hasMetric ? <CheckCircle2 className="w-4 h-4 text-[#21E6A8]" /> : <X className="w-4 h-4 text-red-400" />} 
                Metric: {forecast.metricName || 'None'}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a href="/analytics" className="px-6 py-2 bg-[var(--color-brand-bg)] hover:bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-text)] border border-[var(--color-brand-border)] hover:border-[#21E6A8]/50 font-semibold rounded-xl transition-all flex items-center gap-2">
            View Analytics &rarr;
          </a>
        </div>
      </div>
    );
  }

  const applyScenario = (data: any[], multiplier: number) => {
    return data.map((d) => ({
      ...d,
      predicted: d.isForecast ? d.predicted * multiplier : d.predicted,
      range: d.isForecast
        ? [d.range[0] * multiplier, d.range[1] * multiplier]
        : d.range,
    }));
  };

  const currentForecastData = applyScenario(
    forecast.forecastData,
    scenarioMultiplier,
  );
  const currentPredictedRevenue =
    forecast.predictedRevenue * scenarioMultiplier;
  const currentPredictedOrders = forecast.predictedOrders * scenarioMultiplier;
  const currentExpectedGrowth =
    forecast.expectedGrowth + (scenarioMultiplier - 1) * 100;
  const currentExpectedCustomers =
    forecast.expectedCustomers * scenarioMultiplier;

  const exportReport = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      datasetInfo: {
        name: activeDataset.name,
        rows: activeDataset.rowCount || activeDataset.data?.length || 0,
        columns: activeDataset.columns.length,
      },
      kpis: {
        predictedRevenue: currentPredictedRevenue,
        predictedOrders: currentPredictedOrders,
        expectedGrowth: currentExpectedGrowth,
        expectedCustomers: currentExpectedCustomers,
      },
      forecast: currentForecastData,
      methodology: {
        model: forecast.modelName,
        details: forecast.modelDetails,
        factors: forecast.factors,
      },
      confidence: forecast.confidence,
      risks: forecast.risks,
      drivers: forecast.drivers,
      summary: {
        executive: forecast.explanation,
      },
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(payload, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute(
      "download",
      `forecast_report_${timeframe.toLowerCase()}_${new Date().toISOString().split("T")[0]}.json`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confidenceColor =
    forecast.confidence >= 85
      ? "text-[#21E6A8]"
      : forecast.confidence >= 75
        ? "text-[#FFBD2E]"
        : "text-[#F43F5E]";
  const confidenceBg =
    forecast.confidence >= 85
      ? "bg-[var(--color-brand-primary)]/10"
      : forecast.confidence >= 75
        ? "bg-[#FFBD2E]/10"
        : "bg-[#F43F5E]/10";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isForecast = !payload[0].payload.actual;
      const pred =
        payload.find((p: any) => p.dataKey === "predicted")?.value || 0;
      const actual = payload.find((p: any) => p.dataKey === "actual")?.value;
      const range = payload.find((p: any) => p.dataKey === "range")?.value || [
        0, 0,
      ];

      return (
        <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] p-4 rounded-xl shadow-xl min-w-[200px]">
          <p className="text-[var(--color-brand-text)] font-bold mb-2 pb-2 border-b border-[var(--color-brand-border)] flex items-center justify-between">
            {label}
            <span
              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${isForecast ? "bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)]" : "bg-[var(--color-brand-border)] text-[var(--color-brand-muted)]"}`}
            >
              {isForecast ? "Forecast" : "Historical"}
            </span>
          </p>
          {!isForecast && (
            <p className="text-sm text-[var(--color-brand-muted)] mb-1 flex justify-between">
              Actual:{" "}
              <span className="text-[var(--color-brand-text)] font-medium">
                {formatCurrency(actual)}
              </span>
            </p>
          )}
          <p className="text-sm text-[var(--color-brand-muted)] mb-1 flex justify-between">
            Predicted:{" "}
            <span className="text-[var(--color-brand-primary)] font-medium">
              {formatCurrency(pred)}
            </span>
          </p>
          {isForecast && (
            <>
              <p className="text-sm text-[var(--color-brand-muted)] mb-1 flex justify-between">
                Upper Bound:{" "}
                <span className="text-[var(--color-brand-text)] font-medium">
                  {formatCurrency(range[1])}
                </span>
              </p>
              <p className="text-sm text-[var(--color-brand-muted)] mb-1 flex justify-between">
                Lower Bound:{" "}
                <span className="text-[var(--color-brand-text)] font-medium">
                  {formatCurrency(range[0])}
                </span>
              </p>
              <p className="text-sm text-[var(--color-brand-muted)] mb-1 flex justify-between">
                Confidence:{" "}
                <span className={confidenceColor}>{forecast.confidence}%</span>
              </p>
            </>
          )}
          {!isForecast && actual !== undefined && pred !== undefined && (
            <p className="text-sm text-[var(--color-brand-muted)] mb-1 flex justify-between">
              Error:{" "}
              <span className="text-[#FFBD2E] font-medium">
                {Math.abs(((actual - pred) / actual) * 100).toFixed(1)}%
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const firstForecastIndex = currentForecastData.findIndex((d) => d.isForecast);
  const firstForecastDate =
    firstForecastIndex >= 0 ? currentForecastData[firstForecastIndex].name : "";
  const lastHistoricalDate =
    firstForecastIndex > 0
      ? currentForecastData[firstForecastIndex - 1].name
      : "";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-[var(--color-brand-text)] mb-1 flex items-center gap-3">
            Predictive Analytics
          </h1>
          <p className="text-[var(--color-brand-muted)] text-sm">
            Enterprise-grade forecasting derived from dataset patterns.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex flex-wrap sm:flex-nowrap gap-1 p-1 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-xl w-full sm:w-auto">
            {["Weekly", "Monthly", "Quarterly"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeframe === tf ? "bg-[var(--color-brand-primary)] text-[var(--color-brand-bg)]" : "text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)]"}`}
              >
                {tf}
              </button>
            ))}
          </div>
          <button
            onClick={exportReport}
            className="px-4 py-2 bg-[var(--color-brand-card)] hover:bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] text-[var(--color-brand-text)] text-sm font-medium rounded-xl flex items-center justify-center sm:justify-start gap-2 transition-colors w-full sm:w-auto"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Alerts */}
      {forecast.alerts && forecast.alerts.length > 0 && (
        <div className="flex flex-col gap-3">
          {forecast.alerts.map((alert: any, idx: number) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-start gap-3 ${alert.severity === "High" ? "bg-[#F43F5E]/10 border-[#F43F5E]/30 text-[#F43F5E]" : "bg-[#FFBD2E]/10 border-[#FFBD2E]/30 text-[#FFBD2E]"}`}
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">{alert.message}</p>
                <p className="text-xs opacity-90 mt-1">
                  {alert.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Predicted Revenue"
          value={formatCurrency(currentPredictedRevenue)}
          change={currentExpectedGrowth}
          isGrowth
          isPositive={currentExpectedGrowth >= 0}
          icon={DollarSign}
        />
        <StatCard
          title="Predicted Orders"
          value={formatNumber(currentPredictedOrders)}
          change={
            forecast.comparison?.currentOrders
              ? ((currentPredictedOrders - forecast.comparison.currentOrders) /
                  forecast.comparison.currentOrders) *
                100
              : 0
          }
          isGrowth
          isPositive={
            currentPredictedOrders >= (forecast.comparison?.currentOrders || 0)
          }
          icon={Target}
        />
        <StatCard
          title="Expected Growth"
          value={`${currentExpectedGrowth > 0 ? "+" : ""}${currentExpectedGrowth.toFixed(1)}%`}
          change={0}
          isPositive={currentExpectedGrowth >= 0}
          icon={TrendingUp}
          hideArrow
        />
        <StatCard
          title="Expected Customers"
          value={formatNumber(currentExpectedCustomers)}
          change={
            forecast.comparison?.currentCustomers
              ? ((currentExpectedCustomers -
                  forecast.comparison.currentCustomers) /
                  forecast.comparison.currentCustomers) *
                100
              : 0
          }
          isGrowth
          isPositive={
            currentExpectedCustomers >=
            (forecast.comparison?.currentCustomers || 0)
          }
          icon={Users}
        />

        {/* Confidence Card */}
        <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-5 shadow-sm hover:border-[var(--color-brand-primary)]/30 transition-colors group relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-medium text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-text)] transition-colors">
                Overall Confidence
              </span>
              <div
                className={`w-8 h-8 rounded-lg ${confidenceBg} flex items-center justify-center border border-[var(--color-brand-border)] transition-colors`}
              >
                <ShieldCheck className={`w-4 h-4 ${confidenceColor}`} />
              </div>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <span className="text-2xl font-heading font-bold text-[var(--color-brand-text)] tracking-tight">
                {forecast.confidence}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--color-brand-border)] flex flex-col gap-1.5 relative z-10">
            {[
              {
                label: "Historical Coverage",
                value: forecast.factors?.historicalCoverage,
              },
              { label: "Seasonality", value: forecast.factors?.seasonality },
              {
                label: "Trend Stability",
                value: forecast.factors?.trendStability,
              },
              {
                label: "Model Accuracy",
                value: forecast.factors?.modelAccuracy,
              },
              { label: "Data Quality", value: forecast.factors?.dataQuality },
            ].map((factor, i) => (
              <div key={i}>
                <div className="flex justify-between items-center text-[10px] mb-0.5">
                  <span className="text-[var(--color-brand-muted)]">
                    {factor.label}
                  </span>
                  <span className="text-[var(--color-brand-text)] font-medium">
                    {factor.value}%
                  </span>
                </div>
                <div className="w-full bg-[var(--color-brand-bg)] rounded-full h-1">
                  <div
                    className="bg-[var(--color-brand-primary)] h-1 rounded-full opacity-80"
                    style={{ width: `${factor.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Forecast Chart */}
        <div className="lg:col-span-2 bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-heading font-semibold text-[var(--color-brand-text)]">
                Revenue Projection
              </h2>
              <p className="text-sm text-[var(--color-brand-muted)] mt-1">
                Actual vs Predicted with Confidence Intervals
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center gap-2 text-xs font-medium text-[var(--color-brand-primary)]">
                <Activity className="w-3 h-3" /> Live Model
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="99%" height="100%">
              <ComposedChart
                data={currentForecastData}
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-brand-border)"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-brand-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-brand-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={80} tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "12px",
                    color: "var(--color-brand-muted)",
                  }}
                />

                {firstForecastDate && (
                  <ReferenceLine
                    x={firstForecastDate}
                    stroke="var(--color-brand-primary)"
                    strokeDasharray="3 3"
                    label={{
                      position: "top",
                      value: "Forecast Start",
                      fill: "var(--color-brand-primary)",
                      fontSize: 10,
                      offset: 10,
                    }}
                  />
                )}

                <Area
                  type="monotone"
                  dataKey="range"
                  name="Confidence Interval"
                  fill="var(--color-brand-primary)"
                  stroke="none"
                  fillOpacity={0.15}
                  activeDot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Historical Revenue"
                  stroke="white"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: "white" }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="Predicted Forecast"
                  stroke="var(--color-brand-primary)"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 6, fill: "var(--color-brand-primary)" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Prediction Timeline */}
          <div className="mt-6 pt-6 border-t border-[var(--color-brand-border)] flex flex-wrap items-center justify-between text-xs font-medium text-[var(--color-brand-muted)] gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              Historical Window
            </div>
            <ArrowDownRight className="w-4 h-4 opacity-50 -rotate-90 hidden sm:block" />
            <div className="flex items-center gap-2 text-[var(--color-brand-text)]">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
              Today ({lastHistoricalDate})
            </div>
            <ArrowDownRight className="w-4 h-4 opacity-50 -rotate-90 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)]"></span>
              Forecast Start
            </div>
            <ArrowDownRight className="w-4 h-4 opacity-50 -rotate-90 hidden sm:block" />
            <div className="flex items-center gap-2">30 Days</div>
            <ArrowDownRight className="w-4 h-4 opacity-50 -rotate-90 hidden lg:block" />
            <div className="flex items-center gap-2 hidden lg:flex">
              60 Days
            </div>
            <ArrowDownRight className="w-4 h-4 opacity-50 -rotate-90 hidden lg:block" />
            <div className="flex items-center gap-2 hidden lg:flex">
              90 Days
            </div>
            <ArrowDownRight className="w-4 h-4 opacity-50 -rotate-90 hidden sm:block" />
            <div className="flex items-center gap-2 opacity-50">
              Forecast End
            </div>
          </div>
        </div>

        {/* Scenarios & AI Model */}
        <div className="flex flex-col gap-6">
          {/* AI Model Card */}
          <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden flex-1 flex flex-col justify-center">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowModelDetails(!showModelDetails)}
            >
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-[var(--color-brand-primary)]" />
                <h2 className="text-lg font-heading font-semibold text-[var(--color-brand-text)]">
                  Forecast Engine
                </h2>
              </div>
              {showModelDetails ? (
                <ChevronUp className="w-4 h-4 text-[var(--color-brand-muted)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--color-brand-muted)]" />
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs text-[var(--color-brand-muted)] uppercase font-semibold tracking-wider mb-1">
                Selected Model
              </p>
              <p className="text-sm text-[var(--color-brand-text)] font-medium bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] px-3 py-2 rounded-lg">
                {forecast.modelDetails?.name}
              </p>
            </div>

            {showModelDetails && (
              <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)]">
                    <p className="text-[10px] text-[var(--color-brand-muted)] uppercase mb-1">
                      Training Samples
                    </p>
                    <p className="text-sm text-[var(--color-brand-text)] font-medium">
                      {forecast.modelDetails?.trainingSamples}
                    </p>
                  </div>
                  <div className="p-3 bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)]">
                    <p className="text-[10px] text-[var(--color-brand-muted)] uppercase mb-1">
                      Validation
                    </p>
                    <p className="text-sm text-[var(--color-brand-text)] font-medium">
                      {forecast.modelDetails?.validationSamples} splits
                    </p>
                  </div>
                  <div className="p-3 bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)]">
                    <p className="text-[10px] text-[var(--color-brand-muted)] uppercase mb-1">
                      MAPE
                    </p>
                    <p className="text-sm text-[var(--color-brand-text)] font-medium">
                      {forecast.modelDetails?.mape}
                    </p>
                  </div>
                  <div className="p-3 bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)]">
                    <p className="text-[10px] text-[var(--color-brand-muted)] uppercase mb-1">
                      R² Score
                    </p>
                    <p className="text-sm text-[#21E6A8] font-medium">
                      {forecast.modelDetails?.r2}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-brand-muted)] pt-2 border-t border-[var(--color-brand-border)]">
                  <Clock className="w-3 h-3" /> Last refreshed{" "}
                  {new Date(
                    forecast.modelDetails?.lastRefresh || "",
                  ).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>

          {/* Scenario Planner */}
          <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 shadow-sm min-w-0 flex-1">
            <h2 className="text-lg font-heading font-semibold text-[var(--color-brand-text)] mb-1 flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-[var(--color-brand-primary)]" />{" "}
              Scenario Planner
            </h2>
            <p className="text-xs text-[var(--color-brand-muted)] mb-4">
              Simulate business changes instantly.
            </p>

            <div className="space-y-3">
              <ScenarioBtn
                label="Baseline Forecast"
                multiplier={1}
                current={scenarioMultiplier}
                set={setScenarioMultiplier}
              />
              <ScenarioBtn
                label="Increase Marketing (+10%)"
                multiplier={1.1}
                current={scenarioMultiplier}
                set={setScenarioMultiplier}
              />
              <ScenarioBtn
                label="Holiday Season Surge (+25%)"
                multiplier={1.25}
                current={scenarioMultiplier}
                set={setScenarioMultiplier}
              />
              <ScenarioBtn
                label="Supply Chain Disruption (-15%)"
                multiplier={0.85}
                current={scenarioMultiplier}
                set={setScenarioMultiplier}
              />

              <div className="pt-2">
                <label className="text-xs text-[var(--color-brand-muted)] mb-2 block">
                  Custom Multiplier: {Math.round(scenarioMultiplier * 100)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={scenarioMultiplier}
                  onChange={(e) =>
                    setScenarioMultiplier(parseFloat(e.target.value))
                  }
                  className="w-full accent-[var(--color-brand-primary)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executive Summary */}
        <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden group min-w-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand-primary)]/5 blur-[40px] -mr-10 -mt-10 pointer-events-none group-hover:bg-[var(--color-brand-primary)]/10 transition-colors"></div>

          <h2 className="text-lg font-heading font-semibold text-[var(--color-brand-text)] mb-4 relative z-10 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[var(--color-brand-primary)]" />{" "}
            Executive Outlook
          </h2>

          <div className="space-y-4 relative z-10">
            <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] p-4 rounded-xl">
              <h4 className="text-xs uppercase text-[var(--color-brand-muted)] font-semibold mb-1">
                Revenue Outlook
              </h4>
              <p className="text-sm text-[var(--color-brand-text)] leading-relaxed">
                Based on historical data, revenue is projected to{" "}
                {currentExpectedGrowth > 0 ? "grow" : "contract"} by{" "}
                {Math.abs(currentExpectedGrowth).toFixed(1)}%.
                {forecast.confidence > 80
                  ? " The trend is highly stable and predictable."
                  : " Volatility detected in recent periods lowers confidence."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] p-4 rounded-xl">
                <h4 className="text-xs uppercase text-[var(--color-brand-muted)] font-semibold mb-1">
                  Customer Outlook
                </h4>
                <p className="text-sm text-[var(--color-brand-text)] leading-relaxed">
                  Expect ~{formatNumber(currentExpectedCustomers)} active
                  customers during the forecast window.
                </p>
              </div>
              {forecast.risks && forecast.risks.length > 0 && (
                <div className="bg-[#F43F5E]/5 border border-[#F43F5E]/20 p-4 rounded-xl">
                  <h4 className="text-xs uppercase text-[#F43F5E] font-semibold mb-1">
                    Risk Outlook
                  </h4>
                  <p className="text-sm text-[var(--color-brand-text)] leading-relaxed">
                    {forecast.risks[0].name} may impact projections.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/5">
              <h4 className="text-xs uppercase text-[var(--color-brand-primary)] font-semibold mb-2 flex items-center gap-1">
                <Play className="w-3 h-3" /> Recommended Next Action
              </h4>
              <p className="text-sm text-[var(--color-brand-text)]">
                {forecast.alerts && forecast.alerts.length > 0
                  ? forecast.alerts[0].recommendation
                  : "Maintain current inventory and marketing levels, model shows stable organic growth."}
              </p>
            </div>
          </div>
        </div>

        {/* Explain Prediction & Confidence Factors */}
        <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
          <h2 className="text-lg font-heading font-semibold text-[var(--color-brand-text)] mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-[var(--color-brand-primary)]" />{" "}
            Explain Prediction
          </h2>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-[var(--color-brand-muted)] mb-3">
                Top Influencing Variables:
              </p>
              <div className="space-y-3">
                {forecast.explanation?.topVariables.map(
                  (v: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--color-brand-text)] font-medium">{v.name}</span>
                        <span className="text-[var(--color-brand-primary)]">
                          {v.weight}% Weight
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-brand-bg)] rounded-full h-1.5 border border-[var(--color-brand-border)]">
                        <div
                          className="bg-[var(--color-brand-primary)] h-1.5 rounded-full"
                          style={{ width: `${v.weight}%` }}
                        ></div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)]">
                <h4 className="text-[10px] uppercase text-[var(--color-brand-muted)] font-semibold mb-1">
                  Historical Influence
                </h4>
                <p className="text-xs text-[var(--color-brand-text)]">
                  {forecast.explanation?.historicalInfluence}
                </p>
              </div>
              <div className="p-3 bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)]">
                <h4 className="text-[10px] uppercase text-[var(--color-brand-muted)] font-semibold mb-1">
                  Seasonality
                </h4>
                <p className="text-xs text-[var(--color-brand-text)]">
                  {forecast.explanation?.seasonality}
                </p>
              </div>
              <div className="p-3 bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)]">
                <h4 className="text-[10px] uppercase text-[var(--color-brand-muted)] font-semibold mb-1">
                  Trend
                </h4>
                <p className="text-xs text-[var(--color-brand-text)]">
                  {forecast.explanation?.trend}
                </p>
              </div>
              <div className="p-3 bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)]">
                <h4 className="text-[10px] uppercase text-[var(--color-brand-muted)] font-semibold mb-1">
                  Business Events
                </h4>
                <p className="text-xs text-[var(--color-brand-text)]">
                  {forecast.explanation?.businessEvents}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Comparison Table */}
      <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-6 shadow-sm min-w-0 overflow-hidden">
        <h2 className="text-lg font-heading font-semibold text-[var(--color-brand-text)] mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-[var(--color-brand-primary)]" />{" "}
          Forecast Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-brand-border)] text-[var(--color-brand-muted)] text-xs uppercase tracking-wider">
                <th className="p-3 font-semibold">Metric</th>
                <th className="p-3 font-semibold">Historical Average</th>
                <th className="p-3 font-semibold">Forecast Period</th>
                <th className="p-3 font-semibold text-right">Difference</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <ComparisonRow
                label="Revenue"
                current={formatCurrency(forecast.comparison?.currentRevenue)}
                forecast={formatCurrency(currentPredictedRevenue)}
                diff={
                  currentPredictedRevenue -
                  (forecast.comparison?.currentRevenue || 0)
                }
                isCurrency
              />
              <ComparisonRow
                label="Orders"
                current={formatNumber(forecast.comparison?.currentOrders)}
                forecast={formatNumber(currentPredictedOrders)}
                diff={
                  currentPredictedOrders -
                  (forecast.comparison?.currentOrders || 0)
                }
              />
              <ComparisonRow
                label="Customers"
                current={formatNumber(forecast.comparison?.currentCustomers)}
                forecast={formatNumber(currentExpectedCustomers)}
                diff={
                  currentExpectedCustomers -
                  (forecast.comparison?.currentCustomers || 0)
                }
              />
              <ComparisonRow
                label="AOV"
                current={formatCurrency(forecast.comparison?.currentAOV)}
                forecast={formatCurrency(forecast.comparison?.forecastAOV)}
                diff={
                  (forecast.comparison?.forecastAOV || 0) -
                  (forecast.comparison?.currentAOV || 0)
                }
                isCurrency
              />
              
            </tbody>
          </table>
        </div>
      </div>

      {/* Drivers & Risks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Drivers */}
        <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
          <h2 className="text-lg font-heading font-semibold text-[var(--color-brand-text)] mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--color-brand-primary)]" />{" "}
            Forecast Drivers
          </h2>
          <div className="space-y-4">
            {forecast.drivers && forecast.drivers.length > 0 ? (
              forecast.drivers.map((driver: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-brand-text)]">
                        {driver.name}
                      </p>
                      <p className="text-xs text-[var(--color-brand-muted)]">
                        {driver.history}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--color-brand-primary)]">
                        {driver.contribution}% impact
                      </p>
                      <p className="text-[10px] text-[var(--color-brand-muted)] uppercase">
                        Conf: {driver.confidence}%
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[var(--color-brand-border)]">
                    <p className="text-xs text-[var(--color-brand-text)]/80">
                      {driver.explanation}
                    </p>
                    <p className="text-xs text-[var(--color-brand-primary)] mt-1 font-medium">
                      {driver.metric}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-brand-muted)] text-center py-4">
                No distinct drivers identified.
              </p>
            )}
          </div>
        </div>

        {/* Risks */}
        <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
          <h2 className="text-lg font-heading font-semibold text-[var(--color-brand-text)] mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FFBD2E]" /> Forecast Risks
          </h2>
          <div className="space-y-4">
            {forecast.risks && forecast.risks.length > 0 ? (
              forecast.risks.map((risk: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-[var(--color-brand-text)]">
                      {risk.name}
                    </p>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${risk.severity === "High" ? "bg-[#F43F5E]/10 text-[#F43F5E] border border-[#F43F5E]/20" : "bg-[#FFBD2E]/10 text-[#FFBD2E] border border-[#FFBD2E]/20"}`}
                    >
                      {risk.severity} Risk
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-[var(--color-brand-muted)]">
                      Probability:{" "}
                      <span className="text-[var(--color-brand-text)]">{risk.probability}</span>
                    </div>
                    <div className="text-[var(--color-brand-muted)]">
                      Affected:{" "}
                      <span className="text-[var(--color-brand-text)]">{risk.affected}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-brand-muted)] border-l-2 border-[var(--color-brand-border)] pl-2 py-1">
                    {risk.impact}
                  </p>
                  <div className="pt-2 border-t border-[var(--color-brand-border)] flex items-center justify-between">
                    <p className="text-xs text-[#21E6A8] font-medium flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> {risk.mitigation}
                    </p>
                    <span className="text-[10px] text-[var(--color-brand-muted)]">
                      Recovery: {risk.recovery}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-brand-muted)] text-center py-4">
                No major risks identified.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  isGrowth,
  isPositive,
  icon: Icon,
  hideArrow,
}: any) {
  return (
    <div className="bg-[var(--color-brand-card)] border border-[var(--color-brand-border)] rounded-3xl p-5 shadow-sm hover:border-[var(--color-brand-primary)]/30 transition-colors group h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-text)] transition-colors">
          {title}
        </span>
        <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-bg)] flex items-center justify-center border border-[var(--color-brand-border)] group-hover:border-[var(--color-brand-primary)]/50 transition-colors">
          <Icon className="w-4 h-4 text-[var(--color-brand-primary)]" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-heading font-bold text-[var(--color-brand-text)] tracking-tight">
          {value}
        </span>
        {!hideArrow && (
          <div
            className={`flex items-center gap-1 text-xs font-medium w-fit px-1.5 py-0.5 rounded bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] ${isPositive ? "text-[var(--color-brand-primary)]" : "text-[#F43F5E]"}`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {isGrowth ? `${Math.abs(change).toFixed(1)}%` : Math.abs(change)}
          </div>
        )}
      </div>
    </div>
  );
}

function ScenarioBtn({ label, multiplier, current, set }: any) {
  const isActive = current === multiplier;
  return (
    <button
      onClick={() => set(multiplier)}
      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${isActive ? "bg-[var(--color-brand-primary)]/10 border-[var(--color-brand-primary)]/50" : "bg-[var(--color-brand-bg)] border-[var(--color-brand-border)] hover:border-white/20"}`}
    >
      <span
        className={`text-sm font-medium ${isActive ? "text-[var(--color-brand-primary)]" : "text-[var(--color-brand-text)]"}`}
      >
        {label}
      </span>
      {isActive && (
        <div className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)] shadow-[0_0_8px_var(--color-brand-primary)]"></div>
      )}
    </button>
  );
}

function ComparisonRow({
  label,
  current,
  forecast,
  diff,
  isCurrency,
  isPercent,
}: any) {
  const { formatCurrency } = useCurrency();
  const isPositive = diff >= 0;
  return (
    <tr className="border-b border-[var(--color-brand-border)] last:border-0 hover:bg-[var(--color-brand-bg)]/50 transition-colors">
      <td className="p-3 font-medium text-[var(--color-brand-text)]">{label}</td>
      <td className="p-3 text-[var(--color-brand-muted)]">{current}</td>
      <td className="p-3 text-[var(--color-brand-text)] font-medium">{forecast}</td>
      <td className="p-3 text-right">
        <div
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] ${isPositive ? "text-[var(--color-brand-primary)]" : "text-[#F43F5E]"}`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {isPercent
            ? `${Math.abs(diff).toFixed(1)}%`
            : isCurrency
              ? formatCurrency(Math.abs(diff))
              : formatNumber(Math.abs(diff))}
        </div>
      </td>
    </tr>
  );
}
