import Link from "next/link";
import { Shield, Clock, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClaims, getClaimsCountByStatus } from "@/lib/claim-queries";
import { ClaimsFilterTabs } from "./claims-filter-tabs";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case "approved":
      return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    case "rejected":
      return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    case "expired":
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
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

function getRoleLabel(role: string) {
  switch (role) {
    case "owner":
      return "Owner";
    case "manager":
      return "Manager";
    case "authorized_representative":
      return "Authorized Rep";
    default:
      return role;
  }
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
            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Claimant</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claimsData.claims.map((claim) => (
                    <TableRow key={claim.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/admin/claims/${claim.id}`}
                          className="font-medium hover:underline block"
                        >
                          {claim.clinic.title}
                        </Link>
                        <span className="text-sm text-muted-foreground">
                          {claim.clinic.city}, {claim.clinic.state}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={claim.claimant.image || undefined} />
                            <AvatarFallback>
                              {claim.claimant.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{claim.fullName}</div>
                            <div className="text-sm text-muted-foreground">{claim.businessEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getRoleLabel(claim.role)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(claim.createdAt)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(claim.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
