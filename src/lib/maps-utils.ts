/**
 * Build Google Maps directions URL for an address.
 * @param address - Formatted address string
 * @returns Google Maps directions URL
 */
export function buildGoogleMapsDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}
