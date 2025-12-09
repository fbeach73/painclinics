import Papa from "papaparse";

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
