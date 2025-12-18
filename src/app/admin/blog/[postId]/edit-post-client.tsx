"use client";

import { BlogPostForm } from "@/components/admin/blog";
import type { BlogPostWithRelations } from "@/lib/blog/types";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface EditPostClientProps {
  post: BlogPostWithRelations;
  categories: Category[];
  tags: Tag[];
}

export function EditPostClient({ post, categories, tags }: EditPostClientProps) {
  // Transform the post data for the form
  const formPost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    featuredImageUrl: post.featuredImageUrl,
    featuredImageAlt: post.featuredImageAlt,
    authorName: post.authorName,
    status: post.status,
    publishedAt: post.publishedAt,
    postCategories: post.postCategories,
    postTags: post.postTags,
  };

  return (
    <BlogPostForm
      post={formPost}
      categories={categories}
      tags={tags}
    />
  );
}
