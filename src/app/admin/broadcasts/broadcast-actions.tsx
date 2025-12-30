"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Eye, Copy, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface BroadcastActionsProps {
  broadcast: Broadcast;
}

export function BroadcastActions({ broadcast }: BroadcastActionsProps) {
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
      router.refresh();
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
      router.refresh();
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/admin/broadcasts/${broadcast.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>

          {isDraft && (
            <DropdownMenuItem
              onClick={() => router.push(`/admin/broadcasts/${broadcast.id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Draft
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            <Copy className="h-4 w-4 mr-2" />
            {isDuplicating ? "Duplicating..." : "Duplicate"}
          </DropdownMenuItem>

          {isDraft && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 focus:text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
