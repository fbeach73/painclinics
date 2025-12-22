'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { painLocationLabels } from '@/data/pain-relief-methods';
import { cn } from '@/lib/utils';
import type { PainReliefFilters, PainLocation, PainType, ResourceType } from '@/types/pain-relief';

interface ReliefMethodFiltersProps {
  filters: PainReliefFilters;
  onFiltersChange: (filters: PainReliefFilters) => void;
  className?: string;
}

const painTypeOptions = [
  { value: 'acute', label: 'Acute (sudden, recent)' },
  { value: 'chronic', label: 'Chronic (ongoing, long-term)' },
];

const resourceOptions: { value: ResourceType; label: string }[] = [
  { value: 'at-home', label: 'Available at home' },
  { value: 'has-meds', label: 'Have medications' },
  { value: 'can-exercise', label: 'Able to exercise' },
];

function FilterContent({
  filters,
  onFiltersChange,
}: {
  filters: PainReliefFilters;
  onFiltersChange: (f: PainReliefFilters) => void;
}) {
  const handleLocationChange = (value: string) => {
    onFiltersChange({
      ...filters,
      painLocation: value === 'all' ? null : (value as PainLocation),
    });
  };

  const handlePainTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      painType: value === 'any' ? null : (value as PainType),
    });
  };

  const handleResourceToggle = (resource: ResourceType) => {
    const current = filters.resources || [];
    const updated = current.includes(resource)
      ? current.filter((r) => r !== resource)
      : [...current, resource];
    onFiltersChange({
      ...filters,
      resources: updated,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      painLocation: null,
      painType: null,
      resources: [],
    });
  };

  const hasActiveFilters =
    filters.painLocation !== null ||
    filters.painType !== null ||
    filters.resources.length > 0;

  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={handleClearFilters} className="w-full">
          <X className="size-4 mr-2" />
          Clear Filters
        </Button>
      )}

      {/* Pain Location Select */}
      <div>
        <h3 className="font-semibold mb-3">Pain Location</h3>
        <Select value={filters.painLocation || 'all'} onValueChange={handleLocationChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {Object.entries(painLocationLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Pain Type Radio */}
      <div>
        <h3 className="font-semibold mb-3">Pain Type</h3>
        <RadioGroup
          value={filters.painType || 'any'}
          onValueChange={handlePainTypeChange}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="any" id="pain-type-any" />
            <Label htmlFor="pain-type-any" className="text-sm font-normal cursor-pointer">
              Any type
            </Label>
          </div>
          {painTypeOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`pain-type-${option.value}`} />
              <Label
                htmlFor={`pain-type-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Separator />

      {/* Resources Checkboxes */}
      <div>
        <h3 className="font-semibold mb-3">Available Resources</h3>
        <div className="space-y-2">
          {resourceOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`resource-${option.value}`}
                checked={filters.resources.includes(option.value)}
                onCheckedChange={() => handleResourceToggle(option.value)}
              />
              <Label
                htmlFor={`resource-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mobile sheet trigger
function ReliefFiltersSheet({ filters, onFiltersChange }: ReliefMethodFiltersProps) {
  const activeFilterCount =
    (filters.painLocation !== null ? 1 : 0) +
    (filters.painType !== null ? 1 : 0) +
    filters.resources.length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          <SlidersHorizontal className="size-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Methods</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Desktop inline filter bar
function ReliefFiltersInline({ filters, onFiltersChange, className }: ReliefMethodFiltersProps) {
  const handleLocationChange = (value: string) => {
    onFiltersChange({
      ...filters,
      painLocation: value === 'all' ? null : (value as PainLocation),
    });
  };

  const handlePainTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      painType: value === 'any' ? null : (value as PainType),
    });
  };

  const handleResourceToggle = (resource: ResourceType) => {
    const current = filters.resources || [];
    const updated = current.includes(resource)
      ? current.filter((r) => r !== resource)
      : [...current, resource];
    onFiltersChange({
      ...filters,
      resources: updated,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      painLocation: null,
      painType: null,
      resources: [],
    });
  };

  const hasActiveFilters =
    filters.painLocation !== null ||
    filters.painType !== null ||
    filters.resources.length > 0;

  return (
    <div className={cn('flex flex-wrap gap-4 items-end p-4 bg-card rounded-lg border', className)}>
      {/* Pain Location */}
      <div className="flex-1 min-w-[180px]">
        <Label className="text-sm font-medium mb-2 block">Pain Location</Label>
        <Select value={filters.painLocation || 'all'} onValueChange={handleLocationChange}>
          <SelectTrigger>
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {Object.entries(painLocationLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pain Type */}
      <div className="flex-1 min-w-[180px]">
        <Label className="text-sm font-medium mb-2 block">Pain Type</Label>
        <Select value={filters.painType || 'any'} onValueChange={handlePainTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any type</SelectItem>
            <SelectItem value="acute">Acute (recent)</SelectItem>
            <SelectItem value="chronic">Chronic (ongoing)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resources as inline checkboxes */}
      <div className="flex items-center gap-4 flex-wrap">
        {resourceOptions.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`desktop-resource-${option.value}`}
              checked={filters.resources.includes(option.value)}
              onCheckedChange={() => handleResourceToggle(option.value)}
            />
            <Label
              htmlFor={`desktop-resource-${option.value}`}
              className="text-sm cursor-pointer whitespace-nowrap"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>

      {/* Clear button */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <X className="size-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

// Combined component: inline on desktop, sheet on mobile
export function ReliefMethodFilters({
  filters,
  onFiltersChange,
  className,
}: ReliefMethodFiltersProps) {
  return (
    <>
      {/* Desktop: Inline horizontal filters */}
      <ReliefFiltersInline
        filters={filters}
        onFiltersChange={onFiltersChange}
        className={cn('hidden md:flex', className)}
      />

      {/* Mobile: Sheet trigger */}
      <div className="md:hidden">
        <ReliefFiltersSheet filters={filters} onFiltersChange={onFiltersChange} />
      </div>
    </>
  );
}
