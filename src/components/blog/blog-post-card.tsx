import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { BlogPostWithRelations } from "@/lib/blog/types";

interface BlogPostCardProps {
  post: BlogPostWithRelations;
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const categories = post.postCategories.map((pc) => pc.category);
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Strip HTML tags from excerpt
  const plainExcerpt = post.excerpt
    ? post.excerpt.replace(/<[^>]*>/g, "").slice(0, 160)
    : null;

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      {post.featuredImageUrl && (
        <Link href={`/blog/${post.slug}`} className="block">
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt || post.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </Link>
      )}
      <CardHeader className="pb-2">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {categories.slice(0, 2).map((category) => (
              <Link
                key={category.id}
                href={`/blog/category/${category.slug}`}
              >
                <Badge variant="secondary" className="text-xs">
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
        <Link href={`/blog/${post.slug}`} className="group">
          <h2 className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h2>
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        {plainExcerpt && (
          <p className="text-muted-foreground text-sm line-clamp-3">
            {plainExcerpt}
          </p>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {publishedDate && (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <time dateTime={post.publishedAt?.toISOString()}>
              {publishedDate}
            </time>
          </div>
        )}
        {post.authorName && publishedDate && (
          <span className="mx-2">·</span>
        )}
        {post.authorName && <span>By {post.authorName}</span>}
      </CardFooter>
    </Card>
  );
}
