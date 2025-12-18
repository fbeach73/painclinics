import { notFound } from "next/navigation";
import { BlogPostCard, BlogPagination, BlogSidebar } from "@/components/blog";
import { getBlogPosts, getTagBySlug, getAllTags } from "@/lib/blog/blog-queries";
import type { Metadata } from "next";

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ slug: tag.slug }));
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) {
    return {
      title: "Tag Not Found | Pain Clinics Blog",
    };
  }

  return {
    title: `Posts Tagged "${tag.name}" | Pain Clinics Blog`,
    description: `Browse all articles tagged with ${tag.name}. Expert insights on pain management and treatment options.`,
    openGraph: {
      title: `Posts Tagged "${tag.name}" | Pain Clinics Blog`,
      description: `Browse all articles tagged with ${tag.name}.`,
      type: "website",
    },
  };
}

const POSTS_PER_PAGE = 12;

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const { page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  const tag = await getTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const { posts, total } = await getBlogPosts({
    page: currentPage,
    limit: POSTS_PER_PAGE,
    status: "published",
    tagSlug: slug,
  });

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <main className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">Tag</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{tag.name}</h1>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "article" : "articles"}
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {posts.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {posts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
              <BlogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={`/blog/tag/${slug}`}
              />
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No posts found with this tag.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <BlogSidebar />
        </aside>
      </div>
    </main>
  );
}
