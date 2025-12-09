import type {
  Clinic,
  OperatingHours,
  DayHours,
  ServiceType,
  InsuranceType,
} from "@/types/clinic";
import type { ClinicRecord } from "./clinic-queries";
import type { ClinicHour } from "./clinic-transformer";

/**
 * Transform a database clinic record to the Clinic type used by frontend components.
 *
 * @param dbClinic - The raw database clinic record
 * @returns A Clinic object compatible with existing components
 */
export function transformDbClinicToType(dbClinic: ClinicRecord): Clinic {
  const email = dbClinic.emails?.[0];
  const website = dbClinic.website;

  return {
    id: dbClinic.id,
    name: dbClinic.title,
    slug: extractSlugFromPermalink(dbClinic.permalink),
    address: {
      street: dbClinic.streetAddress || "",
      city: dbClinic.city,
      state: dbClinic.stateAbbreviation || dbClinic.state,
      zipCode: dbClinic.postalCode,
      formatted: formatAddress(dbClinic),
    },
    coordinates: {
      lat: dbClinic.mapLatitude,
      lng: dbClinic.mapLongitude,
    },
    phone: dbClinic.phone || "",
    ...(email ? { email } : {}),
    ...(website ? { website } : {}),
    hours: transformClinicHours(dbClinic.clinicHours as ClinicHour[] | null),
    services: mapAmenitiesToServices(dbClinic.amenities),
    insuranceAccepted: [], // Insurance data not stored in current schema
    rating: dbClinic.rating || 0,
    reviewCount: dbClinic.reviewCount || 0,
    photos: dbClinic.clinicImageUrls || [],
    about: stripHtmlTags(dbClinic.content || ""),
    isVerified: true, // All imported clinics are considered verified
    isFeatured: false, // Featured status not stored in current schema
  };
}

/**
 * Extract the final slug segment from a permalink path.
 *
 * @param permalink - Full permalink path (e.g., "pain-management/clinic-name-al-35243")
 * @returns The slug portion (e.g., "clinic-name-al-35243")
 */
function extractSlugFromPermalink(permalink: string): string {
  const parts = permalink.split("/").filter(Boolean);
  return parts[parts.length - 1] || permalink;
}

/**
 * Format the address components into a single formatted string.
 *
 * @param clinic - The database clinic record
 * @returns Formatted address string
 */
