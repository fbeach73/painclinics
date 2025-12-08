'use client';

import Link from 'next/link';
import { ClinicCardFeatured } from '@/components/clinic/clinic-card-featured';
import { TrustIndicators } from '@/components/layout/trust-indicators';
import { ClinicMap } from '@/components/map/clinic-map';
import { GeolocationPrompt } from '@/components/map/geolocation-prompt';
import { SearchBar } from '@/components/search/search-bar';
import { Button } from '@/components/ui/button';
import { useFeaturedClinics, useNearbyClinics } from '@/hooks/use-clinics';
import { useGeolocation } from '@/hooks/use-geolocation';

export default function Home() {
  const { location, isLoading, error, permissionState, requestLocation } =
    useGeolocation();

  const nearbyClinics = useNearbyClinics(location, 50);
  const featuredClinics = useFeaturedClinics(location);

  // Show top 3 featured clinics sorted by distance
  const topFeatured = featuredClinics.slice(0, 3);

  return (
    <main className="flex-1">
      {/* Hero Map Section */}
      <section className="relative w-full h-[60vh] min-h-[400px]">
        <ClinicMap clinics={nearbyClinics} userLocation={location} />
        {(location.isDefault || permissionState === 'prompt') && (
          <GeolocationPrompt
            onEnableLocation={requestLocation}
            isLoading={isLoading}
            permissionState={permissionState}
            error={error}
          />
        )}
      </section>

      {/* Trust Indicators */}
      <TrustIndicators />

      {/* Search Section */}
      <section className="container py-8">
        <div className="max-w-2xl mx-auto">
          <SearchBar
            size="large"
            placeholder="Search clinics, services, or locations..."
            onLocationClick={requestLocation}
            isLoadingLocation={isLoading}
          />
        </div>
      </section>

      {/* Featured Clinics Section */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Featured Clinics Near You
          </h2>
          <p className="text-muted-foreground">
            Top-rated pain management clinics in your area
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {topFeatured.map((clinic) => (
            <ClinicCardFeatured key={clinic.id} clinic={clinic} />
          ))}
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/clinics">View All Clinics</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
