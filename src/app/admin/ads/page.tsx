import { AdsOverviewClient } from "./ads-overview-client";
import { SetupGuideDialog } from "./setup-guide-dialog";

export default function AdsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ads</h1>
          <p className="text-muted-foreground">
            Manage campaigns and monitor performance
          </p>
        </div>
        <SetupGuideDialog />
      </div>
      <AdsOverviewClient />
    </div>
  );
}
