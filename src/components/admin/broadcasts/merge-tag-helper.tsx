"use client";

import { useState } from "react";
import { Check, Copy, Variable } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MERGE_TAGS, type MergeTagKey } from "@/lib/broadcast/merge-tags";

interface MergeTagHelperProps {
  onInsert?: (tag: string) => void;
}

export function MergeTagHelper({ onInsert }: MergeTagHelperProps) {
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const handleCopy = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag);
      setCopiedTag(tag);
      toast.success(`Copied ${tag}`);
      setTimeout(() => setCopiedTag(null), 2000);

      if (onInsert) {
        onInsert(tag);
      }
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const mergeTagEntries = Object.entries(MERGE_TAGS) as [MergeTagKey, typeof MERGE_TAGS[MergeTagKey]][];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Variable className="h-4 w-4" />
          Merge Tags
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-medium">Available Merge Tags</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Click a tag to copy it, then paste into your email content.
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          <TooltipProvider delayDuration={300}>
            <div className="grid gap-1">
              {mergeTagEntries.map(([key, value]) => {
                const tag = `{{${key}}}`;
                const isCopied = copiedTag === tag;

                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleCopy(tag)}
                        className="flex items-center justify-between w-full px-3 py-2 text-left rounded-md hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="secondary" className="font-mono text-xs shrink-0">
                            {tag}
                          </Badge>
                          <span className="text-sm text-muted-foreground truncate">
                            {value.label}
                          </span>
                        </div>
                        {isCopied ? (
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-xs">
                        <span className="font-medium">Example:</span> {value.example}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
        <div className="p-3 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Use <code className="bg-muted px-1 rounded">{"{{claim_url}}"}</code> to
            link directly to each clinic&apos;s claim button.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Inline merge tag list for display in sidebar
 */
export function MergeTagList() {
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const handleCopy = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag);
      setCopiedTag(tag);
      toast.success(`Copied ${tag}`);
      setTimeout(() => setCopiedTag(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Show most commonly used tags
  const commonTags: MergeTagKey[] = ["clinic_name", "clinic_url", "claim_url", "city", "state_abbr"];

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Click to copy, then paste into your email:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {commonTags.map((key) => {
          const tag = `{{${key}}}`;
          const isCopied = copiedTag === tag;

          return (
            <button
              key={key}
              onClick={() => handleCopy(tag)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-muted hover:bg-muted/80 rounded border transition-colors"
            >
              {tag}
              {isCopied && <Check className="h-3 w-3 text-green-500" />}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        See all tags with the Merge Tags button above.
      </p>
    </div>
  );
}
