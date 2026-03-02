import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { ChevronRight, ExternalLink, MessageCircle, Phone } from "lucide-react";
import { InPageAd, AdPlacement } from "@/components/ads/adsense";
import { PageTracker } from "@/components/analytics/page-tracker";
import { ClaimBenefitsBanner } from "@/components/clinic/claim-benefits-banner";
import { ClinicAbout } from "@/components/clinic/clinic-about";
import { ClinicAmenities } from "@/components/clinic/clinic-amenities";
import { ClinicEditButton } from "@/components/clinic/clinic-edit-button";
import { ClinicFAQ } from "@/components/clinic/clinic-faq";
import { ClinicGallery } from "@/components/clinic/clinic-gallery";
import { ClinicHeroImage } from "@/components/clinic/clinic-hero-image";
import { ClinicHeader } from "@/components/clinic/clinic-header";
import { ClinicHours } from "@/components/clinic/clinic-hours";
import { TrackableCallLink, TrackableLink } from "@/components/clinic/trackable-call-link";
import { ClinicInsurance } from "@/components/clinic/clinic-insurance";
import { ClinicReviews } from "@/components/clinic/clinic-reviews";
import { ClinicServicesLegacy } from "@/components/clinic/clinic-services";

import { LazySearchFeaturedSection } from "@/components/featured/lazy-search-featured-section";
import { LazyEmbeddedMap } from "@/components/map/lazy-embedded-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { transformDbClinicToType } from "@/lib/clinic-db-to-type";
import {
  getClinicByPermalink,
  getClinicByLegacySlug,
  getClinicByStrippedSlug,
  getClinicByTitleSlug,
  getClinicsByState,
  getClinicsByCity,
} from "@/lib/clinic-queries";
import { getClinicInsuranceSlugs } from "@/lib/clinic-insurance-queries";
import { getClinicServices } from "@/lib/clinic-services-queries";
import { parseFilters } from "@/lib/directory/filters";
import { generateFilteredMeta } from "@/lib/directory/meta";
import { getFilteredClinics } from "@/lib/directory/queries";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { featuredSubscriptions } from "@/lib/schema";
import {
  generateBreadcrumbStructuredData,
  generateClinicStructuredData,
  generateDefaultClinicFAQ,
  generateFAQStructuredData,
} from "@/lib/structured-data";
import { US_STATES_REVERSE, getStateName } from "@/lib/us-states";
import { formatDisplayUrl, stripUrlQueryParams } from "@/lib/utils";
import { CityPainManagementPageContent } from "../city-page";
import { StatePainManagementPageContent } from "../state-page";
import type { Metadata } from "next";

// Revalidate clinic pages monthly to reduce Neon DB costs
// Use on-demand revalidation via admin actions for immediate updates
// 30 days cache (2592000 seconds)
export const revalidate = 2592000;

// Check if a slug is a valid US state abbreviation
function isValidStateAbbrev(slug: string): boolean {
  return slug.length === 2 && slug.toUpperCase() in US_STATES_REVERSE;
}

// Check if a slug is a valid city slug (lowercase letters and hyphens, at least 3 chars)
function isValidCitySlug(citySlug: string): boolean {
  return citySlug.length >= 2 && /^[a-z-]+$/.test(citySlug);
}

