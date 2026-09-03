import { useMemo } from 'react';
import { Dataset } from '../context/DataContext';
import {
  calculateUniversalMetrics,
  detectUniversalColumns,
  safeParseDate,
  calculateComparison,
  UniversalMetrics,
  DatasetCapabilities
} from '../lib/universalEngine';

export { parseMonetaryValue, parseNumeric } from '../lib/currencyService';
export { safeParseDate, calculateComparison, detectUniversalColumns } from '../lib/universalEngine';

export function detectColumns(columns: string[]) {
  const detected = detectUniversalColumns(columns);
  return {
    value: detected.revenue,
    date: detected.date,
    country: detected.country,
    identity: detected.customer,
    order: detected.orderId,
    category: detected.category,
    product: detected.product,
    quantity: detected.quantity,
    traffic: detected.traffic,
    region: detected.region,
    payment: detected.payment
  };
}

export function useDashboardMetrics(dataset: Dataset | null, dateFilter: string, targetCurrency: string = 'USD'): UniversalMetrics {
  return useMemo(() => {
    if (!dataset || (!dataset.rawData && !dataset.data)) {
      return calculateUniversalMetrics([], [], dateFilter, targetCurrency);
    }

    const rawData = dataset.rawData && dataset.rawData.length > 0 ? dataset.rawData : (dataset.data || []);
    const columns = dataset.columns || (rawData.length > 0 ? Object.keys(rawData[0]) : []);

    return calculateUniversalMetrics(
      rawData,
      columns,
      dateFilter,
      targetCurrency,
      dataset
    );
  }, [dataset, dateFilter, targetCurrency]);
}
