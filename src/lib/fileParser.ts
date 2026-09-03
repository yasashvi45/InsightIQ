import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedDatasetResult {
  rows: any[];
  columns: string[];
  invalidRows: number;
  sheetNames?: string[];
  activeSheet?: string;
}

/**
 * Universal File Parser for CSV and Excel (.xlsx, .xls) files.
 * Cleans rows, detects headers, ignores completely empty rows,
 * and preserves proper string, number, and date representations.
 */
export async function parseUploadedFile(file: File): Promise<ParsedDatasetResult> {
  const fileNameLower = file.name.toLowerCase();
  const isExcel = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel');

  if (isExcel) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('The Excel workbook contains no readable worksheets.');
    }

    // Pick first non-empty worksheet
    let targetSheetName = workbook.SheetNames[0];
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      if (!sheet) continue;
      const testJson = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (testJson && testJson.length > 1) {
        targetSheetName = name;
        break;
      }
    }

    const worksheet = workbook.Sheets[targetSheetName];
    if (!worksheet) {
      throw new Error('Selected worksheet could not be parsed.');
    }

    const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });

    if (!rawJson || rawJson.length === 0) {
      throw new Error('The selected Excel worksheet contains no data rows.');
    }

    // Extract headers
    const rawColumns = Object.keys(rawJson[0] || {});
    const columns = rawColumns.map(c => String(c).trim()).filter(Boolean);

    // Filter out rows that are completely empty
    const validRows = rawJson.filter(row => {
      if (!row || typeof row !== 'object') return false;
      return Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
    });

    const invalidRows = Math.max(0, rawJson.length - validRows.length);

    return {
      rows: validRows,
      columns,
      invalidRows,
      sheetNames: workbook.SheetNames,
      activeSheet: targetSheetName
    };
  }

  // CSV Parsing
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          reject(new Error('The CSV file is empty or invalid.'));
          return;
        }

        const rawRows = results.data as any[];
        const validRows = rawRows.filter(row => {
          if (!row || typeof row !== 'object') return false;
          return Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
        });

        if (validRows.length === 0) {
          reject(new Error('No valid data rows found in the CSV file.'));
          return;
        }

        const columns = Object.keys(validRows[0]).map(c => String(c).trim()).filter(Boolean);

        resolve({
          rows: validRows,
          columns,
          invalidRows: results.errors.length + (rawRows.length - validRows.length)
        });
      },
      error: (error) => {
        reject(new Error(`CSV Parsing failed: ${error.message}`));
      }
    });
  });
}

/**
 * Parses binary or text buffers downloaded from storage / cloud
 */
export function parseDownloadedData(buffer: ArrayBuffer, fileName: string): ParsedDatasetResult {
  const fileNameLower = fileName.toLowerCase();
  const isExcel = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls');

  if (isExcel) {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    let targetSheetName = workbook.SheetNames[0];
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      if (!sheet) continue;
      const testJson = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (testJson && testJson.length > 1) {
        targetSheetName = name;
        break;
      }
    }

    const worksheet = workbook.Sheets[targetSheetName];
    const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
    const validRows = (rawJson || []).filter(row => {
      if (!row || typeof row !== 'object') return false;
      return Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
    });
    const columns = validRows.length > 0 ? Object.keys(validRows[0]).map(c => String(c).trim()).filter(Boolean) : [];

    return {
      rows: validRows,
      columns,
      invalidRows: Math.max(0, (rawJson?.length || 0) - validRows.length),
      sheetNames: workbook.SheetNames,
      activeSheet: targetSheetName
    };
  }

  // Parse CSV
  const csvText = new TextDecoder().decode(buffer);
  const results = Papa.parse(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy'
  });

  const rawRows = (results.data || []) as any[];
  const validRows = rawRows.filter(row => {
    if (!row || typeof row !== 'object') return false;
    return Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
  });
  const columns = validRows.length > 0 ? Object.keys(validRows[0]).map(c => String(c).trim()).filter(Boolean) : [];

  return {
    rows: validRows,
    columns,
    invalidRows: results.errors.length + (rawRows.length - validRows.length)
  };
}