function formatAddress(clinic: ClinicRecord): string {
  const parts = [
    clinic.streetAddress,
    clinic.city,
    `${clinic.stateAbbreviation || clinic.state} ${clinic.postalCode}`,
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * Transform clinic hours from database JSONB format to OperatingHours type.
 *
 * @param hours - Array of ClinicHour objects from database
 * @returns OperatingHours object with all days
 */
function transformClinicHours(hours: ClinicHour[] | null): OperatingHours {
  const defaultClosed: DayHours = { open: "", close: "", closed: true };

  const result: OperatingHours = {
    monday: { ...defaultClosed },
    tuesday: { ...defaultClosed },
    wednesday: { ...defaultClosed },
    thursday: { ...defaultClosed },
    friday: { ...defaultClosed },
    saturday: { ...defaultClosed },
    sunday: { ...defaultClosed },
  };

  if (!hours || !Array.isArray(hours)) {
    return result;
  }

  const dayMap: Record<string, keyof OperatingHours> = {
    Monday: "monday",
    Tuesday: "tuesday",
    Wednesday: "wednesday",
    Thursday: "thursday",
    Friday: "friday",
    Saturday: "saturday",
    Sunday: "sunday",
  };

  for (const { day, hours: timeStr } of hours) {
    const key = dayMap[day];
    if (!key) continue;

    if (!timeStr || timeStr === "Closed") {
      result[key] = { open: "", close: "", closed: true };
    } else {
      const parsed = parseTimeRange(timeStr);
      result[key] = {
        open: parsed.open,
        close: parsed.close,
        closed: false,
      };
    }
  }

  return result;
}

/**
 * Parse a time range string like "8:00 AM - 5:00 PM" into open/close times.
 *
 * @param timeStr - Time range string from database
 * @returns Object with open and close times
 */
function parseTimeRange(timeStr: string): { open: string; close: string } {
  // Handle various formats: "8:00 AM - 5:00 PM", "8AM-5PM", "8:00AM-5:00PM"
  const parts = timeStr
    .split(/[-–]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const openTime = parts[0];
  const closeTime = parts[1];

  if (openTime && closeTime) {
    return {
      open: openTime,
      close: closeTime,
    };
  }

  // If we can't parse it, return the original string as open time
  return { open: timeStr, close: "" };
}

/**
 * Map amenities array to ServiceType array.
 * Maps known amenities to their corresponding ServiceType values.
 *
 * @param amenities - Array of amenity strings from database
 * @returns Array of ServiceType values
 */
function mapAmenitiesToServices(amenities: string[] | null): ServiceType[] {
  if (!amenities || !Array.isArray(amenities)) {
    return [];
  }

  const amenityToService: Record<string, ServiceType> = {
    "injection therapy": "injection-therapy",
    "physical therapy": "physical-therapy",
    "medication management": "medication-management",
    "nerve blocks": "nerve-blocks",
    "spinal cord stimulation": "spinal-cord-stimulation",
    "regenerative medicine": "regenerative-medicine",
    acupuncture: "acupuncture",
    chiropractic: "chiropractic",
    "massage therapy": "massage-therapy",
    "psychological services": "psychological-services",
    // Additional common variations
    injections: "injection-therapy",
    "physical rehabilitation": "physical-therapy",
    "pain medication": "medication-management",
    "nerve block": "nerve-blocks",
    "stem cell therapy": "regenerative-medicine",
    "prp therapy": "regenerative-medicine",
    massage: "massage-therapy",
    psychology: "psychological-services",
    "mental health": "psychological-services",
  };

  const services: ServiceType[] = [];
  const seen = new Set<ServiceType>();

  for (const amenity of amenities) {
    const normalized = amenity.toLowerCase().trim();
    const service = amenityToService[normalized];
    if (service && !seen.has(service)) {
      services.push(service);
      seen.add(service);
    }
  }

  return services;
}

/**
 * Strip HTML tags from content string.
 *
 * @param html - HTML content string
 * @returns Plain text content
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/&amp;/g, "&") // Replace ampersands
    .replace(/&lt;/g, "<") // Replace less than
    .replace(/&gt;/g, ">") // Replace greater than
    .replace(/&quot;/g, '"') // Replace quotes
    .replace(/&#39;/g, "'") // Replace apostrophes
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Transform multiple database clinic records to Clinic array.
 *
 * @param dbClinics - Array of database clinic records
 * @returns Array of Clinic objects
 */
export function transformDbClinicsToType(dbClinics: ClinicRecord[]): Clinic[] {
  return dbClinics.map(transformDbClinicToType);
}

/**
 * Map insurance strings to InsuranceType array.
 * Utility function for future use when insurance data is available.
 *
 * @param insuranceStrings - Array of insurance name strings
 * @returns Array of InsuranceType values
 */
export function mapInsuranceToTypes(
  insuranceStrings: string[] | null
): InsuranceType[] {
  if (!insuranceStrings || !Array.isArray(insuranceStrings)) {
    return [];
  }

  const insuranceMap: Record<string, InsuranceType> = {
    medicare: "medicare",
    medicaid: "medicaid",
    "blue cross": "blue-cross",
    "blue cross blue shield": "blue-cross",
    bcbs: "blue-cross",
    aetna: "aetna",
    cigna: "cigna",
    "united healthcare": "united-healthcare",
    uhc: "united-healthcare",
    humana: "humana",
    kaiser: "kaiser",
    "kaiser permanente": "kaiser",
    tricare: "tricare",
    "workers comp": "workers-comp",
    "workers compensation": "workers-comp",
  };

  const types: InsuranceType[] = [];
  const seen = new Set<InsuranceType>();

  for (const insurance of insuranceStrings) {
    const normalized = insurance.toLowerCase().trim();
    const type = insuranceMap[normalized];
    if (type && !seen.has(type)) {
      types.push(type);
      seen.add(type);
    }
  }

  return types;
}
