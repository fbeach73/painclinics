/**
 * Format 24-hour time string to 12-hour format with AM/PM.
 * @param time - Time string in HH:MM format
 * @returns Formatted time string (e.g., "9:00 AM")
 */
export function formatTime(time: string): string {
  const parts = time.split(':');
  const hours = parseInt(parts[0] ?? '0', 10);
  const minutes = parseInt(parts[1] ?? '0', 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export interface TimeRange {
  open: string;
  close: string;
}

/**
 * Parse a time range string like "8:00 AM - 5:00 PM" into open/close times.
 * Handles various formats: "8:00 AM - 5:00 PM", "8AM-5PM", "8:00AM-5:00PM"
 *
 * @param timeStr - Time range string
 * @returns TimeRange object or null if closed/invalid
 */
export function parseTimeRange(timeStr: string): TimeRange | null {
  if (!timeStr || timeStr.toLowerCase() === "closed") {
    return null;
  }

  const parts = timeStr
    .split(/[-–]/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  return { open: parts[0], close: parts[1] };
}
