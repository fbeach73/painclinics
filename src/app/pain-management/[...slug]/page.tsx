import { notFound } from "next/navigation";
import { ExternalLink, Phone } from "lucide-react";
import { ClinicAbout } from "@/components/clinic/clinic-about";
import { ClinicGallery } from "@/components/clinic/clinic-gallery";
import { ClinicHeader } from "@/components/clinic/clinic-header";
import { ClinicHours } from "@/components/clinic/clinic-hours";
import { ClinicInsurance } from "@/components/clinic/clinic-insurance";
import { ClinicServices } from "@/components/clinic/clinic-services";
import { EmbeddedMap } from "@/components/map/embedded-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { transformDbClinicToType } from "@/lib/clinic-db-to-type";
import { getClinicByPermalink, getClinicsByState } from "@/lib/clinic-queries";
import {
  generateBreadcrumbStructuredData,
  generateClinicStructuredData,
} from "@/lib/structured-data";
import { US_STATES_REVERSE, getStateName } from "@/lib/us-states";
import { StatePainManagementPageContent } from "../state-page";
import type { Metadata } from "next";

// Check if a slug is a valid US state abbreviation
function isValidStateAbbrev(slug: string): boolean {
  return slug.length === 2 && slug.toUpperCase() in US_STATES_REVERSE;
}

interface Props {
  params: Promise<{ slug: string[] }>;
}

// Generate static params for state pages at build time
export async function generateStaticParams() {
  const { getAllStatesWithClinics } = await import("@/lib/clinic-queries");
  const states = await getAllStatesWithClinics();

  // Generate paths for all states with clinics
  return states.map((state) => ({
    slug: [state.toLowerCase()],
  }));
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
    };
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
  const cleanContent = clinic.content
    ?.replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

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

  // Clinic page logic
  const slugPath = slug.join("/");
  const dbClinic = await getClinicByPermalink(slugPath);

  if (!dbClinic) {
    notFound();
  }

  const clinic = transformDbClinicToType(dbClinic);
  const structuredData = generateClinicStructuredData(dbClinic);
  const breadcrumbData = generateBreadcrumbStructuredData(dbClinic);

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
          {/* Clinic Header */}
          <ClinicHeader clinic={clinic} className="mb-8" />

          {/* Main Content Grid */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              {clinic.about && <ClinicAbout about={clinic.about} />}

              {/* Services Section */}
              {clinic.services.length > 0 && (
                <ClinicServices services={clinic.services} />
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
