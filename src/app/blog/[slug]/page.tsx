import { notFound } from "next/navigation";
import { BlogPostContent, RelatedPostCard } from "@/components/blog";
import {
  getBlogPostBySlug,
  getAllPublishedPostSlugs,
  getRelatedPosts,
} from "@/lib/blog/blog-queries";
import type { BlogPostWithRelations } from "@/lib/blog/types";
import type { Metadata } from "next";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPublishedPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found | Pain Clinics Blog",
    };
  }

  // Strip HTML from excerpt for meta description
  const plainExcerpt = post.excerpt
    ? post.excerpt.replace(/<[^>]*>/g, "").slice(0, 160)
    : null;

  return {
    title: post.metaTitle || `${post.title} | Pain Clinics Blog`,
    description: post.metaDescription || plainExcerpt || undefined,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || plainExcerpt || "",
      images: post.featuredImageUrl ? [post.featuredImageUrl] : [],
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.wpModifiedAt?.toISOString(),
      authors: post.authorName ? [post.authorName] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || plainExcerpt || "",
      images: post.featuredImageUrl ? [post.featuredImageUrl] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Get related posts
  const relatedPosts = await getRelatedPosts(post.id, 3);

  // Build structured data
  const categories = post.postCategories.map((pc) => pc.category);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt
      ? post.excerpt.replace(/<[^>]*>/g, "").slice(0, 160)
      : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.wpModifiedAt?.toISOString() || post.updatedAt.toISOString(),
    author: post.authorName
      ? {
          "@type": "Person",
          name: post.authorName,
        }
      : undefined,
    image: post.featuredImageUrl || undefined,
    publisher: {
      "@type": "Organization",
      name: "Pain Clinics",
      url: "https://painclinics.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://painclinics.com/blog/${post.slug}`,
    },
    articleSection: categories[0]?.name,
    keywords:
      post.postTags.length > 0
        ? post.postTags.map((pt) => pt.tag.name).join(", ")
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="container mx-auto py-8 px-4">
        <article className="max-w-4xl mx-auto">
          <BlogPostContent post={post as BlogPostWithRelations} />
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="max-w-4xl mx-auto mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <RelatedPostCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
