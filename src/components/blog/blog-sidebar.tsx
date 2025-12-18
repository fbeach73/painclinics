import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getCategoriesWithCounts,
  getTagsWithCounts,
  getRecentPosts,
} from "@/lib/blog/blog-queries";

export async function BlogSidebar() {
  const [categories, tags, recentPosts] = await Promise.all([
    getCategoriesWithCounts(),
    getTagsWithCounts(),
    getRecentPosts(5),
  ]);

  // Filter to only show categories/tags with posts
  const activeCategories = categories.filter((c) => c.postCount > 0);
  const activeTags = tags.filter((t) => t.postCount > 0);

  return (
    <div className="space-y-6">
      {/* Categories */}
      {activeCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {activeCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/blog/category/${category.slug}`}
                    className="flex items-center justify-between text-sm hover:text-primary transition-colors"
                  >
                    <span>{category.name}</span>
                    <span className="text-muted-foreground">
                      ({category.postCount})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-4">
              {recentPosts.map((post, index) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex gap-3 group"
                  >
                    {post.featuredImageUrl && (
                      <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded">
                        <Image
                          src={post.featuredImageUrl}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h4>
                      {post.publishedAt && (
                        <time
                          dateTime={post.publishedAt.toISOString()}
                          className="text-xs text-muted-foreground"
                        >
                          {new Date(post.publishedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </time>
                      )}
                    </div>
                  </Link>
                  {index < recentPosts.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tags Cloud */}
      {activeTags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tags</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {activeTags.map((tag) => (
                <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                  <Badge variant="outline" className="hover:bg-secondary">
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
