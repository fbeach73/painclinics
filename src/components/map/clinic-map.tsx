'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import { cn } from '@/lib/utils';
import type { ClinicWithDistance, UserLocation } from '@/types/clinic';
import { ClinicMarker } from './clinic-marker';
import { ClinicDialog } from './clinic-popup';
import type { StyleSpecification } from 'mapbox-gl';
import type { MapRef } from 'react-map-gl/mapbox';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

/**
 * Custom map style configuration that matches the site's purple/violet theme.
 * Based on Mapbox Light v11 with customized colors for better brand cohesion.
 */
const CUSTOM_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: 'PainClinics Custom',
  sources: {
    'mapbox-streets': {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
  },
  sprite: 'mapbox://sprites/mapbox/light-v11',
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  layers: [
    // Background - soft off-white with slight purple tint
    // This serves as the "land" color since mapbox-streets-v8 doesn't have a land layer
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#f8f7fc', // Subtle purple-tinted background
      },
    },
    // Water - soft blue with purple undertone
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox-streets',
      'source-layer': 'water',
      paint: {
        'fill-color': '#d4e5f7',
      },
    },
    // Parks and green areas - muted green
    {
      id: 'landuse-park',
      type: 'fill',
      source: 'mapbox-streets',
      'source-layer': 'landuse',
      filter: ['==', ['get', 'class'], 'park'],
      paint: {
        'fill-color': '#e2f0e6',
        'fill-opacity': 0.7,
      },
    },
    // Buildings - subtle gray
    {
      id: 'building',
      type: 'fill',
      source: 'mapbox-streets',
      'source-layer': 'building',
      paint: {
        'fill-color': '#e8e6f0',
        'fill-opacity': 0.6,
      },
    },
    // Minor roads
    {
      id: 'road-minor',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'road',
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['in', ['get', 'class'], ['literal', ['street', 'street_limited', 'service']]]],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 14, 3, 18, 10],
      },
    },
    // Secondary roads
    {
      id: 'road-secondary',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'road',
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['in', ['get', 'class'], ['literal', ['secondary', 'tertiary']]]],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 4, 18, 14],
      },
    },
    // Primary roads - slight purple tint
    {
      id: 'road-primary',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'road',
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'class'], 'primary']],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 14, 5, 18, 18],
      },
    },
    // Highways/Motorways - branded purple accent
    {
      id: 'road-motorway',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'road',
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['in', ['get', 'class'], ['literal', ['motorway', 'trunk']]]],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#a78bda', // Purple accent for major roads
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 14, 4, 18, 16],
        'line-opacity': 0.7,
      },
    },
    // Road labels
    {
      id: 'road-label',
      type: 'symbol',
      source: 'mapbox-streets',
      'source-layer': 'road',
      filter: ['==', ['geometry-type'], 'LineString'],
      layout: {
        'symbol-placement': 'line',
        'text-field': ['get', 'name'],
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 8, 14, 11],
      },
      paint: {
        'text-color': '#6b5b95', // Purple-tinted text
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    },
    // Place labels (cities, neighborhoods)
    {
      id: 'place-label',
      type: 'symbol',
      source: 'mapbox-streets',
      'source-layer': 'place_label',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 16],
        'text-max-width': 8,
      },
      paint: {
        'text-color': '#4a3f6b', // Darker purple for place names
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
      },
    },
    // POI labels (optional, helps with context)
    {
      id: 'poi-label',
      type: 'symbol',
      source: 'mapbox-streets',
      'source-layer': 'poi_label',
      filter: ['<=', ['get', 'filterrank'], 2],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
        'text-size': 10,
        'icon-image': ['get', 'maki'],
        'icon-size': 0.8,
      },
      paint: {
        'text-color': '#8b7fb5',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
        'icon-opacity': 0.7,
      },
    },
  ],
};

interface ClinicMapProps {
  clinics: ClinicWithDistance[];
  userLocation: UserLocation;
  onClinicSelect?: (clinic: ClinicWithDistance | null) => void;
  onMapMoveEnd?: (center: { lat: number; lng: number }) => void;
  isLoadingClinics?: boolean;
  /** When true, map will auto-fly to userLocation changes. Set to false when user is exploring. */
  followUserLocation?: boolean;
  className?: string;
}

export function ClinicMap({
  clinics,
  userLocation,
  onClinicSelect,
  onMapMoveEnd,
  isLoadingClinics = false,
  followUserLocation = true,
  className = 'h-[60vh] min-h-[400px] w-full',
}: ClinicMapProps) {
  const mapRef = useRef<MapRef>(null);
  const hasInitializedRef = useRef(false);
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithDistance | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Handle map move end - fetch new clinics for the area
  const handleMoveEnd = useCallback(() => {
    if (!mapRef.current || !onMapMoveEnd) return;

    const center = mapRef.current.getCenter();
    onMapMoveEnd({ lat: center.lat, lng: center.lng });
  }, [onMapMoveEnd]);

  const initialViewState = useMemo(() => ({
    longitude: userLocation.coordinates.lng,
    latitude: userLocation.coordinates.lat,
    zoom: 11,
  }), [userLocation.coordinates.lat, userLocation.coordinates.lng]);

  // Fly to new location when userLocation changes (after initial load)
  // Only fly if followUserLocation is true (disabled when user is exploring)
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    // Don't auto-fly if user is exploring the map
    if (!followUserLocation) return;

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.coordinates.lng, userLocation.coordinates.lat],
        zoom: 11,
        duration: 1500,
      });
    }
  }, [userLocation.coordinates.lat, userLocation.coordinates.lng, followUserLocation]);

  const handleMarkerClick = useCallback(
    (clinic: ClinicWithDistance) => {
      setSelectedClinic(clinic);
      setIsDialogOpen(true);
      onClinicSelect?.(clinic);
    },
    [onClinicSelect]
  );

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
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
    <div className={cn(className, 'relative')}>
      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        mapStyle={CUSTOM_MAP_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        reuseMaps
        onMoveEnd={handleMoveEnd}
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

        {/* Clinic markers - click to open dialog */}
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
              featuredTier={clinic.featuredTier || 'none'}
              onClick={() => handleMarkerClick(clinic)}
            />
          </Marker>
        ))}
      </Map>

      {/* Dialog for selected clinic - renders outside map to avoid clipping */}
      <ClinicDialog
        clinic={selectedClinic}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
      />

      {/* Loading overlay when fetching new clinics */}
      {isLoadingClinics && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading clinics...</span>
          </div>
        </div>
      )}
    </div>
  );
}
