import { Suspense } from "react";
import { MessageSquare, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPaginatedLeads,
  getLeadsCountByStatus,
  getClinicLeadSummaries,
  type LeadStatus,
} from "@/lib/lead-queries";
import { ClinicLeadSummaryList } from "./clinic-lead-summary";
import { LeadsFilterTabs } from "./leads-filter-tabs";
import { LeadsPagination } from "./leads-pagination";
import { LeadsSearch } from "./leads-search";
import { LeadsTable } from "./leads-table";

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string; search?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter =
    (params.status as LeadStatus | "all" | "needs_followup") || "all";
  const currentPage = parseInt(params.page || "1", 10);
  const searchQuery = params.search || "";

  const [paginatedResult, counts, clinicSummaries] = await Promise.all([
    getPaginatedLeads({
      status: statusFilter,
      search: searchQuery,
      page: currentPage,
      pageSize: 25,
    }),
    getLeadsCountByStatus(),
    getClinicLeadSummaries(),
  ]);

  const { leads, total, page, pageSize, totalPages } = paginatedResult;

  // Build base URL for pagination links
  const baseUrlParams = new URLSearchParams();
  if (statusFilter !== "all") {
    baseUrlParams.set("status", statusFilter);
  }
  if (searchQuery) {
    baseUrlParams.set("search", searchQuery);
  }
  const baseUrl = `/admin/leads${baseUrlParams.toString() ? `?${baseUrlParams.toString()}` : ""}`;

  return (
    <div className="space-y-6 min-w-0">
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>Patient Inquiries</CardTitle>
            </div>
            <Suspense fallback={<Skeleton className="h-9 w-80" />}>
              <LeadsSearch />
            </Suspense>
          </div>
          <CardDescription>
            Click on a lead to view details and send follow-up emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadsFilterTabs currentStatus={statusFilter} counts={counts} />

          {!searchQuery && statusFilter === "all" && (
            <div className="mt-4">
              <ClinicLeadSummaryList summaries={clinicSummaries} />
            </div>
          )}

          {leads.length === 0 ? (
            <div className="text-center py-8 mt-4">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? `No leads found matching "${searchQuery}"`
                  : statusFilter === "all"
                    ? "No leads found."
                    : statusFilter === "needs_followup"
                      ? "No leads need follow-up."
                      : `No ${statusFilter} leads found.`}
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4">
                <LeadsTable leads={leads} />
              </div>

              <LeadsPagination
                currentPage={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                baseUrl={baseUrl}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
