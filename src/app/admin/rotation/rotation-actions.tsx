"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Send, Mail, Save, Check } from "lucide-react";

const DEFAULT_SUBJECT =
  "Your clinic was featured on PainClinics.com — here's what happened";

const DEFAULT_HTML = `<p>Hi {{clinic_name}},</p>

<p>Great news — your clinic was recently <strong>featured</strong> on <a href="https://painclinics.com">PainClinics.com</a>, giving you priority placement in our directory.</p>

<p>During your featured week, your listing appeared at the top of search results for patients in {{city}}, {{state_abbr}} looking for pain management care.</p>

<p><strong>Your featured status expires tomorrow.</strong></p>

<p>Want to keep your clinic featured permanently? Our Featured Listing plans start at just $29/month and include:</p>

<ul>
  <li>Priority placement in all directory searches</li>
  <li>Featured badge on your listing</li>
  <li>Ad-free clinic page</li>
  <li>Enhanced listing with photos and services</li>
</ul>

<p><a href="{{clinic_url}}">View your listing</a> or <a href="https://painclinics.com/pricing">see our plans</a>.</p>

<p>Best,<br>The PainClinics.com Team</p>`;

const DEFAULT_PREVIEW = "Your clinic was featured — keep it that way";

const MERGE_TAG_EXAMPLES = [
  { tag: "{{clinic_name}}", desc: "Clinic Name" },
  { tag: "{{clinic_url}}", desc: "Clinic Page URL" },
  { tag: "{{city}}", desc: "City" },
  { tag: "{{state}}", desc: "State (Full)" },
  { tag: "{{state_abbr}}", desc: "State (Abbrev)" },
  { tag: "{{rating}}", desc: "Google Rating" },
  { tag: "{{review_count}}", desc: "Review Count" },
];

export function RotateNowButton({ savedBatchSize }: { savedBatchSize: number }) {
  const router = useRouter();
  const [batchSize, setBatchSize] = useState(savedBatchSize);
  const [isRotating, setIsRotating] = useState(false);
  const [result, setResult] = useState<{
    unfeaturedCount: number;
    featuredCount: number;
  } | null>(null);

  async function handleRotate() {
    setIsRotating(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/rotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Rotation failed");
      }
      const data = await res.json();
      setResult({
        unfeaturedCount: data.unfeaturedCount,
        featuredCount: data.featuredCount,
      });
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Rotation failed");
    } finally {
      setIsRotating(false);
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="batchSize">Batch Size</Label>
        <Input
          id="batchSize"
          type="number"
          min={1}
          max={500}
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          className="w-24"
        />
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={isRotating}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRotating ? "animate-spin" : ""}`}
            />
            {isRotating ? "Rotating..." : "Rotate Now"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate Featured Clinics?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unfeature the current free batch and feature {batchSize}{" "}
              new clinics for 7 days. Paying subscribers will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRotate}>
              Confirm Rotation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {result && (
        <p className="text-sm text-muted-foreground">
          Unfeatured {result.unfeaturedCount}, featured {result.featuredCount}{" "}
          new clinics.
        </p>
      )}
    </div>
  );
}

// ============================================
// Email Template Editor (saved to DB, used by cron)
// ============================================

interface SavedConfig {
  emailSubject: string;
  emailPreviewText: string | null;
  emailHtmlContent: string;
  batchSize: number;
}

export function RotationEmailTemplate({
  initialConfig,
}: {
  initialConfig: SavedConfig | null;
}) {
  const [subject, setSubject] = useState(
    initialConfig?.emailSubject ?? DEFAULT_SUBJECT
  );
  const [htmlContent, setHtmlContent] = useState(
    initialConfig?.emailHtmlContent ?? DEFAULT_HTML
  );
  const [previewText, setPreviewText] = useState(
    initialConfig?.emailPreviewText ?? DEFAULT_PREVIEW
  );
  const [batchSize, setBatchSize] = useState(
    initialConfig?.batchSize ?? 150
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/rotation/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailSubject: subject,
          emailPreviewText: previewText,
          emailHtmlContent: htmlContent,
          batchSize,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Weekly Email Template
        </CardTitle>
        <CardDescription>
          This email is sent automatically every Monday at 10am UTC to the
          current featured batch. Edit and save — it&apos;ll be used for every
          future rotation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Merge tags reference */}
        <div className="flex flex-wrap gap-1.5">
          {MERGE_TAG_EXAMPLES.map((t) => (
            <Badge
              key={t.tag}
              variant="outline"
              className="cursor-help font-mono text-xs"
              title={t.desc}
            >
              {t.tag}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="tplSubject">Subject</Label>
            <Input
              id="tplSubject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tplPreview">Preview Text</Label>
            <Input
              id="tplPreview"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Short preview shown in email clients"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tplBody">Email Body (HTML)</Label>
          <Textarea
            id="tplBody"
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            rows={16}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="tplBatchSize">Batch Size</Label>
            <Input
              id="tplBatchSize"
              type="number"
              min={1}
              max={500}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-24"
            />
          </div>

          <div className="self-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || !subject || !htmlContent}
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Template"}
                </>
              )}
            </Button>
          </div>
        </div>

        {!initialConfig && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            No template saved yet. The Monday cron won&apos;t send emails until
            you save one.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Manual Send (one-off to current batch)
// ============================================

export function ManualSendButton({
  hasBatch,
  batchHasBroadcast,
  clinicCount,
}: {
  hasBatch: boolean;
  batchHasBroadcast: boolean;
  clinicCount: number;
}) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sentCount: number;
    failedCount: number;
  } | null>(null);

  // Load saved template for the send
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/rotation/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          setSubject(data.config.emailSubject);
          setHtmlContent(data.config.emailHtmlContent);
          setPreviewText(data.config.emailPreviewText || "");
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!hasBatch || batchHasBroadcast) {
    return null;
  }

  async function handleSend() {
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/rotation/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, htmlContent, previewText }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Send failed");
      }
      const data = await res.json();
      setSendResult({
        sentCount: data.sentCount,
        failedCount: data.failedCount,
      });
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Send failed");
    } finally {
      setIsSending(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="flex items-center gap-3 pt-2 border-t">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            disabled={isSending || !subject || !htmlContent}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Sending..." : `Send Now to ${clinicCount} Clinics`}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send rotation email now?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send the saved email template to {clinicCount} clinics
              in the current batch. Unsubscribed emails excluded. Cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>
              Confirm Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {sendResult && (
        <p className="text-sm text-muted-foreground">
          Sent {sendResult.sentCount}, failed {sendResult.failedCount}.
        </p>
      )}

      {!subject && (
        <p className="text-sm text-amber-600">
          Save a template first before sending.
        </p>
      )}
    </div>
  );
}
