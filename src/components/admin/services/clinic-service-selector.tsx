"use client";

import * as React from "react";
import { Star, Search, Loader2, GripVertical, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  SERVICE_CATEGORIES,
  type Service,
  type ClinicService,
  type SetServiceInput,
  type ServiceCategory,
} from "@/types/service";
import { SERVICE_ICONS } from "./service-icon-picker";

interface ClinicServiceSelectorProps {
  clinicId: string;
  initialServices: ClinicService[];
  availableServices: Service[];
  onSave: (services: SetServiceInput[]) => Promise<void>;
}

interface ServiceSelection {
  serviceId: string;
  service: Service;
  isFeatured: boolean;
  displayOrder: number;
}

const MAX_FEATURED = 8;

export function ClinicServiceSelector({
  initialServices,
  availableServices,
  onSave,
}: ClinicServiceSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Build a map of all services (both assigned and available)
  const allServicesMap = React.useMemo(() => {
    const map = new Map<string, Service>();
    initialServices.forEach((cs) => {
      if (cs.service) {
        map.set(cs.service.id, cs.service);
      }
    });
    availableServices.forEach((s) => {
      map.set(s.id, s);
    });
    return map;
  }, [initialServices, availableServices]);

  // Track selected services with their featured status
  const [selections, setSelections] = React.useState<Map<string, ServiceSelection>>(() => {
    const map = new Map<string, ServiceSelection>();
    initialServices.forEach((cs) => {
      if (cs.service) {
        map.set(cs.serviceId, {
          serviceId: cs.serviceId,
          service: cs.service,
          isFeatured: cs.isFeatured,
          displayOrder: cs.displayOrder ?? 0,
        });
      }
    });
    return map;
  });

  // Track collapsed state for categories
  const [collapsedCategories, setCollapsedCategories] = React.useState<Set<string>>(new Set());

  // Group all services by category
  const servicesByCategory = React.useMemo(() => {
    const groups: Record<ServiceCategory, Service[]> = {
      injection: [],
      procedure: [],
      physical: [],
      diagnostic: [],
      management: [],
      specialized: [],
    };

    allServicesMap.forEach((service) => {
      if (service.isActive) {
        groups[service.category].push(service);
      }
    });

    // Sort each group by displayOrder then name
    Object.values(groups).forEach((services) => {
      services.sort((a, b) => {
        const orderDiff = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return a.name.localeCompare(b.name);
      });
    });

    return groups;
  }, [allServicesMap]);

  // Filter services by search query
  const filteredServicesByCategory = React.useMemo(() => {
    if (!searchQuery.trim()) return servicesByCategory;

    const query = searchQuery.toLowerCase();
    const filtered: Record<ServiceCategory, Service[]> = {
      injection: [],
      procedure: [],
      physical: [],
      diagnostic: [],
      management: [],
      specialized: [],
    };

    Object.entries(servicesByCategory).forEach(([category, services]) => {
      filtered[category as ServiceCategory] = services.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
      );
    });

    return filtered;
  }, [servicesByCategory, searchQuery]);

  // Get featured services count
  const featuredCount = React.useMemo(() => {
    let count = 0;
    selections.forEach((s) => {
      if (s.isFeatured) count++;
    });
    return count;
  }, [selections]);

  // Get featured services sorted by display order
  const featuredServices = React.useMemo(() => {
    return Array.from(selections.values())
      .filter((s) => s.isFeatured)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [selections]);

  const toggleService = (service: Service) => {
    setHasChanges(true);
    setSelections((prev) => {
      const next = new Map(prev);
      if (next.has(service.id)) {
        next.delete(service.id);
      } else {
        next.set(service.id, {
          serviceId: service.id,
          service,
          isFeatured: false,
          displayOrder: 0,
        });
      }
      return next;
    });
  };

  const toggleFeatured = (serviceId: string) => {
    setHasChanges(true);
    setSelections((prev) => {
      const next = new Map(prev);
      const selection = next.get(serviceId);
      if (selection) {
        const newFeatured = !selection.isFeatured;
        // If making featured and already at max, don't allow
        if (newFeatured && featuredCount >= MAX_FEATURED) {
          return prev;
        }
        // Update display order for newly featured
        const newDisplayOrder = newFeatured ? featuredCount : 0;
        next.set(serviceId, {
          ...selection,
          isFeatured: newFeatured,
          displayOrder: newDisplayOrder,
        });
      }
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const moveFeatured = (index: number, direction: "up" | "down") => {
    setHasChanges(true);
    const featured = [...featuredServices];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= featured.length) return;

    // Swap
    const temp = featured[index];
    const swapItem = featured[newIndex];
    if (temp && swapItem) {
      featured[index] = swapItem;
      featured[newIndex] = temp;
    }

    // Update display orders
    setSelections((prev) => {
      const next = new Map(prev);
      featured.forEach((s, i) => {
        next.set(s.serviceId, { ...s, displayOrder: i });
      });
      return next;
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const services: SetServiceInput[] = [];
      let orderIndex = 0;

      // First add featured services in order
      featuredServices.forEach((s) => {
        services.push({
          serviceId: s.serviceId,
          isFeatured: true,
          displayOrder: orderIndex++,
        });
      });

      // Then add non-featured services
      selections.forEach((s) => {
        if (!s.isFeatured) {
          services.push({
            serviceId: s.serviceId,
            isFeatured: false,
            displayOrder: orderIndex++,
          });
        }
      });

      await onSave(services);
      setHasChanges(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with save button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {selections.size} services selected
            {featuredCount > 0 && ` (${featuredCount} featured)`}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isLoading || !hasChanges}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {hasChanges ? "Save Changes" : "Saved"}
          {!isLoading && !hasChanges && <Check className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      {/* Featured services section */}
      {featuredCount > 0 && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">Featured Services</span>
            </div>
            <Badge variant={featuredCount > MAX_FEATURED ? "destructive" : "secondary"}>
              {featuredCount}/{MAX_FEATURED} recommended
            </Badge>
          </div>
          <div className="space-y-2">
            {featuredServices.map((selection, index) => {
              const Icon = SERVICE_ICONS[selection.service.iconName];
              return (
                <div
                  key={selection.serviceId}
                  className="flex items-center gap-2 bg-background rounded-md p-2"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2 flex-1">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="text-sm">{selection.service.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveFeatured(index, "up")}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveFeatured(index, "down")}
                      disabled={index === featuredServices.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleFeatured(selection.serviceId)}
                    >
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Service categories */}
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {(Object.keys(SERVICE_CATEGORIES) as ServiceCategory[]).map((category) => {
            const services = filteredServicesByCategory[category];
            if (services.length === 0) return null;

            const selectedInCategory = services.filter((s) => selections.has(s.id)).length;
            const isCollapsed = collapsedCategories.has(category);

            return (
              <Collapsible
                key={category}
                open={!isCollapsed}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md cursor-pointer hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {SERVICE_CATEGORIES[category].label}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {selectedInCategory}/{services.length}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {isCollapsed ? "▶" : "▼"}
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-2 pt-2 pl-2">
                    {services.map((service) => {
                      const isSelected = selections.has(service.id);
                      const selection = selections.get(service.id);
                      const Icon = SERVICE_ICONS[service.iconName];

                      return (
                        <div
                          key={service.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-md border transition-colors",
                            isSelected
                              ? "bg-primary/5 border-primary/30"
                              : "bg-background hover:bg-muted/50"
                          )}
                        >
                          <Checkbox
                            id={`service-${service.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleService(service)}
                          />
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {Icon && (
                              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0">
                                <Icon className="h-4 w-4" />
                              </div>
                            )}
                            <Label
                              htmlFor={`service-${service.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-medium">{service.name}</div>
                              {service.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {service.description}
                                </div>
                              )}
                            </Label>
                          </div>
                          {isSelected && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0"
                              onClick={(e) => {
                                e.preventDefault();
                                toggleFeatured(service.id);
                              }}
                              disabled={!selection?.isFeatured && featuredCount >= MAX_FEATURED}
                              title={
                                selection?.isFeatured
                                  ? "Remove from featured"
                                  : featuredCount >= MAX_FEATURED
                                    ? "Maximum featured services reached"
                                    : "Add to featured"
                              }
                            >
                              <Star
                                className={cn(
                                  "h-4 w-4",
                                  selection?.isFeatured
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
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
