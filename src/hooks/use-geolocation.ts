'use client';

import { useState, useCallback, useEffect } from 'react';
import type { UserLocation, Coordinates } from '@/types/clinic';

// Default fallback location: Chicago, IL
const CHICAGO_COORDINATES: Coordinates = {
  lat: 41.8781,
  lng: -87.6298,
};

const DEFAULT_LOCATION: UserLocation = {
  coordinates: CHICAGO_COORDINATES,
  city: 'Chicago',
  state: 'IL',
  isDefault: true,
};

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface UseGeolocationReturn {
  location: UserLocation;
  isLoading: boolean;
  error: string | null;
  permissionState: PermissionState;
  requestLocation: () => void;
  searchLocation: (query: string) => Promise<void>;
}

/**
 * Hook for managing user geolocation with permission handling.
 * Falls back to Chicago, IL when location is unavailable or denied.
 */
export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] =
    useState<PermissionState>('prompt');

  // Check initial permission state
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setPermissionState('unavailable');
      return;
    }

    // Check permission status if available
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          setPermissionState(status.state as PermissionState);

          // Listen for permission changes
          status.onchange = () => {
            setPermissionState(status.state as PermissionState);
          };
        })
        .catch(() => {
          // Permission API not supported, leave as prompt
          setPermissionState('prompt');
        });
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setPermissionState('unavailable');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: UserLocation = {
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          isDefault: false,
        };
        setLocation(newLocation);
        setIsLoading(false);
        setPermissionState('granted');
      },
      (err) => {
        let errorMessage: string;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            setPermissionState('denied');
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An error occurred while getting location';
        }
        setError(errorMessage);
        setIsLoading(false);
        // Keep the default Chicago location on error
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a city or ZIP code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use Mapbox Geocoding API
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!mapboxToken) {
        throw new Error('Mapbox token not configured');
      }

      const encodedQuery = encodeURIComponent(query.trim());
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?country=US&types=place,postcode&limit=1&access_token=${mapboxToken}`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        setError('Location not found. Try a different city or ZIP code.');
        setIsLoading(false);
        return;
      }

      const feature = data.features[0];
      const [lng, lat] = feature.center;

      // Extract city and state from context
      let city = '';
      let state = '';

      if (feature.place_type.includes('postcode')) {
        // For ZIP codes, extract from context
        const placeContext = feature.context?.find((c: { id: string }) => c.id.startsWith('place'));
        const regionContext = feature.context?.find((c: { id: string }) => c.id.startsWith('region'));
        city = placeContext?.text || feature.text;
        state = regionContext?.short_code?.replace('US-', '') || '';
      } else {
        // For places (cities)
        city = feature.text;
        const regionContext = feature.context?.find((c: { id: string }) => c.id.startsWith('region'));
        state = regionContext?.short_code?.replace('US-', '') || '';
      }

      const newLocation: UserLocation = {
        coordinates: { lat, lng },
        city,
        state,
        isDefault: false,
      };

      setLocation(newLocation);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search location');
      setIsLoading(false);
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    permissionState,
    requestLocation,
    searchLocation,
  };
}
