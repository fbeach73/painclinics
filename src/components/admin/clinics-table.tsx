'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Database, Star, Edit, Search, Filter, Loader2, X, Sparkles, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Calendar, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BulkEnhanceModal } from './bulk-enhance-modal';
import { BulkSyncModal } from './sync/bulk-sync-modal';
import { ClinicImportBadge } from '@/components/clinics/clinic-import-badge';

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
  status: 'draft' | 'published' | 'deleted';
  createdAt: string;
  hasEnhancedContent: boolean;
  importUpdatedAt: string | null; // For UPDATED badge
}

type SortColumn = 'title' | 'createdAt' | 'enhanced' | 'rating' | 'reviewCount';
type SortDirection = 'asc' | 'desc';

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
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [enhancedFilter, setEnhancedFilter] = useState<string>('');
  const [updatedFilter, setUpdatedFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortColumn>('createdAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [offset, setOffset] = useState(0);
  const limit = 100;

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkSyncModal, setShowBulkSyncModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/clinics/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicIds: Array.from(selectedIds) }),
      });

      if (response.ok) {
        clearSelection();
        fetchClinics(offset);
        setShowDeleteDialog(false);
      } else {
        const error = await response.json();
        console.error('Delete failed:', error);
        alert(`Failed to delete clinics: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete clinics. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchClinics = useCallback(async (currentOffset: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedState) params.set('state', selectedState);
      if (featuredFilter) params.set('featured', featuredFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (enhancedFilter) params.set('enhanced', enhancedFilter);
      if (updatedFilter) params.set('updated', updatedFilter);
      params.set('sortBy', sortBy);
      params.set('sortDir', sortDir);
      params.set('limit', limit.toString());
      params.set('offset', currentOffset.toString());

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
  }, [searchQuery, selectedState, featuredFilter, statusFilter, enhancedFilter, updatedFilter, sortBy, sortDir]);

  // Debounced search - only triggers on filter/sort changes, resets to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
      fetchClinics(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedState, featuredFilter, statusFilter, enhancedFilter, updatedFilter, sortBy, sortDir, fetchClinics]);

  // Fetch on offset change (pagination) - separate from filter changes
  useEffect(() => {
    if (offset > 0) {
      fetchClinics(offset);
    }
  }, [offset, fetchClinics]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedState('');
    setFeaturedFilter('');
    setStatusFilter('');
    setEnhancedFilter('');
    setUpdatedFilter('');
    setSortBy('createdAt');
    setSortDir('desc');
    setOffset(0);
  };

  const hasFilters = searchQuery || selectedState || featuredFilter || statusFilter || enhancedFilter || updatedFilter;

  // Toggle sort on column header click
  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  // Get sort icon for column header
  const getSortIcon = (column: SortColumn) => {
    if (sortBy !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

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

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>

          {/* Enhanced Filter */}
          <Select value={enhancedFilter} onValueChange={setEnhancedFilter}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Enhanced" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Enhanced</SelectItem>
              <SelectItem value="false">Not Enhanced</SelectItem>
            </SelectContent>
          </Select>

          {/* Recently Updated Filter (Import) */}
          <Select value={updatedFilter} onValueChange={setUpdatedFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Import Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clinics</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="updated-7">Updated (7 days)</SelectItem>
              <SelectItem value="updated-14">Updated (14 days)</SelectItem>
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
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
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

        {/* Results Count & Top Pagination */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>
              Showing {clinics.length} of {totalCount.toLocaleString()} clinics
            </span>
            {hasFilters && (
              <Badge variant="outline" className="gap-1">
                <Filter className="h-3 w-3" />
                Filtered
              </Badge>
            )}
          </div>
          {totalCount > limit && (
            <div className="flex items-center gap-2">
              <span className="text-xs">
                Page {Math.floor(offset / limit) + 1}/{Math.ceil(totalCount / limit)}
              </span>
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
                  <TableHead>
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Clinic Name
                      {getSortIcon('title')}
                    </button>
                  </TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center w-[80px]">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center justify-center hover:text-foreground transition-colors w-full"
                      title="Imported Date"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {getSortIcon('createdAt')}
                    </button>
                  </TableHead>
                  <TableHead className="text-center w-[50px]">
                    <button
                      onClick={() => handleSort('enhanced')}
                      className="flex items-center justify-center hover:text-foreground transition-colors w-full"
                      title="Enhanced"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {getSortIcon('enhanced')}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">
                    <button
                      onClick={() => handleSort('rating')}
                      className="flex items-center justify-center hover:text-foreground transition-colors w-full"
                    >
                      Rating
                      {getSortIcon('rating')}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">
                    <button
                      onClick={() => handleSort('reviewCount')}
                      className="flex items-center justify-center hover:text-foreground transition-colors w-full"
                    >
                      Reviews
                      {getSortIcon('reviewCount')}
                    </button>
                  </TableHead>
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
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/clinics/${clinic.id}`}
                          className="font-medium hover:underline"
                        >
                          {clinic.title}
                        </Link>
                        <ClinicImportBadge
                          importUpdatedAt={clinic.importUpdatedAt}
                          showNew={false}
                          size="sm"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {clinic.city}, {clinic.stateAbbreviation}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {clinic.createdAt ? formatDate(clinic.createdAt) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {clinic.hasEnhancedContent ? (
                        <span className="text-green-600 font-medium">Y</span>
                      ) : (
                        <span className="text-muted-foreground">N</span>
                      )}
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
                      <div className="flex items-center justify-center gap-1.5">
                        {clinic.status === 'published' ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                            Published
                          </Badge>
                        ) : clinic.status === 'draft' ? (
                          <Badge variant="secondary">
                            Draft
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Deleted
                          </Badge>
                        )}
                        {clinic.isFeatured && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                            {clinic.featuredTier || 'Featured'}
                          </Badge>
                        )}
                      </div>
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
          fetchClinics(offset);
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
          fetchClinics(offset);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Clinics?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to permanently delete{' '}
                <strong>{selectedIds.size} clinic{selectedIds.size !== 1 ? 's' : ''}</strong>{' '}
                from the database.
              </p>
              <p className="text-destructive font-medium">
                This action cannot be undone. All clinic data, services, and claims will be permanently removed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedIds.size} Clinic{selectedIds.size !== 1 ? 's' : ''}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
