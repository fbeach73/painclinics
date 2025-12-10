import Link from "next/link";
import { FileCheck, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { requireOwner } from "@/lib/session";
import { getUserClaimStatuses } from "@/lib/owner-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusConfig = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    variant: "secondary" as const,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    variant: "secondary" as const,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    variant: "secondary" as const,
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  expired: {
    label: "Expired",
    icon: AlertCircle,
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
};

export default async function ClaimStatusPage() {
  const session = await requireOwner();
  const claims = await getUserClaimStatuses(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Claim Status</h1>
        <p className="text-muted-foreground">
          Track the status of your clinic claim requests
        </p>
      </div>

      {claims.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No claims submitted</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven&apos;t submitted any clinic claims yet.
              <br />
              Find your clinic and submit a claim to get started.
            </p>
            <Button asChild>
              <Link href="/pain-management">Find Your Clinic</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const status = statusConfig[claim.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <Card key={claim.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {claim.clinic?.title || "Unknown Clinic"}
                        </h3>
                        <Badge variant={status.variant} className={status.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {claim.clinic?.city}, {claim.clinic?.state}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <span>Submitted: </span>
                        <span>
                          {new Date(claim.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {claim.status === "rejected" && claim.rejectionReason && (
                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-950 rounded-md">
                          <p className="text-sm text-red-800 dark:text-red-200">
                            <strong>Rejection reason:</strong> {claim.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                    {claim.status === "approved" && claim.clinic && (
                      <Button asChild>
                        <Link href={`/my-clinics/${claim.clinic.id}`}>
                          Manage Clinic
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
