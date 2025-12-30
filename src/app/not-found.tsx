import Link from "next/link";
import { FileQuestion, Home, Search, BookOpen, MapPin } from "lucide-react";
import { NotFoundLogger } from "@/components/not-found-logger";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <NotFoundLogger />
      <div className="max-w-lg mx-auto text-center">
        <div className="flex justify-center mb-6">
          <FileQuestion className="h-20 w-20 text-muted-foreground" />
        </div>
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been
          moved. Let&apos;s help you find what you need.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/clinics">
              <Search className="mr-2 h-4 w-4" />
              Find Clinics
            </Link>
          </Button>
        </div>

        <div className="border-t pt-8">
          <h3 className="text-lg font-medium mb-4">Popular Pages</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <Link
              href="/clinics"
              className="flex items-center p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <MapPin className="h-5 w-5 mr-3 text-primary" />
              <div>
                <div className="font-medium">Find a Clinic</div>
                <div className="text-sm text-muted-foreground">
                  Search pain clinics near you
                </div>
              </div>
            </Link>
            <Link
              href="/blog"
              className="flex items-center p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <BookOpen className="h-5 w-5 mr-3 text-primary" />
              <div>
                <div className="font-medium">Blog</div>
                <div className="text-sm text-muted-foreground">
                  Pain management articles
                </div>
              </div>
            </Link>
            <Link
              href="/pain-management-guide"
              className="flex items-center p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <BookOpen className="h-5 w-5 mr-3 text-primary" />
              <div>
                <div className="font-medium">Pain Management Guide</div>
                <div className="text-sm text-muted-foreground">
                  Learn about treatments
                </div>
              </div>
            </Link>
            <Link
              href="/treatment-options"
              className="flex items-center p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <Search className="h-5 w-5 mr-3 text-primary" />
              <div>
                <div className="font-medium">Treatment Options</div>
                <div className="text-sm text-muted-foreground">
                  Explore available treatments
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
