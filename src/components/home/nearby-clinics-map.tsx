'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ClinicMap } from '@/components/map/clinic-map';
import { GeolocationPrompt } from '@/components/map/geolocation-prompt';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useNearbyClinics } from '@/hooks/use-nearby-clinics';

export function NearbyClinicsMap() {
  const { location, isLoading: isLoadingLocation, error, permissionState, requestLocation, searchLocation } =
    useGeolocation();
  const [promptDismissed, setPromptDismissed] = useState(false);

  const { clinics, isLoading: isLoadingClinics } = useNearbyClinics(location, 50);

  const showPrompt = !promptDismissed && (location.isDefault || permissionState === 'prompt');
  const isLoading = isLoadingLocation || isLoadingClinics;

  const handleSearchLocation = (query: string) => {
    searchLocation(query);
    // Dismiss the prompt after successful search
    setPromptDismissed(true);
  };

  return (
    <section className="relative w-full h-[50vh] min-h-[350px]">
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
      {showPrompt && (
        <GeolocationPrompt
          onEnableLocation={requestLocation}
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
