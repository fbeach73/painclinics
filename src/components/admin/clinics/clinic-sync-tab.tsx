"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface SyncStatusData {
  clinicId: string;
  placeId: string | null;
  hasPlaceId: boolean;
  syncStatus: {
    lastReviewSync: string | null;
    lastHoursSync: string | null;
    lastPhotosSync: string | null;
    lastContactSync: string | null;
    lastLocationSync: string | null;
    lastFullSync: string | null;
    lastSyncError: string | null;
    consecutiveErrors: number;
  } | null;
  apiConfigured: boolean;
}

interface PlaceSearchResult {
  id: string;
  name: string;
  address: string;
  location: { latitude: number; longitude: number } | null;
}

interface SyncResult {
  success: boolean;
  error?: string;
  updatedFields?: string[];
  changes?: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
}

interface ClinicSyncTabProps {
  clinicId: string;
  clinicName: string;
  initialPlaceId: string | null;
}

type SyncFieldType = "reviews" | "hours" | "contact" | "location";

const SYNC_FIELDS: { type: SyncFieldType; label: string; icon: React.ReactNode }[] = [
  { type: "reviews", label: "Reviews", icon: <MessageSquare className="h-4 w-4" /> },
  { type: "hours", label: "Hours", icon: <Clock className="h-4 w-4" /> },
  { type: "contact", label: "Contact", icon: <Phone className="h-4 w-4" /> },
  { type: "location", label: "Location", icon: <MapPin className="h-4 w-4" /> },
];

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function ClinicSyncTab({ clinicId, clinicName, initialPlaceId }: ClinicSyncTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState(initialPlaceId || "");

  // Places lookup state
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingPlaceId, setIsSavingPlaceId] = useState(false);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/sync`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sync status");
      }

      setSyncStatus(data);
      if (data.placeId) {
        setPlaceId(data.placeId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sync status");
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  const handleSync = async (fields?: SyncFieldType[]) => {
    const syncType = fields ? fields.join(",") : "all";
    setIsSyncing(syncType);
    setError(null);

    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields ? { fields } : {}),
      });

      const data: SyncResult = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Sync failed");
      }

      const changeCount = data.changes?.length || 0;
      toast.success("Sync completed", {
        description: changeCount > 0
          ? `Updated ${changeCount} field${changeCount > 1 ? "s" : ""}`
          : "No changes detected",
      });

      await fetchSyncStatus();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      setError(message);
      toast.error("Sync failed", { description: message });
    } finally {
      setIsSyncing(null);
    }
  };

  const handlePlaceSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 3) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/admin/places/lookup?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setSearchResults(data.places || []);
    } catch (err) {
      toast.error("Search failed", {
        description: err instanceof Error ? err.message : "Failed to search places",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = async (place: PlaceSearchResult) => {
    setIsSavingPlaceId(true);
    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: place.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update Place ID");
      }

      setPlaceId(place.id);
      setIsLookupOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      toast.success("Place ID updated", {
        description: `Set to ${place.name}`,
      });

      await fetchSyncStatus();
      router.refresh();
    } catch (err) {
      toast.error("Failed to update Place ID", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSavingPlaceId(false);
    }
  };

  const handleManualPlaceIdSave = async () => {
    if (!placeId.trim()) return;

    setIsSavingPlaceId(true);
    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: placeId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update Place ID");
      }

      toast.success("Place ID saved");
      await fetchSyncStatus();
      router.refresh();
    } catch (err) {
      toast.error("Failed to save Place ID", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSavingPlaceId(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading sync status...</span>
        </CardContent>
      </Card>
    );
  }

  const hasErrors = (syncStatus?.syncStatus?.consecutiveErrors ?? 0) > 0;
  const lastError = syncStatus?.syncStatus?.lastSyncError;

  return (
    <div className="space-y-6">
      {/* API Configuration Warning */}
      {syncStatus && !syncStatus.apiConfigured && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Not Configured</AlertTitle>
          <AlertDescription>
            Google Places API key is not configured. Add GOOGLE_PLACES_API_KEY to your environment variables.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Last Sync Error Alert */}
      {hasErrors && lastError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            Previous Sync Failed ({syncStatus?.syncStatus?.consecutiveErrors} consecutive errors)
          </AlertTitle>
          <AlertDescription>{lastError}</AlertDescription>
        </Alert>
      )}

      {/* Place ID Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Google Place ID
          </CardTitle>
          <CardDescription>
            Link this clinic to a Google Places listing for data sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                placeholder="Enter Google Place ID (e.g., ChIJ...)"
                className="font-mono text-sm"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleManualPlaceIdSave}
              disabled={!placeId.trim() || isSavingPlaceId || placeId === syncStatus?.placeId}
            >
              {isSavingPlaceId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
            <Dialog open={isLookupOpen} onOpenChange={setIsLookupOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  Lookup
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Find Place on Google</DialogTitle>
                  <DialogDescription>
                    Search for the clinic on Google Places to get the Place ID
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search for "${clinicName}"...`}
                      onKeyDown={(e) => e.key === "Enter" && handlePlaceSearch()}
                    />
                    <Button onClick={handlePlaceSearch} disabled={isSearching}>
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {searchResults.map((place) => (
                        <button
                          key={place.id}
                          className="w-full p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors"
                          onClick={() => handleSelectPlace(place)}
                          disabled={isSavingPlaceId}
                        >
                          <div className="font-medium">{place.name}</div>
                          <div className="text-sm text-muted-foreground">{place.address}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-1">
                            {place.id}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.length === 0 && searchQuery && !isSearching && (
                    <div className="text-center text-muted-foreground py-4">
                      No results found. Try a different search term.
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {syncStatus?.placeId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Place ID is set</span>
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${syncStatus.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:underline ml-2"
              >
                View on Google Maps
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Data from Google
          </CardTitle>
          <CardDescription>
            Pull the latest data from Google Places for this clinic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sync All Button */}
          <div>
            <Button
              onClick={() => handleSync()}
              disabled={!syncStatus?.hasPlaceId || isSyncing !== null || !syncStatus?.apiConfigured}
              className="w-full sm:w-auto"
            >
              {isSyncing === "all" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing All...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync All Fields
                </>
              )}
            </Button>
            {!syncStatus?.hasPlaceId && (
              <p className="text-sm text-muted-foreground mt-2">
                Set a Place ID above to enable syncing
              </p>
            )}
          </div>

          <Separator />

          {/* Individual Field Sync */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Sync Individual Fields
            </Label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SYNC_FIELDS.map(({ type, label, icon }) => {
                const lastSyncKey = `last${type.charAt(0).toUpperCase() + type.slice(1)}Sync` as keyof NonNullable<SyncStatusData["syncStatus"]>;
                const lastSync = syncStatus?.syncStatus?.[lastSyncKey] as string | null;

                return (
                  <Card key={type} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span className="font-medium text-sm">{label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync([type])}
                        disabled={!syncStatus?.hasPlaceId || isSyncing !== null || !syncStatus?.apiConfigured}
                      >
                        {isSyncing === type ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last: {formatRelativeTime(lastSync)}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Sync Status Summary */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Last Full Sync</Label>
            <div className="flex items-center gap-2">
              {syncStatus?.syncStatus?.lastFullSync ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{formatRelativeTime(syncStatus.syncStatus.lastFullSync)}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Never synced</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4" />
            About Google Places Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Sync</strong> pulls the latest data from Google Places API and updates this clinic&apos;s listing.
          </p>
          <Separator className="my-3" />
          <div>
            <strong>Syncable fields:</strong>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
              <li><strong>Reviews:</strong> Rating, review count, and featured reviews</li>
              <li><strong>Hours:</strong> Business hours and schedule</li>
              <li><strong>Contact:</strong> Phone number and website</li>
              <li><strong>Location:</strong> Address and coordinates</li>
            </ul>
          </div>
          <Separator className="my-3" />
          <p>
            <Badge variant="outline" className="mr-2">Tip</Badge>
            Use the lookup feature to find the correct Google Place ID if you don&apos;t have it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
