/**
 * Distance calculation utilities using the Haversine formula.
 * Used to calculate distances between geographic coordinates.
 */

/**
 * Converts degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates the distance between two geographic points using the Haversine formula.
 * @param lat1 - Latitude of the first point
 * @param lng1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @param lng2 - Longitude of the second point
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats a distance in miles to a human-readable string.
 * @param miles - Distance in miles
 * @returns Formatted string (e.g., "2.5 mi" or "25 mi")
 */
export function formatDistance(miles: number): string {
  if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  }
  return `${Math.round(miles)} mi`;
}
