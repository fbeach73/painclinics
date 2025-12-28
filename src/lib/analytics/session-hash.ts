/**
 * Session hash utility for unique visitor tracking
 * Creates a privacy-preserving hash for daily unique visitor identification
 */

/**
 * Generates a SHA-256 hash of the input string
 * @param input - The string to hash
 * @returns Hex string of the hash, truncated to 32 characters
 */
export async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex.slice(0, 32);
}

/**
 * Generates a session hash for a unique daily visitor
 * Combines fingerprint, IP, and date for privacy-preserving identification
 *
 * @param fingerprint - Client-generated fingerprint (UA, screen, timezone, etc.)
 * @param ipAddress - The visitor's IP address
 * @param date - The date for the session (defaults to today)
 * @returns A 32-character hash identifying the unique visitor for that day
 */
export async function generateSessionHash(
  fingerprint: string,
  ipAddress: string | null,
  date?: Date
): Promise<string> {
  const eventDate = date || new Date();
  const dateString = eventDate.toISOString().split("T")[0]; // YYYY-MM-DD

  // Combine components for hashing
  // Including date ensures the same visitor gets a new hash each day
  const components = [fingerprint, ipAddress || "unknown", dateString].join("|");

  return generateHash(components);
}

/**
 * Gets today's date in YYYY-MM-DD format
 * Uses UTC-04 (AST - Atlantic Standard Time) for consistent date boundaries
 * @returns Date string for event grouping
 */
export function getEventDate(date?: Date): string {
  const d = date || new Date();

  // Convert to UTC-04 (AST)
  // Subtract 4 hours from UTC to get AST time
  const AST_OFFSET_MS = -4 * 60 * 60 * 1000;
  const astDate = new Date(d.getTime() + AST_OFFSET_MS);

  // Extract YYYY-MM-DD from the adjusted date
  const year = astDate.getUTCFullYear();
  const month = String(astDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(astDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
