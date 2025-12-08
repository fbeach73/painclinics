'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ClinicCard } from '@/components/clinic/clinic-card';
import { ClinicMap } from '@/components/map/clinic-map';
import { SearchBar } from '@/components/search/search-bar';
import { SearchFiltersSidebar, SearchFiltersSheet } from '@/components/search/search-filters';
import { SearchSort } from '@/components/search/search-sort';
import { ViewToggle, type ViewMode } from '@/components/search/view-toggle';
import { useClinics } from '@/hooks/use-clinics';
import { useGeolocation } from '@/hooks/use-geolocation';
import type { SearchFilters, ServiceType, InsuranceType } from '@/types/clinic';

function parseServices(param: string | null): ServiceType[] | undefined {
  if (!param) return undefined;
  return param.split(',') as ServiceType[];
}

function parseInsurance(param: string | null): InsuranceType[] | undefined {
  if (!param) return undefined;
  return param.split(',') as InsuranceType[];
}

function parseNumber(param: string | null): number | undefined {
  if (!param) return undefined;
  const num = parseInt(param, 10);
  return isNaN(num) ? undefined : num;
}

function buildInitialFilters(searchParams: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {
    sortBy: (searchParams.get('sort') as SearchFilters['sortBy']) || 'distance',
  };

  const query = searchParams.get('q');
  if (query) filters.query = query;

  const services = parseServices(searchParams.get('services'));
  if (services) filters.services = services;

  const insurance = parseInsurance(searchParams.get('insurance'));
  if (insurance) filters.insurance = insurance;

  const distance = parseNumber(searchParams.get('distance'));
  if (distance) filters.maxDistance = distance;

  const rating = parseNumber(searchParams.get('rating'));
  if (rating) filters.minRating = rating;

  return filters;
}

export default function ClinicsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { location, isLoading: isLocationLoading, requestLocation } = useGeolocation();

  // Parse URL params into filters
  const [filters, setFilters] = useState<SearchFilters>(() =>
    buildInitialFilters(searchParams)
  );

  const [view, setView] = useState<ViewMode>('list');
  const [searchValue, setSearchValue] = useState(filters.query || '');

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.query) params.set('q', filters.query);
    if (filters.services?.length) params.set('services', filters.services.join(','));
    if (filters.insurance?.length) params.set('insurance', filters.insurance.join(','));
    if (filters.maxDistance) params.set('distance', filters.maxDistance.toString());
    if (filters.minRating) params.set('rating', filters.minRating.toString());
    if (filters.sortBy !== 'distance') params.set('sort', filters.sortBy);

    const queryString = params.toString();
    const url = queryString ? `/clinics?${queryString}` : '/clinics';
    router.replace(url, { scroll: false });
  }, [filters, router]);

  // Get clinics with current filters
  const { clinics, filteredCount, totalCount } = useClinics({
    userLocation: location,
    filters,
  });

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setFilters((prev) => {
      const newFilters: SearchFilters = { sortBy: prev.sortBy };
      if (value) newFilters.query = value;
      if (prev.services) newFilters.services = prev.services;
      if (prev.insurance) newFilters.insurance = prev.insurance;
      if (prev.maxDistance) newFilters.maxDistance = prev.maxDistance;
      if (prev.minRating) newFilters.minRating = prev.minRating;
      return newFilters;
    });
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((sortBy: SearchFilters['sortBy']) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
    }));
  }, []);

  return (
    <main className="flex-1">
      {/* Search Header */}
      <div className="border-b bg-background sticky top-16 z-30">
        <div className="container py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-xl">
              <SearchBar
                value={searchValue}
                onChange={handleSearchChange}
                onLocationClick={requestLocation}
                isLoadingLocation={isLocationLoading}
                placeholder="Search clinics, services..."
              />
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile filters */}
              <div className="lg:hidden">
                <SearchFiltersSheet
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
              </div>
              <SearchSort sortBy={filters.sortBy} onSortChange={handleSortChange} />
              <ViewToggle view={view} onViewChange={setView} />
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="container py-4">
        <p className="text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredCount}</span> of{' '}
          <span className="font-medium text-foreground">{totalCount}</span> clinics
          {location.city && (
            <>
              {' '}
              near <span className="font-medium text-foreground">{location.city}, {location.state}</span>
            </>
          )}
        </p>
      </div>

      {/* Main Content */}
      <div className="container pb-12">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <SearchFiltersSidebar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            className="hidden lg:block"
          />

          {/* Results */}
          <div className="flex-1 min-w-0">
            {view === 'map' ? (
              <div className="h-[600px] rounded-lg overflow-hidden border">
                <ClinicMap
                  clinics={clinics}
                  userLocation={location}
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {clinics.map((clinic) => (
                  <ClinicCard key={clinic.id} clinic={clinic} />
                ))}
              </div>
            )}

            {clinics.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg font-medium mb-2">No clinics found</p>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters to find more results.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
