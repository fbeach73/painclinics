'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import { MapPin } from 'lucide-react';
import type { StateClinicMarker } from './state-map-toggle';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface StateClinicsMapProps {
  clinics: StateClinicMarker[];
}

// Calculate bounds to fit all markers
function calculateBounds(clinics: StateClinicMarker[]) {
  if (clinics.length === 0) {
    // Default to center of US
    return {
      center: { lat: 39.8283, lng: -98.5795 },
      zoom: 4,
    };
  }

  const lats = clinics.map((c) => c.lat);
  const lngs = clinics.map((c) => c.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Calculate zoom based on spread
  const latSpread = maxLat - minLat;
  const lngSpread = maxLng - minLng;
  const maxSpread = Math.max(latSpread, lngSpread);

  // Rough zoom calculation - adjust based on spread
  let zoom = 6;
  if (maxSpread > 10) zoom = 4;
  else if (maxSpread > 5) zoom = 5;
  else if (maxSpread > 2) zoom = 6;
  else if (maxSpread > 1) zoom = 7;
  else if (maxSpread > 0.5) zoom = 8;
  else zoom = 9;

  return {
    center: { lat: centerLat, lng: centerLng },
    zoom,
  };
}

export function StateClinicsMap({ clinics }: StateClinicsMapProps) {
  const [selectedClinic, setSelectedClinic] = useState<StateClinicMarker | null>(
    null
  );

  const { center, zoom } = useMemo(() => calculateBounds(clinics), [clinics]);

  const handleMarkerClick = useCallback((clinic: StateClinicMarker) => {
    setSelectedClinic(clinic);
  }, []);

  const handlePopupClose = useCallback(() => {
    setSelectedClinic(null);
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-full w-full bg-muted/50 flex items-center justify-center">
        <p className="text-muted-foreground">Map unavailable</p>
      </div>
    );
  }

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: center.lng,
        latitude: center.lat,
        zoom: zoom,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      reuseMaps
    >
      <NavigationControl position="top-right" />

      {clinics.map((clinic) => (
        <Marker
          key={clinic.id}
          longitude={clinic.lng}
          latitude={clinic.lat}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            handleMarkerClick(clinic);
          }}
        >
          <div className="cursor-pointer transform hover:scale-110 transition-transform">
            <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-md">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
        </Marker>
      ))}

      {selectedClinic && (
        <Popup
          longitude={selectedClinic.lng}
          latitude={selectedClinic.lat}
          anchor="bottom"
          onClose={handlePopupClose}
          closeButton={true}
          closeOnClick={false}
          offset={25}
        >
          <div className="p-2 min-w-[200px]">
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
              {selectedClinic.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              {selectedClinic.city}
            </p>
            <Link
              href={`/${selectedClinic.permalink}/`}
              className="text-xs text-primary hover:underline"
            >
              View clinic details →
            </Link>
          </div>
        </Popup>
      )}
    </Map>
  );
}
