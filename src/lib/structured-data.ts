import type { clinics } from "./schema";

type DbClinic = typeof clinics.$inferSelect;

interface ClinicHour {
  day: string;
  hours: string;
}

/**
 * Generates Schema.org structured data (JSON-LD) for a clinic.
 * Uses MedicalBusiness and LocalBusiness types for optimal SEO.
 */
export function generateClinicStructuredData(clinic: DbClinic) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

  // Clean description - remove HTML tags and truncate
  const cleanDescription = clinic.content
    ? clinic.content
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .substring(0, 200)
        .trim()
    : `${clinic.title} provides pain management services in ${clinic.city}, ${clinic.stateAbbreviation || clinic.state}.`;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["MedicalBusiness", "LocalBusiness"],
    "@id": `${baseUrl}/${clinic.permalink}/#organization`,
    name: clinic.title,
    description: cleanDescription,
    url: `${baseUrl}/${clinic.permalink}/`,
    medicalSpecialty: "Pain Medicine",
    priceRange: "$$",
  };

  // Add telephone if available
  if (clinic.phone) {
    structuredData.telephone = clinic.phone;
  }

  // Add website if available
  if (clinic.website) {
    structuredData.sameAs = clinic.website;
  }

  // Add address
  structuredData.address = {
    "@type": "PostalAddress",
    streetAddress: clinic.streetAddress || undefined,
    addressLocality: clinic.city,
    addressRegion: clinic.stateAbbreviation || clinic.state,
    postalCode: clinic.postalCode,
    addressCountry: "US",
  };

  // Add geo coordinates
  structuredData.geo = {
    "@type": "GeoCoordinates",
    latitude: clinic.mapLatitude,
    longitude: clinic.mapLongitude,
  };

  // Add image if available
  const image = clinic.imageFeatured || clinic.imageUrl;
  if (image) {
    structuredData.image = image;
  }

  // Add aggregate rating if available
  if (clinic.rating && clinic.reviewCount && clinic.reviewCount > 0) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: clinic.rating,
      reviewCount: clinic.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Add opening hours if available
  const openingHours = formatOpeningHours(
    clinic.clinicHours as ClinicHour[] | null
  );
  if (openingHours && openingHours.length > 0) {
    structuredData.openingHoursSpecification = openingHours;
  }

  return structuredData;
}

/**
 * Formats clinic hours into Schema.org OpeningHoursSpecification format.
 */
function formatOpeningHours(hours: ClinicHour[] | null) {
  if (!hours || !Array.isArray(hours)) return undefined;

  return hours
    .filter((h) => h.hours && h.hours !== "Closed")
    .map((h) => {
      const parts = h.hours.split("-").map((t) => t.trim());
      const open = parts[0] || "9:00 AM";
      const close = parts[1] || "5:00 PM";
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.day,
        opens: formatTime24(open),
        closes: formatTime24(close),
      };
    });
}

/**
 * Converts 12-hour time format to 24-hour format for Schema.org.
 * Handles formats like "9:00 AM", "9AM", "9:00", etc.
 */
function formatTime24(time12: string): string {
  if (!time12) return "09:00";

  const match = time12.match(/(\d+):?(\d*)?\s*(AM|PM)?/i);
  if (!match || !match[1]) return "09:00";

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Generates BreadcrumbList structured data for clinic pages.
 */
export function generateBreadcrumbStructuredData(
  clinic: DbClinic,
  stateName?: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pain Management Clinics",
        item: `${baseUrl}/clinics`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name:
          stateName ||
          clinic.state ||
          clinic.stateAbbreviation ||
          "United States",
        item: `${baseUrl}/pain-management/${(clinic.stateAbbreviation || clinic.state).toLowerCase()}/`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: clinic.title,
        item: `${baseUrl}/${clinic.permalink}/`,
      },
    ],
  };
}

/**
 * Generates FAQPage structured data from clinic Q&A.
 */
export function generateFAQStructuredData(
  questions: Array<{ question: string; answer: string }> | null
) {
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}
