'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { services, insuranceProviders } from '@/data/services';
import { cn } from '@/lib/utils';
import type { ServiceType, InsuranceType, SearchFilters as SearchFiltersType } from '@/types/clinic';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  className?: string;
}

const distanceOptions = [
  { value: '5', label: '5 miles' },
  { value: '10', label: '10 miles' },
  { value: '25', label: '25 miles' },
  { value: '50', label: '50 miles' },
  { value: 'any', label: 'Any distance' },
];

const ratingOptions = [
  { value: '4', label: '4+ stars' },
  { value: '3', label: '3+ stars' },
  { value: 'any', label: 'Any rating' },
];

function FilterContent({
  filters,
  onFiltersChange,
}: {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
}) {
  const handleServiceToggle = (serviceType: ServiceType) => {
    const currentServices = filters.services || [];
    const newServices = currentServices.includes(serviceType)
      ? currentServices.filter((s) => s !== serviceType)
      : [...currentServices, serviceType];

    const newFilters: SearchFiltersType = {
      sortBy: filters.sortBy,
      ...(filters.query && { query: filters.query }),
      ...(filters.insurance && { insurance: filters.insurance }),
      ...(filters.maxDistance !== undefined && { maxDistance: filters.maxDistance }),
      ...(filters.minRating !== undefined && { minRating: filters.minRating }),
      ...(newServices.length > 0 && { services: newServices }),
    };
    onFiltersChange(newFilters);
  };

  const handleInsuranceToggle = (insuranceType: InsuranceType) => {
    const currentInsurance = filters.insurance || [];
    const newInsurance = currentInsurance.includes(insuranceType)
      ? currentInsurance.filter((i) => i !== insuranceType)
      : [...currentInsurance, insuranceType];

    const newFilters: SearchFiltersType = {
      sortBy: filters.sortBy,
      ...(filters.query && { query: filters.query }),
      ...(filters.services && { services: filters.services }),
      ...(filters.maxDistance !== undefined && { maxDistance: filters.maxDistance }),
      ...(filters.minRating !== undefined && { minRating: filters.minRating }),
      ...(newInsurance.length > 0 && { insurance: newInsurance }),
    };
    onFiltersChange(newFilters);
  };

  const handleDistanceChange = (value: string) => {
    const newFilters: SearchFiltersType = {
      sortBy: filters.sortBy,
      ...(filters.query && { query: filters.query }),
      ...(filters.services && { services: filters.services }),
      ...(filters.insurance && { insurance: filters.insurance }),
      ...(filters.minRating !== undefined && { minRating: filters.minRating }),
      ...(value !== 'any' && { maxDistance: parseInt(value, 10) }),
    };
    onFiltersChange(newFilters);
  };

  const handleRatingChange = (value: string) => {
    const newFilters: SearchFiltersType = {
      sortBy: filters.sortBy,
      ...(filters.query && { query: filters.query }),
      ...(filters.services && { services: filters.services }),
      ...(filters.insurance && { insurance: filters.insurance }),
      ...(filters.maxDistance !== undefined && { maxDistance: filters.maxDistance }),
      ...(value !== 'any' && { minRating: parseInt(value, 10) }),
    };
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    onFiltersChange({
      sortBy: filters.sortBy,
    });
  };

  const hasActiveFilters =
    (filters.services && filters.services.length > 0) ||
    (filters.insurance && filters.insurance.length > 0) ||
    filters.maxDistance !== undefined ||
    filters.minRating !== undefined;

  return (
    <div className="space-y-6">
      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="w-full"
        >
          <X className="size-4 mr-2" />
          Clear Filters
        </Button>
      )}

      {/* Services filter */}
      <div>
        <h3 className="font-semibold mb-3">Services</h3>
        <div className="space-y-2">
          {services.map((service) => (
            <div key={service.type} className="flex items-center space-x-2">
              <Checkbox
                id={`service-${service.type}`}
                checked={filters.services?.includes(service.type) || false}
                onCheckedChange={() => handleServiceToggle(service.type)}
              />
              <Label
                htmlFor={`service-${service.type}`}
                className="text-sm font-normal cursor-pointer"
              >
                {service.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Insurance filter */}
      <div>
        <h3 className="font-semibold mb-3">Insurance</h3>
        <div className="space-y-2">
          {insuranceProviders.map((insurance) => (
            <div key={insurance.type} className="flex items-center space-x-2">
              <Checkbox
                id={`insurance-${insurance.type}`}
                checked={filters.insurance?.includes(insurance.type) || false}
                onCheckedChange={() => handleInsuranceToggle(insurance.type)}
              />
              <Label
                htmlFor={`insurance-${insurance.type}`}
                className="text-sm font-normal cursor-pointer"
              >
                {insurance.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Distance filter */}
      <div>
        <h3 className="font-semibold mb-3">Distance</h3>
        <RadioGroup
          value={filters.maxDistance?.toString() || 'any'}
          onValueChange={handleDistanceChange}
          className="space-y-2"
        >
          {distanceOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`distance-${option.value}`} />
              <Label
                htmlFor={`distance-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Separator />

      {/* Rating filter */}
      <div>
        <h3 className="font-semibold mb-3">Rating</h3>
        <RadioGroup
          value={filters.minRating?.toString() || 'any'}
          onValueChange={handleRatingChange}
          className="space-y-2"
        >
          {ratingOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`rating-${option.value}`} />
              <Label
                htmlFor={`rating-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

// Desktop sidebar component
export function SearchFiltersSidebar({
  filters,
  onFiltersChange,
  className,
}: SearchFiltersProps) {
  return (
    <aside className={cn('w-60 shrink-0', className)}>
      <div className="sticky top-20 p-4 bg-card rounded-lg border">
        <h2 className="font-semibold text-lg mb-4">Filters</h2>
        <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
      </div>
    </aside>
  );
}

// Mobile sheet component
export function SearchFiltersSheet({
  filters,
  onFiltersChange,
}: SearchFiltersProps) {
  const activeFilterCount =
    (filters.services?.length || 0) +
    (filters.insurance?.length || 0) +
    (filters.maxDistance !== undefined ? 1 : 0) +
    (filters.minRating !== undefined ? 1 : 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <SlidersHorizontal className="size-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Combined component that shows sidebar on desktop, sheet trigger on mobile
export function SearchFilters({
  filters,
  onFiltersChange,
  className,
}: SearchFiltersProps) {
  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <SearchFiltersSidebar
        filters={filters}
        onFiltersChange={onFiltersChange}
        className={cn('hidden lg:block', className)}
      />

      {/* Mobile sheet trigger - hidden on desktop */}
      <div className="lg:hidden">
        <SearchFiltersSheet filters={filters} onFiltersChange={onFiltersChange} />
      </div>
    </>
  );
}
