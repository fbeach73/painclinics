"use client";

import Image from "next/image";
import { CalendarDays, Clock, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface PreviewCategory {
  id: string;
  name: string;
}

interface PreviewTag {
  id: string;
  name: string;
}

interface PostPreviewProps {
  title: string;
  content: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  authorName: string;
  publishedAt: Date | null;
  categories: PreviewCategory[];
  tags: PreviewTag[];
}

function estimateReadingTime(content: string): number {
  // Strip HTML tags and count words
  const text = content.replace(/<[^>]*>/g, "");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  // Average reading speed: 200 words per minute
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function PostPreview({
  title,
  content,
  featuredImageUrl,
  featuredImageAlt,
  authorName,
  publishedAt,
  categories,
  tags,
}: PostPreviewProps) {
  const publishedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const readingTime = estimateReadingTime(content);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Preview Banner */}
      <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-center py-2 px-4 rounded-t-lg text-sm font-medium">
        Preview Mode - This is how your post will appear to readers
      </div>

      <div className="border border-t-0 rounded-b-lg p-6 bg-background">
        {/* Header */}
        <header className="mb-8">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((category) => (
                <Badge key={category.id} variant="secondary">
                  {category.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {title || "Untitled Post"}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {authorName && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{authorName}</span>
              </div>
            )}
            {publishedDate && (
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                <time>{publishedDate}</time>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min read</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {featuredImageUrl && (
          <div className="relative aspect-video overflow-hidden rounded-lg mb-8">
            <Image
              src={featuredImageUrl}
              alt={featuredImageAlt || title || "Featured image"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        )}

        {/* Content */}
        {content ? (
          <div
            className="prose max-w-none prose-img:rounded-lg prose-a:text-primary prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-blockquote:text-foreground/90 prose-blockquote:border-primary prose-td:text-foreground prose-th:text-foreground prose-table:text-foreground"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Start writing to see a preview of your content here.</p>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-8 pt-8 border-t">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Tags:</span>
              {tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
