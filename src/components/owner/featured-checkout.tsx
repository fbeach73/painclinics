"use client";

import { useState } from "react";
import { Loader2, ExternalLink, CreditCard, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { subscription } from "@/lib/auth-client";

interface FeaturedCheckoutProps {
  clinicId: string;
  clinicName: string;
  tier?: "basic" | "premium";
  currentTier?: "basic" | "premium" | null;
  mode: "subscribe" | "manage";
  annual?: boolean;
}

export default function FeaturedCheckout({
  clinicId,
  clinicName: _clinicName,
  tier,
  currentTier,
  mode,
  annual = false,
}: FeaturedCheckoutProps) {
  // clinicName reserved for future use
  void _clinicName;
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!tier) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId,
          plan: tier === "basic" ? "featured-basic" : "featured-premium",
          annual,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to start checkout");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to start checkout";
      toast.error(errorMessage);
      // Also log to console for debugging
      console.error("Full checkout error details:", {
        error,
        clinicId,
        tier,
        annual,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const result = await subscription.billingPortal({
        returnUrl: `${window.location.origin}/my-clinics/${clinicId}/featured`,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to open portal");
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        toast.error("Failed to open subscription portal");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to open subscription portal. Please try again."
      );
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
