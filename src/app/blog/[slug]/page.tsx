import { notFound } from "next/navigation";
import { BlogPostContent, RelatedPostCard, FloatingToc } from "@/components/blog";
import {
  getBlogPostBySlug,
  getAllPublishedPostSlugs,
  getRelatedPosts,
} from "@/lib/blog/blog-queries";
import { extractFAQsFromContent } from "@/lib/blog/seo/faq-extractor";
import type { BlogPostWithRelations } from "@/lib/blog/types";
import { generateFAQStructuredData, generateBlogBreadcrumbSchema } from "@/lib/structured-data";
import type { Metadata } from "next";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPublishedPostSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    // If database is unavailable (e.g., in CI), return empty array
    // Pages will be generated on-demand at runtime instead
    console.warn("generateStaticParams: Database unavailable, skipping static generation:", error);
    return [];
  }
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
      url: "https://www.painclinics.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.painclinics.com/blog/${post.slug}`,
    },
    articleSection: categories[0]?.name,
    keywords:
      post.postTags.length > 0
        ? post.postTags.map((pt) => pt.tag.name).join(", ")
        : undefined,
  };

  // Extract FAQs from post content for FAQ schema
  const extractedFAQs = post.content ? extractFAQsFromContent(post.content) : [];
  const faqJsonLd = extractedFAQs.length > 0 ? generateFAQStructuredData(extractedFAQs) : null;

  // Generate breadcrumb schema
  const primaryCategory = categories[0];
  const breadcrumbJsonLd = generateBlogBreadcrumbSchema({
    postTitle: post.title,
    postSlug: post.slug,
    ...(primaryCategory && {
      categoryName: primaryCategory.name,
      categorySlug: primaryCategory.slug,
    }),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <main className="container mx-auto py-8 px-4">
        <article className="max-w-4xl mx-auto">
          <BlogPostContent post={post as BlogPostWithRelations} />
        </article>

        {/* Floating Table of Contents */}
        <FloatingToc />

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
