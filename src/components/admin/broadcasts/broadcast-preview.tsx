"use client";

import { Eye, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface BroadcastPreviewProps {
  subject: string;
  previewText?: string;
  htmlContent: string;
  recipientCount?: number;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  trigger?: React.ReactNode;
}

export function BroadcastPreview({
  subject,
  previewText,
  htmlContent,
  recipientCount,
  open,
  onOpenChange,
  trigger,
}: BroadcastPreviewProps) {
  // Wrap HTML content in email-style layout for preview
  const previewHtml = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
      ${htmlContent}
      <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #666; margin-top: 16px;">
        You're receiving this because your clinic is listed on Pain Clinics Directory.
        <br />
        <a href="#" style="color: #666;">Unsubscribe</a>
      </p>
    </div>
  `;

  // Conditionally build dialog props to avoid undefined values with exactOptionalPropertyTypes
  const dialogProps = open !== undefined && onOpenChange !== undefined
    ? { open, onOpenChange }
    : {};

  return (
    <Dialog {...dialogProps}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preview
          </DialogTitle>
          <DialogDescription>
            This is how the email will appear in recipients' inboxes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0">
          {/* Email header simulation */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-medium w-20">From:</span>
              <span>Pain Clinics Directory &lt;hello@painclinics.com&gt;</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-medium w-20">To:</span>
              <span>
                {recipientCount
                  ? `${recipientCount.toLocaleString()} recipients`
                  : "Selected recipients"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-medium w-20">Subject:</span>
              <span className="font-medium">{subject || "(No subject)"}</span>
            </div>
            {previewText && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground font-medium w-20">Preview:</span>
                <span className="text-muted-foreground italic">{previewText}</span>
              </div>
            )}
          </div>

          {/* Email content */}
          <ScrollArea className="flex-1 rounded-lg border bg-white">
            <div className="p-6">
              {htmlContent ? (
                <div
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  className="prose max-w-none prose-img:rounded-lg prose-a:text-primary"
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No content yet</p>
                  <p className="text-sm">Start writing to see a preview</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Standalone preview card for inline display
interface BroadcastPreviewCardProps {
  subject: string;
  previewText?: string | undefined;
  htmlContent: string;
}

export function BroadcastPreviewCard({
  subject,
  previewText,
  htmlContent,
}: BroadcastPreviewCardProps) {
  // Simple preview HTML
  const previewHtml = `
    <div style="max-width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
      ${htmlContent}
    </div>
  `;

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Email header */}
      <div className="bg-muted/50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{subject || "(No subject)"}</p>
            {previewText && (
              <p className="text-sm text-muted-foreground truncate">{previewText}</p>
            )}
          </div>
          <Badge variant="outline" className="shrink-0 ml-2">
            Preview
          </Badge>
        </div>
      </div>

      {/* Email body */}
      <ScrollArea className="h-[300px] bg-white">
        <div className="p-4">
          {htmlContent ? (
            <div
              dangerouslySetInnerHTML={{ __html: previewHtml }}
              className="prose prose-sm max-w-none"
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No content yet</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
