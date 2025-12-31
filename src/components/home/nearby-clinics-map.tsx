'use client';

import { useState, useRef, useCallback } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ClinicMap } from '@/components/map/clinic-map';
import { GeolocationPrompt } from '@/components/map/geolocation-prompt';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useNearbyClinics } from '@/hooks/use-nearby-clinics';
import type { UserLocation } from '@/types/clinic';

export function NearbyClinicsMap() {
  const sectionRef = useRef<HTMLElement>(null);
  const { location: userLocation, isLoading: isLoadingLocation, error, permissionState, requestLocation, searchLocation } =
    useGeolocation();
  const [promptDismissed, setPromptDismissed] = useState(false);

  // Track the map's search center separately from user's location
  // This allows users to drag the map to explore different areas
  const [mapCenter, setMapCenter] = useState<UserLocation | null>(null);

  // Use map center for fetching clinics if user has dragged, otherwise use user location
  const searchLocationForClinics = mapCenter || userLocation;
  const { clinics, isLoading: isLoadingClinics, error: clinicsError } = useNearbyClinics(searchLocationForClinics, 50);

  const showPrompt = !promptDismissed && (userLocation.isDefault || permissionState === 'prompt');
  const isLoading = isLoadingLocation || isLoadingClinics;
  const hasError = error || clinicsError;

  // Handle map drag - update search center to fetch clinics in new area
  const handleMapMoveEnd = useCallback((center: { lat: number; lng: number }) => {
    // Only update if the center has moved significantly (more than ~1 mile)
    const currentCenter = mapCenter?.coordinates || userLocation.coordinates;
    const latDiff = Math.abs(center.lat - currentCenter.lat);
    const lngDiff = Math.abs(center.lng - currentCenter.lng);

    // ~0.015 degrees is roughly 1 mile
    if (latDiff > 0.015 || lngDiff > 0.015) {
      setMapCenter({
        coordinates: { lat: center.lat, lng: center.lng },
        isDefault: false,
      });
      // Dismiss the prompt once user starts exploring
      setPromptDismissed(true);
    }
  }, [mapCenter, userLocation.coordinates]);

  const scrollToMap = useCallback(() => {
    // Small delay to allow the map to start updating before scrolling
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const handleSearchLocation = useCallback((query: string) => {
    searchLocation(query);
    // Dismiss the prompt after successful search
    setPromptDismissed(true);
    // Scroll to map section
    scrollToMap();
  }, [searchLocation, scrollToMap]);

  const handleEnableLocation = useCallback(() => {
    requestLocation();
    // Scroll to map section after requesting location
    scrollToMap();
  }, [requestLocation, scrollToMap]);

  return (
    <section ref={sectionRef} className="relative w-full h-[50vh] md:h-[62vh] min-h-[350px]">
      {isLoading && clinics.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ClinicMap
          clinics={clinics}
          userLocation={userLocation}
          onMapMoveEnd={handleMapMoveEnd}
          isLoadingClinics={isLoadingClinics}
          className="h-full w-full"
        />
      )}
      {hasError && !showPrompt && (
        <div className="absolute top-4 left-4 right-4 z-10 max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {clinicsError || error || 'Unable to load nearby clinics. Please try again.'}
            </AlertDescription>
          </Alert>
        </div>
      )}
      {showPrompt && (
        <GeolocationPrompt
          onEnableLocation={handleEnableLocation}
          onSearchLocation={handleSearchLocation}
          onClose={() => setPromptDismissed(true)}
          isLoading={isLoadingLocation}
          permissionState={permissionState}
          error={error}
        />
      )}
    </section>
  );
}
