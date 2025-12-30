import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Pencil,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getBroadcast } from "@/lib/broadcast/broadcast-queries";
import { BroadcastStats, BroadcastPreviewCard, BroadcastRecipientList, BroadcastStatusBadge } from "@/components/admin/broadcasts";
import { BroadcastDetailActions } from "./broadcast-detail-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(start: Date | null, end: Date | null) {
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function getAudienceLabel(audience: string | null, filters: { states?: string[]; tiers?: string[] } | null) {
  switch (audience) {
    case "all_with_email":
      return "All clinics with email";
    case "featured_only":
      return "Featured clinics only";
    case "by_state":
      return filters?.states?.length
        ? `Clinics in ${filters.states.join(", ")}`
        : "By state (none selected)";
    case "by_tier":
      return filters?.tiers?.length
        ? `${filters.tiers.join(", ")} tier clinics`
        : "By tier (none selected)";
    case "custom":
      return "Custom selection";
    default:
      return "All clinics with email";
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const broadcast = await getBroadcast(id);

  if (!broadcast) {
    return {
      title: "Broadcast Not Found - Admin",
    };
  }

  return {
    title: `${broadcast.name} - Broadcasts - Admin`,
    description: `View broadcast: ${broadcast.name}`,
  };
}

export default async function BroadcastDetailPage({ params }: PageProps) {
  const { id } = await params;
  const broadcast = await getBroadcast(id);

  if (!broadcast) {
    notFound();
  }

  const isDraft = broadcast.status === "draft";
  const isSending = broadcast.status === "sending";
  const isComplete = broadcast.status === "completed" || broadcast.status === "failed";
  const duration = formatDuration(broadcast.startedAt, broadcast.completedAt);
  const targetFilters = broadcast.targetFilters as { states?: string[]; tiers?: string[] } | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin/broadcasts">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{broadcast.name}</h1>
            <BroadcastStatusBadge status={broadcast.status} />
          </div>
          <p className="text-muted-foreground ml-10">
            {broadcast.subject}
          </p>
        </div>
        <BroadcastDetailActions broadcast={broadcast} />
      </div>

      {/* Metadata cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Created
            </div>
            <p className="font-medium">{formatDate(broadcast.createdAt)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <User className="h-4 w-4" />
              Audience
            </div>
            <p className="font-medium text-sm">
              {getAudienceLabel(broadcast.targetAudience, targetFilters)}
            </p>
          </CardContent>
        </Card>

        {broadcast.startedAt && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                {isSending ? "Started" : "Sent"}
              </div>
              <p className="font-medium">{formatDate(broadcast.startedAt)}</p>
            </CardContent>
          </Card>
        )}

        {isComplete && duration && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                Duration
              </div>
              <p className="font-medium">{duration}</p>
            </CardContent>
          </Card>
        )}

        {isDraft && (
          <Card className="col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Mail className="h-4 w-4" />
                Status
              </div>
              <p className="font-medium text-sm">
                This broadcast is a draft and has not been sent yet.
              </p>
              <Button asChild size="sm" variant="outline" className="mt-2">
                <Link href={`/admin/broadcasts/${broadcast.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Draft
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats - only show if not draft */}
      {!isDraft && (
        <BroadcastStats
          recipientCount={broadcast.recipientCount || 0}
          sentCount={broadcast.sentCount || 0}
          failedCount={broadcast.failedCount || 0}
          status={broadcast.status || "draft"}
          deliveredCount={0} // These will be fetched by recipient list
          openedCount={broadcast.openedCount || 0}
          clickedCount={broadcast.clickedCount || 0}
          bouncedCount={0}
        />
      )}

      <Separator />

      {/* Content layout: Preview and Recipients */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Email Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Preview
            </CardTitle>
            <CardDescription>
              How this email appears to recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BroadcastPreviewCard
              subject={broadcast.subject}
              previewText={broadcast.previewText || undefined}
              htmlContent={broadcast.htmlContent}
            />
          </CardContent>
        </Card>

        {/* Recipients List */}
        <BroadcastRecipientList
          broadcastId={broadcast.id}
          status={broadcast.status || "draft"}
        />
      </div>
    </div>
  );
}
