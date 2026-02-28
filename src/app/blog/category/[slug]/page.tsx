import { notFound } from "next/navigation";
import { BlogPostCard, BlogPagination, BlogSidebar } from "@/components/blog";
import {
  getBlogPosts,
  getCategoryBySlug,
  getAllCategories,
} from "@/lib/blog/blog-queries";
import type { Metadata } from "next";

export const revalidate = 86400; // Revalidate every 24 hours

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  try {
    const categories = await getAllCategories();
    return categories.map((category) => ({ slug: category.slug }));
  } catch (error) {
    // If database is unavailable (e.g., in CI), return empty array
    // Pages will be generated on-demand at runtime instead
    console.warn("generateStaticParams: Database unavailable, skipping static generation:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found | Pain Clinics Blog",
    };
  }

  return {
    title: `${category.name} | Pain Clinics Blog`,
    description:
      category.description ||
      `Browse all articles in the ${category.name} category. Expert insights on pain management and treatment options.`,
    openGraph: {
      title: `${category.name} | Pain Clinics Blog`,
      description:
        category.description ||
        `Browse all articles in the ${category.name} category.`,
      type: "website",
    },
  };
}

const POSTS_PER_PAGE = 12;

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const { page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const { posts, total } = await getBlogPosts({
    page: currentPage,
    limit: POSTS_PER_PAGE,
    status: "published",
    categorySlug: slug,
  });

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <main className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">Category</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
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
                basePath={`/blog/category/${slug}`}
              />
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No posts found in this category.</p>
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
