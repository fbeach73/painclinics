'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import type { ClinicWithDistance, UserLocation } from '@/types/clinic';
import { ClinicMarker } from './clinic-marker';
import { ClinicPopup } from './clinic-popup';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface ClinicMapProps {
  clinics: ClinicWithDistance[];
  userLocation: UserLocation;
  onClinicSelect?: (clinic: ClinicWithDistance | null) => void;
  className?: string;
}

export function ClinicMap({
  clinics,
  userLocation,
  onClinicSelect,
  className = 'h-[60vh] min-h-[400px] w-full',
}: ClinicMapProps) {
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithDistance | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialViewState = useMemo(() => ({
    longitude: userLocation.coordinates.lng,
    latitude: userLocation.coordinates.lat,
    zoom: 11,
  }), [userLocation.coordinates.lat, userLocation.coordinates.lng]);

  const handleMarkerEnter = useCallback(
    (clinic: ClinicWithDistance) => {
      // Clear any pending close timeout
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setSelectedClinic(clinic);
      onClinicSelect?.(clinic);
    },
    [onClinicSelect]
  );

  const handleMarkerLeave = useCallback(() => {
    // Delay closing to allow mouse to move to popup
    closeTimeoutRef.current = setTimeout(() => {
      setSelectedClinic(null);
      onClinicSelect?.(null);
    }, 150);
  }, [onClinicSelect]);

  const handlePopupEnter = useCallback(() => {
    // Cancel close when entering popup
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handlePopupLeave = useCallback(() => {
    // Close popup when leaving it
    setSelectedClinic(null);
    onClinicSelect?.(null);
  }, [onClinicSelect]);

  const handlePopupClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setSelectedClinic(null);
    onClinicSelect?.(null);
  }, [onClinicSelect]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted rounded-lg`}>
        <p className="text-muted-foreground text-center px-4">
          Map unavailable. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN environment variable.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Map
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        reuseMaps
      >
        <NavigationControl position="top-right" />

        {/* User location marker */}
        <Marker
          longitude={userLocation.coordinates.lng}
          latitude={userLocation.coordinates.lat}
          anchor="center"
        >
          <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-md" />
        </Marker>

        {/* Clinic markers */}
        {clinics.map((clinic) => (
          <Marker
            key={clinic.id}
            longitude={clinic.coordinates.lng}
            latitude={clinic.coordinates.lat}
            anchor="bottom"
          >
            <ClinicMarker
              isSelected={selectedClinic?.id === clinic.id}
              isFeatured={clinic.isFeatured}
              onMouseEnter={() => handleMarkerEnter(clinic)}
              onMouseLeave={handleMarkerLeave}
            />
          </Marker>
        ))}

        {/* Popup for selected clinic */}
        {selectedClinic && (
          <Popup
            longitude={selectedClinic.coordinates.lng}
            latitude={selectedClinic.coordinates.lat}
            anchor="bottom"
            offset={40}
            closeButton={false}
            closeOnClick={false}
            onClose={handlePopupClose}
          >
            <div
              onMouseEnter={handlePopupEnter}
              onMouseLeave={handlePopupLeave}
            >
              <ClinicPopup clinic={selectedClinic} onClose={handlePopupClose} />
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
