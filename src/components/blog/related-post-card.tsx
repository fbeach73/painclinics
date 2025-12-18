import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  publishedAt: Date | null;
}

interface RelatedPostCardProps {
  post: RelatedPost;
}

export function RelatedPostCard({ post }: RelatedPostCardProps) {
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Strip HTML tags from excerpt
  const plainExcerpt = post.excerpt
    ? post.excerpt.replace(/<[^>]*>/g, "").slice(0, 100)
    : null;

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      {post.featuredImageUrl && (
        <Link href={`/blog/${post.slug}`} className="block">
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={post.featuredImageUrl}
              alt={post.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </Link>
      )}
      <CardHeader className="pb-2">
        <Link href={`/blog/${post.slug}`} className="group">
          <h3 className="text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {plainExcerpt && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
            {plainExcerpt}
          </p>
        )}
        {publishedDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            <time dateTime={post.publishedAt?.toISOString()}>{publishedDate}</time>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
