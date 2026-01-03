import Papa from "papaparse";

/**
 * Check if a value looks like an owner JSON object from Outscraper export
 * These have the pattern: {"id":"...","name":"... (Owner)","link":"..."}
 */
function isOwnerJson(value: string): boolean {
  if (!value || !value.startsWith('{"id":')) return false;
  return value.includes('(Owner)') || value.includes('Owner"') || value.includes('"name":');
}

/**
 * Check if a value is empty or a simple empty array
 */
function isEmptyValue(value: string): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  return trimmed === '' || trimmed === '[]';
}

/**
 * Attempt to repair a malformed CSV row where columns are shifted.
 *
 * Common pattern: The "owner" JSON field gets exported in the wrong column,
 * with empty columns before it, causing all subsequent data to shift.
 *
 * Strategy:
 * 1. Find owner JSON by its distinctive pattern
 * 2. Detect if it's in the wrong position (not in "owner" column)
 * 3. Remove extra empty columns to realign the data
 *
 * @param values - Array of column values from the parsed row
 * @param headers - Array of expected column headers
 * @returns Repaired row object, or null if repair not possible
 */
export function repairMalformedRow(
  values: string[],
  headers: string[]
): Record<string, string> | null {
  const expectedCols = headers.length;
  const actualCols = values.length;
  const extraCols = actualCols - expectedCols;

  // Only attempt repair for rows with EXTRA columns
  // Rows with MISSING columns likely have unclosed quotes - too hard to repair
  if (extraCols <= 0 || extraCols > 10) {
    return null;
  }

  // Find the index of the "owner" column in headers
  const ownerColIndex = headers.indexOf('owner');
  if (ownerColIndex === -1) {
    // No owner column in headers, can't use this repair strategy
    return tryJsonMergeRepair(values, headers, expectedCols);
  }

  // Look for the owner JSON in the values
  let ownerJsonIndex = -1;
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (val && isOwnerJson(val)) {
      ownerJsonIndex = i;
      break;
    }
  }

  if (ownerJsonIndex === -1) {
    // No owner JSON found, try the JSON merge approach
    return tryJsonMergeRepair(values, headers, expectedCols);
  }

  // Check if owner JSON is in the wrong position
  if (ownerJsonIndex === ownerColIndex) {
    // Owner is in correct position, issue might be elsewhere
    return tryJsonMergeRepair(values, headers, expectedCols);
  }

  // Owner JSON is shifted - check if columns before it are empty
  // Count how many empty columns are between expected and actual position
  let emptyCount = 0;
  for (let i = ownerColIndex; i < ownerJsonIndex; i++) {
    const val = values[i];
    if (val === undefined || isEmptyValue(val)) {
      emptyCount++;
    }
  }

  // We need at least some empty columns to remove
  if (emptyCount === 0) {
    return tryJsonMergeRepair(values, headers, expectedCols);
  }

  // Try removing empty columns to fix the alignment
  // Strategy: Skip exactly 'extraCols' empty columns between expected and actual owner position
  const repairedValues: string[] = [];

  // Copy columns before owner (indices 0 to ownerColIndex-1)
  for (let i = 0; i < ownerColIndex; i++) {
    repairedValues.push(values[i] || '');
  }

  // Skip exactly 'extraCols' empty columns, then copy the rest
  let skipped = 0;
  for (let i = ownerColIndex; i < values.length; i++) {
    const val = values[i];
    if (skipped < extraCols && (val === undefined || isEmptyValue(val))) {
      // Skip this empty column
      skipped++;
    } else {
      // Keep this column
      repairedValues.push(val || '');
    }
  }

  // Verify we now have the correct number of columns
  if (repairedValues.length !== expectedCols) {
    // Still doesn't work, try JSON merge approach
    return tryJsonMergeRepair(values, headers, expectedCols);
  }

  // Build the row object
  const row: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (header) {
      row[header] = repairedValues[i] || '';
    }
  }

  return row;
}

/**
 * Fallback repair strategy: Try to merge split JSON fields
 */
function tryJsonMergeRepair(
  values: string[],
  headers: string[],
  expectedCols: number
): Record<string, string> | null {
  // Helper to count JSON delimiters
  const countDelimiters = (s: string) => ({
    openBraces: (s.match(/\{/g) || []).length,
    closeBraces: (s.match(/\}/g) || []).length,
    openBrackets: (s.match(/\[/g) || []).length,
    closeBrackets: (s.match(/\]/g) || []).length,
  });

  const isJsonComplete = (s: string) => {
    const d = countDelimiters(s);
    return d.openBraces <= d.closeBraces && d.openBrackets <= d.closeBrackets;
  };

  const looksLikeJsonStart = (s: string) =>
    s.startsWith('{"') || s.startsWith('[{"') || s.startsWith('[{') ||
    s.startsWith('{"id"') || (s.startsWith('[') && s.includes('"'));

  // Merge split JSON fields
  const mergedValues: string[] = [];
  let i = 0;

  while (i < values.length) {
    const val = values[i] || '';

    // Check if this looks like incomplete JSON
    if (looksLikeJsonStart(val) && !isJsonComplete(val)) {
      // Merge with subsequent columns until JSON is complete
      let merged = val;
      let j = i + 1;

      while (j < values.length && !isJsonComplete(merged)) {
        merged += ',' + (values[j] || '');
        j++;
      }

      mergedValues.push(merged);
      i = j;
    } else {
      mergedValues.push(val);
      i++;
    }
  }

  if (mergedValues.length !== expectedCols) {
    return null;
  }

  // Build the row object
  const row: Record<string, string> = {};
  for (let k = 0; k < headers.length; k++) {
    const header = headers[k];
    if (header) {
      row[header] = mergedValues[k] || '';
    }
  }

  return row;
}

