import { StatsClient } from "./stats-client";

export default function StatsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Site Stats</h1>
        <p className="text-muted-foreground">
          Monitor site health, 404 errors, and other metrics
        </p>
      </div>
      <StatsClient />
    </div>
  );
}
