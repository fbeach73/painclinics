'use client';

import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { ComparisonPanel } from '@/components/pain-relief/comparison-panel';
import { ReliefMethodFilters } from '@/components/pain-relief/relief-method-filters';
import { ReliefMethodTable } from '@/components/pain-relief/relief-method-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { painReliefMethods, filterMethods } from '@/data/pain-relief-methods';
import type { PainReliefFilters, ComparisonState, PainReliefMethod } from '@/types/pain-relief';

const MAX_COMPARISON_ITEMS = 4;

export function PainReliefComparison() {
  // Filter state
  const [filters, setFilters] = useState<PainReliefFilters>({
    painLocation: null,
    painType: null,
    resources: [],
  });

  // Comparison selection state
  const [comparison, setComparison] = useState<ComparisonState>({
    selectedMethods: [],
  });

  // Filtered methods based on current filters
  const filteredMethods = useMemo(() => {
    return filterMethods(painReliefMethods, {
      painLocation: filters.painLocation,
      painType: filters.painType,
      resources: filters.resources,
    });
  }, [filters]);

  // Selected method objects for comparison
  const selectedMethodObjects = useMemo(() => {
    return comparison.selectedMethods
      .map((id) => painReliefMethods.find((m) => m.id === id))
      .filter((m): m is PainReliefMethod => m !== undefined);
  }, [comparison.selectedMethods]);

  // Handlers
  const handleToggleSelection = (methodId: string) => {
    setComparison((prev) => {
      const isSelected = prev.selectedMethods.includes(methodId);
      if (isSelected) {
        return {
          selectedMethods: prev.selectedMethods.filter((id) => id !== methodId),
        };
      } else if (prev.selectedMethods.length < MAX_COMPARISON_ITEMS) {
        return {
          selectedMethods: [...prev.selectedMethods, methodId],
        };
      }
      return prev; // Max reached, don't add
    });
  };

  const handleClearComparison = () => {
    setComparison({ selectedMethods: [] });
  };

  const handleRemoveFromComparison = (methodId: string) => {
    setComparison((prev) => ({
      selectedMethods: prev.selectedMethods.filter((id) => id !== methodId),
    }));
  };

  const hasSelectedMethods = selectedMethodObjects.length > 0;

  return (
    <div className="space-y-6" style={{ paddingBottom: hasSelectedMethods ? '500px' : '0' }}>
      {/* Filters Section */}
      <ReliefMethodFilters filters={filters} onFiltersChange={setFilters} />

      {/* Results count and comparison indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredMethods.length} of {painReliefMethods.length} methods
        </p>

        {comparison.selectedMethods.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {comparison.selectedMethods.length} selected for comparison
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleClearComparison}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <ReliefMethodTable
        methods={filteredMethods}
        selectedMethods={comparison.selectedMethods}
        onToggleSelection={handleToggleSelection}
        maxSelections={MAX_COMPARISON_ITEMS}
      />

      {/* Comparison Panel (sticky at bottom when items selected) */}
      {selectedMethodObjects.length > 0 && (
        <ComparisonPanel
          methods={selectedMethodObjects}
          onRemove={handleRemoveFromComparison}
          onClearAll={handleClearComparison}
        />
      )}
    </div>
  );
}
