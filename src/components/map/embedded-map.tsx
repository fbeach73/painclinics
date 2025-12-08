'use client';

import { ExternalLink } from 'lucide-react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import { Button } from '@/components/ui/button';
import type { Clinic } from '@/types/clinic';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface EmbeddedMapProps {
  clinic: Clinic;
  className?: string;
}

export function EmbeddedMap({
  clinic,
  className = 'h-[300px] w-full',
}: EmbeddedMapProps) {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.address.formatted)}`;

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-muted rounded-lg gap-4`}>
        <p className="text-muted-foreground text-center text-sm px-4">
          Map unavailable
        </p>
        <Button asChild variant="outline" size="sm">
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Get Directions
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`${className} rounded-lg overflow-hidden`}>
        <Map
          initialViewState={{
            longitude: clinic.coordinates.lng,
            latitude: clinic.coordinates.lat,
            zoom: 15,
          }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          interactive={false}
          reuseMaps
        >
          <NavigationControl position="top-right" showCompass={false} />

          <Marker
            longitude={clinic.coordinates.lng}
            latitude={clinic.coordinates.lat}
            anchor="bottom"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-md">
              <svg
                className="h-4 w-4 text-primary-foreground"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
          </Marker>
        </Map>
      </div>

      <Button asChild variant="outline" className="w-full">
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 mr-2" />
          Get Directions
        </a>
      </Button>
    </div>
  );
}
