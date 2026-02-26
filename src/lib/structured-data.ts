import { stripHtmlTags } from "./html-utils";
import type { FeaturedReview } from "./clinic-transformer";
import type { clinics } from "./schema";

type DbClinic = typeof clinics.$inferSelect;

/**
 * Generates Schema.org structured data (JSON-LD) for a clinic page.
 * Uses MedicalBusiness type for pain management clinic listings.
 */
export function generateClinicStructuredData(clinic: DbClinic) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";
  const stateSlug = (clinic.stateAbbreviation || clinic.state || "").toLowerCase();

  // Clean description - remove HTML tags and truncate
  const rawDescription = clinic.newPostContent || clinic.content || clinic.businessDescription;
  const cleanDescription = rawDescription
    ? stripHtmlTags(rawDescription).substring(0, 200)
    : `${clinic.title} provides pain management services in ${clinic.city}, ${clinic.stateAbbreviation || clinic.state}.`;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "@id": `${baseUrl}/pain-management/${stateSlug}/${clinic.permalink?.split("/").pop() || ""}`,
    name: clinic.title,
    description: cleanDescription,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinic.streetAddress || undefined,
      addressLocality: clinic.city,
      addressRegion: clinic.stateAbbreviation || clinic.state,
      postalCode: clinic.postalCode,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: clinic.mapLatitude,
      longitude: clinic.mapLongitude,
    },
    medicalSpecialty: "Pain Medicine",
    priceRange: "$",
  };

  // Add image if available
  const image = clinic.imageFeatured || clinic.imageUrl;
  if (image) {
    structuredData.image = image;
  }

  // Add telephone if available
  if (clinic.phone) {
    structuredData.telephone = clinic.phone;
  }

  // Add clinic website if available
  if (clinic.website) {
    structuredData.url = clinic.website;
  }

  // Add aggregate rating if available
  const featuredReviewsForRating = clinic.featuredReviews as FeaturedReview[] | null;
  let aggregateRating = clinic.rating;
  let aggregateReviewCount = clinic.reviewCount || 0;

  // If rating is missing or 0, try to calculate from featured reviews
  if ((!aggregateRating || aggregateRating === 0) && featuredReviewsForRating && featuredReviewsForRating.length > 0) {
    const reviewsWithRatings = featuredReviewsForRating.filter((r) => r.rating !== null && r.rating !== undefined);
    if (reviewsWithRatings.length > 0) {
      const sum = reviewsWithRatings.reduce((acc, r) => acc + (r.rating || 0), 0);
      aggregateRating = Math.round((sum / reviewsWithRatings.length) * 10) / 10;
      if (aggregateReviewCount === 0) {
        aggregateReviewCount = reviewsWithRatings.length;
      }
    }
  }

  if (aggregateRating && aggregateRating > 0 && aggregateReviewCount > 0) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(aggregateRating),
      reviewCount: String(aggregateReviewCount),
      bestRating: "5",
      worstRating: "1",
    };
  }

  return structuredData;
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";
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
export function generateWebSiteSchema(baseUrl: string, totalClinics: number) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: "PainClinics.com",
    alternateName: "Pain Clinics",
    description: `Find pain clinics near you. Search ${totalClinics.toLocaleString()}+ verified pain management doctors across all 50 states. Read reviews, compare specialists, and book appointments online.`,
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/pain-management?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "PainClinics.com",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    audience: {
      "@type": "PatientAudience",
      audienceType: "Patient",
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
    name: "PainClinics.com",
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

/**
 * Generates HowTo structured data for instructional content.
 * Great for step-by-step guides like pain tracking instructions.
 */
export function generateHowToSchema(data: {
  name: string;
  description: string;
  totalTime?: string;
  steps: Array<{ name: string; text: string }>;
  baseUrl?: string;
}) {
  const baseUrl = data.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.name,
    description: data.description,
    ...(data.totalTime && { totalTime: data.totalTime }),
    step: data.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
    publisher: {
      "@type": "Organization",
      name: "PainClinics.com",
      url: baseUrl,
    },
  };
}

/**
 * Generates ItemList structured data for comparison lists.
 * Ideal for pain relief methods comparison tool.
 */
export function generateItemListSchema(data: {
  name: string;
  description: string;
  items: Array<{
    name: string;
    description: string;
    position?: number;
  }>;
  baseUrl?: string;
}) {
  const baseUrl = data.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: data.name,
    description: data.description,
    numberOfItems: data.items.length,
    itemListElement: data.items.map((item, index) => ({
      "@type": "ListItem",
      position: item.position || index + 1,
      item: {
        "@type": "Thing",
        name: item.name,
        description: item.description,
      },
    })),
    publisher: {
      "@type": "Organization",
      name: "PainClinics.com",
      url: baseUrl,
    },
  };
}

/**
 * Generates MedicalWebPage structured data.
 * Appropriate for health-related informational pages.
 */
