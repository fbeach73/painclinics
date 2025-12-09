import { KeywordsAnalyticsClient } from "./keywords-client";

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review Analytics</h1>
        <p className="text-muted-foreground">
          Analyze review keywords and sentiment across all clinics
        </p>
      </div>
      <KeywordsAnalyticsClient />
    </div>
  );
}
