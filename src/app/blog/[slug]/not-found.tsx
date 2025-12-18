import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlogPostNotFound() {
  return (
    <main className="container mx-auto py-16 px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The blog post you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Button asChild>
        <Link href="/blog" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
      </Button>
    </main>
  );
}
