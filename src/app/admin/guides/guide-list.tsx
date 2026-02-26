"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, Trash2, MoreHorizontal, Pencil, ExternalLink } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Guide {
  id: string;
  title: string;
  slug: string;
  status: string;
  stateAbbreviation: string | null;
  createdAt: string | Date;
}

type StatusFilter = "all" | "draft" | "published";

interface GuideListProps {
  initialGuides: Guide[];
  initialTotal: number;
  initialCounts: { all: number; draft: number; published: number };
}

export function GuideList({
  initialGuides,
  initialTotal,
  initialCounts,
}: GuideListProps) {
  const [guides, setGuides] = useState(initialGuides);
  const [total, setTotal] = useState(initialTotal);
  const [counts, setCounts] = useState(initialCounts);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteGuideId, setDeleteGuideId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  function fetchGuides() {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    params.set("status", status);
    if (search) params.set("search", search);

    fetch(`/api/admin/guides?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setGuides(data.guides);
        setTotal(data.total);
        if (data.counts) setCounts(data.counts);
      })
      .catch((err) => console.error("Failed to fetch guides:", err))
      .finally(() => setIsLoading(false));
  }

  const [prevStatus, setPrevStatus] = useState(status);
  const [prevSearch, setPrevSearch] = useState(search);

  // Reset page when filters change
  let currentPage = page;
  if (status !== prevStatus || search !== prevSearch) {
    currentPage = 1;
    setPage(1);
    setPrevStatus(status);
    setPrevSearch(search);
  }

  useEffect(() => {
    // Skip initial load — we have SSR data
    if (currentPage === 1 && status === "all" && !search) return;
    const timer = setTimeout(() => fetchGuides(), 300);
    return () => clearTimeout(timer);
  }, [currentPage, status, search]);

  function handleDelete() {
    if (!deleteGuideId) return;
    setIsDeleting(true);

    fetch(`/api/admin/guides/${deleteGuideId}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        fetchGuides();
      })
      .catch(() => alert("Failed to delete guide"))
      .finally(() => {
        setIsDeleting(false);
        setDeleteGuideId(null);
      });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Guides</h1>
          <p className="text-sm text-muted-foreground">
            State-specific pain management guides for SEO &amp; link building
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/guides/new">
            <Plus className="h-4 w-4 mr-2" />
            New Guide
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs
          value={status}
          onValueChange={(v) => setStatus(v as StatusFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="draft">Drafts ({counts.draft})</TabsTrigger>
            <TabsTrigger value="published">
              Published ({counts.published})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search guides..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : guides.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  No guides yet
                </TableCell>
              </TableRow>
            ) : (
              guides.map((guide) => (
                <TableRow key={guide.id}>
                  <TableCell>
                    <Link
                      href={`/admin/guides/${guide.id}`}
                      className="font-medium hover:underline"
                    >
                      {guide.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {guide.stateAbbreviation || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        guide.status === "published" ? "default" : "secondary"
                      }
                    >
                      {guide.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(guide.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/guides/${guide.id}`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {guide.status === "published" && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/guides/${guide.slug}`}
                              target="_blank"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeleteGuideId(guide.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} guides)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!deleteGuideId}
        onOpenChange={() => setDeleteGuideId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete guide?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
