/**
 * Safely parse a JSON string, returning null on failure
 */
export function safeParseJSON<T>(value: string | undefined | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Safely parse an integer, returning null on failure
 */
export function safeParseInt(value: string | undefined | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Safely parse a float, returning null on failure
 */
export function safeParseFloat(value: string | undefined | null): number | null {
  if (!value) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Convert empty strings to null
 */
export function emptyToNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value;
}
