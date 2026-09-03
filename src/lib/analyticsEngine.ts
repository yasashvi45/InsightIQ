export type AggregationType = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'DISTINCT_COUNT';

export interface Operations {
  metric?: string;
  agg?: AggregationType;
  groupBy?: string;
  sort?: 'ASC' | 'DESC';
  limit?: number;
}

export interface QueryResult {
  type: 'metric' | 'table' | 'chart' | 'error';
  value?: number | string;
  data?: any[];
  columns?: string[];
  error?: string;
}

function parseNumeric(val: any): number {
  if (typeof val === 'number') return val;
  if (val === null || val === undefined || val === '') return NaN;
  const str = String(val).replace(/[^0-9.-]+/g, '');
  if (str === '' || str === '-' || str === '.') return NaN;
  return parseFloat(str);
}

function normalize(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function findColumn(columns: string[], target: string): string | null {
  if (!target) return null;
  const nTarget = normalize(target);
  // exact match
  for (const c of columns) {
    if (normalize(c) === nTarget) return c;
  }
  // partial match
  for (const c of columns) {
    if (normalize(c).includes(nTarget) || nTarget.includes(normalize(c))) return c;
  }
  return null;
}

export function executeOperations(data: any[], columns: string[], ops: Operations): QueryResult {
  if (!data || data.length === 0) {
    return { type: 'error', error: 'No data to analyze.' };
  }

  const metricCol = ops.metric ? findColumn(columns, ops.metric) : null;
  const groupCol = ops.groupBy ? findColumn(columns, ops.groupBy) : null;

  if (ops.groupBy && !groupCol) {
    return { type: 'error', error: `Could not find column for grouping: ${ops.groupBy}` };
  }
  if (ops.metric && !metricCol && ops.agg !== 'COUNT') {
    return { type: 'error', error: `Could not find numeric column for metric: ${ops.metric}` };
  }

  // Case 1: Group By
  if (groupCol) {
    const groups: Record<string, number[]> = {};
    for (const row of data) {
      let g = row[groupCol];
      if (g === undefined || g === null || g === '') g = 'Unknown';
      if (!groups[g]) groups[g] = [];
      if (metricCol) {
        const val = parseNumeric(row[metricCol]);
        if (!isNaN(val)) groups[g].push(val);
      } else {
        groups[g].push(1); // just for count
      }
    }

    let results = Object.entries(groups).map(([key, vals]) => {
      let agValue = 0;
      if (ops.agg === 'SUM') agValue = vals.reduce((a, b) => a + b, 0);
      else if (ops.agg === 'AVG') agValue = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      else if (ops.agg === 'MAX') agValue = Math.max(...vals);
      else if (ops.agg === 'MIN') agValue = Math.min(...vals);
      else agValue = vals.length; // COUNT default

      return { [groupCol]: key, [metricCol || 'Count']: agValue };
    });

    const metricKey = metricCol || 'Count';

    // Sort
    if (ops.sort) {
      results.sort((a, b) => ops.sort === 'ASC' ? (a[metricKey] as number) - (b[metricKey] as number) : (b[metricKey] as number) - (a[metricKey] as number));
    } else {
      results.sort((a, b) => (b[metricKey] as number) - (a[metricKey] as number)); // default desc
    }

    // Limit
    if (ops.limit && ops.limit > 0) {
      results = results.slice(0, ops.limit);
    }

    return {
      type: 'chart',
      data: results,
      columns: [groupCol, metricKey]
    };
  }

  // Case 2: Single Metric
  if (metricCol || ops.agg === 'COUNT') {
    let vals: number[] = [];
    if (metricCol) {
      for (const row of data) {
        const val = parseNumeric(row[metricCol]);
        if (!isNaN(val)) vals.push(val);
      }
    } else {
      vals = new Array(data.length).fill(1);
    }

    let agValue = 0;
    if (ops.agg === 'SUM') agValue = vals.reduce((a, b) => a + b, 0);
    else if (ops.agg === 'AVG') agValue = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    else if (ops.agg === 'MAX') agValue = Math.max(...vals);
    else if (ops.agg === 'MIN') agValue = Math.min(...vals);
    else agValue = vals.length;

    return {
      type: 'metric',
      value: agValue
    };
  }

  return { type: 'error', error: 'Unrecognized operation' };
}
