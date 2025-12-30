import Link from "next/link";
import { Mail, Plus } from "lucide-react";
import { BroadcastStatusBadge } from "@/components/admin/broadcasts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listBroadcasts, getBroadcastCountsByStatus, type BroadcastStatus } from "@/lib/broadcast/broadcast-queries";
import { BroadcastActions } from "./broadcast-actions";
import { BroadcastsFilterTabs } from "./broadcasts-filter-tabs";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export const metadata = {
  title: "Broadcasts - Admin",
  description: "Manage email broadcasts to clinic listings",
};

export default async function BroadcastsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as BroadcastStatus | "all") || "all";

  const listOptions = statusFilter === "all"
    ? { limit: 50 }
    : { status: statusFilter, limit: 50 };

  const [{ broadcasts, total }, counts] = await Promise.all([
    listBroadcasts(listOptions),
    getBroadcastCountsByStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Broadcasts</h1>
          <p className="text-muted-foreground">
            Send email broadcasts to clinic listings
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-gray-50 dark:bg-gray-950">
            {counts.draft} drafts
          </Badge>
          <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
            {counts.completed} sent
          </Badge>
          <Button asChild>
            <Link href="/admin/broadcasts/new">
              <Plus className="h-4 w-4 mr-2" />
              New Broadcast
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Broadcasts</CardTitle>
          </div>
          <CardDescription>
            Click on a broadcast to view details and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BroadcastsFilterTabs currentStatus={statusFilter} counts={counts} />

          {broadcasts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No broadcasts found</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === "all"
                  ? "Create your first broadcast to get started."
                  : `No ${statusFilter} broadcasts found.`}
              </p>
              {statusFilter === "all" && (
                <Button asChild>
                  <Link href="/admin/broadcasts/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Broadcast
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Recipients</TableHead>
                    <TableHead className="text-right">Sent / Failed</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {broadcasts.map((broadcast) => (
                    <TableRow key={broadcast.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/admin/broadcasts/${broadcast.id}`}
                          className="font-medium hover:underline block"
                        >
                          {broadcast.name}
                        </Link>
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {broadcast.subject}
                        </span>
                      </TableCell>
                      <TableCell>
                        <BroadcastStatusBadge status={broadcast.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {broadcast.recipientCount?.toLocaleString() || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {broadcast.status === "draft" ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <>
                            <span className="text-green-600 dark:text-green-400">
                              {broadcast.sentCount?.toLocaleString() || 0}
                            </span>
                            {" / "}
                            <span className="text-red-600 dark:text-red-400">
                              {broadcast.failedCount?.toLocaleString() || 0}
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(broadcast.createdAt)}
                      </TableCell>
                      <TableCell>
                        <BroadcastActions broadcast={broadcast} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {total > 50 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing first 50 of {total} broadcasts
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
