import { AnalyticsPageClient } from "./analytics-page-client";

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Monitor site traffic and analyze review keywords
        </p>
      </div>
      <AnalyticsPageClient />
    </div>
  );
}
