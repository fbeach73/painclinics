'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ClinicWithDistance, UserLocation } from '@/types/clinic';

interface UseNearbyClinicsReturn {
  clinics: ClinicWithDistance[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching nearby clinics based on user location.
 * Uses the /api/clinics/nearby endpoint to get clinics within a radius.
 */
export function useNearbyClinics(
  location: UserLocation,
  radiusMiles = 50
): UseNearbyClinicsReturn {
  const [clinics, setClinics] = useState<ClinicWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClinics = useCallback(async () => {
    if (!location.coordinates.lat || !location.coordinates.lng) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: String(location.coordinates.lat),
        lng: String(location.coordinates.lng),
        radius: String(radiusMiles),
        limit: '50',
      });

      const response = await fetch(`/api/clinics/nearby?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch nearby clinics');
      }

      const data = await response.json();

      // Transform API response to ClinicWithDistance format
      const transformedClinics: ClinicWithDistance[] = data.clinics.map((clinic: {
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
        coordinates: { lat: number; lng: number };
        phone: string;
        rating: number;
        reviewCount: number;
        isFeatured: boolean;
        featuredTier: string;
        photos: string[];
        distance: number;
        distanceFormatted: string;
      }) => ({
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
        featuredTier: clinic.featuredTier as 'none' | 'basic' | 'premium',
        distance: clinic.distance,
        distanceFormatted: clinic.distanceFormatted,
        // Default values for required fields
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
        isVerified: false,
      }));

      setClinics(transformedClinics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setClinics([]);
    } finally {
      setIsLoading(false);
    }
  }, [location.coordinates.lat, location.coordinates.lng, radiusMiles]);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  return {
    clinics,
    isLoading,
    error,
    refetch: fetchClinics,
  };
}
