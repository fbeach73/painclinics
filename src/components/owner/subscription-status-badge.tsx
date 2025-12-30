import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionStatusBadgeProps {
  tier: "basic" | "premium";
  clinicId: string;
  className?: string;
}

export function SubscriptionStatusBadge({
  tier,
  clinicId,
  className,
}: SubscriptionStatusBadgeProps) {
  const isPremium = tier === "premium";

  return (
    <Link
      href={`/my-clinics/${clinicId}/featured`}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:opacity-90",
        isPremium
          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm"
          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
        className
      )}
    >
      <Star
        className={cn(
          "h-3.5 w-3.5",
          isPremium && "fill-white"
        )}
      />
      <span>{isPremium ? "Premium" : "Basic"}</span>
    </Link>
  );
}
