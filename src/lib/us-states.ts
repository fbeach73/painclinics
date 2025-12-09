/**
 * US states mapping: Full name to abbreviation
 */
export const US_STATES: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
};

/**
 * Reverse mapping: Abbreviation to full name
 */
export const US_STATES_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATES).map(([name, abbr]) => [abbr, name])
);

/**
 * Get state abbreviation from full state name
 * @param stateName - Full state name (e.g., "California")
 * @returns State abbreviation (e.g., "CA") or first 2 characters if not found
 */
export function getStateAbbreviation(stateName: string): string {
  if (!stateName) return "";
  const trimmed = stateName.trim();
  // If already an abbreviation, return as-is
  if (trimmed.length === 2 && trimmed === trimmed.toUpperCase()) {
    return trimmed;
  }
  return US_STATES[trimmed] || trimmed.substring(0, 2).toUpperCase();
}

/**
 * Get full state name from abbreviation
 * @param abbreviation - State abbreviation (e.g., "CA")
 * @returns Full state name (e.g., "California") or the input if not found
 */
export function getStateName(abbreviation: string): string {
  if (!abbreviation) return "";
  const trimmed = abbreviation.trim().toUpperCase();
  return US_STATES_REVERSE[trimmed] || abbreviation;
}
