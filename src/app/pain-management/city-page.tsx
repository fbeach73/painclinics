"use client";

import Link from "next/link";
import { MapPin, Phone, Star, Building2, ChevronRight } from "lucide-react";
import { FeaturedBadge, type FeaturedTier } from "@/components/clinic/featured-badge";
import { OpenClosedStatus } from "@/components/clinic/open-closed-status";
import { SearchFeaturedSection } from "@/components/featured";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ClinicSummary {
  id: string;
  title: string;
  permalink: string;
  city: string;
  stateAbbreviation: string | null;
  phone: string | null;
  rating: number | null;
  reviewCount: number | null;
  streetAddress: string | null;
  postalCode: string;
  clinicHours: unknown; // JSONB from database
  timezone: string | null; // IANA timezone for accurate open/closed status
  isFeatured: boolean | null;
  featuredTier: string | null;
}

interface CityPainManagementPageProps {
  cityName: string;
  stateName: string;
  stateAbbrev: string;
  clinics: ClinicSummary[];
}

export function CityPainManagementPageContent({
  cityName,
  stateName,
  stateAbbrev,
  clinics,
}: CityPainManagementPageProps) {
  return (
    <main className="flex-1">
      <div className="container mx-auto py-8 md:py-12">
        {/* Semantic Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="h-4 w-4" />
            </li>
            <li>
              <Link href="/clinics" className="hover:text-primary">
                Clinics
              </Link>
            </li>
            <li>
              <ChevronRight className="h-4 w-4" />
            </li>
            <li>
              <Link
                href={`/pain-management/${stateAbbrev.toLowerCase()}/`}
                className="hover:text-primary"
              >
                {stateName}
              </Link>
            </li>
            <li>
              <ChevronRight className="h-4 w-4" />
            </li>
            <li>
              <span aria-current="page">{cityName}</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Pain Management Clinics in {cityName}, {stateAbbrev}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Find top-rated pain management clinics in {cityName}, {stateName}.
            Browse {clinics.length.toLocaleString()} verified clinic
            {clinics.length !== 1 ? "s" : ""}, read patient reviews, and
            schedule appointments for pain relief.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {clinics.length.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {clinics.length === 1 ? "Clinic" : "Clinics"} in {cityName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stateName}</p>
                  <p className="text-sm text-muted-foreground">State</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {clinics.filter((c) => c.rating && c.rating >= 4).length}
                  </p>
                  <p className="text-sm text-muted-foreground">4+ Star Rated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Clinics Section */}
        <SearchFeaturedSection stateAbbrev={stateAbbrev} city={cityName} />

        {/* Clinic List with Microdata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              All Clinics in {cityName}
              <Badge variant="secondary" className="ml-2">
                {clinics.length} clinic{clinics.length !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clinics.map((clinic) => {
                const featuredTier = (clinic.isFeatured && clinic.featuredTier)
                  ? (clinic.featuredTier as FeaturedTier)
                  : 'none';

                return (
                <Link
                  key={clinic.id}
                  href={`/${clinic.permalink}/`}
                  className={cn(
                    "block p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
                    featuredTier === 'premium' && "border-featured-border bg-featured ring-1 ring-featured-border/50",
                    featuredTier === 'basic' && "border-yellow-200 bg-yellow-50/20 dark:border-yellow-800/50 dark:bg-yellow-950/10"
                  )}
                  itemScope
                  itemType="https://schema.org/MedicalBusiness"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                      className="font-medium line-clamp-2"
                      itemProp="name"
                    >
                      {clinic.title}
                    </h3>
                    <FeaturedBadge tier={featuredTier} size="sm" className="flex-shrink-0" />
                  </div>
                  {/* Open/Closed Status */}
                  <OpenClosedStatus clinicHours={clinic.clinicHours} timezone={clinic.timezone} className="mb-2" />
                  {clinic.rating !== null && clinic.rating > 0 && (
                    <div
                      className="flex items-center gap-1 mb-2"
                      itemProp="aggregateRating"
                      itemScope
                      itemType="https://schema.org/AggregateRating"
                    >
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium" itemProp="ratingValue">
                        {clinic.rating.toFixed(1)}
                      </span>
                      {clinic.reviewCount !== null && clinic.reviewCount > 0 && (
                        <span className="text-sm text-muted-foreground">
                          (<span itemProp="reviewCount">{clinic.reviewCount}</span>{" "}
                          reviews)
                        </span>
                      )}
                      <meta itemProp="bestRating" content="5" />
                      <meta itemProp="worstRating" content="1" />
                    </div>
                  )}
                  <address
                    className="not-italic text-sm text-muted-foreground"
                    itemProp="address"
                    itemScope
                    itemType="https://schema.org/PostalAddress"
                  >
                    {clinic.streetAddress && (
                      <p className="line-clamp-1" itemProp="streetAddress">
                        {clinic.streetAddress}
                      </p>
                    )}
                    <p>
                      <span itemProp="addressLocality">{clinic.city}</span>,{" "}
                      <span itemProp="addressRegion">
                        {clinic.stateAbbreviation}
                      </span>{" "}
                      <span itemProp="postalCode">{clinic.postalCode}</span>
                    </p>
                  </address>
                  {clinic.phone && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-primary">
                      <Phone className="h-3.5 w-3.5" />
                      <span itemProp="telephone">{clinic.phone}</span>
                    </div>
                  )}
                  <meta
                    itemProp="url"
                    content={`${typeof window !== "undefined" ? window.location.origin : ""}/${clinic.permalink}/`}
                  />
                </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Back to State Link */}
        <div className="mt-8">
          <Link
            href={`/pain-management/${stateAbbrev.toLowerCase()}/`}
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            View all clinics in {stateName}
          </Link>
        </div>
      </div>
    </main>
  );
}
