'use client';

import { useState } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { PermissionState } from '@/hooks/use-geolocation';

interface GeolocationPromptProps {
  onEnableLocation: () => void;
  onSearchLocation?: (query: string) => void;
  isLoading?: boolean;
  permissionState: PermissionState;
  error?: string | null;
}

export function GeolocationPrompt({
  onEnableLocation,
  onSearchLocation,
  isLoading = false,
  permissionState,
  error,
}: GeolocationPromptProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearchLocation) {
      onSearchLocation(searchQuery.trim());
    }
  };

  const showEnableButton = permissionState !== 'denied' && permissionState !== 'unavailable';
  const showDeniedMessage = permissionState === 'denied';
  const showUnavailableMessage = permissionState === 'unavailable';

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 p-4 pointer-events-none">
      <Card className="mx-auto max-w-md shadow-lg pointer-events-auto">
        <CardContent className="p-4 space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-sm">Find Clinics Near You</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {showDeniedMessage
                ? 'Location access was denied. Search for a city or ZIP code instead.'
                : showUnavailableMessage
                  ? 'Location is not available. Search for a city or ZIP code instead.'
                  : 'Enable location or enter a city/ZIP code to find nearby clinics.'}
            </p>
          </div>

          {showEnableButton && (
            <Button
              onClick={onEnableLocation}
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Enable Location
                </>
              )}
            </Button>
          )}

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {showEnableButton ? 'or search' : 'search location'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="City or ZIP code"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary" size="icon" disabled={!searchQuery.trim()}>
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
