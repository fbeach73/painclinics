'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

// Dynamic import for the map component (client-side only)
const NearbyClinicsMap = dynamic(
  () => import('./nearby-clinics-map').then((mod) => mod.NearbyClinicsMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[50vh] min-h-[350px] bg-muted/50 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export function NearbyClinicsSection() {
  return <NearbyClinicsMap />;
}
