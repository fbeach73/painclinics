import type {
  Clinic,
  OperatingHours,
  DayHours,
  ServiceType,
  InsuranceType,
} from "@/types/clinic";
import type { ClinicService } from "@/types/service";

import type { ClinicRecord } from "./clinic-queries";
import { extractPermalinkSlug, type ClinicHour } from "./clinic-transformer";
import { stripHtmlTags } from "./html-utils";
import { parseTimeRange } from "./time-utils";

/**
 * Extended clinic record with junction table services.
 */
export interface ClinicRecordWithServices extends ClinicRecord {
  clinicServices?: ClinicService[];
}

/**
 * Transform a database clinic record to the Clinic type used by frontend components.
 * Uses the clinic_services junction table for service data.
 *
 * @param dbClinic - The raw database clinic record (with clinicServices from junction table)
 * @returns A Clinic object compatible with existing components
 */
export function transformDbClinicToType(dbClinic: ClinicRecordWithServices): Clinic {
  const email = dbClinic.emails?.[0];
  const website = dbClinic.website;

  // Get services from junction table
  const services = dbClinic.clinicServices?.length
    ? mapClinicServicesToServiceTypes(dbClinic.clinicServices)
    : [];

  return {
    id: dbClinic.id,
    name: dbClinic.title,
    slug: extractPermalinkSlug(dbClinic.permalink),
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
    services,
    insuranceAccepted: [], // Insurance data not stored in current schema
    rating: dbClinic.rating || 0,
    reviewCount: dbClinic.reviewCount || 0,
    photos: dbClinic.clinicImageUrls || [],
    about: stripHtmlTags(dbClinic.content || ""),
    isVerified: dbClinic.isVerified ?? false,
    isFeatured: dbClinic.isFeatured ?? false,
    ownerUserId: dbClinic.ownerUserId,
    featuredTier: dbClinic.featuredTier,
    featuredUntil: dbClinic.featuredUntil,
  };
}

/**
 * Map ClinicService objects from the junction table to legacy ServiceType array.
 * This maintains backward compatibility with existing components that expect ServiceType[].
 *
 * @param clinicServices - Array of ClinicService objects with service details
 * @returns Array of ServiceType values
 */
function mapClinicServicesToServiceTypes(clinicServices: ClinicService[]): ServiceType[] {
  const slugToServiceType: Record<string, ServiceType> = {
    "injection-therapy": "injection-therapy",
    "physical-therapy": "physical-therapy",
    "medication-management": "medication-management",
    "nerve-blocks": "nerve-blocks",
    "spinal-cord-stimulation": "spinal-cord-stimulation",
    "regenerative-medicine": "regenerative-medicine",
    acupuncture: "acupuncture",
    "chiropractic-care": "chiropractic",
    "massage-therapy": "massage-therapy",
    "psychological-services": "psychological-services",
  };

  const services: ServiceType[] = [];
  const seen = new Set<ServiceType>();

  for (const cs of clinicServices) {
    if (!cs.service) continue;
    const serviceType = slugToServiceType[cs.service.slug];
    if (serviceType && !seen.has(serviceType)) {
      services.push(serviceType);
      seen.add(serviceType);
    }
  }

  return services;
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

    const parsed = parseTimeRange(timeStr);
    if (parsed) {
      result[key] = {
        open: parsed.open,
        close: parsed.close,
        closed: false,
      };
    } else {
      result[key] = { open: "", close: "", closed: true };
    }
  }

  return result;
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
