import { BlogPostForm } from "@/components/admin/blog";
import { getAllCategories, getAllTags } from "@/lib/blog/blog-queries";

export const metadata = {
  title: "New Post - Admin",
  description: "Create a new blog post",
};

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([
    getAllCategories(),
    getAllTags(),
  ]);

  return <BlogPostForm categories={categories} tags={tags} />;
}
