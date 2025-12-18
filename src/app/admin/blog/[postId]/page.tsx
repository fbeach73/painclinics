import { notFound } from "next/navigation";
import {
  getBlogPostById,
  getAllCategories,
  getAllTags,
} from "@/lib/blog/blog-queries";
import { EditPostClient } from "./edit-post-client";

interface EditPostPageProps {
  params: Promise<{ postId: string }>;
}

export async function generateMetadata({ params }: EditPostPageProps) {
  const { postId } = await params;
  const post = await getBlogPostById(postId);

  return {
    title: post ? `Edit: ${post.title} - Admin` : "Post Not Found - Admin",
    description: post ? `Editing blog post: ${post.title}` : "Post not found",
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { postId } = await params;

  const [post, categories, tags] = await Promise.all([
    getBlogPostById(postId),
    getAllCategories(),
    getAllTags(),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <EditPostClient
      post={post}
      categories={categories}
      tags={tags}
    />
  );
}
