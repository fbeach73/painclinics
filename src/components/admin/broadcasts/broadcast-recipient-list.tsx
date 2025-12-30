"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Eye,
  MousePointerClick,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
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

interface Recipient {
  logId: string;
  recipientEmail: string;
  status: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  errorMessage: string | null;
  clinicId: string | null;
  clinicName: string | null;
}

interface RecipientStats {
  sent: number;
  queued: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
}

interface ApiResponse {
  recipients: Recipient[];
  stats: RecipientStats;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BroadcastRecipientListProps {
  broadcastId: string;
  status: string;
}

function getStatusBadge(recipient: Recipient) {
  // Check timestamps first as they're more accurate than status
  if (recipient.clickedAt) {
    return (
      <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
        <MousePointerClick className="h-3 w-3 mr-1" />
        Clicked
      </Badge>
    );
  }
  if (recipient.openedAt) {
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
        <Eye className="h-3 w-3 mr-1" />
        Opened
      </Badge>
    );
  }
  if (recipient.bouncedAt || recipient.status === "bounced") {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Bounced
      </Badge>
    );
  }
  if (recipient.status === "complained") {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Complained
      </Badge>
    );
  }
  if (recipient.status === "failed") {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  }
  if (recipient.deliveredAt || recipient.status === "delivered") {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Delivered
      </Badge>
    );
  }
  if (recipient.status === "queued") {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        <Clock className="h-3 w-3 mr-1" />
        Queued
      </Badge>
    );
  }
  // Default: sent but no further status
  return (
    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
      <CheckCircle className="h-3 w-3 mr-1" />
      Sent
    </Badge>
  );
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function BroadcastRecipientList({ broadcastId, status }: BroadcastRecipientListProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  const fetchRecipients = useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/admin/broadcasts/${broadcastId}/recipients?page=${pageNum}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recipients");
      }

      const data: ApiResponse = await response.json();
      setRecipients(data.recipients);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [broadcastId, limit]);

  useEffect(() => {
    fetchRecipients(page);
  }, [page, fetchRecipients]);

  // Auto-refresh while sending
  useEffect(() => {
    if (status !== "sending") return;

    const interval = setInterval(() => {
      fetchRecipients(page);
    }, 10000); // Refresh every 10 seconds while sending

    return () => clearInterval(interval);
  }, [status, page, fetchRecipients]);

  const isDraft = status === "draft";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recipients
          </CardTitle>
          <CardDescription>
            {isDraft
              ? "Recipients will appear here after sending"
              : `${total.toLocaleString()} email${total !== 1 ? "s" : ""} sent`}
          </CardDescription>
        </div>
        {!isDraft && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRecipients(page)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isDraft ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recipients yet</p>
            <p className="text-sm">Send the broadcast to see delivery status</p>
          </div>
        ) : isLoading && recipients.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRecipients(page)}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : recipients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recipients found</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Opened</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((recipient) => (
                    <TableRow key={recipient.logId}>
                      <TableCell className="font-medium">
                        {recipient.clinicName || (
                          <span className="text-muted-foreground">Unknown clinic</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {recipient.recipientEmail}
                      </TableCell>
                      <TableCell>{getStatusBadge(recipient)}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDate(recipient.sentAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDate(recipient.deliveredAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDate(recipient.openedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of{" "}
                  {total.toLocaleString()} recipients
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
