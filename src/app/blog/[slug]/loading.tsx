import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogPostLoading() {
  return (
    <main className="container mx-auto py-8 px-4">
      <article className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Post Header */}
        <header className="mb-8">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-3/4 mb-4" />

          {/* Meta info */}
          <div className="flex items-center gap-4 text-muted-foreground">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </header>

        {/* Featured Image */}
        <Skeleton className="w-full aspect-video rounded-lg mb-8" />

        {/* Post Content */}
        <div className="prose prose-lg max-w-none space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-8 w-1/2 mt-8" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-8 w-2/5 mt-8" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>

        {/* Tags */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>

        {/* Related Posts */}
        <section className="mt-12">
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full rounded-none" />
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
