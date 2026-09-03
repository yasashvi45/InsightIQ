import { Dataset } from "../context/DataContext";
import {
  calculateUniversalMetrics,
  computeUniversalForecast,
  detectUniversalColumns,
  safeParseDate,
  calculateComparison,
  UniversalMetrics,
  DatasetCapabilities,
  ColumnMapping
} from "./universalEngine";
import { parseMonetaryValue, parseNumeric, convertCurrency } from "./currencyService";

export {
  calculateUniversalMetrics,
  computeUniversalForecast,
  detectUniversalColumns,
  safeParseDate,
  calculateComparison,
  parseMonetaryValue,
  parseNumeric,
  convertCurrency
};

export type { UniversalMetrics, DatasetCapabilities, ColumnMapping };

export function detectSchema(columns: string[]) {
  if (!columns || columns.length === 0) {
    return {
      revenue: undefined,
      date: undefined,
      product: undefined,
      customer: undefined,
      category: undefined,
      payment: undefined,
      region: undefined,
      inventory: undefined,
      marketing: undefined
    };
  }
  const detected = detectUniversalColumns(columns);
  return {
    revenue: detected.revenue,
    date: detected.date,
    product: detected.product,
    customer: detected.customer,
    category: detected.category,
    payment: detected.payment,
    region: detected.region || detected.country,
    inventory: detected.quantity,
    marketing: detected.traffic
  };
}

/**
 * Backward-compatible computeMetrics helper which uses the single source of truth
 * calculateUniversalMetrics engine.
 */
export function computeMetrics(dataset: Dataset | null, dateFilter: string = 'All Time', targetCurrency: string = 'USD'): UniversalMetrics {
  if (!dataset || (!dataset.data && !dataset.rawData)) {
    return calculateUniversalMetrics([], [], dateFilter, targetCurrency);
  }
  const rawRows = dataset.rawData && dataset.rawData.length > 0 ? dataset.rawData : (dataset.data || []);
  const columns = dataset.columns || (rawRows.length > 0 ? Object.keys(rawRows[0]) : []);
  return calculateUniversalMetrics(rawRows, columns, dateFilter, targetCurrency, dataset);
}

/**
 * Backward-compatible computeForecast helper which uses the universal forecast engine
 */
export function computeForecast(dataset: Dataset | null, timeframe: string = 'Monthly', scenarioMultiplier: number = 1.0) {
  return computeUniversalForecast(dataset, timeframe, scenarioMultiplier);
}

/**
 * Format numbers with thousand separators
 */
export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) return "0";
  const safe = Object.is(value, -0) ? 0 : value;
  return new Intl.NumberFormat("en-US").format(safe);
}

/**
 * Format compact numbers (e.g. 1.2M, 50K)
 */
export function formatCompactNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) return "0";
  const safe = Object.is(value, -0) ? 0 : value;
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(safe);
}
