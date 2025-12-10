import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Shield, Building2, User, Mail, Phone, Clock, CheckCircle, XCircle, AlertCircle, Globe, MapPin, FileText, Laptop, Wifi } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getClaimById, getClinicClaimHistory } from "@/lib/claim-queries";
import { ClaimActions } from "./claim-actions";

interface PageProps {
  params: Promise<{ claimId: string }>;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
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
    month: "long",
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
      return "Authorized Representative";
    default:
      return role;
  }
}

export default async function ClaimReviewPage({ params }: PageProps) {
  const { claimId } = await params;
  const claim = await getClaimById(claimId);

  if (!claim) {
    notFound();
  }

  const claimHistory = await getClinicClaimHistory(claim.clinicId);
  const otherClaims = claimHistory.filter(c => c.id !== claim.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/claims">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Claims
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Claim Review</h1>
          <p className="text-muted-foreground">
            Review ownership claim for {claim.clinic.title}
          </p>
        </div>
        {getStatusBadge(claim.status)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clinic Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Clinic Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{claim.clinic.title}</h3>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {claim.clinic.streetAddress && `${claim.clinic.streetAddress}, `}
                {claim.clinic.city}, {claim.clinic.state}
              </p>
            </div>
            <Separator />
            <div className="grid gap-3">
              {claim.clinic.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{claim.clinic.phone}</span>
                </div>
              )}
              {claim.clinic.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={claim.clinic.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {claim.clinic.website}
                  </a>
                </div>
              )}
            </div>
            <Separator />
            <div>
              <Link href={`/admin/clinics/${claim.clinicId}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Full Clinic Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Claimant Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Claimant Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={claim.claimant.image || undefined} />
                <AvatarFallback className="text-lg">
                  {claim.claimant.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{claim.fullName}</h3>
                <Badge variant="outline">{getRoleLabel(claim.role)}</Badge>
              </div>
            </div>
            <Separator />
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${claim.businessEmail}`} className="text-primary hover:underline">
                  {claim.businessEmail}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{claim.businessPhone}</span>
              </div>
            </div>
            {claim.additionalNotes && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Additional Notes
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {claim.additionalNotes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Submission Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Submission Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Submitted</span>
                <span>{formatDate(claim.createdAt)}</span>
              </div>
              {claim.reviewedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reviewed</span>
                  <span>{formatDate(claim.reviewedAt)}</span>
                </div>
              )}
              {claim.reviewer && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reviewed by</span>
                  <span>{claim.reviewer.name}</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Anti-Fraud Information</p>
              <div className="grid gap-2 text-xs">
                {claim.ipAddress && (
                  <div className="flex items-center gap-2">
                    <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">IP:</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded">{claim.ipAddress}</code>
                  </div>
                )}
                {claim.userAgent && (
                  <div className="flex items-start gap-2">
                    <Laptop className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">UA:</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs break-all line-clamp-2">
                      {claim.userAgent}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claim History */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Claim History</CardTitle>
            </div>
            <CardDescription>
              Previous claims for this clinic
            </CardDescription>
          </CardHeader>
          <CardContent>
            {otherClaims.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No previous claims for this clinic.
              </p>
            ) : (
              <div className="space-y-3">
                {otherClaims.map((historyClaim) => (
                  <div
                    key={historyClaim.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                  >
                    <div>
                      <p className="text-sm font-medium">{historyClaim.fullName}</p>
                      <p className="text-xs text-muted-foreground">{historyClaim.businessEmail}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(historyClaim.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(historyClaim.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Notes & Review Outcome */}
      {(claim.status !== "pending" && (claim.adminNotes || claim.rejectionReason)) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Outcome</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {claim.rejectionReason && (
              <div>
                <p className="text-sm font-medium text-destructive mb-1">Rejection Reason</p>
                <p className="text-sm bg-destructive/10 p-3 rounded-md">
                  {claim.rejectionReason}
                </p>
              </div>
            )}
            {claim.adminNotes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Admin Notes</p>
                <p className="text-sm bg-muted p-3 rounded-md">
                  {claim.adminNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {claim.status === "pending" && (
        <ClaimActions claimId={claim.id} clinicName={claim.clinic.title} />
      )}
    </div>
  );
}
