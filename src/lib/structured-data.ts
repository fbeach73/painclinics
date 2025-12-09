import type { clinics } from "./schema";

type DbClinic = typeof clinics.$inferSelect;

interface ClinicHour {
  day: string;
  hours: string;
}

interface FeaturedReview {
  username: string | null;
  url: string | null;
  review: string | null;
  date: string | null;
  rating: number | null;
}

/**
 * Service mapping for pain management procedures.
 * Maps common service names to Schema.org MedicalProcedure types.
 */
const SERVICE_MAPPING: Record<string, { name: string; procedureType: string }> = {
  "injection therapy": { name: "Injection Therapy", procedureType: "Therapeutic" },
  "physical therapy": { name: "Physical Therapy", procedureType: "Therapeutic" },
  "nerve blocks": { name: "Nerve Block Procedures", procedureType: "Therapeutic" },
  "epidural steroid injections": { name: "Epidural Steroid Injections", procedureType: "Therapeutic" },
  "radiofrequency ablation": { name: "Radiofrequency Ablation", procedureType: "Therapeutic" },
  "spinal cord stimulation": { name: "Spinal Cord Stimulation", procedureType: "Therapeutic" },
  "medication management": { name: "Medication Management", procedureType: "Therapeutic" },
  "acupuncture": { name: "Acupuncture", procedureType: "Therapeutic" },
  "chiropractic": { name: "Chiropractic Care", procedureType: "Therapeutic" },
  "massage therapy": { name: "Massage Therapy", procedureType: "Therapeutic" },
  "trigger point injections": { name: "Trigger Point Injections", procedureType: "Therapeutic" },
  "joint injections": { name: "Joint Injections", procedureType: "Therapeutic" },
  "platelet rich plasma": { name: "Platelet Rich Plasma (PRP) Therapy", procedureType: "Therapeutic" },
  "stem cell therapy": { name: "Stem Cell Therapy", procedureType: "Therapeutic" },
};

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

  // Add sameAs array from website and social media links
  const sameAs: string[] = [];
  if (clinic.website) sameAs.push(clinic.website);
  if (clinic.facebook) sameAs.push(clinic.facebook);
  if (clinic.instagram) sameAs.push(clinic.instagram);
  if (clinic.twitter) sameAs.push(clinic.twitter);
  if (clinic.youtube) sameAs.push(clinic.youtube);
  if (clinic.linkedin) sameAs.push(clinic.linkedin);
  if (clinic.tiktok) sameAs.push(clinic.tiktok);
  if (clinic.pinterest) sameAs.push(clinic.pinterest);
  if (sameAs.length > 0) {
    structuredData.sameAs = sameAs;
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

  // Add featured reviews (up to 10)
  const featuredReviews = clinic.featuredReviews as FeaturedReview[] | null;
  if (featuredReviews && featuredReviews.length > 0) {
    structuredData.review = featuredReviews
      .slice(0, 10)
      .filter((r) => r.review)
      .map((r) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating || 5,
          bestRating: 5,
          worstRating: 1,
        },
        author: {
          "@type": "Person",
          name: r.username || "Anonymous",
        },
        reviewBody: r.review,
        ...(r.date && { datePublished: r.date }),
      }));
  }

  // Add amenities as amenityFeature
  if (clinic.amenities && clinic.amenities.length > 0) {
    structuredData.amenityFeature = clinic.amenities.map((amenity) => ({
      "@type": "LocationFeatureSpecification",
      name: amenity,
      value: true,
    }));
  }

  // Add available services as MedicalProcedure types
  if (clinic.checkboxFeatures && clinic.checkboxFeatures.length > 0) {
    const services = clinic.checkboxFeatures
      .map((feature) => {
        const featureLower = feature.toLowerCase();
        const serviceInfo = SERVICE_MAPPING[featureLower];
        if (serviceInfo) {
          return {
            "@type": "MedicalProcedure",
            name: serviceInfo.name,
            procedureType: serviceInfo.procedureType,
          };
        }
        // Include as generic service if not in mapping
        return {
          "@type": "MedicalProcedure",
          name: feature,
          procedureType: "Therapeutic",
        };
      })
      .filter(Boolean);

    if (services.length > 0) {
      structuredData.availableService = services;
    }
  }

  // Add Google Maps link if placeId is available
  if (clinic.placeId) {
    structuredData.hasMap = `https://www.google.com/maps/place/?q=place_id:${clinic.placeId}`;
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
 * @param clinic - The clinic data
 * @param stateName - Full state name (e.g., "California")
 * @param includeCity - Whether to include the city level in breadcrumbs (5-level vs 4-level)
 */
export function generateBreadcrumbStructuredData(
  clinic: DbClinic,
  stateName?: string,
  includeCity: boolean = true
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";
  const stateSlug = (clinic.stateAbbreviation || clinic.state).toLowerCase();
  const citySlug = clinic.city.toLowerCase().replace(/\s+/g, "-");

  const itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }> = [
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
      item: `${baseUrl}/pain-management/${stateSlug}/`,
    },
  ];

  if (includeCity && clinic.city) {
    itemListElement.push({
      "@type": "ListItem",
      position: 4,
      name: clinic.city,
      item: `${baseUrl}/pain-management/${stateSlug}/${citySlug}/`,
    });
    itemListElement.push({
      "@type": "ListItem",
      position: 5,
      name: clinic.title,
      item: `${baseUrl}/${clinic.permalink}/`,
    });
  } else {
    itemListElement.push({
      "@type": "ListItem",
      position: 4,
      name: clinic.title,
      item: `${baseUrl}/${clinic.permalink}/`,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
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

/**
 * Generates WebSite schema with SearchAction for the homepage.
 * Enables sitelinks searchbox in Google search results.
 */
export function generateWebSiteSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "Pain Clinics Directory",
    description: "Find pain management clinics near you",
    publisher: { "@id": `${baseUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/pain-management/{state}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generates Organization schema for the homepage.
 * Links to the WebSite schema via @id reference.
 */
export function generateOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "Pain Clinics Directory",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "English",
    },
  };
}

/**
 * Generates CollectionPage schema for city landing pages.
 * Lists all clinics in the city as an ItemList.
 */
export function generateCityPageSchema(
  city: string,
  stateAbbrev: string,
  stateName: string,
  clinics: DbClinic[],
  baseUrl: string
) {
  const citySlug = city.toLowerCase().replace(/\s+/g, "-");
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/${citySlug}/#webpage`,
    name: `Pain Management Clinics in ${city}, ${stateAbbrev}`,
    description: `Find ${clinics.length} pain management clinics in ${city}, ${stateName}.`,
    url: `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/${citySlug}/`,
    isPartOf: { "@id": `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/#webpage` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: clinics.length,
      itemListElement: clinics.map((clinic, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "MedicalBusiness",
          "@id": `${baseUrl}/${clinic.permalink}/#organization`,
          name: clinic.title,
          url: `${baseUrl}/${clinic.permalink}/`,
        },
      })),
    },
  };
}

/**
 * Generates default FAQ entries for clinics without custom Q&A.
 * Provides basic information about services, location, and scheduling.
 */
export function generateDefaultClinicFAQ(clinic: DbClinic) {
  const address = [
    clinic.streetAddress,
    clinic.city,
    clinic.stateAbbreviation || clinic.state,
    clinic.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    {
      question: `What services does ${clinic.title} offer?`,
      answer: `${clinic.title} provides comprehensive pain management services including evaluation, diagnosis, and treatment of chronic pain conditions.`,
    },
    {
      question: `Where is ${clinic.title} located?`,
      answer: `${clinic.title} is located at ${address}.`,
    },
    {
      question: `How do I schedule an appointment at ${clinic.title}?`,
      answer: `You can schedule an appointment by calling ${clinic.phone || "our office"} during business hours.`,
    },
  ];
}
