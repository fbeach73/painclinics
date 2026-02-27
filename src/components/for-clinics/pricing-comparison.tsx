"use client";

import { Check, Sparkles, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type FeatureValue = boolean | string;

interface Feature {
  name: string;
  included: FeatureValue;
}

interface Tier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  originalMonthly?: number;
  originalAnnual?: number;
  description: string;
  popular?: boolean;
  features: Feature[];
  cta: string;
}

const tiers: Tier[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Claim your listing",
    features: [
      { name: "Verified badge", included: true },
      { name: "Edit basic info", included: true },
      { name: "Appear in directory", included: true },
      { name: "Featured badge", included: false },
      { name: "Priority placement", included: false },
      { name: "Ad-free listing", included: false },
      { name: "Photos", included: "3" },
      { name: "Homepage feature", included: false },
      { name: "Priority support", included: false },
    ],
    cta: "Claim Free",
  },
  {
    name: "Basic",
    monthlyPrice: 49.5,
    annualPrice: 495,
    originalMonthly: 99,
    originalAnnual: 990,
    description: "Get noticed",
    features: [
      { name: "Verified badge", included: true },
      { name: "Edit basic info", included: true },
      { name: "Appear in directory", included: true },
      { name: "Featured badge", included: true },
      { name: "Priority placement", included: true },
      { name: "Ad-free listing", included: true },
      { name: "Photos", included: "5" },
      { name: "Homepage feature", included: false },
      { name: "Priority support", included: false },
    ],
    cta: "Get Basic",
  },
  {
    name: "Premium",
    monthlyPrice: 99.5,
    annualPrice: 995,
    originalMonthly: 199,
    originalAnnual: 1990,
    description: "Maximum visibility",
    popular: true,
    features: [
      { name: "Verified badge", included: true },
      { name: "Edit basic info", included: true },
      { name: "Appear in directory", included: true },
      { name: "Featured badge", included: "Gold" },
      { name: "Priority placement", included: "TOP" },
      { name: "Ad-free listing", included: true },
      { name: "Photos", included: "50" },
      { name: "Homepage feature", included: true },
      { name: "Priority support", included: true },
    ],
    cta: "Get Premium",
  },
];

function FeatureIcon({ value }: { value: FeatureValue }) {
  if (value === false) {
    return <X className="h-4 w-4 text-neutral-500" />;
  }
  if (value === true) {
    return <Check className="h-4 w-4 text-green-500" />;
  }
  return (
    <span className="text-sm font-medium text-primary">{value}</span>
  );
}

function PriceDisplay({
  price,
  originalPrice,
  isAnnual,
}: {
  price: number;
  originalPrice: number | undefined;
  isAnnual: boolean;
}) {
  if (price === 0) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold text-white">$0</span>
        <span className="text-neutral-400">/forever</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {originalPrice && (
        <span className="text-lg text-neutral-500 line-through">
          ${originalPrice.toLocaleString()}{isAnnual ? "/year" : "/mo"}
        </span>
      )}
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold text-white">
          ${price.toLocaleString()}
        </span>
        <span className="text-neutral-400">{isAnnual ? "/year" : "/mo"}</span>
      </div>
      {isAnnual && price > 0 && (
        <span className="text-sm text-green-400 mt-1">
          Save ${((originalPrice || price * 2) - price).toLocaleString()}/year
        </span>
      )}
    </div>
  );
}

export function PricingComparison() {
  // A/B test: 50% see annual, 50% see monthly by default
  const [isAnnual, setIsAnnual] = useState(() => Math.random() < 0.5);
  const hasTracked = useRef(false);

  // Track A/B test variant to GA4 on mount
  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Send to GA4
    if (typeof window !== "undefined" && "gtag" in window) {
      (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag("event", "pricing_ab_test", {
        variant: isAnnual ? "annual" : "monthly",
        page: "for_clinics",
      });
    }
  }, [isAnnual]);

  return (
    <section id="pricing" className="bg-slate-950 py-20 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-neutral-400 max-w-2xl mx-auto">
            Start free and upgrade when you&apos;re ready for more visibility.
          </p>
        </motion.div>

        {/* Discount Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-8"
        >
          <div className="bg-primary/10 border border-primary/20 rounded-full px-6 py-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-white">
              <span className="font-semibold text-primary">50% OFF</span>
              {" "}— January Early Adopter Special
            </span>
          </div>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mb-12"
        >
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              !isAnnual ? "text-white" : "text-neutral-500"
            )}
          >
            Monthly
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="data-[state=checked]:bg-primary"
          />
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              isAnnual ? "text-white" : "text-neutral-500"
            )}
          >
            Annual
          </span>
          <span className="ml-2 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
            Save 17%
          </span>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={cn(
                "relative rounded-2xl border p-6 flex flex-col",
                tier.popular
                  ? "border-primary bg-primary/5"
                  : "border-neutral-800 bg-neutral-900/50"
              )}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tier Header */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  {tier.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <PriceDisplay
                  price={isAnnual ? tier.annualPrice : tier.monthlyPrice}
                  originalPrice={
                    isAnnual ? tier.originalAnnual : tier.originalMonthly
                  }
                  isAnnual={isAnnual}
                />
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-grow">
                {tier.features.map((feature) => (
                  <li
                    key={feature.name}
                    className="flex items-center gap-3 text-sm"
                  >
                    <FeatureIcon value={feature.included} />
                    <span
                      className={cn(
                        feature.included === false
                          ? "text-neutral-500"
                          : "text-neutral-300"
                      )}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                asChild
                variant={tier.popular ? "default" : "outline"}
                className={cn(
                  "w-full",
                  tier.popular
                    ? "bg-primary hover:bg-primary/90"
                    : "border-neutral-700 hover:bg-neutral-800"
                )}
              >
                <Link href="/pain-management">{tier.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center text-sm text-neutral-500 mt-8"
        >
          All plans include a verified badge. Cancel anytime, no contracts.
        </motion.p>
      </div>
    </section>
  );
}
