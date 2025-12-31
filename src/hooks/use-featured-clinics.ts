'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ClinicWithDistance } from '@/types/clinic';
import { useGeolocation } from './use-geolocation';

export interface FeaturedClinic {
  id: string;
  name: string;
  slug: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    formatted: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  phone: string;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  featuredTier: 'none' | 'basic' | 'premium';
  isVerified: boolean;
  photos: string[];
  distance: number | null;
  distanceFormatted: string | null;
}

export interface UseFeaturedClinicsOptions {
  stateAbbrev?: string;
  city?: string;
  excludeClinicId?: string;
  limit?: number;
  useGeolocation?: boolean;
  radiusMiles?: number;
  randomize?: boolean;
}

export interface UseFeaturedClinicsReturn {
  clinics: FeaturedClinic[];
  isLoading: boolean;
  error: string | null;
  hasLocation: boolean;
  refetch: () => void;
}

/**
 * Hook for fetching featured clinics with optional geo-awareness.
 *
 * If useGeolocation is true (default), it will:
 * 1. Request user location
 * 2. Fetch featured clinics near the user
 * 3. Fall back to random/context-based results if location unavailable
 *
 * @param options - Configuration options for fetching
 * @returns Featured clinics, loading state, error, and refetch function
 */
export function useFeaturedClinics(
  options: UseFeaturedClinicsOptions = {}
): UseFeaturedClinicsReturn {
  const {
    stateAbbrev,
    city,
    excludeClinicId,
    limit = 10,
    useGeolocation: shouldUseGeolocation = true,
    radiusMiles = 50,
    randomize = true,
  } = options;

  const [clinics, setClinics] = useState<FeaturedClinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    location,
    isLoading: isLocationLoading,
    permissionState,
  } = useGeolocation();

  // Determine if we have real user location
  const hasLocation = !location.isDefault;

  // Note: We intentionally do NOT auto-request location on mount.
  // This avoids the intrusive browser permission popup on page load.
  // Users can enable location via the map's "Enable Location" button instead.

  const fetchClinics = useCallback(async () => {
    // Wait for location to be determined if we're using geolocation
    if (shouldUseGeolocation && isLocationLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Add location params if available and using geolocation
      if (shouldUseGeolocation && hasLocation) {
        params.set('lat', String(location.coordinates.lat));
        params.set('lng', String(location.coordinates.lng));
        params.set('radius', String(radiusMiles));
      }

      // Add context filters
      if (stateAbbrev) {
        params.set('state', stateAbbrev);
      }
      if (city) {
        params.set('city', city);
      }
      if (excludeClinicId) {
        params.set('exclude', excludeClinicId);
      }
      if (limit) {
        params.set('limit', String(limit));
      }
      // Enable randomize when no location available
      if (randomize && !hasLocation && !stateAbbrev && !city) {
        params.set('random', 'true');
      }

      const response = await fetch(`/api/clinics/featured?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch featured clinics');
      }

      const data = await response.json();
      setClinics(data.clinics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setClinics([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    shouldUseGeolocation,
    isLocationLoading,
    hasLocation,
    location.coordinates.lat,
    location.coordinates.lng,
    radiusMiles,
    stateAbbrev,
    city,
    excludeClinicId,
    limit,
    randomize,
  ]);

  // Fetch when dependencies change
  useEffect(() => {
    // Only fetch when location loading is resolved or we're not using geolocation
    if (!shouldUseGeolocation || !isLocationLoading) {
      fetchClinics();
    }
  }, [fetchClinics, shouldUseGeolocation, isLocationLoading]);

  return {
    clinics,
    isLoading: isLoading || (shouldUseGeolocation && isLocationLoading),
    error,
    hasLocation,
    refetch: fetchClinics,
  };
}

/**
 * Convert FeaturedClinic to ClinicWithDistance type for component compatibility.
 * Provides default values for fields not returned by the featured API.
 */
export function featuredToClinicWithDistance(
  clinic: FeaturedClinic
): ClinicWithDistance {
  return {
    id: clinic.id,
    name: clinic.name,
    slug: clinic.slug,
    address: clinic.address,
    coordinates: clinic.coordinates,
    phone: clinic.phone,
    rating: clinic.rating,
    reviewCount: clinic.reviewCount,
    photos: clinic.photos,
    isFeatured: clinic.isFeatured,
    featuredTier: clinic.featuredTier,
    isVerified: clinic.isVerified,
    distance: clinic.distance ?? 0,
    distanceFormatted: clinic.distanceFormatted ?? '',
    // Default values for required Clinic fields
    hours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: true },
      sunday: { open: '09:00', close: '17:00', closed: true },
    },
    services: [],
    insuranceAccepted: [],
    about: '',
  };
}
