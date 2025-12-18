"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  FileText,
  FolderOpen,
  Tag,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PreviewPost {
  wpId: number;
  title: string;
  slug: string;
  publishedAt: string;
  status: "new" | "existing";
  featuredImage: string | null;
  categories: number[];
  tags: number[];
}

interface PreviewCategory {
  wpId: number;
  name: string;
  slug: string;
  parent: number;
  status: "new" | "existing";
}

interface PreviewTag {
  wpId: number;
  name: string;
  slug: string;
  status: "new" | "existing";
}

export interface PreviewData {
  stats: {
    posts: {
      total: number;
      new: number;
      existing: number;
      pages: number;
      currentPage: number;
    };
    categories: {
      total: number;
      new: number;
      existing: number;
    };
    tags: {
      total: number;
      new: number;
      existing: number;
    };
  };
  posts: PreviewPost[];
  categories: PreviewCategory[];
  tags: PreviewTag[];
}

interface MigrationPreviewProps {
  onLoaded?: (data: PreviewData) => void;
  onStartMigration: () => void;
}

export function MigrationPreview({
  onLoaded,
  onStartMigration,
}: MigrationPreviewProps) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPreview(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchPreview = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/blog/migration/preview?page=${page}&perPage=20`
      );
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load preview");
      }

      setData(result);
      onLoaded?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading preview...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPreview(currentPage)}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.stats.posts.total}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="bg-green-500">
                {data.stats.posts.new} new
              </Badge>
              <Badge variant="secondary">
                {data.stats.posts.existing} existing
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.stats.categories.total}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="bg-green-500">
                {data.stats.categories.new} new
              </Badge>
              <Badge variant="secondary">
                {data.stats.categories.existing} existing
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.stats.tags.total}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="bg-green-500">
                {data.stats.tags.new} new
              </Badge>
              <Badge variant="secondary">
                {data.stats.tags.existing} existing
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Preview Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Content Preview</CardTitle>
          <CardDescription>
            Review the content that will be imported from WordPress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="posts">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">
                Posts ({data.stats.posts.total})
              </TabsTrigger>
              <TabsTrigger value="categories">
                Categories ({data.stats.categories.total})
              </TabsTrigger>
              <TabsTrigger value="tags">
                Tags ({data.stats.tags.total})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Image</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.posts.map((post) => (
                    <TableRow key={post.wpId}>
                      <TableCell>
                        <Badge
                          variant={
                            post.status === "new" ? "default" : "secondary"
                          }
                          className={
                            post.status === "new" ? "bg-green-500" : ""
                          }
                        >
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {post.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[150px] truncate">
                        {post.slug}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {post.featuredImage ? (
                          <Badge variant="outline">Has image</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.stats.posts.pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {data.stats.posts.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(data.stats.posts.pages, p + 1)
                        )
                      }
                      disabled={currentPage === data.stats.posts.pages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="categories" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Parent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.categories.map((cat) => (
                    <TableRow key={cat.wpId}>
                      <TableCell>
                        <Badge
                          variant={cat.status === "new" ? "default" : "secondary"}
                          className={cat.status === "new" ? "bg-green-500" : ""}
                        >
                          {cat.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {cat.slug}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {cat.parent > 0 ? (
                          <Badge variant="outline">
                            ID: {cat.parent}
                          </Badge>
                        ) : (
                          <span className="text-xs">Root</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="tags" className="mt-4">
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag) => (
                  <Badge
                    key={tag.wpId}
                    variant={tag.status === "new" ? "default" : "secondary"}
                    className={tag.status === "new" ? "bg-green-500" : ""}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Start Migration Button */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ready to migrate?</p>
              <p className="text-sm text-muted-foreground">
                This will import {data.stats.posts.new} new posts,{" "}
                {data.stats.categories.new} categories, and {data.stats.tags.new}{" "}
                tags. Existing items will be skipped.
              </p>
            </div>
            <Button onClick={onStartMigration} size="lg">
              <PlayCircle className="h-5 w-5 mr-2" />
              Start Migration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
