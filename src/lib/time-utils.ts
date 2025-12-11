import type { OperatingHours } from "@/types/clinic";

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
 * Convert a 12-hour time string to 24-hour format.
 * Handles formats: "8:00 AM", "8AM", "8:00AM", "5:00 PM", "5PM", "17:00"
 *
 * @param time - Time string in various formats
 * @returns Time string in HH:MM format (24-hour)
 */
function convertTo24Hour(time: string): string {
  // If already in 24-hour format (no AM/PM), return as-is with padding
  if (!/[aApP][mM]/.test(time)) {
    const match = time.match(/(\d{1,2}):?(\d{2})?/);
    if (!match) return "00:00";
    const hours = parseInt(match[1] ?? "0", 10);
    const minutes = parseInt(match[2] ?? "0", 10);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  // Parse 12-hour format with AM/PM
  const match = time.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
  if (!match) return "00:00";

  let hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const period = match[3]?.toUpperCase();

  // Convert to 24-hour
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Parse a time range string like "8:00 AM - 5:00 PM" into open/close times.
 * Handles various formats: "8:00 AM - 5:00 PM", "8AM-5PM", "8:00AM-5:00PM"
 * Converts all times to 24-hour format (HH:MM).
 *
 * @param timeStr - Time range string
 * @returns TimeRange object with 24-hour times, or null if closed/invalid
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

  return {
    open: convertTo24Hour(parts[0]),
    close: convertTo24Hour(parts[1]),
  };
}

export interface OpenStatus {
  isOpen: boolean;
  statusText: string;
}

/**
 * Determine if a clinic is currently open based on operating hours.
 *
 * @param hours - OperatingHours object with hours for each day
 * @returns Object with isOpen boolean and descriptive statusText
 */
export function isCurrentlyOpen(hours: OperatingHours): OpenStatus {
  const now = new Date();
  const dayNames: (keyof OperatingHours)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDay = dayNames[now.getDay()]!;
  const dayHours = hours[currentDay];

  if (dayHours.closed) {
    return { isOpen: false, statusText: "Closed today" };
  }

  // Convert current time to HHMM number for comparison
  const currentTime = now.getHours() * 100 + now.getMinutes();

  // Convert 24-hour time strings (HH:MM) to HHMM numbers
  const openTime = parseInt(dayHours.open.replace(":", ""), 10);
  const closeTime = parseInt(dayHours.close.replace(":", ""), 10);

  if (currentTime >= openTime && currentTime < closeTime) {
    return { isOpen: true, statusText: `Open until ${formatTime(dayHours.close)}` };
  }

  if (currentTime < openTime) {
    return { isOpen: false, statusText: `Opens at ${formatTime(dayHours.open)}` };
  }

  return { isOpen: false, statusText: "Closed" };
}
