"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceForm } from "@/components/admin/services/service-form";
import type { ServiceCategory } from "@/types/service";

interface ServiceFormData {
  name: string;
  slug: string;
  iconName: string;
  description: string;
  category: ServiceCategory;
  isActive: boolean;
  displayOrder: number;
}

export default function NewServicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ServiceFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create service");
      }

      router.push("/admin/services");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New Service</h1>
        <p className="text-muted-foreground">
          Create a new service that clinics can add to their profile
        </p>
      </div>
      <div className="max-w-2xl">
        <ServiceForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
