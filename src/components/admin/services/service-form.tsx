"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SERVICE_CATEGORIES, type Service, type ServiceCategory } from "@/types/service";
import { ServiceIconPicker } from "./service-icon-picker";

interface ServiceFormData {
  name: string;
  slug: string;
  iconName: string;
  description: string;
  category: ServiceCategory;
  isActive: boolean;
  displayOrder: number;
}

interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  isLoading?: boolean;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function ServiceForm({ service, onSubmit, isLoading }: ServiceFormProps) {
  const router = useRouter();
  const [formData, setFormData] = React.useState<ServiceFormData>({
    name: service?.name ?? "",
    slug: service?.slug ?? "",
    iconName: service?.iconName ?? "Syringe",
    description: service?.description ?? "",
    category: service?.category ?? "injection",
    isActive: service?.isActive ?? true,
    displayOrder: service?.displayOrder ?? 0,
  });
  const [autoSlug, setAutoSlug] = React.useState(!service);
  const [error, setError] = React.useState<string | null>(null);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      ...(autoSlug ? { slug: generateSlug(name) } : {}),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setAutoSlug(false);
    setFormData((prev) => ({ ...prev, slug: generateSlug(slug) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.slug.trim()) {
      setError("Slug is required");
      return;
    }
    if (!formData.iconName) {
      setError("Icon is required");
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{service ? "Edit Service" : "Add New Service"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Physical Therapy"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g., physical-therapy"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from name. Edit to customize.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon *</Label>
              <ServiceIconPicker
                value={formData.iconName}
                onChange={(iconName) =>
                  setFormData((prev) => ({ ...prev, iconName }))
                }
                disabled={isLoading ?? false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: ServiceCategory) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                disabled={isLoading ?? false}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SERVICE_CATEGORIES) as ServiceCategory[]).map(
                    (key) => (
                      <SelectItem key={key} value={key}>
                        {SERVICE_CATEGORIES[key].label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Brief description of this service..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    displayOrder: parseInt(e.target.value) || 0,
                  }))
                }
                min={0}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: value === "active",
                  }))
                }
                disabled={isLoading ?? false}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {service ? "Update Service" : "Create Service"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
