"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, Download } from "lucide-react";
import type { ContentFormat } from "@/data/education-conditions";

interface EducationOutputProps {
  content: string;
  condition: string;
  format: ContentFormat;
}

export function EducationOutput({ content, condition, format }: EducationOutputProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${condition.toLowerCase().replace(/\s+/g, "-")}-${format}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const formatLabels: Record<ContentFormat, string> = {
    website: "Website Page",
    handout: "Patient Handout",
    social: "Social Media Series",
  };

  return (
    <Card className="border-emerald-200 dark:border-emerald-500/20">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">
          {formatLabels[format]}: {condition}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-lg bg-muted/50 p-4 border border-border">
          {content}
        </div>
      </CardContent>
    </Card>
  );
}
