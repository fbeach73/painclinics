import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Clock,
  Calendar,
  MessageSquare,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Eye,
  Ban,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getLeadById, needsFollowUp, type LeadStatus } from "@/lib/lead-queries";
import { FollowUpForm } from "./follow-up-form";
import { LeadStatusSelect } from "./lead-status-select";
import { LeadNotesForm } from "./lead-notes-form";

interface PageProps {
  params: Promise<{ leadId: string }>;
}

function getStatusBadge(status: LeadStatus) {
  switch (status) {
    case "new":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          New
        </Badge>
      );
    case "contacted":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Contacted
        </Badge>
      );
    case "qualified":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Qualified
        </Badge>
      );
    case "closed":
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Closed
        </Badge>
      );
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

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getEmailStatusBadge(status: string | null, label: string) {
  if (!status) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <AlertCircle className="h-3 w-3 mr-1" />
        Not sent
      </Badge>
    );
  }

  switch (status) {
    case "delivered":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          {label}: Delivered
        </Badge>
      );
    case "opened":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          <Eye className="h-3 w-3 mr-1" />
          {label}: Opened
        </Badge>
      );
    case "clicked":
      return (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          {label}: Clicked
        </Badge>
      );
    case "bounced":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        >
          <Ban className="h-3 w-3 mr-1" />
          {label}: Bounced
        </Badge>
      );
    case "sent":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        >
          <Send className="h-3 w-3 mr-1" />
          {label}: Sent
        </Badge>
      );
    case "queued":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {label}: Queued
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        >
          <XCircle className="h-3 w-3 mr-1" />
          {label}: Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {label}: {status}
        </Badge>
      );
  }
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { leadId } = await params;
  const lead = await getLeadById(leadId);

  if (!lead) {
    notFound();
  }

  const showFollowUpWarning = needsFollowUp(lead);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/leads">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Details</h1>
          <p className="text-muted-foreground">
            Patient inquiry from {lead.patientName} for {lead.clinic.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showFollowUpWarning && (
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Needs Follow-up
            </Badge>
          )}
          {getStatusBadge(lead.status)}
        </div>
      </div>

      {/* Main Grid */}
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
              <h3 className="font-semibold text-lg">{lead.clinic.title}</h3>
              <p className="text-muted-foreground text-sm">
                {lead.clinic.city}, {lead.clinic.stateAbbreviation}
              </p>
            </div>
            <Separator />
            <div className="grid gap-2">
              {lead.clinic.emails && lead.clinic.emails.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${lead.clinic.emails[0]}`}
                    className="text-primary hover:underline"
                  >
                    {lead.clinic.emails[0]}
                  </a>
                </div>
              )}
            </div>
            <Separator />
            <div>
              <Link href={`/admin/clinics/${lead.clinic.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Full Clinic Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Patient Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Patient Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{lead.patientName}</h3>
            </div>
            <Separator />
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${lead.patientEmail}`}
                  className="text-primary hover:underline"
                >
                  {lead.patientEmail}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${lead.patientPhone}`}
                  className="text-primary hover:underline"
                >
                  {lead.patientPhone}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Preferred contact: {lead.preferredContactTime}
                </span>
              </div>
            </div>
            {lead.additionalInfo && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Additional Information
                  </p>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {lead.additionalInfo}
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
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Submission Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Submitted</span>
                <span>{formatDate(lead.createdAt)}</span>
              </div>
              {lead.followedUpAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Followed Up</span>
                  <span>{formatDate(lead.followedUpAt)}</span>
                </div>
              )}
              {lead.followUpDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Follow-up Scheduled</span>
                  <span>{formatShortDate(lead.followUpDate)}</span>
                </div>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Email Delivery Status
              </p>
              <div className="flex flex-col gap-2">
                {getEmailStatusBadge(
                  lead.clinicEmailLog?.status ?? null,
                  "Clinic"
                )}
                {getEmailStatusBadge(
                  lead.patientEmailLog?.status ?? null,
                  "Patient"
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Intake */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Medical Intake</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pain Type
                </p>
                <p className="text-sm">{lead.painType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Duration
                </p>
                <p className="text-sm">{lead.painDuration}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Previous Treatment
                </p>
                <p className="text-sm">{lead.previousTreatment}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Insurance
                </p>
                <p className="text-sm">{lead.insurance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Follow-up</CardTitle>
          </div>
          <CardDescription>
            Send a follow-up email to the clinic about this patient inquiry
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lead.followedUpAt ? (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-4">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Follow-up sent</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Follow-up email was sent on {formatDate(lead.followedUpAt)}
              </p>
            </div>
          ) : (
            <FollowUpForm
              leadId={lead.id}
              clinicName={lead.clinic.title}
              clinicEmail={lead.clinic.emails?.[0] ?? null}
              patientName={lead.patientName}
            />
          )}
        </CardContent>
      </Card>

      {/* Status & Notes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Status & Notes</CardTitle>
          </div>
          <CardDescription>
            Update lead status and add admin notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
          </div>
          <Separator />
          <div>
            <LeadNotesForm
              leadId={lead.id}
              currentNotes={lead.adminNotes ?? ""}
              updatedAt={lead.updatedAt}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
