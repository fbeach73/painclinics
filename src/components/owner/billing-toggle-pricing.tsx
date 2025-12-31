"use client";

import { useState } from "react";
import {
  Star,
  Check,
  Sparkles,
} from "lucide-react";
import FeaturedCheckout from "@/components/owner/featured-checkout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const PRICING = {
  basic: {
    monthly: 49.50,
    annual: 495,
    savings: 99,
    monthlyEquivalent: 41.25, // 495/12
  },
  premium: {
    monthly: 99.50,
    annual: 995,
    savings: 199,
    monthlyEquivalent: 82.92, // 995/12
  },
};

const BASIC_FEATURES = [
  "Featured badge on listing",
  "Priority placement in search results",
  "Highlighted card in directory",
  "Featured marker on map",
  "Up to 5 photos",
];

const PREMIUM_FEATURES = [
  "All Basic features",
  "Premium gold badge",
  "Top placement in search results",
  "Larger marker on map",
  "Featured on homepage",
  "Up to 50 photos",
  "Priority support",
];

interface BillingTogglePricingProps {
  clinicId: string;
  clinicName: string;
  currentTier?: "basic" | "premium" | null;
  hasActiveSubscription: boolean;
}

export default function BillingTogglePricing({
  clinicId,
  clinicName,
  currentTier,
  hasActiveSubscription,
}: BillingTogglePricingProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Label
          htmlFor="billing-toggle"
          className={`text-sm font-medium cursor-pointer transition-colors ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}
        >
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
          aria-label="Toggle annual billing"
        />
        <Label
          htmlFor="billing-toggle"
          className={`text-sm font-medium cursor-pointer transition-colors ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}
        >
          Annual
        </Label>
        {isAnnual && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            Save up to 17%
          </Badge>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {/* Basic Plan */}
        <Card className={`relative ${hasActiveSubscription && currentTier === "basic" ? "ring-2 ring-amber-400" : ""}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Basic
            </CardTitle>
            <CardDescription>
              Essential features to boost your visibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              {isAnnual ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${PRICING.basic.annual}</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${PRICING.basic.monthlyEquivalent.toFixed(2)}/month equivalent
                  </p>
                  <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                    Save ${PRICING.basic.savings}/year
                  </Badge>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${PRICING.basic.monthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Billed monthly, cancel anytime
                  </p>
                </>
              )}
            </div>
            <Separator />
            <ul className="space-y-2">
              {BASIC_FEATURES.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {hasActiveSubscription && currentTier === "basic" ? (
              <Badge variant="secondary" className="w-full justify-center py-2">
                Current Plan
              </Badge>
            ) : (
              <FeaturedCheckout
                clinicId={clinicId}
                clinicName={clinicName}
                tier="basic"
                currentTier={currentTier ?? null}
                mode="subscribe"
                annual={isAnnual}
              />
            )}
          </CardFooter>
        </Card>

        {/* Premium Plan */}
        <Card className={`relative ${hasActiveSubscription && currentTier === "premium" ? "ring-2 ring-amber-400" : "border-amber-200 dark:border-amber-700"}`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-amber-500 text-white font-bold shadow-md hover:bg-amber-500">
              Most Popular
            </Badge>
          </div>
          <CardHeader className="pt-6">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Premium
            </CardTitle>
            <CardDescription>
              Maximum visibility and premium features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              {isAnnual ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${PRICING.premium.annual}</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${PRICING.premium.monthlyEquivalent.toFixed(2)}/month equivalent
                  </p>
                  <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                    Save ${PRICING.premium.savings}/year
                  </Badge>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${PRICING.premium.monthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Billed monthly, cancel anytime
                  </p>
                </>
              )}
            </div>
            <Separator />
            <ul className="space-y-2">
              {PREMIUM_FEATURES.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {hasActiveSubscription && currentTier === "premium" ? (
              <Badge variant="secondary" className="w-full justify-center py-2">
                Current Plan
              </Badge>
            ) : (
              <FeaturedCheckout
                clinicId={clinicId}
                clinicName={clinicName}
                tier="premium"
                currentTier={currentTier ?? null}
                mode="subscribe"
                annual={isAnnual}
              />
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
