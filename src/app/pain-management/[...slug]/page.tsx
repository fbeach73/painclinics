// import { headers } from "next/headers"; // Temporarily unused while auth is disabled
import { notFound } from "next/navigation";
import { ExternalLink, Phone } from "lucide-react";
import { ClinicAbout } from "@/components/clinic/clinic-about";
import { ClaimBenefitsBanner } from "@/components/clinic/claim-benefits-banner";
import { ClinicGallery } from "@/components/clinic/clinic-gallery";
import { ClinicHeader } from "@/components/clinic/clinic-header";
import { ClinicHours } from "@/components/clinic/clinic-hours";
import { ClinicInsurance } from "@/components/clinic/clinic-insurance";
import { ClinicServicesLegacy } from "@/components/clinic/clinic-services";
import { EmbeddedMap } from "@/components/map/embedded-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Dynamic import to avoid module-level errors
// import { auth } from "@/lib/auth";
import { transformDbClinicToType } from "@/lib/clinic-db-to-type";
import {
  getClinicByPermalink,
  getClinicsByState,
  getClinicsByCity,
} from "@/lib/clinic-queries";
import { stripHtmlTags } from "@/lib/html-utils";
import {
  generateBreadcrumbStructuredData,
  generateClinicStructuredData,
  generateCityPageSchema,
} from "@/lib/structured-data";
import { US_STATES_REVERSE, getStateName } from "@/lib/us-states";
import { CityPainManagementPageContent } from "../city-page";
import { StatePainManagementPageContent } from "../state-page";
import type { Metadata } from "next";

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
}

// Generate static params for state and city pages at build time
export async function generateStaticParams() {
  try {
    const { getAllStatesWithClinics, getAllCitiesWithClinics } = await import(
      "@/lib/clinic-queries"
    );
    const states = await getAllStatesWithClinics();

    // Generate paths for all states with clinics
    const stateParams = states.map((state) => ({
      slug: [state.toLowerCase()],
    }));

    // Generate paths for all cities with clinics
    const cities = await getAllCitiesWithClinics();
    const cityParams = cities.map((c) => ({
      slug: [
        c.stateAbbreviation!.toLowerCase(),
        c.city.toLowerCase().replace(/\s+/g, "-"),
      ],
    }));

    return [...stateParams, ...cityParams];
  } catch (error) {
    // If database is unavailable (e.g., in CI), return empty array
    // Pages will be generated on-demand at runtime instead
    console.warn("generateStaticParams: Database unavailable, skipping static generation:", error);
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

  // Check if this is a state page (single segment, 2-char state abbrev)
  const firstSlug = slug[0];
  if (slug.length === 1 && firstSlug && isValidStateAbbrev(firstSlug)) {
    const stateAbbrev = firstSlug.toUpperCase();
    const stateName = getStateName(stateAbbrev);
    const stateClinics = await getClinicsByState(stateAbbrev);

    const title = `Pain Management Clinics in ${stateName} | ${stateClinics.length} Verified Clinics`;
    const description = `Find top-rated pain management clinics in ${stateName}. Browse ${stateClinics.length} verified clinics, read patient reviews, and schedule appointments for pain relief.`;
    const canonicalUrl = `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/`;

    // Calculate average coordinates for state centroid
    const clinicsWithCoords = stateClinics.filter(
      (c) => c.mapLatitude && c.mapLongitude
    );
    const avgLat =
      clinicsWithCoords.length > 0
        ? clinicsWithCoords.reduce((sum, c) => sum + (c.mapLatitude || 0), 0) /
          clinicsWithCoords.length
        : null;
    const avgLng =
      clinicsWithCoords.length > 0
        ? clinicsWithCoords.reduce((sum, c) => sum + (c.mapLongitude || 0), 0) /
          clinicsWithCoords.length
        : null;

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
        siteName: "Pain Clinics Directory",
      },
      twitter: {
        card: "summary",
        title,
        description,
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
        "geo.region": `US-${stateAbbrev}`,
        "geo.placename": stateName,
        ...(avgLat && avgLng
          ? {
              "geo.position": `${avgLat.toFixed(4)};${avgLng.toFixed(4)}`,
              ICBM: `${avgLat.toFixed(4)}, ${avgLng.toFixed(4)}`,
            }
          : {}),
      },
    };
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
      const cityClinics = await getClinicsByCity(cityName, stateAbbrev);

      if (cityClinics.length > 0) {
        const title = `Pain Management Clinics in ${cityName}, ${stateAbbrev} | ${cityClinics.length} Verified Clinics`;
        const description = `Find top-rated pain management clinics in ${cityName}, ${stateName}. Browse ${cityClinics.length} verified clinic${cityClinics.length !== 1 ? "s" : ""}, read patient reviews, and schedule appointments.`;
        const canonicalUrl = `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/${citySlug}/`;

        // Calculate average coordinates for city centroid
        const clinicsWithCoords = cityClinics.filter(
          (c) => c.mapLatitude && c.mapLongitude
        );
        const avgLat =
          clinicsWithCoords.length > 0
            ? clinicsWithCoords.reduce((sum, c) => sum + (c.mapLatitude || 0), 0) /
              clinicsWithCoords.length
            : null;
        const avgLng =
          clinicsWithCoords.length > 0
            ? clinicsWithCoords.reduce((sum, c) => sum + (c.mapLongitude || 0), 0) /
              clinicsWithCoords.length
            : null;

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
            siteName: "Pain Clinics Directory",
          },
          twitter: {
            card: "summary",
            title,
            description,
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
            "geo.region": `US-${stateAbbrev}`,
            "geo.placename": `${cityName}, ${stateAbbrev}`,
            ...(avgLat && avgLng
              ? {
                  "geo.position": `${avgLat.toFixed(4)};${avgLng.toFixed(4)}`,
                  ICBM: `${avgLat.toFixed(4)}, ${avgLng.toFixed(4)}`,
                }
              : {}),
          },
        };
      }
    }
  }

  // Clinic page metadata
  const slugPath = slug.join("/");
  const clinic = await getClinicByPermalink(slugPath);

  if (!clinic) {
    return {
      title: "Clinic Not Found",
      description: "The pain management clinic you're looking for could not be found.",
    };
  }

  const title = `${clinic.title} - Pain Management in ${clinic.city}, ${clinic.stateAbbreviation || clinic.state}`;

  // Clean description - remove HTML tags
  const cleanContent = clinic.content ? stripHtmlTags(clinic.content) : null;

  const description =
    cleanContent?.substring(0, 160) ||
    `${clinic.title} provides pain management services in ${clinic.city}, ${clinic.stateAbbreviation || clinic.state}. Call ${clinic.phone} for appointments.`;

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
      siteName: "Pain Clinics Directory",
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

