"use client";

import { useState } from "react";
import { Loader2, ExternalLink, CreditCard, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { checkout, customer } from "@/lib/auth-client";

interface FeaturedCheckoutProps {
  clinicId: string;
  clinicName: string;
  tier?: "basic" | "premium";
  currentTier?: "basic" | "premium" | null;
  mode: "subscribe" | "manage";
}

export default function FeaturedCheckout({
  clinicId,
  clinicName,
  tier,
  currentTier,
  mode,
}: FeaturedCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!tier) return;

    setIsLoading(true);
    try {
      const slug = tier === "basic" ? "featured-basic" : "featured-premium";

      await checkout({
        slug,
        metadata: {
          clinicId,
          clinicName,
        },
      });
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      await customer.portal();
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Failed to open subscription portal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === "manage") {
    return (
      <Button
        variant="outline"
        onClick={handleManageSubscription}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Subscription
            <ExternalLink className="h-3 w-3 ml-1" />
          </>
        )}
      </Button>
    );
  }

  const isUpgrade = currentTier === "basic" && tier === "premium";
  const isDowngrade = currentTier === "premium" && tier === "basic";

  return (
    <Button
      className="w-full"
      variant={tier === "premium" ? "default" : "outline"}
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {isUpgrade ? (
            <>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </>
          ) : isDowngrade ? (
            <>Switch to Basic</>
          ) : (
            <>Get {tier === "premium" ? "Premium" : "Basic"}</>
          )}
        </>
      )}
    </Button>
  );
}
