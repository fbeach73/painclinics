"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface StoredAccess {
  email: string;
  timestamp: number;
}

const STORAGE_KEY = "pain_tracker_access";
const ACCESS_DURATION_MS = 365 * 24 * 60 * 60 * 1000; // 365 days

const templates = [
  {
    id: "pain-tracker-daily",
    title: "Daily Pain Tracker",
    description:
      "Track pain hour-by-hour. Best for flare-ups and acute pain episodes.",
    filename: "pain-tracker-daily.pdf",
    badge: "Daily",
  },
  {
    id: "pain-tracker-weekly",
    title: "Weekly Pain Tracker",
    description:
      "Daily summary view. See patterns across the week at a glance.",
    filename: "pain-tracker-weekly.pdf",
    badge: "Weekly",
  },
  {
    id: "pain-tracker-monthly",
    title: "Monthly Pain Tracker",
    description:
      "Long-term tracking. Ideal for chronic conditions and doctor visits.",
    filename: "pain-tracker-monthly.pdf",
    badge: "Monthly",
  },
];

/**
 * Trigger a file download via programmatic link click
 */
function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function DownloadTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check localStorage for existing access on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const access: StoredAccess = JSON.parse(stored);
        const now = Date.now();
        if (now - access.timestamp < ACCESS_DURATION_MS) {
          setHasAccess(true);
          setEmail(access.email);
        } else {
          // Access expired, clear it
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // localStorage not available or parse error
    }
  }, []);

  const handleDownloadClick = (templateId: string) => {
    setSelectedTemplate(templateId);
    setError(null);

    if (hasAccess) {
      // User already has access, download directly
      initiateDownload(templateId);
    } else {
      // Show email gate dialog
      setIsDialogOpen(true);
    }
  };

  const initiateDownload = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    try {
      // Call API to log download (even for returning users)
      const response = await fetch("/api/resources/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          resourceName: templateId,
          source: "pain-tracking-page",
        }),
      });

      const data = await response.json();

      if (data.success && data.downloadUrl) {
        triggerDownload(data.downloadUrl, template.filename);
      }
    } catch {
      // Fallback to direct download
      triggerDownload(`/templates/${template.filename}`, template.filename);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !email) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/resources/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          resourceName: selectedTemplate,
          source: "pain-tracking-page",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Save access to localStorage
      const access: StoredAccess = {
        email: email,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(access));
      setHasAccess(true);

      // Close dialog
      setIsDialogOpen(false);

      // Trigger download
      if (data.downloadUrl) {
        const template = templates.find((t) => t.id === selectedTemplate);
        if (template) {
          triggerDownload(data.downloadUrl, template.filename);
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="not-prose my-8">
      <h2 className="text-2xl font-bold mb-2 text-foreground">
        Download Free Pain Tracking Templates
      </h2>
      <p className="text-muted-foreground mb-6">
        Choose the format that works best for your needs. All templates are
        printable PDF files.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{template.title}</CardTitle>
                <Badge variant="secondary">{template.badge}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleDownloadClick(template.id)}
                className="w-full"
              >
                {hasAccess ? (
                  <>
                    <Download className="size-4" />
                    Download PDF
                  </>
                ) : (
                  <>
                    <FileText className="size-4" />
                    Get Free Template
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {hasAccess && (
        <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
          <Check className="size-4 text-green-600" />
          You have instant download access
        </p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Get Your Free Pain Tracker</DialogTitle>
            <DialogDescription>
              Enter your email to download the template. We&apos;ll also send
              you helpful pain management tips (unsubscribe anytime).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                aria-label="Email address"
              />
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  Download Now
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By downloading, you agree to receive occasional emails. We respect
              your privacy.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
