"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapPin, Phone, Star, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { transformClinicHours } from "@/lib/clinic-db-to-type";
import type { ClinicHour } from "@/lib/clinic-transformer";
import { isCurrentlyOpen } from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import { SearchFeaturedSection } from "@/components/featured";

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
}

/**
 * Component to display open/closed status with colored indicator dot.
 */
function OpenClosedStatus({ clinicHours }: { clinicHours: unknown }) {
  const status = useMemo(() => {
    const hours = transformClinicHours(clinicHours as ClinicHour[] | null);
    return isCurrentlyOpen(hours);
  }, [clinicHours]);

  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span
        className={cn(
          "h-2 w-2 rounded-full flex-shrink-0",
          status.isOpen ? "bg-green-500" : "bg-red-500"
        )}
      />
      <span
        className={cn(
          "text-xs",
          status.isOpen ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
        )}
      >
        {status.isOpen ? "Open" : "Closed"}
      </span>
    </div>
  );
}

interface StatePainManagementPageProps {
  stateName: string;
  stateAbbrev: string;
  clinicsByCity: Record<string, ClinicSummary[]>;
  totalClinics: number;
  cityCount: number;
}

export function StatePainManagementPageContent({
  stateName,
  stateAbbrev,
  clinicsByCity,
  totalClinics,
  cityCount,
}: StatePainManagementPageProps) {
  const cities = Object.keys(clinicsByCity).sort();

  return (
    <main className="flex-1">
      <div className="container mx-auto py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span>/</span>
            <Link href="/clinics" className="hover:text-primary">
              Clinics
            </Link>
            <span>/</span>
            <span>{stateName}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Pain Management Clinics in {stateName}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Find top-rated pain management clinics in {stateName}. Browse{" "}
            {totalClinics.toLocaleString()} verified clinics across {cityCount}{" "}
            cities, read patient reviews, and schedule appointments.
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
                    {totalClinics.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Clinics
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
                  <p className="text-2xl font-bold">{cityCount}</p>
                  <p className="text-sm text-muted-foreground">Cities Served</p>
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
                  <p className="text-2xl font-bold">{stateAbbrev}</p>
                  <p className="text-sm text-muted-foreground">State Code</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Clinics Section */}
        <SearchFeaturedSection stateAbbrev={stateAbbrev} />

        {/* Cities List */}
        <div className="space-y-8">
          {cities.map((city) => {
            const cityClinics = clinicsByCity[city] ?? [];
            return (
            <section key={city} id={city.toLowerCase().replace(/\s+/g, "-")}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {city}, {stateAbbrev}
                    <Badge variant="secondary" className="ml-2">
                      {cityClinics.length} clinic
                      {cityClinics.length !== 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cityClinics.map((clinic) => (
                      <Link
                        key={clinic.id}
                        href={`/${clinic.permalink}/`}
                        className="block p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <h3 className="font-medium line-clamp-2 mb-2">
                          {clinic.title}
                        </h3>
                        {/* Open/Closed Status */}
                        <OpenClosedStatus clinicHours={clinic.clinicHours} />
                        {clinic.rating && clinic.rating > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {clinic.rating.toFixed(1)}
                            </span>
                            {clinic.reviewCount && clinic.reviewCount > 0 && (
                              <span className="text-sm text-muted-foreground">
                                ({clinic.reviewCount} reviews)
                              </span>
                            )}
                          </div>
                        )}
                        {clinic.streetAddress && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {clinic.streetAddress}
                          </p>
                        )}
                        {clinic.phone && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-primary">
                            <Phone className="h-3.5 w-3.5" />
                            {clinic.phone}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          );
          })}
        </div>

        {/* City Quick Nav */}
        {cities.length > 5 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <Link
                    key={city}
                    href={`#${city.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
