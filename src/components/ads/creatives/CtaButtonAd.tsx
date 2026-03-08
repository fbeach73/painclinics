import { MessageCircle } from "lucide-react";
import type { AdCreativeResult } from "@/lib/ad-queries";
import { Button } from "@/components/ui/button";

interface CtaButtonAdProps {
  creative: AdCreativeResult;
  clickUrl: string;
}

export function CtaButtonAd({ creative, clickUrl }: CtaButtonAdProps) {
  return (
    <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
      <a
        href={clickUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
        <MessageCircle className="h-4 w-4" />
        {creative.ctaText ?? "Chat with a Doctor Online"}
      </a>
    </Button>
  );
}
