import { Badge } from "@/components/ui/badge";
import type { ReviewKeywordItem } from "@/types/clinic";

interface ReviewKeywordsProps {
  keywords: ReviewKeywordItem[];
}

/**
 * Validate that a keyword item has proper structure.
 * Filters out malformed data (e.g., JSON fragments from bad imports).
 */
function isValidKeyword(item: ReviewKeywordItem): boolean {
  // Must have a keyword string that's not a JSON fragment
  if (!item.keyword || typeof item.keyword !== "string") return false;
  // Skip if keyword looks like JSON (starts with [ or { or ")
  if (/^[\[{"\\]/.test(item.keyword.trim())) return false;
  // Skip very short keywords (likely fragments)
  if (item.keyword.trim().length < 2) return false;
  return true;
}

export function ReviewKeywords({ keywords }: ReviewKeywordsProps) {
  if (!keywords?.length) return null;

  // Filter to only valid keywords
  const validKeywords = keywords.filter(isValidKeyword);

  if (validKeywords.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">What Patients Say</h3>
      <div className="flex flex-wrap gap-2">
        {validKeywords.slice(0, 10).map((item, i) => (
          <Badge key={i} variant="secondary">
            {item.keyword}
          </Badge>
        ))}
      </div>
    </div>
  );
}
