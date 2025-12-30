"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Broadcast } from "@/lib/broadcast/broadcast-queries";

interface BroadcastDetailActionsProps {
  broadcast: Broadcast;
}

export function BroadcastDetailActions({ broadcast }: BroadcastDetailActionsProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = async () => {
    try {
      setIsDuplicating(true);
      const response = await fetch(`/api/admin/broadcasts/${broadcast.id}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate broadcast");
      }

      const { broadcast: newBroadcast } = await response.json();
      toast.success("Broadcast duplicated", {
        description: `Created "${newBroadcast.name}"`,
      });
      router.push(`/admin/broadcasts/${newBroadcast.id}/edit`);
    } catch {
      toast.error("Failed to duplicate broadcast");
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/broadcasts/${broadcast.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete broadcast");
      }

      toast.success("Broadcast deleted");
      router.push("/admin/broadcasts");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete broadcast");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const isDraft = broadcast.status === "draft";

  return (
    <>
      <div className="flex items-center gap-2">
        {isDraft && (
          <Button asChild variant="outline">
            <Link href={`/admin/broadcasts/${broadcast.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        )}

        <Button
          variant="outline"
          onClick={handleDuplicate}
          disabled={isDuplicating}
        >
          <Copy className="h-4 w-4 mr-2" />
          {isDuplicating ? "Duplicating..." : "Duplicate"}
        </Button>

        {isDraft && (
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Broadcast</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{broadcast.name}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
