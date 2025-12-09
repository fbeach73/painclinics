"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVICE_CATEGORIES, type ServiceWithCount, type ServiceCategory } from "@/types/service";
import { SERVICE_ICONS } from "./service-icon-picker";

interface ServiceListProps {
  services: ServiceWithCount[];
  onDelete: (serviceId: string) => Promise<void>;
}

export function ServiceList({ services, onDelete }: ServiceListProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [deleteTarget, setDeleteTarget] = React.useState<ServiceWithCount | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const filteredServices =
    activeCategory === "all"
      ? services
      : services.filter((s) => s.category === activeCategory);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      console.error("Failed to delete service:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            <TabsTrigger value="all">All ({services.length})</TabsTrigger>
            {(Object.keys(SERVICE_CATEGORIES) as ServiceCategory[]).map((key) => {
              const count = services.filter((s) => s.category === key).length;
              return (
                <TabsTrigger key={key} value={key}>
                  {SERVICE_CATEGORIES[key].label.replace(" Therapies", "").replace(" Services", "")} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <Link href="/admin/services/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Clinics Using</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No services found
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => {
                const Icon = SERVICE_ICONS[service.iconName];
                return (
                  <TableRow key={service.id}>
                    <TableCell>
                      {Icon ? (
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                          <Icon className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-muted" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-xs text-muted-foreground">
                          /{service.slug}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {SERVICE_CATEGORIES[service.category].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={service.clinicCount > 0 ? "default" : "outline"}>
                        {service.clinicCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={service.isActive ? "default" : "secondary"}>
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/services/${service.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(service)}
                          disabled={service.clinicCount > 0}
                          title={
                            service.clinicCount > 0
                              ? "Cannot delete: service is in use"
                              : "Delete service"
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
