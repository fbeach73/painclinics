import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalyticsPageClient } from "./analytics-page-client";

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor site traffic and analyze review keywords
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a
            href="https://vercel.com/kyles-projects-c3b13c2d/painclinics/analytics"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Vercel Analytics
          </a>
        </Button>
      </div>
      <AnalyticsPageClient />
    </div>
  );
}
