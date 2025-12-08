'use client';

import { useMemo } from 'react';
import { mockClinics } from '@/data/mock-clinics';
import { calculateDistance, formatDistance } from '@/lib/distance';
import type {
  ClinicWithDistance,
  UserLocation,
  SearchFilters,
} from '@/types/clinic';

export interface UseClinicsOptions {
  userLocation: UserLocation;
  filters?: SearchFilters;
}

export interface UseClinicsReturn {
  clinics: ClinicWithDistance[];
  totalCount: number;
  filteredCount: number;
}

/**
 * Hook for loading, filtering, and sorting clinic data.
 * Calculates distances from user location and applies search filters.
 */
export function useClinics({
  userLocation,
  filters,
}: UseClinicsOptions): UseClinicsReturn {
  const clinicsWithDistance = useMemo<ClinicWithDistance[]>(() => {
    // Calculate distance for each clinic
    return mockClinics.map((clinic) => {
      const distance = calculateDistance(
        userLocation.coordinates.lat,
        userLocation.coordinates.lng,
        clinic.coordinates.lat,
        clinic.coordinates.lng
      );
      return {
        ...clinic,
        distance,
        distanceFormatted: formatDistance(distance),
      };
    });
  }, [userLocation.coordinates.lat, userLocation.coordinates.lng]);

  const filteredClinics = useMemo<ClinicWithDistance[]>(() => {
    let result = [...clinicsWithDistance];

    if (!filters) {
      // Default sort by distance when no filters
      return result.sort((a, b) => a.distance - b.distance);
    }

    // Filter by search query (name or address)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      result = result.filter(
        (clinic) =>
          clinic.name.toLowerCase().includes(query) ||
          clinic.address.formatted.toLowerCase().includes(query) ||
          clinic.address.city.toLowerCase().includes(query) ||
          clinic.address.state.toLowerCase().includes(query)
      );
    }

    // Filter by services
    if (filters.services && filters.services.length > 0) {
      result = result.filter((clinic) =>
        filters.services!.some((service) => clinic.services.includes(service))
      );
    }

    // Filter by insurance
    if (filters.insurance && filters.insurance.length > 0) {
      result = result.filter((clinic) =>
        filters.insurance!.some((ins) => clinic.insuranceAccepted.includes(ins))
      );
    }

    // Filter by max distance
    if (filters.maxDistance) {
      result = result.filter((clinic) => clinic.distance <= filters.maxDistance!);
    }

    // Filter by minimum rating
    if (filters.minRating) {
      result = result.filter((clinic) => clinic.rating >= filters.minRating!);
    }

    // Sort results
    switch (filters.sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'distance':
      default:
        result.sort((a, b) => a.distance - b.distance);
        break;
    }

    return result;
  }, [clinicsWithDistance, filters]);

  return {
    clinics: filteredClinics,
    totalCount: mockClinics.length,
    filteredCount: filteredClinics.length,
  };
}

/**
 * Get featured clinics with distance calculations.
 */
export function useFeaturedClinics(userLocation: UserLocation): ClinicWithDistance[] {
  return useMemo(() => {
    return mockClinics
      .filter((clinic) => clinic.isFeatured)
      .map((clinic) => {
        const distance = calculateDistance(
          userLocation.coordinates.lat,
          userLocation.coordinates.lng,
          clinic.coordinates.lat,
          clinic.coordinates.lng
        );
        return {
          ...clinic,
          distance,
          distanceFormatted: formatDistance(distance),
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [userLocation.coordinates.lat, userLocation.coordinates.lng]);
}

/**
 * Get nearby clinics (within a specified radius) with distance calculations.
 */
export function useNearbyClinics(
  userLocation: UserLocation,
  maxDistance: number = 25
): ClinicWithDistance[] {
  return useMemo(() => {
    return mockClinics
      .map((clinic) => {
        const distance = calculateDistance(
          userLocation.coordinates.lat,
          userLocation.coordinates.lng,
          clinic.coordinates.lat,
          clinic.coordinates.lng
        );
        return {
          ...clinic,
          distance,
          distanceFormatted: formatDistance(distance),
        };
      })
      .filter((clinic) => clinic.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }, [userLocation.coordinates.lat, userLocation.coordinates.lng, maxDistance]);
}
