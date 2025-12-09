"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceForm } from "@/components/admin/services/service-form";
import type { Service, ServiceCategory } from "@/types/service";

interface ServiceFormData {
  name: string;
  slug: string;
  iconName: string;
  description: string;
  category: ServiceCategory;
  isActive: boolean;
  displayOrder: number;
}

interface EditServiceClientProps {
  service: Service;
}

export function EditServiceClient({ service }: EditServiceClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ServiceFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update service");
      }

      router.push("/admin/services");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return <ServiceForm service={service} onSubmit={handleSubmit} isLoading={isLoading} />;
}
