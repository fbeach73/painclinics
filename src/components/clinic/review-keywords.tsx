import { Badge } from "@/components/ui/badge";
import type { ReviewKeywordItem } from "@/types/clinic";

interface ReviewKeywordsProps {
  keywords: ReviewKeywordItem[];
}

export function ReviewKeywords({ keywords }: ReviewKeywordsProps) {
  if (!keywords?.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">What Patients Say</h3>
      <div className="flex flex-wrap gap-2">
        {keywords.slice(0, 10).map((item, i) => (
          <Badge key={i} variant="secondary">
            {item.keyword}
          </Badge>
        ))}
      </div>
    </div>
  );
}