export default async function PainManagementClinicPage({ params }: Props) {
  const { slug } = await params;

  // Check if this is a state page (single segment, 2-char state abbrev)
  const firstSlug = slug[0];
  if (slug.length === 1 && firstSlug && isValidStateAbbrev(firstSlug)) {
    const stateAbbrev = firstSlug.toUpperCase();
    const stateName = getStateName(stateAbbrev);
    const stateClinics = await getClinicsByState(stateAbbrev);

    // If no clinics in state, show 404
    if (stateClinics.length === 0) {
      notFound();
    }

    // Group clinics by city
    const clinicsByCity: Record<string, typeof stateClinics> = {};
    for (const clinic of stateClinics) {
      const city = clinic.city;
      if (!clinicsByCity[city]) {
        clinicsByCity[city] = [];
      }
      clinicsByCity[city].push(clinic);
    }

    const cityCount = Object.keys(clinicsByCity).length;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

    // Generate state page structured data
    const stateStructuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Pain Management Clinics in ${stateName}`,
      description: `Find top-rated pain management clinics in ${stateName}. Browse ${stateClinics.length} verified clinics across ${cityCount} cities.`,
      url: `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: stateClinics.length,
        itemListElement: stateClinics.slice(0, 10).map((clinic, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "MedicalBusiness",
            name: clinic.title,
            address: {
              "@type": "PostalAddress",
              addressLocality: clinic.city,
              addressRegion: clinic.stateAbbreviation,
              postalCode: clinic.postalCode,
            },
            url: `${baseUrl}/${clinic.permalink}/`,
          },
        })),
      },
    };

    const breadcrumbData = {
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
          name: "Clinics",
          item: `${baseUrl}/clinics`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: stateName,
          item: `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/`,
        },
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(stateStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
        />
        <StatePainManagementPageContent
          stateName={stateName}
          stateAbbrev={stateAbbrev}
          clinicsByCity={clinicsByCity}
          totalClinics={stateClinics.length}
          cityCount={cityCount}
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
      const cityClinics = await getClinicsByCity(cityName, stateAbbrev);

      // If no clinics in city, show 404
      if (cityClinics.length === 0) {
        notFound();
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

      // Generate city page structured data
      const cityStructuredData = generateCityPageSchema(
        cityName,
        stateAbbrev,
        stateName,
        cityClinics,
        baseUrl
      );

      const breadcrumbData = {
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
            name: "Clinics",
            item: `${baseUrl}/clinics`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: stateName,
            item: `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: cityName,
            item: `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/${citySlug}/`,
          },
        ],
      };

      // Transform clinics to the expected format for the city page component
      const clinicSummaries = cityClinics.map((clinic) => ({
        id: clinic.id,
        title: clinic.title,
        permalink: clinic.permalink,
        city: clinic.city,
        stateAbbreviation: clinic.stateAbbreviation,
        phone: clinic.phone,
        rating: clinic.rating,
        reviewCount: clinic.reviewCount,
        streetAddress: clinic.streetAddress,
        postalCode: clinic.postalCode,
      }));

      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(cityStructuredData),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
          />
          <CityPainManagementPageContent
            cityName={cityName}
            stateName={stateName}
            stateAbbrev={stateAbbrev}
            clinics={clinicSummaries}
          />
        </>
      );
    }
  }

  // Clinic page logic
  const slugPath = slug.join("/");
  const dbClinic = await getClinicByPermalink(slugPath);

  if (!dbClinic) {
    notFound();
  }

  // Temporarily skip auth check to diagnose 500 errors
  const currentUserId: string | null = null;
  // TODO: Re-enable after fixing 500 errors
  // try {
  //   const { auth } = await import("@/lib/auth");
  //   const session = await auth.api.getSession({ headers: await headers() });
  //   currentUserId = session?.user?.id || null;
  // } catch (error) {
  //   console.error("Failed to get session:", error);
  // }

  const clinic = transformDbClinicToType(dbClinic);
  const structuredData = generateClinicStructuredData(dbClinic);
  const breadcrumbData = generateBreadcrumbStructuredData(dbClinic);

  // Determine if we should show the claim benefits banner
  // Only show if the clinic is not owned and the current user doesn't own it
  const isOwned = !!clinic.ownerUserId;
  const isOwnedByCurrentUser = !!(currentUserId && clinic.ownerUserId === currentUserId);
  const showClaimBanner = !isOwned && !isOwnedByCurrentUser;

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

      <main className="flex-1">
        <div className="container py-8">
          {/* Claim Benefits Banner - shown for unclaimed clinics */}
          {showClaimBanner && (
            <ClaimBenefitsBanner
              clinicId={clinic.id}
              clinicName={clinic.name}
              className="mb-8"
            />
          )}

          {/* Clinic Header */}
          <ClinicHeader clinic={clinic} currentUserId={currentUserId} className="mb-8" />

          {/* Main Content Grid */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              {clinic.about && <ClinicAbout about={clinic.about} />}

              {/* Services Section */}
              {clinic.services.length > 0 && (
                <ClinicServicesLegacy services={clinic.services} />
              )}

              {/* Insurance Section */}
              {clinic.insuranceAccepted.length > 0 && (
                <ClinicInsurance insurance={clinic.insuranceAccepted} />
              )}

              {/* Gallery Section */}
              {clinic.photos.length > 0 && (
                <ClinicGallery photos={clinic.photos} clinicName={clinic.name} />
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
                  <EmbeddedMap clinic={clinic} className="h-[250px]" />
                </CardContent>
              </Card>

              {/* Hours of Operation */}
              <ClinicHours hours={clinic.hours} />

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
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Website
                      </p>
                      <a
                        href={clinic.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {clinic.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
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
        </div>
      </main>
    </>
  );
}
