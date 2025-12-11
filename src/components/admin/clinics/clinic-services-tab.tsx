"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ClinicServiceSelector } from "@/components/admin/services/clinic-service-selector";
import type { Service, ClinicService, SetServiceInput } from "@/types/service";

interface ClinicServicesTabProps {
  clinicId: string;
  clinicName: string;
  initialServices: ClinicService[];
  availableServices: Service[];
}

export function ClinicServicesTab({
  clinicId,
  clinicName,
  initialServices,
  availableServices,
}: ClinicServicesTabProps) {
  const router = useRouter();

  const handleSave = async (services: SetServiceInput[]) => {
    try {
      const response = await fetch(`/api/admin/services/clinic/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update services");
      }

      // Show success message
      const featuredCount = services.filter((s) => s.isFeatured).length;
      toast.success(
        `Updated ${services.length} services for ${clinicName}`,
        {
          description: featuredCount > 0 ? `${featuredCount} featured` : undefined,
        }
      );

      // Show warnings if any
      if (data.warnings?.length > 0) {
        data.warnings.forEach((warning: string) => {
          toast.warning(warning);
        });
      }

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Failed to save services:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update services"
      );
      throw error; // Re-throw to keep loading state in selector
    }
  };

  return (
    <ClinicServiceSelector
      clinicId={clinicId}
      initialServices={initialServices}
      availableServices={availableServices}
      onSave={handleSave}
    />
  );
}

// Loading state component
export function ClinicServicesTabLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
