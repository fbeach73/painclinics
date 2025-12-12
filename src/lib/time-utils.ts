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
 * Handles formats: "8:00 AM", "8AM", "8:00AM", "5:00 PM", "5PM", "17:00",
 * "8 a.m.", "5 p.m.", "8:00 a.m.", "5:00 p.m."
 *
 * @param time - Time string in various formats
 * @param inferPeriod - Optional period (AM/PM) to use when not specified in time string
 * @returns Time string in HH:MM format (24-hour)
 */
function convertTo24Hour(time: string, inferPeriod?: "AM" | "PM"): string {
  // Normalize a.m./p.m. to AM/PM for consistent parsing
  const normalized = time.replace(/a\.m\./gi, "AM").replace(/p\.m\./gi, "PM");

  // Check if AM/PM is present
  const hasAmPm = /[aApP][mM]/i.test(normalized);

  // If no AM/PM and we have an inferred period, add it
  if (!hasAmPm && inferPeriod) {
    const match = normalized.match(/(\d{1,2}):?(\d{2})?/);
    if (!match) return "00:00";
    let hours = parseInt(match[1] ?? "0", 10);
    const minutes = parseInt(match[2] ?? "0", 10);

    // Convert to 24-hour using inferred period
    if (inferPeriod === "PM" && hours !== 12) {
      hours += 12;
    } else if (inferPeriod === "AM" && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  // If no AM/PM and no inferred period, return as-is (assume 24-hour)
  if (!hasAmPm) {
    const match = normalized.match(/(\d{1,2}):?(\d{2})?/);
    if (!match) return "00:00";
    const hours = parseInt(match[1] ?? "0", 10);
    const minutes = parseInt(match[2] ?? "0", 10);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  // Parse 12-hour format with AM/PM
  const match = normalized.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
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
 * Handles various formats:
 * - Standard: "8:00 AM - 5:00 PM", "8AM-5PM", "8:00AM-5:00PM"
 * - With dots: "8 a.m.-5 p.m.", "8:00 a.m.-5:00 p.m."
 * - Open 24 hours: "Open 24 hours", "24 hours"
 * - Split hours (lunch break): "8 a.m.-12 p.m., 1-5 p.m." -> uses first range
 * - Missing AM/PM on first time: "2-6 p.m." -> infers PM from second time
 * Converts all times to 24-hour format (HH:MM).
 *
 * @param timeStr - Time range string
 * @returns TimeRange object with 24-hour times, or null if closed/invalid
 */
export function parseTimeRange(timeStr: string): TimeRange | null {
  if (!timeStr || timeStr.toLowerCase() === "closed") {
    return null;
  }

  const lowerStr = timeStr.toLowerCase();

  // Handle "Open 24 hours" or "24 hours"
  if (lowerStr.includes("24 hour") || lowerStr === "open 24 hours") {
    return { open: "00:00", close: "23:59" };
  }

  // Handle split hours like "8 a.m.-12 p.m., 1-5 p.m." - use the full range
  // Extract the first open time and last close time
  if (timeStr.includes(",")) {
    const segments = timeStr.split(",").map((s) => s.trim());
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    if (segments.length >= 2 && firstSegment && lastSegment) {
      // Parse first segment for open time
      const firstParts = firstSegment.split(/[-–]/).map((t) => t.trim());
      // Parse last segment for close time
      const lastParts = lastSegment.split(/[-–]/).map((t) => t.trim());

      if (firstParts[0] && lastParts.length > 0) {
        const openTime = firstParts[0];
        const closeTime = lastParts[lastParts.length - 1];

        if (openTime && closeTime) {
          // Infer period from close time if open time lacks AM/PM
          const closePeriod = /p\.?m\.?/i.test(closeTime) ? "PM" : /a\.?m\.?/i.test(closeTime) ? "AM" : undefined;
          // For morning open times (before noon), assume AM
          const openPeriod = /a\.?m\.?/i.test(openTime) ? "AM" : /p\.?m\.?/i.test(openTime) ? "PM" : "AM";

          return {
            open: convertTo24Hour(openTime, openPeriod === "AM" || openPeriod === "PM" ? undefined : "AM"),
            close: convertTo24Hour(closeTime, closePeriod),
          };
        }
      }
    }
  }

  const parts = timeStr
    .split(/[-–]/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  // Check if the close time has AM/PM but open time doesn't
  // e.g., "2-6 p.m." should be parsed as "2 PM - 6 PM"
  const openHasAmPm = /[aApP]\.?[mM]\.?/i.test(parts[0]);
  const closeHasAmPm = /[aApP]\.?[mM]\.?/i.test(parts[1]);

  if (!openHasAmPm && closeHasAmPm) {
    // Infer the period from the close time
    const closePeriod = /p\.?m\.?/i.test(parts[1]) ? "PM" : "AM";
    return {
      open: convertTo24Hour(parts[0], closePeriod),
      close: convertTo24Hour(parts[1]),
    };
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
