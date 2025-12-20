import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, ArrowLeft, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OptimizedHtmlContent } from "@/components/blog/optimized-html-content";
import type { BlogPostWithRelations } from "@/lib/blog/types";

interface BlogPostContentProps {
  post: BlogPostWithRelations;
}

function estimateReadingTime(content: string): number {
  // Strip HTML tags and count words
  const text = content.replace(/<[^>]*>/g, "");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  // Average reading speed: 200 words per minute
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  const categories = post.postCategories.map((pc) => pc.category);
  const tags = post.postTags.map((pt) => pt.tag);

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const readingTime = estimateReadingTime(post.content);

  return (
    <div>
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/blog" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
      </div>

      {/* Header */}
      <header className="mb-8">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/blog/category/${category.slug}`}
              >
                <Badge variant="secondary">{category.name}</Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {post.authorName && (
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{post.authorName}</span>
            </div>
          )}
          {publishedDate && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              <time dateTime={post.publishedAt?.toISOString()}>
                {publishedDate}
              </time>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{readingTime} min read</span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImageUrl && (
        <div className="relative aspect-video overflow-hidden rounded-lg mb-8">
          <Image
            src={post.featuredImageUrl}
            alt={post.featuredImageAlt || post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
      )}

      {/* Content */}
      <OptimizedHtmlContent
        html={post.content}
        className="prose max-w-none prose-img:rounded-lg prose-a:text-primary prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-blockquote:text-foreground/90 prose-blockquote:border-primary prose-td:text-foreground prose-th:text-foreground prose-table:text-foreground"
      />

      {/* Tags */}
      {tags.length > 0 && (
        <>
          <Separator className="my-8" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Tags:</span>
            {tags.map((tag) => (
              <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                <Badge variant="outline" className="hover:bg-secondary">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
