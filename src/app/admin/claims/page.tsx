import { Shield, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClaims, getClaimsCountByStatus } from "@/lib/claim-queries";
import { ClaimsFilterTabs } from "./claims-filter-tabs";
import { ClaimsTable } from "./claims-table";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ClaimsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as "pending" | "approved" | "rejected" | "expired" | "all") || "pending";

  const [claimsData, counts] = await Promise.all([
    getClaims({ status: statusFilter, limit: 50 }),
    getClaimsCountByStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Claims</h1>
          <p className="text-muted-foreground">
            Review and manage clinic ownership claims
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950">
            {counts.pending} pending
          </Badge>
          <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
            {counts.approved} approved
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Claim Requests</CardTitle>
          </div>
          <CardDescription>
            Click on a claim to review details and take action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClaimsFilterTabs currentStatus={statusFilter} counts={counts} />

          {claimsData.claims.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No {statusFilter === "all" ? "" : statusFilter} claims found.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <ClaimsTable claims={claimsData.claims} />
            </div>
          )}

          {claimsData.total > 50 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing first 50 of {claimsData.total} claims
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
