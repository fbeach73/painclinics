"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Search,
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  MoreHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  DropdownMenuSeparator,
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
import type { BlogPostWithRelations } from "@/lib/blog/types";

interface BlogPostListProps {
  initialPosts: BlogPostWithRelations[];
  initialTotal: number;
  initialCounts: {
    all: number;
    draft: number;
    published: number;
    archived: number;
  };
}

type StatusFilter = "all" | "draft" | "published" | "archived";

export function BlogPostList({
  initialPosts,
  initialTotal,
  initialCounts,
}: BlogPostListProps) {
  // State
  const [posts, setPosts] = useState(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [counts, setCounts] = useState(initialCounts);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  // Fetch posts when filters change
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      params.set("status", status);
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/admin/blog/posts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch posts");

      const data = await response.json();
      setPosts(data.posts);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, status, search]);

  // Fetch on filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, search]);

  // Delete post
  const handleDelete = async () => {
    if (!deletePostId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/blog/posts/${deletePostId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      // Refresh the list
      fetchPosts();

      // Update counts
      const deletedPost = posts.find((p) => p.id === deletePostId);
      if (deletedPost) {
        setCounts((prev) => ({
          ...prev,
          all: prev.all - 1,
          [deletedPost.status]: prev[deletedPost.status] - 1,
        }));
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post");
    } finally {
      setIsDeleting(false);
      setDeletePostId(null);
    }
  };

  // Get display status (including "scheduled")
  const getDisplayStatus = (post: BlogPostWithRelations) => {
    if (
      post.status === "published" &&
      post.publishedAt &&
      new Date(post.publishedAt) > new Date()
    ) {
      return "scheduled";
    }
    return post.status;
  };

  // Status badge colors
  const getStatusBadge = (displayStatus: string) => {
    switch (displayStatus) {
      case "published":
        return <Badge variant="default">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      case "scheduled":
        return (
          <Badge className="bg-featured text-featured-foreground border-featured-border">
            Scheduled
          </Badge>
        );
      default:
        return <Badge variant="outline">{displayStatus}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">
            Manage your blog posts and articles
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status tabs */}
        <Tabs
          value={status}
          onValueChange={(v) => setStatus(v as StatusFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Drafts ({counts.draft})
            </TabsTrigger>
            <TabsTrigger value="published">
              Published ({counts.published})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({counts.archived})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Posts table */}
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="text-muted-foreground">
                    {search
                      ? "No posts found matching your search"
                      : "No posts yet. Create your first post!"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => {
                const displayStatus = getDisplayStatus(post);
                const categories = post.postCategories.map((pc) => pc.category);

                return (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="font-medium hover:underline"
                      >
                        {post.title || "Untitled"}
                      </Link>
                      {post.slug && (
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          /blog/{post.slug}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(displayStatus)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {categories.length > 0 ? (
                          categories.slice(0, 2).map((cat) => (
                            <Badge key={cat.id} variant="outline" className="text-xs">
                              {cat.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                        {categories.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{categories.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(post.updatedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/blog/${post.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {post.status === "published" && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/blog/${post.slug}`}
                                target="_blank"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Post
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletePostId(post.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} posts
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post
              and all associated data.
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
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