/**
 * Parse CSV with automatic repair of malformed rows
 * Attempts to fix rows where JSON fields have unquoted commas
 */
export function parseCSVWithRepair<T extends Record<string, unknown>>(
  content: string
): { data: T[]; repaired: number; unfixable: number } {
  const cleanContent = content.replace(/^\uFEFF/, "");

  // First, parse without headers to get raw arrays
  const rawResult = Papa.parse(cleanContent, {
    header: false,
    skipEmptyLines: true,
  });

  if (rawResult.data.length < 2) {
    return { data: [], repaired: 0, unfixable: 0 };
  }

  const headers = (rawResult.data[0] as string[]).map((h) => h.trim());
  const expectedCols = headers.length;
  const rows = rawResult.data.slice(1) as string[][];

  const result: T[] = [];
  let repaired = 0;
  let unfixable = 0;

  for (const row of rows) {
    if (row.length === expectedCols) {
      // Normal row - build object directly
      const obj: Record<string, string> = {};
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (header) {
          obj[header] = row[i] || '';
        }
      }
      result.push(obj as T);
    } else if (row.length > expectedCols) {
      // Too many columns - attempt repair
      const repairedRow = repairMalformedRow(row, headers);
      if (repairedRow) {
        result.push(repairedRow as T);
        repaired++;
        console.warn(`Repaired malformed row: ${repairedRow.name || repairedRow.title || 'unknown'}`);
      } else {
        unfixable++;
        console.warn(`Could not repair row with ${row.length} columns (expected ${expectedCols})`);
      }
    } else {
      // Too few columns - likely unclosed quote, hard to repair
      unfixable++;
      console.warn(`Row has too few columns (${row.length} vs ${expectedCols}) - cannot repair`);
    }
  }

  return { data: result, repaired, unfixable };
}

/**
 * Parse a CSV string into an array of typed objects
 * Handles BOM (Byte Order Mark) automatically
 *
 * @param content - Raw CSV string content
 * @returns Array of parsed objects with headers as keys
 */
export function parseCSV<T extends Record<string, unknown>>(content: string): T[] {
  // Remove BOM if present (common in Excel exports)
  const cleanContent = content.replace(/^\uFEFF/, "");

  const result = Papa.parse<T>(cleanContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    dynamicTyping: false, // Keep all values as strings for consistent handling
  });

  if (result.errors.length > 0) {
    console.warn("CSV parsing warnings:", result.errors);
  }

  return result.data;
}

/**
 * Parse a CSV file from a File object
 * @param file - File object to parse
 * @returns Promise resolving to array of parsed objects
 */
export function parseCSVFile<T extends Record<string, unknown>>(
  file: File
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      dynamicTyping: false,
      complete: (result) => {
        if (result.errors.length > 0) {
          console.warn("CSV parsing warnings:", result.errors);
        }
        resolve(result.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Validate CSV headers match expected columns
 * @param content - Raw CSV content
 * @param requiredHeaders - Array of required header names
 * @returns Object with validation result and any missing headers
 */
export function validateCSVHeaders(
  content: string,
  requiredHeaders: string[]
): { valid: boolean; headers: string[]; missing: string[] } {
  const cleanContent = content.replace(/^\uFEFF/, "");
  const firstLine = cleanContent.split("\n")[0];

  if (!firstLine) {
    return { valid: false, headers: [], missing: requiredHeaders };
  }

  // Parse just the first line to get headers
  const result = Papa.parse(firstLine, { header: false });
  const headers = (result.data[0] as string[] | undefined)?.map((h) =>
    h.trim()
  ) || [];

  const missing = requiredHeaders.filter((h) => !headers.includes(h));

  return {
    valid: missing.length === 0,
    headers,
    missing,
  };
}

/**
 * Get a preview of the CSV data (first N rows)
 * @param content - Raw CSV content
 * @param rows - Number of rows to preview (default: 10)
 * @returns Array of preview objects and total row count
 */
export function previewCSV<T extends Record<string, unknown>>(
  content: string,
  rows: number = 10
): { preview: T[]; totalRows: number; headers: string[] } {
  const cleanContent = content.replace(/^\uFEFF/, "");

  const result = Papa.parse<T>(cleanContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    preview: rows,
  });

  // Count total rows (minus header)
  const allLines = cleanContent.split("\n").filter((line) => line.trim());
  const totalRows = Math.max(0, allLines.length - 1);

  const headers = result.meta.fields || [];

  return {
    preview: result.data,
    totalRows,
    headers,
  };
}
