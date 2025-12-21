'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  location: { latitude: number; longitude: number } | null;
}

interface PlacesLookupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (place: PlaceResult) => void;
  initialQuery?: string;
}

export function PlacesLookupDialog({
  open,
  onOpenChange,
  onSelect,
  initialQuery = '',
}: PlacesLookupDialogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setResults([]);
      setError(null);
      setHasSearched(false);
    }
  }, [open, initialQuery]);

  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({ q: searchQuery });
      const response = await fetch(`/api/admin/places/lookup?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search places');
      }

      setResults(data.places || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        searchPlaces(query);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchPlaces]);

  const handleSelect = (place: PlaceResult) => {
    onSelect(place);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Google Places
          </DialogTitle>
          <DialogDescription>
            Search for a business to get its location data and Place ID
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a clinic or business..."
              className="pl-9"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 ? (
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-2 space-y-1">
                {results.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => handleSelect(place)}
                    className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="font-medium text-sm">{place.name}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {place.address}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : hasSearched && !isSearching && !error ? (
            <div className="h-[300px] flex items-center justify-center border rounded-md">
              <div className="text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No places found</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            </div>
          ) : !hasSearched ? (
            <div className="h-[300px] flex items-center justify-center border rounded-md">
              <div className="text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Enter at least 3 characters to search</p>
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
