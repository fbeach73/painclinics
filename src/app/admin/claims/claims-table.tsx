"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, XCircle, AlertCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Claim {
  id: string;
  clinicId: string;
  userId: string;
  fullName: string;
  role: string;
  businessEmail: string;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  clinic: {
    id: string;
    title: string;
    city: string;
    state: string;
  };
  claimant: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface ClaimsTableProps {
  claims: Claim[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case "approved":
      return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    case "rejected":
      return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    case "expired":
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getRoleLabel(role: string) {
  switch (role) {
    case "owner":
      return "Owner";
    case "manager":
      return "Manager";
    case "authorized_representative":
      return "Authorized Rep";
    default:
      return role;
  }
}

export function ClaimsTable({ claims }: ClaimsTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === claims.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(claims.map(c => c.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/claims", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimIds: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete claims");
      }

      const result = await response.json();
      toast.success(`Deleted ${result.deleted} claim(s)`);
      setSelectedIds(new Set());
      setShowDeleteDialog(false);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Failed to delete claims", { description: errorMessage });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-muted/50 border rounded-lg p-3 mb-4">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} claim{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={claims.length > 0 && selectedIds.size === claims.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Clinic</TableHead>
              <TableHead>Claimant</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <TableRow key={claim.id} className="hover:bg-muted/50">
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(claim.id)}
                    onCheckedChange={() => toggleSelect(claim.id)}
                    aria-label={`Select ${claim.clinic.title}`}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/claims/${claim.id}`}
                    className="font-medium hover:underline block"
                  >
                    {claim.clinic.title}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {claim.clinic.city}, {claim.clinic.state}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={claim.claimant.image || undefined} />
                      <AvatarFallback>
                        {claim.claimant.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{claim.fullName}</div>
                      <div className="text-sm text-muted-foreground">{claim.businessEmail}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getRoleLabel(claim.role)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(claim.createdAt)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(claim.status)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} claim{selectedIds.size > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the selected claim records from the database.
              This action cannot be undone. The associated clinics will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
