import { BlogPostList } from "@/components/admin/blog";
import { getBlogPostsAdmin, getBlogPostCountsByStatus } from "@/lib/blog/blog-queries";

export const metadata = {
  title: "Blog Posts - Admin",
  description: "Manage your blog posts",
};

export default async function AdminBlogPage() {
  const [{ posts, total }, counts] = await Promise.all([
    getBlogPostsAdmin({ page: 1, limit: 20 }),
    getBlogPostCountsByStatus(),
  ]);

  return (
    <BlogPostList
      initialPosts={posts}
      initialTotal={total}
      initialCounts={counts}
    />
  );
}
