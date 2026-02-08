/**
 * Controlled amenity vocabulary for directory filtering.
 * Maps free-form amenity strings from Google Places to a normalized set.
 */

export interface NormalizedAmenity {
  slug: string;
  label: string;
}

/**
 * Canonical list of normalized amenities used in directory filters.
 */
export const NORMALIZED_AMENITIES: NormalizedAmenity[] = [
  { slug: "wheelchair-accessible", label: "Wheelchair Accessible" },
  { slug: "telehealth", label: "Telehealth Available" },
  { slug: "parking", label: "Parking Available" },
  { slug: "accepts-new-patients", label: "Accepts New Patients" },
  { slug: "online-booking", label: "Online Booking" },
  { slug: "same-day-appointments", label: "Same-Day Appointments" },
  { slug: "multilingual", label: "Multilingual Staff" },
  { slug: "evening-hours", label: "Evening Hours" },
  { slug: "weekend-hours", label: "Weekend Hours" },
  { slug: "free-consultation", label: "Free Consultation" },
  { slug: "accepts-walk-ins", label: "Accepts Walk-Ins" },
  { slug: "veteran-services", label: "Veteran Services" },
];

/**
 * Map from common free-form amenity substrings to normalized slugs.
 * Case-insensitive matching during normalization.
 */
const AMENITY_MAPPING: Record<string, string> = {
  // Wheelchair / accessibility
  "wheelchair": "wheelchair-accessible",
  "accessible": "wheelchair-accessible",
  "handicap": "wheelchair-accessible",
  "ada": "wheelchair-accessible",
  "disability": "wheelchair-accessible",
  "mobility": "wheelchair-accessible",

  // Telehealth
  "telehealth": "telehealth",
  "telemedicine": "telehealth",
  "virtual": "telehealth",
  "video visit": "telehealth",
  "remote": "telehealth",
  "online visit": "telehealth",
  "video consult": "telehealth",

  // Parking
  "parking": "parking",
  "garage": "parking",
  "valet": "parking",

  // New patients
  "new patient": "accepts-new-patients",
  "accepting patient": "accepts-new-patients",
  "accepting new": "accepts-new-patients",

  // Online booking
  "online booking": "online-booking",
  "book online": "online-booking",
  "online appointment": "online-booking",
  "schedule online": "online-booking",
  "online scheduling": "online-booking",

  // Same-day
  "same day": "same-day-appointments",
  "same-day": "same-day-appointments",
  "walk in": "accepts-walk-ins",
  "walk-in": "accepts-walk-ins",
  "walkin": "accepts-walk-ins",

  // Multilingual
  "spanish": "multilingual",
  "multilingual": "multilingual",
  "bilingual": "multilingual",
  "interpreter": "multilingual",
  "language": "multilingual",

  // Evening hours
  "evening": "evening-hours",
  "after hours": "evening-hours",
  "late hours": "evening-hours",

  // Weekend hours
  "weekend": "weekend-hours",
  "saturday": "weekend-hours",
  "sunday": "weekend-hours",

  // Free consultation
  "free consult": "free-consultation",
  "complimentary": "free-consultation",
  "no cost consult": "free-consultation",

  // Veteran services
  "veteran": "veteran-services",
  "va ": "veteran-services",
  "military": "veteran-services",
};

/**
 * Normalize a raw amenity string to matching canonical slugs.
 * Returns an array since one raw string may match multiple categories.
 */
export function normalizeAmenity(raw: string): string[] {
  const lower = raw.toLowerCase().trim();
  const matches = new Set<string>();

  for (const [keyword, slug] of Object.entries(AMENITY_MAPPING)) {
    if (lower.includes(keyword)) {
      matches.add(slug);
    }
  }

  return Array.from(matches);
}

/**
 * Normalize an array of raw amenities to a deduplicated set of canonical slugs.
 */
export function normalizeAmenities(raw: string[]): string[] {
  const normalized = new Set<string>();
  for (const amenity of raw) {
    for (const slug of normalizeAmenity(amenity)) {
      normalized.add(slug);
    }
  }
  return Array.from(normalized).sort();
}

/**
 * Get the display label for a normalized amenity slug.
 */
export function getAmenityLabel(slug: string): string {
  return NORMALIZED_AMENITIES.find((a) => a.slug === slug)?.label ?? slug;
}
