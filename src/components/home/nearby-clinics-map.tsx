'use client';

import { useState, useRef, useCallback } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClinicMap } from '@/components/map/clinic-map';
import { GeolocationPrompt } from '@/components/map/geolocation-prompt';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useNearbyClinics } from '@/hooks/use-nearby-clinics';

export function NearbyClinicsMap() {
  const sectionRef = useRef<HTMLElement>(null);
  const { location, isLoading: isLoadingLocation, error, permissionState, requestLocation, searchLocation } =
    useGeolocation();
  const [promptDismissed, setPromptDismissed] = useState(false);

  const { clinics, isLoading: isLoadingClinics, error: clinicsError } = useNearbyClinics(location, 50);

  const showPrompt = !promptDismissed && (location.isDefault || permissionState === 'prompt');
  const isLoading = isLoadingLocation || isLoadingClinics;
  const hasError = error || clinicsError;

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
    <section ref={sectionRef} className="relative w-full h-[50vh] min-h-[350px]">
      {isLoading && clinics.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ClinicMap
          clinics={clinics}
          userLocation={location}
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
