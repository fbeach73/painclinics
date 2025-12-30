"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Loader2,
  Star,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ClinicService, SetServiceInput, ServiceCategory } from "@/types/service";

/**
 * Service suggestion from AI analysis.
 */
interface ServiceSuggestion {
  serviceId?: string;
  serviceName: string;
  confidence: "high" | "medium" | "low";
  evidence: string;
  isNew: boolean;
  suggestedCategory?: ServiceCategory;
}

/**
 * Response structure from enhance services API.
 */
interface EnhanceServicesResponse {
  success: boolean;
  existingServices: ServiceSuggestion[];
  suggestedNewServices: ServiceSuggestion[];
  featuredRecommendations: string[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ServiceEnhanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  clinicName: string;
  currentServices: ClinicService[];
  onApply: (services: SetServiceInput[]) => Promise<void>;
}

/**
 * Confidence badge with color coding.
 */
function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", styles[confidence])}>
      {confidence}
    </Badge>
  );
}

export function ServiceEnhanceModal({
  open,
  onOpenChange,
  clinicId,
  clinicName,
  currentServices,
  onApply,
}: ServiceEnhanceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<EnhanceServicesResponse | null>(null);

  // Track selected services
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedFeatured, setSelectedFeatured] = useState<Set<string>>(new Set());

  // Get current service IDs for reference
  const currentServiceIds = new Set(currentServices.map((cs) => cs.serviceId));

  /**
   * Fetch AI suggestions when modal opens.
   */
  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    setSelectedServices(new Set());
    setSelectedFeatured(new Set());

    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/enhance-services`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI suggestions");
      }

      setSuggestions(data);

      // Pre-select high confidence services
      const highConfidence = new Set<string>();
      data.existingServices.forEach((s: ServiceSuggestion) => {
        if (s.confidence === "high" && s.serviceId) {
          highConfidence.add(s.serviceId);
        }
      });
      setSelectedServices(highConfidence);

      // Pre-select featured recommendations
      setSelectedFeatured(new Set(data.featuredRecommendations || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get suggestions");
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  // Fetch suggestions when modal opens
  useEffect(() => {
    if (open) {
      fetchSuggestions();
    }
  }, [open, fetchSuggestions]);

  /**
   * Toggle service selection.
   */
  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
        // Also remove from featured if deselecting
        setSelectedFeatured((prevFeatured) => {
          const nextFeatured = new Set(prevFeatured);
          nextFeatured.delete(serviceId);
          return nextFeatured;
        });
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  /**
   * Toggle featured selection.
   */
  const toggleFeatured = (serviceId: string) => {
    setSelectedFeatured((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else if (next.size < 8) {
        // Max 8 featured
        next.add(serviceId);
      }
      return next;
    });
  };

  /**
   * Apply selected services.
   */
  const handleApply = async () => {
    setIsApplying(true);
    try {
      // Build the services list
      // Start with current services (preserve existing)
      const services: SetServiceInput[] = [];
      let displayOrder = 0;

      // First, add newly selected services from suggestions
      selectedServices.forEach((serviceId) => {
        // Skip if already in current services
        if (currentServiceIds.has(serviceId)) return;

        services.push({
          serviceId,
          isFeatured: selectedFeatured.has(serviceId),
          displayOrder: displayOrder++,
        });
      });

      // Then add existing services, updating featured status if in recommendations
      currentServices.forEach((cs) => {
        const isFeatured = selectedFeatured.has(cs.serviceId) || cs.isFeatured;
        services.push({
          serviceId: cs.serviceId,
          isFeatured,
          displayOrder: displayOrder++,
        });
      });

      await onApply(services);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply services");
    } finally {
      setIsApplying(false);
    }
  };

  const hasSelections = selectedServices.size > 0;
  const newServicesCount = Array.from(selectedServices).filter(
    (id) => !currentServiceIds.has(id)
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Service Suggestions
          </DialogTitle>
          <DialogDescription>
            Review AI-suggested services for {clinicName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analyzing clinic data for service suggestions...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchSuggestions}>
                Try Again
              </Button>
            </div>
          ) : suggestions ? (
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6">
                {/* Suggested Services Section */}
                {suggestions.existingServices.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Suggested Services
                      <Badge variant="secondary" className="ml-auto">
                        {suggestions.existingServices.length} found
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {suggestions.existingServices.map((suggestion) => {
                        const serviceId = suggestion.serviceId;
                        if (!serviceId) return null;

                        const isSelected = selectedServices.has(serviceId);
                        const isAlreadyAssigned = currentServiceIds.has(serviceId);
                        const isFeatured = selectedFeatured.has(serviceId);

                        return (
                          <div
                            key={serviceId}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-md border transition-colors",
                              isAlreadyAssigned
                                ? "bg-muted/30 border-muted"
                                : isSelected
                                  ? "bg-primary/5 border-primary/30"
                                  : "bg-background hover:bg-muted/50"
                            )}
                          >
                            <Checkbox
                              checked={isSelected || isAlreadyAssigned}
                              onCheckedChange={() => !isAlreadyAssigned && toggleService(serviceId)}
                              disabled={isAlreadyAssigned}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{suggestion.serviceName}</span>
                                <ConfidenceBadge confidence={suggestion.confidence} />
                                {isAlreadyAssigned && (
                                  <Badge variant="outline" className="text-xs">
                                    Already assigned
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                &ldquo;{suggestion.evidence}&rdquo;
                              </p>
                            </div>
                            {(isSelected || isAlreadyAssigned) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0"
                                onClick={() => toggleFeatured(serviceId)}
                                disabled={!isFeatured && selectedFeatured.size >= 8}
                                title={isFeatured ? "Remove from featured" : "Add to featured"}
                              >
                                <Star
                                  className={cn(
                                    "h-4 w-4",
                                    isFeatured
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-muted-foreground"
                                  )}
                                />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Featured Recommendations Section */}
                {suggestions.featuredRecommendations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Featured Recommendations
                      <Badge variant="secondary" className="ml-auto">
                        {selectedFeatured.size}/8 selected
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      AI recommends featuring these services prominently on the clinic page.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.featuredRecommendations.map((serviceId) => {
                        const suggestion = suggestions.existingServices.find(
                          (s) => s.serviceId === serviceId
                        );
                        if (!suggestion) return null;

                        const isSelected = selectedFeatured.has(serviceId);

                        return (
                          <Badge
                            key={serviceId}
                            variant={isSelected ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer transition-colors",
                              isSelected && "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700"
                            )}
                            onClick={() => toggleFeatured(serviceId)}
                          >
                            <Star
                              className={cn(
                                "h-3 w-3 mr-1",
                                isSelected ? "fill-current" : ""
                              )}
                            />
                            {suggestion.serviceName}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* New Service Suggestions (Info Only) */}
                {suggestions.suggestedNewServices.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-500" />
                      Suggested New Services
                      <Badge variant="outline" className="ml-auto">
                        Not in master list
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      These services were mentioned but don&apos;t exist in the master list.
                      Add them to the Services page first if needed.
                    </p>
                    <div className="space-y-2">
                      {suggestions.suggestedNewServices.map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-md border bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                        >
                          <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{suggestion.serviceName}</span>
                              <ConfidenceBadge confidence={suggestion.confidence} />
                              {suggestion.suggestedCategory && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {suggestion.suggestedCategory}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              &ldquo;{suggestion.evidence}&rdquo;
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results State */}
                {suggestions.existingServices.length === 0 &&
                  suggestions.suggestedNewServices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">No service suggestions found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          The AI couldn&apos;t identify any services from the available clinic data.
                          Try adding more review text or description content.
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </ScrollArea>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          {suggestions && (
            <p className="text-xs text-muted-foreground mr-auto">
              {suggestions.usage.totalTokens.toLocaleString()} tokens used
            </p>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApplying}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isLoading || isApplying || !hasSelections}
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                Apply Selected
                {newServicesCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    +{newServicesCount}
                  </Badge>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