export function generateMedicalWebPageSchema(data: {
  name: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  about?: string[];
  baseUrl?: string;
}) {
  const baseUrl = data.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: data.name,
    description: data.description,
    url: data.url,
    ...(data.datePublished && { datePublished: data.datePublished }),
    ...(data.dateModified && { dateModified: data.dateModified }),
    ...(data.about && data.about.length > 0 && {
      about: data.about.map((topic) => ({
        "@type": "MedicalCondition",
        name: topic,
      })),
    }),
    publisher: {
      "@type": "Organization",
      name: "PainClinics.com",
      url: baseUrl,
    },
    medicalAudience: {
      "@type": "PatientAudience",
      audienceType: "Patient",
    },
  };
}

/**
 * Generates ItemList structured data for directory listing pages (city/state).
 * Lists clinics as MedicalBusiness items in the filtered/sorted result order.
 */
export function generateDirectoryListSchema(data: {
  locationName: string;
  stateAbbrev: string;
  citySlug?: string;
  clinics: Array<{
    title: string;
    permalink: string;
    rating?: number | null;
    reviewCount?: number | null;
  }>;
  totalCount: number;
  isFiltered: boolean;
  filterDescription?: string | undefined;
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

  const pageUrl = data.citySlug
    ? `${baseUrl}/pain-management/${data.stateAbbrev.toLowerCase()}/${data.citySlug}/`
    : `${baseUrl}/pain-management/${data.stateAbbrev.toLowerCase()}/`;

  const name = data.isFiltered && data.filterDescription
    ? `${data.filterDescription} Pain Clinics in ${data.locationName}`
    : `Pain Management Clinics in ${data.locationName}`;

  const description = data.isFiltered
    ? `${data.clinics.length} of ${data.totalCount} pain management clinics in ${data.locationName} matching your filters.`
    : `${data.totalCount} pain management clinics in ${data.locationName}.`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#webpage`,
    name,
    description,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: data.clinics.length,
      itemListElement: data.clinics.map((clinic, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "MedicalBusiness",
          "@id": `${baseUrl}/${clinic.permalink}/#organization`,
          name: clinic.title,
          url: `${baseUrl}/${clinic.permalink}/`,
          ...(clinic.rating &&
            clinic.rating > 0 &&
            clinic.reviewCount &&
            clinic.reviewCount > 0 && {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: clinic.rating,
                reviewCount: clinic.reviewCount,
                bestRating: 5,
                worstRating: 1,
              },
            }),
        },
      })),
    },
  };
}

/**
 * Generates FAQPage structured data for the homepage.
 * Targets "pain clinic near me" and related queries.
 */
export function generateHomepageFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I find a pain clinic near me?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use PainClinics.com to search over 5,000 verified pain management clinics across all 50 states. Browse by state or city, read patient reviews, compare ratings, and find specialists near your location.",
        },
      },
      {
        "@type": "Question",
        name: "What does a pain management doctor do?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A pain management doctor specializes in diagnosing and treating chronic pain conditions. They use a combination of approaches including medication management, injections, nerve blocks, physical therapy referrals, and minimally invasive procedures to help reduce pain and improve quality of life.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need a referral to see a pain management specialist?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It depends on your insurance plan. Some insurance providers require a referral from your primary care physician, while others allow you to see a pain specialist directly. Check with your insurance provider or call the clinic directly to confirm their referral requirements.",
        },
      },
      {
        "@type": "Question",
        name: "What conditions do pain clinics treat?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pain clinics treat a wide range of conditions including chronic back pain, neck pain, arthritis, fibromyalgia, neuropathy, migraines, sciatica, post-surgical pain, sports injuries, and complex regional pain syndrome (CRPS). Many clinics also offer treatments for cancer-related pain.",
        },
      },
      {
        "@type": "Question",
        name: "How much does a pain clinic visit cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The cost of a pain clinic visit varies based on your insurance coverage, the type of treatment, and your location. An initial consultation typically ranges from $100 to $300 without insurance. Most pain clinics accept major insurance plans including Medicare and Medicaid. Contact the clinic directly to verify accepted insurance and estimated costs.",
        },
      },
    ],
  };
}

/**
 * Generates simple BreadcrumbList for resource pages.
 */
export function generateResourceBreadcrumbSchema(data: {
  pageName: string;
  pageUrl: string;
  baseUrl?: string;
}) {
  const baseUrl = data.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

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
        name: data.pageName,
        item: data.pageUrl,
      },
    ],
  };
}

/**
 * Generates BreadcrumbList structured data for blog posts.
 * Creates a 3-4 level hierarchy: Home → Blog → [Category] → Post Title
 */
export function generateBlogBreadcrumbSchema(data: {
  postTitle: string;
  postSlug: string;
  categoryName?: string;
  categorySlug?: string;
  baseUrl?: string;
}) {
  const baseUrl = data.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

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
      name: "Blog",
      item: `${baseUrl}/blog`,
    },
  ];

  // Add category level if provided
  if (data.categoryName && data.categorySlug) {
    itemListElement.push({
      "@type": "ListItem",
      position: 3,
      name: data.categoryName,
      item: `${baseUrl}/blog/category/${data.categorySlug}`,
    });
    itemListElement.push({
      "@type": "ListItem",
      position: 4,
      name: data.postTitle,
      item: `${baseUrl}/blog/${data.postSlug}`,
    });
  } else {
    // No category - just Blog → Post
    itemListElement.push({
      "@type": "ListItem",
      position: 3,
      name: data.postTitle,
      item: `${baseUrl}/blog/${data.postSlug}`,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}