// Convert city slug back to city name (e.g., "los-angeles" -> "Los Angeles")
function citySlugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface Props {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Generate static params for state pages only at build time
// City and clinic pages are generated on-demand with ISR (revalidate = 3600)
// This keeps build times fast while still benefiting from caching
export async function generateStaticParams() {
  try {
    const { getAllStatesWithClinics } = await import("@/lib/clinic-queries");
    const states = await getAllStatesWithClinics();

    // Only generate paths for state pages (~50 pages)
    // City pages (hundreds) are generated on-demand to avoid build timeouts
    const stateParams = states.map((state) => ({
      slug: [state.toLowerCase()],
    }));

    return stateParams;
  } catch (error) {
    // If database is unavailable (e.g., in CI), return empty array
    // Pages will be generated on-demand at runtime instead
    console.warn("generateStaticParams: Database unavailable, skipping static generation:", error);
    return [];
  }
}

export async function generateMetadata({ params, searchParams: searchParamsPromise }: Props): Promise<Metadata> {
  const { slug } = await params;
  const searchParams = await searchParamsPromise;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

  // Check if this is a state page (single segment, 2-char state abbrev)
  const firstSlug = slug[0];
  if (slug.length === 1 && firstSlug && isValidStateAbbrev(firstSlug)) {
    const stateAbbrev = firstSlug.toUpperCase();
    const stateName = getStateName(stateAbbrev);

    // Use filter-aware meta generation
    const filters = parseFilters(searchParams);
    const result = await getFilteredClinics({ stateAbbrev }, filters);

    return generateFilteredMeta(
      {
        stateName,
        stateAbbrev,
        clinicCount: result.stats.totalCount,
        filteredCount: result.stats.filteredCount,
      },
      filters
    );
  }

  // Check if this is a city page (2 segments: state + city)
  if (slug.length === 2) {
    const [stateSlug, citySlug] = slug;
    if (
      stateSlug &&
      isValidStateAbbrev(stateSlug) &&
      citySlug &&
      isValidCitySlug(citySlug)
    ) {
      const stateAbbrev = stateSlug.toUpperCase();
      const stateName = getStateName(stateAbbrev);
      const cityName = citySlugToName(citySlug);

      // Use filter-aware meta generation
      const filters = parseFilters(searchParams);
      const result = await getFilteredClinics(
        { stateAbbrev, city: cityName },
        filters
      );

      if (result.stats.totalCount > 0) {
        return generateFilteredMeta(
          {
            cityName,
            stateName,
            stateAbbrev,
            clinicCount: result.stats.totalCount,
            filteredCount: result.stats.filteredCount,
          },
          filters
        );
      }
    }
  }

  // Clinic page metadata
  const slugPath = slug.join("/");
  let clinic = await getClinicByPermalink(slugPath);

  // If not found and single segment, try legacy WordPress slug format
  if (!clinic && slug.length === 1 && slug[0]) {
    clinic = await getClinicByLegacySlug(slug[0]);
  }

  if (!clinic) {
    return {
      title: "Clinic Not Found",
      description: "The pain management clinic you're looking for could not be found.",
    };
  }

  const stateName = getStateName(clinic.stateAbbreviation || clinic.state);

  // Build title differentiators — prefer rating+reviews, fall back to reviews only
  const hasRating = clinic.rating && clinic.rating >= 3.0;
  const hasReviews = clinic.reviewCount && clinic.reviewCount > 0;

  let titleSuffix = "";
  if (hasRating && hasReviews) {
    titleSuffix = ` | ${clinic.rating!.toFixed(1)}★ ${clinic.reviewCount} Reviews`;
  } else if (hasReviews) {
    titleSuffix = ` | ${clinic.reviewCount} Reviews`;
  } else if (hasRating) {
    titleSuffix = ` | Rated ${clinic.rating!.toFixed(1)}★`;
  }

  // Keep total title under ~60 chars when possible; truncate clinic name if needed
  const locationPart = ` - Pain Management in ${clinic.city}, ${clinic.stateAbbreviation || stateName}`;
  const baseTitle = `${clinic.title}${locationPart}${titleSuffix}`;
  const title = baseTitle.length <= 65 ? baseTitle : `${clinic.title}${locationPart}`;

  // Build description: lead with social proof, add CTA and phone
  let description: string;
  if (hasRating && hasReviews) {
    const base = `${clinic.title} in ${clinic.city}, ${stateName} — rated ${clinic.rating!.toFixed(1)}★ by ${clinic.reviewCount} patients.`;
    const cta = clinic.phone ? ` Call ${clinic.phone} to book an appointment.` : " Find directions, hours & contact info.";
    description = (base + cta).substring(0, 155);
  } else if (hasReviews) {
    const base = `${clinic.title} in ${clinic.city}, ${stateName} — reviewed by ${clinic.reviewCount} patients.`;
    const cta = clinic.phone ? ` Call ${clinic.phone} for pain management appointments.` : " View contact info and directions.";
    description = (base + cta).substring(0, 155);
  } else if (hasRating) {
    const base = `${clinic.title} — ${clinic.rating!.toFixed(1)}★ rated pain management clinic in ${clinic.city}, ${stateName}.`;
    const cta = clinic.phone ? ` Call ${clinic.phone} to schedule.` : " View hours, location & contact info.";
    description = (base + cta).substring(0, 155);
  } else {
    const base = `${clinic.title} is a pain management clinic in ${clinic.city}, ${stateName}.`;
    const cta = clinic.phone ? ` Call ${clinic.phone} to book an appointment.` : " Find location, hours & contact details.";
    description = (base + cta).substring(0, 155);
  }

  const canonicalUrl = `${baseUrl}/${clinic.permalink}/`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "PainClinics.com",
      ...(clinic.imageFeatured || clinic.imageUrl
        ? {
            images: [
              {
                url: clinic.imageFeatured || clinic.imageUrl || "",
                width: 1200,
                height: 630,
                alt: clinic.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(clinic.imageFeatured || clinic.imageUrl
        ? { images: [clinic.imageFeatured || clinic.imageUrl || ""] }
        : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "geo.region": `US-${clinic.stateAbbreviation}`,
      "geo.placename": `${clinic.city}, ${clinic.stateAbbreviation}`,
      ...(clinic.mapLatitude && clinic.mapLongitude
        ? {
            "geo.position": `${clinic.mapLatitude};${clinic.mapLongitude}`,
            ICBM: `${clinic.mapLatitude}, ${clinic.mapLongitude}`,
          }
        : {}),
      "business:contact_data:locality": clinic.city,
      "business:contact_data:region": clinic.stateAbbreviation || "",
      "business:contact_data:postal_code": clinic.postalCode,
      "business:contact_data:country_name": "United States",
    },
  };
}

export default async function PainManagementClinicPage({ params, searchParams: searchParamsPromise }: Props) {
  const { slug: rawSlug } = await params;
  const searchParams = await searchParamsPromise;

  // Clean URL-encoded junk from slugs (e.g., %23google_vignette, %20portal)
  // These come from Google ad parameters or user typos leaking into URLs
  const slug = rawSlug.map((s) => {
    // Strip everything after a URL-decoded hash or common appended junk
    const cleaned = s.replace(/%23.*$/, "").replace(/%20.*$/, "");
    return cleaned || s;
  });

  // If slug was cleaned, redirect to the clean version
  if (slug.some((s, i) => s !== rawSlug[i])) {
    redirect(`/pain-management/${slug.join("/")}`);
  }

  // Check if this is a state page (single segment, 2-char state abbrev)
  const firstSlug = slug[0];
  if (slug.length === 1 && firstSlug && isValidStateAbbrev(firstSlug)) {
    const stateAbbrev = firstSlug.toUpperCase();
    const stateName = getStateName(stateAbbrev);

    // Quick check: any clinics in this state?
    const checkClinics = await getClinicsByState(stateAbbrev);
    if (checkClinics.length === 0) {
      notFound();
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

    // Fetch filtered clinics for structured data
    const stateFilters = parseFilters(searchParams);
    const stateResult = await getFilteredClinics({ stateAbbrev }, stateFilters);


    const stateCollectionData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Pain Management Clinics in ${stateName}`,
      description: `Find ${stateResult.stats.totalCount} verified pain management clinics in ${stateName}. Browse ratings and reviews.`,
      url: `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}`,
      breadcrumb: {
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
            name: stateName,
          },
        ],
      },
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(stateCollectionData) }}
        />
        <StatePainManagementPageContent
          stateName={stateName}
          stateAbbrev={stateAbbrev}
          searchParams={searchParams}
        />
      </>
    );
  }

  // Check if this is a city page (2 segments: state + city)
  if (slug.length === 2) {
    const [stateSlug, citySlug] = slug;
    if (
      stateSlug &&
      isValidStateAbbrev(stateSlug) &&
      citySlug &&
      isValidCitySlug(citySlug)
    ) {
      const stateAbbrev = stateSlug.toUpperCase();
      const stateName = getStateName(stateAbbrev);
      const cityName = citySlugToName(citySlug);

      // Quick check: any clinics in this city?
      const checkClinics = await getClinicsByCity(cityName, stateAbbrev);
      if (checkClinics.length === 0) {
        notFound();
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

      // Fetch filtered clinics for structured data
      const cityFilters = parseFilters(searchParams);
      const cityResult = await getFilteredClinics(
        { stateAbbrev, city: cityName },
        cityFilters
      );


      const cityCollectionData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `Pain Management Clinics in ${cityName}, ${stateName}`,
        description: `Find ${cityResult.stats.totalCount} verified pain management clinics in ${cityName}, ${stateName}. Browse ratings and reviews.`,
        url: `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/${citySlug}`,
        breadcrumb: {
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
              name: stateName,
              item: `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: cityName,
            },
          ],
        },
      };

      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(cityCollectionData) }}
          />
          <CityPainManagementPageContent
            cityName={cityName}
            stateName={stateName}
            stateAbbrev={stateAbbrev}
            searchParams={searchParams}
          />
        </>
      );
    }
  }

  // Handle legacy 3-segment URLs: /pain-management/{state}/{city}/{clinic}
  // These are old WordPress-era URLs — redirect to the city browse page
  if (slug.length === 3) {
    const [stateSlug, citySlug] = slug;
    if (stateSlug && isValidStateAbbrev(stateSlug) && citySlug && isValidCitySlug(citySlug)) {
      permanentRedirect(`/pain-management/${stateSlug.toLowerCase()}/${citySlug.toLowerCase()}`);
    }
  }

  // Clinic page logic
  const slugPath = slug.join("/");
  const dbClinic = await getClinicByPermalink(slugPath);

  // If not found, check if slug ends with -N suffix (e.g., -2, -3)
  // This handles legacy duplicate clinic URLs that should redirect to canonical
  if (!dbClinic) {
    const strippedResult = await getClinicByStrippedSlug(slugPath);
    if (strippedResult) {
      // Redirect to canonical URL without the -N suffix (308 permanent redirect)
      permanentRedirect(`/pain-management/${strippedResult.canonicalSlug}`);
    }
  }

  // If not found, check for leading-zero mismatch in zip codes.
  // Two cases:
  //   A) Old URL has 4-digit zip (8034) but DB has 5-digit (08034) — add leading zero
  //   B) Old URL has 5-digit zip with leading zero (07076) but DB permalink has 4-digit (7076) — strip it
  if (!dbClinic && slug.length === 1 && slug[0]) {
    // Case A: 4-digit zip → try adding leading zero
    const zipMatch4 = slug[0].match(/^(.+)-([a-z]{2})-(\d{4})$/i);
    if (zipMatch4 && zipMatch4[1] && zipMatch4[2] && zipMatch4[3]) {
      const paddedSlug = `${zipMatch4[1]}-${zipMatch4[2].toLowerCase()}-0${zipMatch4[3]}`;
      const paddedClinic = await getClinicByPermalink(paddedSlug);
      if (paddedClinic && paddedClinic.permalink) {
        const newPath = paddedClinic.permalink.replace(/^pain-management\//, "");
        permanentRedirect(`/pain-management/${newPath}`);
      }
    }

    // Case B: 5-digit zip starting with 0 → try stripping leading zero
    const zipMatch5 = slug[0].match(/^(.+)-([a-z]{2})-(0\d{4})$/i);
    if (zipMatch5 && zipMatch5[1] && zipMatch5[2] && zipMatch5[3]) {
      const strippedZip = zipMatch5[3].replace(/^0/, "");
      const strippedSlug = `${zipMatch5[1]}-${zipMatch5[2].toLowerCase()}-${strippedZip}`;
      const strippedClinic = await getClinicByPermalink(strippedSlug);
      if (strippedClinic && strippedClinic.permalink) {
        const newPath = strippedClinic.permalink.replace(/^pain-management\//, "");
        permanentRedirect(`/pain-management/${newPath}`);
      }
    }
  }

  // If still not found and single segment, try legacy WordPress slug format
  // Legacy format: {clinic-name-slug}-{state}-{zipcode} e.g. "open-arms-pain-clinic-co-80909"
  if (!dbClinic && slug.length === 1 && slug[0]) {
    const legacyClinic = await getClinicByLegacySlug(slug[0]);
    if (legacyClinic && legacyClinic.permalink) {
      const newPath = legacyClinic.permalink.replace(/^pain-management\//, "");
      permanentRedirect(`/pain-management/${newPath}`);
    }
  }

  // Last resort: try matching by title alone (handles old WordPress slugs without state-zip)
  // e.g., "arrowhead-endoscopy-pain-management-center" -> title "Arrowhead Endoscopy Pain Management Center"
  if (!dbClinic && slug.length === 1 && slug[0]) {
    const titleClinic = await getClinicByTitleSlug(slug[0]);
    if (titleClinic && titleClinic.permalink) {
      const newPath = titleClinic.permalink.replace(/^pain-management\//, "");
      permanentRedirect(`/pain-management/${newPath}`);
    }
  }

  if (!dbClinic) {
    notFound();
  }

  // Fetch services, insurance, and subscription status in parallel
  const [clinicServices, insuranceSlugs, activeSubscription] = await Promise.all([
    getClinicServices(dbClinic.id),
    getClinicInsuranceSlugs(dbClinic.id),
    db.select({ id: featuredSubscriptions.id })
      .from(featuredSubscriptions)
      .where(
        and(
          eq(featuredSubscriptions.clinicId, dbClinic.id),
          eq(featuredSubscriptions.status, "active"),
        )
      )
      .limit(1),
  ]);

  const hasActiveSubscription = activeSubscription.length > 0;

  // Add services and insurance to the clinic record for transformation
  const dbClinicWithServices = {
    ...dbClinic,
    clinicServices,
    insuranceSlugs,
  };

  const clinic = transformDbClinicToType(dbClinicWithServices);
  const structuredData = generateClinicStructuredData(dbClinicWithServices);
  const breadcrumbData = generateBreadcrumbStructuredData(dbClinicWithServices);

  // Generate FAQ structured data — use custom questions if available, otherwise default
  const faqStructuredData = clinic.questions?.length
    ? generateFAQStructuredData(clinic.questions)
    : generateFAQStructuredData(generateDefaultClinicFAQ(dbClinic));

  // Show claim banner only for unclaimed clinics
  // The ClaimBenefitsBanner handles user-specific logic client-side
  const showClaimBanner = !clinic.ownerUserId;

  // Ad-free pages for paying featured subscribers (managed manually)
  const AD_FREE_SLUGS = new Set(["amir-abdel-kader-md-de-19804"]);
  const showAds = !AD_FREE_SLUGS.has(slugPath);

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      {faqStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
      )}

      {/* Analytics tracking — only for clinics with active paid subscriptions */}
      {hasActiveSubscription && <PageTracker clinicId={clinic.id} />}

      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Top leaderboard ad — desktop only */}
          {showAds && (
            <div className="hidden lg:block mb-6">
              <AdPlacement><InPageAd slot="7320134815" /></AdPlacement>
            </div>
          )}

          {/* Edit Listing Button - Client component handles auth check */}
          <ClinicEditButton
            clinicId={clinic.id}
            ownerUserId={clinic.ownerUserId ?? null}
          />

          {/* Hero Section: Header + Featured Image */}
          <div className="grid gap-8 lg:grid-cols-2 mb-8">
            <div className="space-y-6">
              {/* Breadcrumb Navigation */}
              <nav aria-label="Breadcrumb">
                <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                  <li>
                    <Link href="/" className="hover:text-primary transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>
                  <li>
                    <Link href="/pain-management" className="hover:text-primary transition-colors">
                      Clinics
                    </Link>
                  </li>
                  <li>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>
                  <li>
                    <Link
                      href={`/pain-management/${clinic.address.state.toLowerCase()}`}
                      className="hover:text-primary transition-colors"
                    >
                      {getStateName(clinic.address.state)}
                    </Link>
                  </li>
                  <li>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>
                  <li>
                    <Link
                      href={`/pain-management/${clinic.address.state.toLowerCase()}/${clinic.address.city.toLowerCase().replace(/\s+/g, "-")}`}
                      className="hover:text-primary transition-colors"
                    >
                      {clinic.address.city}
                    </Link>
                  </li>
                  <li>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>
                  <li>
                    <span aria-current="page" className="text-foreground font-medium truncate max-w-[200px]">
                      {clinic.name}
                    </span>
                  </li>
                </ol>
              </nav>

              <ClinicHeader clinic={clinic} trackingEnabled={hasActiveSubscription} />
            </div>
            <div className="space-y-2">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                <ClinicHeroImage
                  src={dbClinic.imageFeatured || dbClinic.imageUrl}
                  alt={clinic.name}
                  priority
                />
              </div>
            </div>
          </div>

          {/* Services + Ad Row */}
          <div className={`grid gap-8 ${showAds ? "lg:grid-cols-[1fr_300px]" : ""} mb-8 min-w-0`}>
            {/* Ad - shows first on mobile, second on desktop */}
            {showAds && (
              <div className="order-first lg:order-last min-w-0">
                <AdPlacement><InPageAd slot="7243608610" /></AdPlacement>
              </div>
            )}
            {/* Services - shows second on mobile, first on desktop */}
            {clinic.services.length > 0 && (
              <div className="order-last lg:order-first min-w-0">
                <ClinicServicesLegacy services={clinic.services} />
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-8 lg:grid-cols-3 min-w-0">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8 min-w-0">
              {/* About Section - use enhanced if available, business description as fallback */}
              {(clinic.about || clinic.enhancedAbout || clinic.businessDescription) && (
                <ClinicAbout
                  about={clinic.about}
                  enhancedAbout={clinic.enhancedAbout}
                  businessDescription={clinic.businessDescription}
                />
              )}

              {/* In-Page Ad - Content break */}
              {showAds && (
                <AdPlacement><InPageAd slot="7268163920" /></AdPlacement>
              )}

              {/* FAQ Section */}
              {clinic.questions && clinic.questions.length > 0 && (
                <ClinicFAQ questions={clinic.questions} />
              )}

              {/* Reviews Section */}
              <ClinicReviews
                featuredReviews={clinic.featuredReviews}
                reviewsPerScore={clinic.reviewsPerScore}
                reviewKeywords={clinic.reviewKeywords}
                totalReviews={clinic.reviewCount}
              />

              {/* Insurance & Payment Section */}
              {(clinic.insuranceAccepted.length > 0 || (clinic.paymentMethods && clinic.paymentMethods.length > 0)) && (
                <ClinicInsurance
                  insurance={clinic.insuranceAccepted}
                  paymentMethods={clinic.paymentMethods}
                />
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6 min-w-0">
              {/* Location Map */}
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyEmbeddedMap
                    clinic={clinic}
                    className="h-[250px]"
                    contactProps={{
                      clinicId: clinic.id,
                      clinicName: clinic.name,
                      clinicCity: clinic.address.city,
                      clinicState: clinic.address.state,
                    }}
                  />
                </CardContent>
              </Card>

              {/* Hours of Operation */}
              <ClinicHours hours={clinic.hours} timezone={clinic.timezone} />

              {/* Amenities */}
              {clinic.amenities && clinic.amenities.length > 0 && (
                <ClinicAmenities amenities={clinic.amenities} />
              )}

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Address */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Address
                    </p>
                    <p className="text-sm">{clinic.address.formatted}</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Phone
                    </p>
                    <a
                      href={`tel:${clinic.phone}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {clinic.phone}
                    </a>
                  </div>

                  {/* Website */}
                  {clinic.website && (
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Website
                      </p>
                      <TrackableLink
                        href={stripUrlQueryParams(clinic.website)}
                        clinicId={clinic.id}
                        clinicName={clinic.name}
                        eventType="website_click"
                        trackingEnabled={hasActiveSubscription}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 min-w-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{formatDisplayUrl(clinic.website)}</span>
                      </TrackableLink>
                    </div>
                  )}

                  {/* Email */}
                  {clinic.email && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Email
                      </p>
                      <a
                        href={`mailto:${clinic.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {clinic.email}
                      </a>
                    </div>
                  )}

                  {/* Call to Action */}
                  <div className="pt-2 space-y-2">
                    <Button asChild className="w-full">
                      <TrackableCallLink clinicId={clinic.id} clinicName={clinic.name} phone={clinic.phone} trackingEnabled={hasActiveSubscription}>
                        <Phone className="h-4 w-4" />
                        Call to Schedule
                      </TrackableCallLink>
                    </Button>
                    <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      <a
                        href="https://vaultmediainc10211905.o18.link/c?o=21483674&m=20197&a=628724&sub_aff_id=contact_btn&mo=Doctor_USA"
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat with a Doctor Online
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Full-Width Sections */}
          <div className="mt-8 space-y-8">
            {/* Claim Benefits Banner - shown for unclaimed clinics */}
            {showClaimBanner && (
              <ClaimBenefitsBanner
                clinicId={clinic.id}
                clinicName={clinic.name}
              />
            )}

            {/* Gallery Section */}
            {clinic.photos.length > 0 && (
              <ClinicGallery photos={clinic.photos} clinicName={clinic.name} />
            )}

            {/* Featured Clinics Section - Horizontal carousel below gallery */}
            <LazySearchFeaturedSection
              stateAbbrev={clinic.address.state}
              city={clinic.address.city}
              excludeClinicId={clinic.id}
              serviceIds={clinicServices.map((s) => s.serviceId)}
            />
          </div>
        </div>

      </main>
    </>
  );
}
