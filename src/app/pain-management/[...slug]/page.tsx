import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, ExternalLink, Phone } from "lucide-react";
import { InPageAd, AdPlacement } from "@/components/ads";
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
import { ClinicInsurance } from "@/components/clinic/clinic-insurance";
import { ClinicReviews } from "@/components/clinic/clinic-reviews";
import { ClinicServicesLegacy } from "@/components/clinic/clinic-services";
import { ContactClinicButton } from "@/components/clinic/contact-clinic-button";
import { LazySearchFeaturedSection } from "@/components/featured/lazy-search-featured-section";
import { LazyEmbeddedMap } from "@/components/map/lazy-embedded-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { transformDbClinicToType } from "@/lib/clinic-db-to-type";
import {
  getClinicByPermalink,
  getClinicByLegacySlug,
  getClinicByStrippedSlug,
  getClinicsByState,
  getClinicsByCity,
} from "@/lib/clinic-queries";
import { getClinicServices } from "@/lib/clinic-services-queries";
import { parseFilters } from "@/lib/directory/filters";
import { generateFilteredMeta } from "@/lib/directory/meta";
import { getFilteredClinics } from "@/lib/directory/queries";
import { stripHtmlTags } from "@/lib/html-utils";
import {
  generateBreadcrumbStructuredData,
  generateClinicStructuredData,
  generateFAQStructuredData,
} from "@/lib/structured-data";
import { US_STATES_REVERSE, getStateName } from "@/lib/us-states";
import { formatDisplayUrl, stripUrlQueryParams } from "@/lib/utils";
import { CityPainManagementPageContent } from "../city-page";
import { StatePainManagementPageContent } from "../state-page";
import type { Metadata } from "next";

// Revalidate clinic pages weekly to reduce Vercel ISR costs
// Use on-demand revalidation via admin actions for immediate updates
// 1 week cache (604800 seconds) - only ~750 ISR writes/day vs 120K+/day at 1 hour
export const revalidate = 604800;

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
  const title = `${clinic.title} - Pain Management in ${clinic.city}, ${stateName}`;

  // Clean description - remove HTML tags
  const cleanContent = clinic.content ? stripHtmlTags(clinic.content) : null;

  const description =
    cleanContent?.substring(0, 160) ||
    `${clinic.title} provides pain management services in ${clinic.city}, ${stateName}. Call ${clinic.phone} for appointments.`;

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
  const { slug } = await params;
  const searchParams = await searchParamsPromise;

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

  // Clinic page logic
  const slugPath = slug.join("/");
  const dbClinic = await getClinicByPermalink(slugPath);

  // If not found, check if slug ends with -N suffix (e.g., -2, -3)
  // This handles legacy duplicate clinic URLs that should redirect to canonical
  if (!dbClinic) {
    const strippedResult = await getClinicByStrippedSlug(slugPath);
    if (strippedResult) {
      // Redirect to canonical URL without the -N suffix (301 permanent redirect)
      redirect(`/pain-management/${strippedResult.canonicalSlug}`);
    }
  }

  // If not found, check if slug ends with a 4-digit zip (missing leading zero)
  // Old WordPress URLs for states like NJ, MA, CT had zips like 8034 instead of 08034
  if (!dbClinic && slug.length === 1 && slug[0]) {
    const zipMatch = slug[0].match(/^(.+)-([a-z]{2})-(\d{4})$/i);
    if (zipMatch && zipMatch[1] && zipMatch[2] && zipMatch[3]) {
      const paddedSlug = `${zipMatch[1]}-${zipMatch[2].toLowerCase()}-0${zipMatch[3]}`;
      const paddedClinic = await getClinicByPermalink(paddedSlug);
      if (paddedClinic && paddedClinic.permalink) {
        const newPath = paddedClinic.permalink.replace(/^pain-management\//, "");
        redirect(`/pain-management/${newPath}`);
      }
    }
  }

  // If still not found and single segment, try legacy WordPress slug format
  // Legacy format: {clinic-name-slug}-{state}-{zipcode} e.g. "open-arms-pain-clinic-co-80909"
  if (!dbClinic && slug.length === 1 && slug[0]) {
    const legacyClinic = await getClinicByLegacySlug(slug[0]);
    if (legacyClinic && legacyClinic.permalink) {
      // Redirect to the canonical URL (301 permanent redirect)
      const newPath = legacyClinic.permalink.replace(/^pain-management\//, "");
      redirect(`/pain-management/${newPath}`);
    }
  }

  if (!dbClinic) {
    notFound();
  }

  // Fetch services from junction table
  const clinicServices = await getClinicServices(dbClinic.id);

  // Add services to the clinic record for transformation
  const dbClinicWithServices = {
    ...dbClinic,
    clinicServices,
  };

  const clinic = transformDbClinicToType(dbClinicWithServices);
  const structuredData = generateClinicStructuredData(dbClinicWithServices);
  const breadcrumbData = generateBreadcrumbStructuredData(dbClinicWithServices);

  // Generate FAQ structured data if questions exist
  const faqStructuredData = clinic.questions?.length
    ? generateFAQStructuredData(clinic.questions)
    : null;

  // Show claim banner only for unclaimed clinics
  // The ClaimBenefitsBanner handles user-specific logic client-side
  const showClaimBanner = !clinic.ownerUserId;

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

      {/* Analytics tracking for clinic views */}
      <PageTracker clinicId={clinic.id} />

      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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

              {/* In-Page Ad - Above fold for better viewability */}
              <AdPlacement className="mt-4 mb-6">
                <InPageAd />
              </AdPlacement>

              <ClinicHeader clinic={clinic} />
              {clinic.services.length > 0 && (
                <div>
                  <ClinicServicesLegacy services={clinic.services} />
                </div>
              )}
            </div>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <ClinicHeroImage
                src={dbClinic.imageFeatured || dbClinic.imageUrl}
                alt={clinic.name}
                priority
              />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section - use enhanced if available */}
              {(clinic.about || clinic.enhancedAbout) && (
                <ClinicAbout
                  about={clinic.about}
                  enhancedAbout={clinic.enhancedAbout}
                />
              )}

              {/* In-Page Ad - Content break */}
              <AdPlacement>
                <InPageAd />
              </AdPlacement>

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

              {/* Insurance Section */}
              {clinic.insuranceAccepted.length > 0 && (
                <ClinicInsurance insurance={clinic.insuranceAccepted} />
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Location Map */}
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyEmbeddedMap clinic={clinic} className="h-[250px]" />
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
                      <a
                        href={stripUrlQueryParams(clinic.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 min-w-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{formatDisplayUrl(clinic.website)}</span>
                      </a>
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
                  <div className="pt-2">
                    <Button asChild className="w-full">
                      <a href={`tel:${clinic.phone}`}>
                        <Phone className="h-4 w-4" />
                        Call to Schedule
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
            />
          </div>
        </div>

        {/* Contact Clinic CTA - sticky floating button */}
        <ContactClinicButton
          clinicId={clinic.id}
          clinicName={clinic.name}
          clinicCity={clinic.address.city}
          clinicState={clinic.address.state}
        />
      </main>
    </>
  );
}
