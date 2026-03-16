import Link from "next/link";
import { BookOpen } from "lucide-react";

interface GuideLinkProps {
  stateAbbrev: string;
  stateName: string;
}

export function GuideLink({ stateName }: GuideLinkProps) {
  const slug = `pain-management-in-${stateName.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 p-5">
      <div className="flex items-start gap-3">
        <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="font-medium text-foreground text-sm">
            Pain Management Guide for {stateName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Learn about {stateName} regulations, insurance coverage, treatment options,
            and how to choose the right pain clinic.
          </p>
          <Link
            href={`/guides/${slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mt-2"
          >
            Read the full guide →
          </Link>
        </div>
      </div>
    </div>
  );
}
