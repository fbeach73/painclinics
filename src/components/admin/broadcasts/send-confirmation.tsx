"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, Mail, Send, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RecipientPreview {
  clinicName: string;
  email: string;
  city?: string;
  state?: string;
}

interface SendConfirmationProps {
  broadcastName: string;
  subject: string;
  recipientCount: number;
  sampleRecipients?: RecipientPreview[];
  onSend: () => Promise<void>;
  onTestSend: (email: string) => Promise<void>;
  disabled?: boolean;
}

export function SendConfirmation({
  broadcastName,
  subject,
  recipientCount,
  sampleRecipients = [],
  onSend,
  onTestSend,
  disabled = false,
}: SendConfirmationProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"test" | "send">("test");
  const [testEmail, setTestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleTestSend = async () => {
    if (!testEmail) return;

    setIsLoading(true);
    setResult(null);

    try {
      await onTestSend(testEmail);
      setResult({
        type: "success",
        message: `Test email sent to ${testEmail}`,
      });
    } catch (error) {
      setResult({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send test email",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      await onSend();
      setResult({
        type: "success",
        message: `Broadcast sent to ${recipientCount.toLocaleString()} recipients`,
      });
      // Close dialog after short delay on success
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (error) {
      setResult({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send broadcast",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setOpen(newOpen);
      if (newOpen) {
        setResult(null);
        setActiveTab("test");
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button disabled={disabled || recipientCount === 0}>
          <Send className="h-4 w-4 mr-2" />
          Send Broadcast
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Broadcast
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p className="font-medium text-foreground">{broadcastName}</p>
              <p className="text-sm text-muted-foreground">Subject: {subject}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "test" | "send")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="test">Test First</TabsTrigger>
            <TabsTrigger value="send">Send Now</TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Send a test email to</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Preview the email in your inbox before sending to all recipients
              </p>
            </div>

            {result && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  result.type === "success"
                    ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                    : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
                }`}
              >
                {result.type === "success" ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                {result.message}
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <Button
                onClick={handleTestSend}
                disabled={isLoading || !testEmail}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </TabsContent>

          <TabsContent value="send" className="space-y-4 mt-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-featured border border-featured-border">
              <AlertTriangle className="h-5 w-5 text-featured-foreground shrink-0" />
              <div>
                <p className="font-medium text-featured-foreground">
                  Ready to send?
                </p>
                <p className="text-sm text-featured-muted">
                  This will send the broadcast to all selected recipients. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{recipientCount.toLocaleString()}</span>
              <span className="text-muted-foreground">recipients</span>
            </div>

            {/* Sample recipients preview */}
            {sampleRecipients.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Sample recipients ({sampleRecipients.length} of {recipientCount.toLocaleString()}):
                </p>
                <div className="space-y-1.5 text-sm bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {sampleRecipients.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{r.clinicName}</span>
                      <span className="text-muted-foreground text-xs truncate">{r.email}</span>
                    </div>
                  ))}
                  {recipientCount > sampleRecipients.length && (
                    <p className="text-xs text-muted-foreground pt-1 border-t">
                      ...and {(recipientCount - sampleRecipients.length).toLocaleString()} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {result && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  result.type === "success"
                    ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                    : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
                }`}
              >
                {result.type === "success" ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                {result.message}
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <Button
                onClick={handleSend}
                disabled={isLoading || recipientCount === 0}
                variant="default"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {recipientCount.toLocaleString()} Recipients
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </TabsContent>
        </Tabs>
      </AlertDialogContent>
    </AlertDialog>
  );
}
