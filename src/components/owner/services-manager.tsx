"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Star,
  Loader2,
  Wrench,
  Syringe,
  Stethoscope,
  Activity,
  Settings,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ClinicService, Service, ServiceCategory } from "@/types/service";

interface ServicesManagerProps {
  clinicId: string;
  currentServices: ClinicService[];
  availableServices: Service[];
}

// Map category to icon
const categoryIcons: Record<ServiceCategory, React.ComponentType<{ className?: string }>> = {
  injection: Syringe,
  procedure: Wrench,
  physical: Activity,
  diagnostic: Stethoscope,
  management: Settings,
  specialized: Sparkles,
};

// Category labels
const categoryLabels: Record<ServiceCategory, string> = {
  injection: "Injection Therapies",
  procedure: "Procedures",
  physical: "Physical Therapies",
  diagnostic: "Diagnostic Services",
  management: "Pain Management",
  specialized: "Specialized Treatments",
};

export function ServicesManager({
  clinicId,
  currentServices,
  availableServices,
}: ServicesManagerProps) {
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingService, setRemovingService] = useState<string | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);

  // Group services by category
  const groupedCurrentServices = currentServices.reduce<Record<ServiceCategory, ClinicService[]>>(
    (acc, service) => {
      const category = service.service?.category || "specialized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    },
    {} as Record<ServiceCategory, ClinicService[]>
  );

  const groupedAvailableServices = availableServices.reduce<Record<ServiceCategory, Service[]>>(
    (acc, service) => {
      const category = service.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    },
    {} as Record<ServiceCategory, Service[]>
  );

  const handleToggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleAddServices = async () => {
    if (selectedServices.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/owner/clinics/${clinicId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceIds: selectedServices }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add services");
      }

      toast.success(`Added ${selectedServices.length} service${selectedServices.length > 1 ? "s" : ""}`);
      setSelectedServices([]);
      setIsAddDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add services");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    setRemovingService(serviceId);
    try {
      const response = await fetch(
        `/api/owner/clinics/${clinicId}/services/${serviceId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove service");
      }

      toast.success("Service removed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove service");
    } finally {
      setRemovingService(null);
    }
  };

  const handleToggleFeatured = async (serviceId: string, currentlyFeatured: boolean) => {
    setTogglingFeatured(serviceId);
    try {
      const response = await fetch(
        `/api/owner/clinics/${clinicId}/services/${serviceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFeatured: !currentlyFeatured }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update service");
      }

      toast.success(
        currentlyFeatured ? "Service removed from featured" : "Service marked as featured"
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update service");
    } finally {
      setTogglingFeatured(null);
    }
  };

  const featuredCount = currentServices.filter((s) => s.isFeatured).length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Services Offered</CardTitle>
            <CardDescription>
              {currentServices.length} service{currentServices.length !== 1 ? "s" : ""} •{" "}
              {featuredCount} featured
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Services
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Services</DialogTitle>
                <DialogDescription>
                  Select services to add to your clinic listing
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6 pr-4">
                  {Object.entries(groupedAvailableServices).map(([category, services]) => {
                    const CategoryIcon = categoryIcons[category as ServiceCategory];
                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2 text-sm">
                          <CategoryIcon className="h-4 w-4" />
                          {categoryLabels[category as ServiceCategory]}
                        </h4>
                        <div className="grid gap-2">
                          {services.map((service) => (
                            <label
                              key={service.id}
                              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedServices.includes(service.id)}
                                onCheckedChange={() => handleToggleService(service.id)}
                              />
                              <div>
                                <div className="font-medium">{service.name}</div>
                                {service.description && (
                                  <div className="text-sm text-muted-foreground">
                                    {service.description}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {availableServices.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      All available services have already been added to this clinic.
                    </p>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddServices}
                  disabled={selectedServices.length === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    `Add ${selectedServices.length} Service${selectedServices.length !== 1 ? "s" : ""}`
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Current Services by Category */}
      {currentServices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No services added</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add services to let patients know what treatments you offer.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Services
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedCurrentServices).map(([category, services]) => {
            const CategoryIcon = categoryIcons[category as ServiceCategory];
            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4" />
                    {categoryLabels[category as ServiceCategory]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {services.map((clinicService) => (
                      <div
                        key={clinicService.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            {clinicService.service?.name}
                          </span>
                          {clinicService.isFeatured && (
                            <Badge variant="secondary" className="bg-featured text-featured-foreground border-featured-border">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleToggleFeatured(
                                clinicService.serviceId,
                                clinicService.isFeatured
                              )
                            }
                            disabled={togglingFeatured === clinicService.serviceId}
                          >
                            {togglingFeatured === clinicService.serviceId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Star
                                className={`h-4 w-4 ${
                                  clinicService.isFeatured
                                    ? "fill-featured-foreground text-featured-foreground"
                                    : "text-muted-foreground"
                                }`}
                              />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveService(clinicService.serviceId)}
                            disabled={removingService === clinicService.serviceId}
                          >
                            {removingService === clinicService.serviceId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-medium mb-2">Tips for Services</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Mark your most popular or specialized services as &quot;Featured&quot;</li>
            <li>• Featured services appear prominently on your clinic profile</li>
            <li>• Keep your service list up-to-date for accurate search results</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
