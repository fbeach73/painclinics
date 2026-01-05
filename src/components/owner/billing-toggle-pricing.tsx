"use client";

import { useState } from "react";
import {
  Star,
  Check,
  Sparkles,
  Zap,
  Clock,
} from "lucide-react";
import FeaturedCheckout from "@/components/owner/featured-checkout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const PRICING = {
  basic: {
    regularMonthly: 99,
    regularAnnual: 990,
    monthly: 49.50,
    annual: 495,
    savings: 99,
    monthlyEquivalent: 41.25, // 495/12
  },
  premium: {
    regularMonthly: 199,
    regularAnnual: 1990,
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
      {/* Early Adopter Banner */}
      <Card className="border-featured-border bg-featured">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-featured-border/30 flex-shrink-0">
              <Zap className="h-6 w-6 text-featured-foreground fill-featured-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-featured-foreground">
                  Early Adopter Pricing
                </h3>
                <Badge className="bg-red-500 text-white hover:bg-red-500">
                  50% OFF
                </Badge>
              </div>
              <p className="text-sm text-featured-muted mt-1">
                Lock in these special launch prices before they go up. This offer won&apos;t last long!
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-featured-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Limited Time</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
            Save Now Up To 67%
          </Badge>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {/* Basic Plan */}
        <Card className={`relative ${hasActiveSubscription && currentTier === "basic" ? "ring-2 ring-featured-border" : ""}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-featured-foreground" />
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
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg text-muted-foreground line-through">${PRICING.basic.regularAnnual}</span>
                    <span className="text-3xl font-bold text-green-600">${PRICING.basic.annual}</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${PRICING.basic.monthlyEquivalent.toFixed(2)}/month equivalent
                  </p>
                  <Badge className="mt-2 bg-green-600 text-white hover:bg-green-600">
                    Save 50% - Early Adopter Price
                  </Badge>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg text-muted-foreground line-through">${PRICING.basic.regularMonthly}</span>
                    <span className="text-3xl font-bold text-green-600">${PRICING.basic.monthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Billed monthly, cancel anytime
                  </p>
                  <Badge className="mt-2 bg-green-600 text-white hover:bg-green-600">
                    Save 50% - Early Adopter Price
                  </Badge>
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
        <Card className={`relative ${hasActiveSubscription && currentTier === "premium" ? "ring-2 ring-featured-border" : "border-featured-border"}`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-featured-foreground text-featured font-bold shadow-md hover:bg-featured-foreground">
              Most Popular
            </Badge>
          </div>
          <CardHeader className="pt-6">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-featured-foreground" />
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
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg text-muted-foreground line-through">${PRICING.premium.regularAnnual}</span>
                    <span className="text-3xl font-bold text-green-600">${PRICING.premium.annual}</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${PRICING.premium.monthlyEquivalent.toFixed(2)}/month equivalent
                  </p>
                  <Badge className="mt-2 bg-green-600 text-white hover:bg-green-600">
                    Save 50% - Early Adopter Price
                  </Badge>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg text-muted-foreground line-through">${PRICING.premium.regularMonthly}</span>
                    <span className="text-3xl font-bold text-green-600">${PRICING.premium.monthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Billed monthly, cancel anytime
                  </p>
                  <Badge className="mt-2 bg-green-600 text-white hover:bg-green-600">
                    Save 50% - Early Adopter Price
                  </Badge>
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
