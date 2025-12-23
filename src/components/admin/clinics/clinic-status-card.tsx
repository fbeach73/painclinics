"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClinicStatusCardProps {
  clinicId: string;
  initialStatus: "draft" | "published" | "deleted";
}

const STATUS_OPTIONS = [
  { value: "published", label: "Published", description: "Visible on the public site" },
  { value: "draft", label: "Draft", description: "Hidden from public, visible in admin" },
  { value: "deleted", label: "Deleted", description: "Marked for deletion" },
] as const;

export function ClinicStatusCard({ clinicId, initialStatus }: ClinicStatusCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      setStatus(newStatus as typeof status);
      toast.success(`Status updated to ${newStatus}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast.error("Update failed", { description: message });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={status}
          onValueChange={handleStatusChange}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-full">
            {isUpdating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </div>
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span className={
                    option.value === "published"
                      ? "text-green-600 font-medium"
                      : option.value === "deleted"
                      ? "text-red-600 font-medium"
                      : "font-medium"
                  }>
                    {option.label}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
