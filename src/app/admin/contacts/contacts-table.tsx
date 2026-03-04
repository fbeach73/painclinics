"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Tag, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { Contact } from "@/lib/contact-queries";

interface ContactsTableProps {
  contacts: Contact[];
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function tagVariant(tag: string) {
  switch (tag) {
    case "user":
      return "default" as const;
    case "lead":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export function ContactsTable({ contacts }: ContactsTableProps) {
  const router = useRouter();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTagging, setIsTagging] = useState(false);

  // Tag action state
  const [tagValue, setTagValue] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [tagAction, setTagAction] = useState<"add" | "remove">("add");

  const allSelected =
    contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));
  const someSelected = contacts.some((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      const newSet = new Set(selectedIds);
      contacts.forEach((c) => newSet.delete(c.id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      contacts.forEach((c) => newSet.add(c.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkTag = async () => {
    const resolvedTag = tagValue === "custom" ? customTag.trim() : tagValue;
    if (!resolvedTag || selectedIds.size === 0) return;

    setIsTagging(true);
    try {
      const response = await fetch("/api/admin/contacts/bulk-tag", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactIds: Array.from(selectedIds),
          action: tagAction,
          tag: resolvedTag,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        clearSelection();
        setTagValue("");
        setCustomTag("");
        router.refresh();
        alert(
          `Successfully ${tagAction === "add" ? "added" : "removed"} tag "${resolvedTag}" on ${data.updatedCount} contact(s)`
        );
      } else {
        const error = await response.json();
        alert(`Failed to update tags: ${error.error || "Unknown error"}`);
      }
    } catch {
      alert("Failed to update tags. Please try again.");
    } finally {
      setIsTagging(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/contacts/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: Array.from(selectedIds) }),
      });

      if (response.ok) {
        clearSelection();
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to delete contacts: ${error.error || "Unknown error"}`);
      }
    } catch {
      alert("Failed to delete contacts. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 mb-4 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} contact{selectedIds.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex items-center gap-2">
            {/* Tag Action */}
            <div className="flex items-center gap-1 border-r pr-3 mr-1">
              <Select
                value={tagAction}
                onValueChange={(v) => setTagAction(v as "add" | "remove")}
              >
                <SelectTrigger className="w-[90px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="remove">Remove</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tagValue} onValueChange={setTagValue}>
                <SelectTrigger className="w-[110px] h-8 text-sm">
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="lead">lead</SelectItem>
                  <SelectItem value="custom">custom...</SelectItem>
                </SelectContent>
              </Select>

              {tagValue === "custom" && (
                <Input
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Tag name"
                  className="w-[100px] h-8 text-sm"
                />
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkTag}
                disabled={
                  isTagging ||
                  (!tagValue || (tagValue === "custom" && !customTag.trim()))
                }
              >
                {isTagging ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Tag className="mr-1 h-3.5 w-3.5" />
                    Apply
                  </>
                )}
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={clearSelection}>
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all contacts"
                className={someSelected && !allSelected ? "opacity-50" : ""}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow
              key={contact.id}
              className={selectedIds.has(contact.id) ? "bg-primary/5" : ""}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(contact.id)}
                  onCheckedChange={() => toggleSelect(contact.id)}
                  aria-label={`Select ${contact.email}`}
                />
              </TableCell>
              <TableCell className="font-medium">
                {contact.name || (
                  <span className="text-muted-foreground">&mdash;</span>
                )}
              </TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell>
                {contact.phone || (
                  <span className="text-muted-foreground">&mdash;</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {contact.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={tagVariant(tag)}
                      className="text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(contact.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contacts?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to permanently delete{" "}
                <strong>
                  {selectedIds.size} contact
                  {selectedIds.size !== 1 ? "s" : ""}
                </strong>
                .
              </p>
              <p className="text-destructive font-medium">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedIds.size} Contact
                  {selectedIds.size !== 1 ? "s" : ""}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
