'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Map, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Simple marker type for the state map
export interface StateClinicMarker {
  id: string;
  title: string;
  lat: number;
  lng: number;
  city: string;
  permalink: string;
}

interface StateMapToggleProps {
  clinics: StateClinicMarker[];
  stateName: string;
}

// Loading skeleton for the map
function MapSkeleton() {
  return (
    <div className="h-[400px] bg-muted/50 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-primary/60" />
        </div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  );
}

// Lazy load the actual map component
const LazyStateMap = dynamic(
  () => import('./state-clinics-map').then((mod) => mod.StateClinicsMap),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

export function StateMapToggle({ clinics, stateName }: StateMapToggleProps) {
  const [showMap, setShowMap] = useState(false);

  // Only show the toggle if there are clinics with coordinates
  const clinicsWithCoords = clinics.filter((c) => c.lat && c.lng);
  if (clinicsWithCoords.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex gap-2 mb-4">
        <Button
          variant={showMap ? 'default' : 'outline'}
          onClick={() => setShowMap(!showMap)}
          className="gap-2"
        >
          <Map className="h-4 w-4" />
          {showMap ? 'Hide Map' : 'View on Map'}
        </Button>
        {showMap && (
          <span className="text-sm text-muted-foreground self-center">
            Showing {clinicsWithCoords.length} clinics in {stateName}
          </span>
        )}
      </div>

      {showMap && (
        <div className="h-[400px] md:h-[500px] rounded-lg overflow-hidden border">
          <LazyStateMap clinics={clinicsWithCoords} />
        </div>
      )}
    </div>
  );
}
