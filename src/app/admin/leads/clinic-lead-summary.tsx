"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ClinicLeadSummary } from "@/lib/lead-queries";

interface ClinicLeadSummaryProps {
  summaries: ClinicLeadSummary[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function ClinicLeadSummaryList({ summaries }: ClinicLeadSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get clinics with more than 1 lead
  const clinicsWithMultipleLeads = summaries.filter((s) => s.leadCount > 1);
  const totalMultiLeadCount = clinicsWithMultipleLeads.reduce(
    (acc, s) => acc + s.leadCount,
    0
  );

  if (clinicsWithMultipleLeads.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-auto py-3"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>
              {clinicsWithMultipleLeads.length} clinic
              {clinicsWithMultipleLeads.length !== 1 ? "s" : ""} with multiple
              leads
            </span>
            <Badge variant="secondary">{totalMultiLeadCount} leads total</Badge>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="rounded-md border bg-muted/30">
          <div className="grid gap-1 p-2">
            {clinicsWithMultipleLeads.map((summary) => (
              <Link
                key={summary.clinicId}
                href={`/admin/leads?search=${encodeURIComponent(summary.clinicTitle)}`}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{summary.clinicTitle}</div>
                  <div className="text-sm text-muted-foreground">
                    {summary.clinicCity}, {summary.clinicState}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    Latest: {formatDate(summary.latestLeadDate)}
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary"
                  >
                    {summary.leadCount} leads
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
