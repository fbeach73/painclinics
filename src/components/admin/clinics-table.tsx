'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Database, Star, Edit, Search, Filter, Loader2, X, Sparkles, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BulkEnhanceModal } from './bulk-enhance-modal';
import { BulkSyncModal } from './sync/bulk-sync-modal';

interface Clinic {
  id: string;
  title: string;
  city: string;
  stateAbbreviation: string | null;
  permalink: string;
  rating: number | null;
  reviewCount: number | null;
  isFeatured: boolean | null;
  featuredTier: string | null;
}

interface ClinicsTableProps {
  initialClinics: Clinic[];
  initialTotalCount: number;
  states: string[];
}

export function ClinicsTable({
  initialClinics,
  initialTotalCount,
  states,
}: ClinicsTableProps) {
  const [clinics, setClinics] = useState<Clinic[]>(initialClinics);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [featuredFilter, setFeaturedFilter] = useState<string>('');
  const [offset, setOffset] = useState(0);
  const limit = 100;

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkSyncModal, setShowBulkSyncModal] = useState(false);

  // Create a map of clinic IDs to names for the modal
  const clinicNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    clinics.forEach((clinic) => map.set(clinic.id, clinic.title));
    return map;
  }, [clinics]);

  // Check if all visible clinics are selected
  const allSelected = clinics.length > 0 && clinics.every((c) => selectedIds.has(c.id));
  const someSelected = clinics.some((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      // Deselect all visible clinics
      const newSet = new Set(selectedIds);
      clinics.forEach((c) => newSet.delete(c.id));
      setSelectedIds(newSet);
    } else {
      // Select all visible clinics
      const newSet = new Set(selectedIds);
      clinics.forEach((c) => newSet.add(c.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const fetchClinics = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedState) params.set('state', selectedState);
      if (featuredFilter) params.set('featured', featuredFilter);
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const response = await fetch(`/api/admin/clinics?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setClinics(data.clinics || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch clinics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedState, featuredFilter, offset]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
      fetchClinics();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedState, featuredFilter, fetchClinics]);

  // Fetch on offset change (pagination)
  useEffect(() => {
    if (offset > 0) {
      fetchClinics();
    }
  }, [offset, fetchClinics]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedState('');
    setFeaturedFilter('');
    setOffset(0);
  };

  const hasFilters = searchQuery || selectedState || featuredFilter;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <CardTitle>Clinic Database</CardTitle>
        </div>
        <CardDescription>
          Click on a clinic to manage its services and view details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clinics by name, city, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* State Filter */}
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Featured Filter */}
          <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="All Listings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Listings</SelectItem>
              <SelectItem value="true">Featured Only</SelectItem>
              <SelectItem value="false">Non-Featured</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasFilters && (
            <Button variant="outline" size="icon" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <span className="text-sm font-medium">
              {selectedIds.size} clinic{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowBulkSyncModal(true)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Bulk Sync
              </Button>
              <Button size="sm" onClick={() => setShowBulkModal(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Bulk Enhance
              </Button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>
              Showing {clinics.length} of {totalCount.toLocaleString()} clinics
            </span>
          </div>
          {hasFilters && (
            <Badge variant="outline" className="gap-1">
              <Filter className="h-3 w-3" />
              Filtered
            </Badge>
          )}
        </div>

        {/* Table */}
        {clinics.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {hasFilters
                ? 'No clinics match your filters. Try adjusting your search.'
                : 'No clinics found. Use the Data Import section to import clinic data.'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all clinics"
                      className={someSelected && !allSelected ? 'opacity-50' : ''}
                    />
                  </TableHead>
                  <TableHead>Clinic Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead className="text-center">Reviews</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics.map((clinic) => (
                  <TableRow key={clinic.id} className={selectedIds.has(clinic.id) ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(clinic.id)}
                        onCheckedChange={() => toggleSelect(clinic.id)}
                        aria-label={`Select ${clinic.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/clinics/${clinic.id}`}
                        className="font-medium hover:underline"
                      >
                        {clinic.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {clinic.city}, {clinic.stateAbbreviation}
                    </TableCell>
                    <TableCell className="text-center">
                      {clinic.rating ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                          <span>{clinic.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{clinic.reviewCount ?? 0}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {clinic.isFeatured ? (
                        <Badge variant="default" className="bg-yellow-500 text-yellow-950">
                          {clinic.featuredTier || 'Featured'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/clinics/${clinic.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalCount > limit && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {Math.floor(offset / limit) + 1} of{' '}
              {Math.ceil(totalCount / limit)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= totalCount || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Bulk Enhance Modal */}
      <BulkEnhanceModal
        clinicIds={Array.from(selectedIds)}
        clinicNames={clinicNamesMap}
        open={showBulkModal}
        onOpenChange={setShowBulkModal}
        onComplete={() => {
          clearSelection();
          fetchClinics();
        }}
      />

      {/* Bulk Sync Modal */}
      <BulkSyncModal
        clinicIds={Array.from(selectedIds)}
        clinicNames={clinicNamesMap}
        open={showBulkSyncModal}
        onOpenChange={setShowBulkSyncModal}
        onComplete={() => {
          clearSelection();
          fetchClinics();
        }}
      />
    </Card>
  );
}
