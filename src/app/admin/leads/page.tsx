import { MessageSquare, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLeads, getLeadsCountByStatus, type LeadStatus } from "@/lib/lead-queries";
import { LeadsFilterTabs } from "./leads-filter-tabs";
import { LeadsTable } from "./leads-table";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter =
    (params.status as LeadStatus | "all" | "needs_followup") || "all";

  const [leads, counts] = await Promise.all([
    getLeads({ status: statusFilter, limit: 50 }),
    getLeadsCountByStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Manage patient inquiries from clinic contact forms
          </p>
        </div>
        <div className="flex gap-2">
          {counts.needs_followup > 0 && (
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
            >
              {counts.needs_followup} needs follow-up
            </Badge>
          )}
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          >
            {counts.new} new
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>Patient Inquiries</CardTitle>
          </div>
          <CardDescription>
            Click on a lead to view details and send follow-up emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadsFilterTabs currentStatus={statusFilter} counts={counts} />

          {leads.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {statusFilter === "all"
                  ? "No leads found."
                  : statusFilter === "needs_followup"
                    ? "No leads need follow-up."
                    : `No ${statusFilter} leads found.`}
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <LeadsTable leads={leads} />
            </div>
          )}

          {leads.length >= 50 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing first 50 leads
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
