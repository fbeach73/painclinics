
import { BlogPostCard, BlogPagination, BlogSidebar } from "@/components/blog";
import { getBlogPosts } from "@/lib/blog/blog-queries";
import type { Metadata } from "next";

export const revalidate = 86400; // Revalidate every 24 hours

export const metadata: Metadata = {
  title: "Pain Management Blog | Pain Clinics",
  description:
    "Expert articles on chronic pain management, treatment options, and finding relief. Stay informed with the latest insights from pain management specialists.",
  openGraph: {
    title: "Pain Management Blog | Pain Clinics",
    description:
      "Expert articles on chronic pain management, treatment options, and finding relief.",
    type: "website",
  },
};

const POSTS_PER_PAGE = 12;

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  const { posts, total } = await getBlogPosts({
    page: currentPage,
    limit: POSTS_PER_PAGE,
    status: "published",
  });

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <main className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Pain Management Blog
        </h1>
        <p className="text-muted-foreground">
          Expert articles on chronic pain, treatments, and finding relief.
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
              />
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No blog posts found.</p>
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
