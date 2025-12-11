import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  Check,
  Sparkles,
  TrendingUp,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import FeaturedCheckout from "@/components/owner/featured-checkout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getClinicWithSubscription } from "@/lib/owner-queries";
import { requireClinicOwnership } from "@/lib/session";

const PRICING = {
  basic: {
    monthly: 99,
    annual: 990,
    savings: 198,
  },
  premium: {
    monthly: 199,
    annual: 1990,
    savings: 398,
  },
};

const BASIC_FEATURES = [
  "Featured badge on listing",
  "Priority placement in search results",
  "Highlighted card in directory",
  "Featured marker on map",
];

const PREMIUM_FEATURES = [
  "All Basic features",
  "Premium gold badge",
  "Top placement in search results",
  "Larger marker on map",
  "Featured on homepage",
  "Priority support",
];

export default async function FeaturedPage({
  params,
  searchParams,
}: {
  params: Promise<{ clinicId: string }>;
  searchParams: Promise<{ success?: string; checkout_id?: string }>;
}) {
  const { clinicId } = await params;
  const { success } = await searchParams;
  const { session, clinic } = await requireClinicOwnership(clinicId);

  if (!clinic) {
    notFound();
  }

  const subscriptionData = await getClinicWithSubscription(clinicId, session.user.id);
  const hasActiveSubscription = subscriptionData?.subscription?.status === "active";

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/my-clinics/${clinicId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clinic
          </Link>
        </Button>
      </div>

      {/* Success Message */}
      {success === "true" && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Welcome to Featured!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your clinic is now featured and will appear prominently in search results.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-500" />
          <h1 className="text-3xl font-bold tracking-tight">Featured Listing</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Boost your visibility and attract more patients with a featured listing.
        </p>
      </div>

      {/* Current Subscription */}
      {hasActiveSubscription && subscriptionData?.subscription && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium capitalize flex items-center gap-1">
                  {subscriptionData.subscription.tier === "premium" && (
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  )}
                  {subscriptionData.subscription.tier}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {subscriptionData.subscription.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billing</p>
                <p className="font-medium capitalize">
                  {subscriptionData.subscription.billingCycle || "Monthly"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renews</p>
                <p className="font-medium">
                  {subscriptionData.subscription.endDate
                    ? new Date(subscriptionData.subscription.endDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <FeaturedCheckout
                clinicId={clinicId}
                clinicName={clinic.title}
                currentTier={subscriptionData.subscription.tier as "basic" | "premium" | null}
                mode="manage"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits Overview */}
      {!hasActiveSubscription && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium">Higher Visibility</h3>
                <p className="text-sm text-muted-foreground">
                  Appear at the top of search results and stand out from competitors.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Map Prominence</h3>
                <p className="text-sm text-muted-foreground">
                  Get a highlighted marker on the map that catches attention.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Trust Badge</h3>
                <p className="text-sm text-muted-foreground">
                  Show patients you're a verified, trusted practice.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        {/* Basic Plan */}
        <Card className={hasActiveSubscription && subscriptionData?.subscription?.tier === "basic" ? "ring-2 ring-amber-400" : ""}>
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
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">${PRICING.basic.monthly}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">
                or ${PRICING.basic.annual}/year (save ${PRICING.basic.savings})
              </p>
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
            {hasActiveSubscription && subscriptionData?.subscription?.tier === "basic" ? (
              <Badge variant="secondary" className="w-full justify-center py-2">
                Current Plan
              </Badge>
            ) : (
              <FeaturedCheckout
                clinicId={clinicId}
                clinicName={clinic.title}
                tier="basic"
                currentTier={subscriptionData?.subscription?.tier as "basic" | "premium" | null}
                mode="subscribe"
              />
            )}
          </CardFooter>
        </Card>

        {/* Premium Plan */}
        <Card className={`relative ${hasActiveSubscription && subscriptionData?.subscription?.tier === "premium" ? "ring-2 ring-amber-400" : "border-amber-200"}`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
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
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">${PRICING.premium.monthly}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">
                or ${PRICING.premium.annual}/year (save ${PRICING.premium.savings})
              </p>
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
            {hasActiveSubscription && subscriptionData?.subscription?.tier === "premium" ? (
              <Badge variant="secondary" className="w-full justify-center py-2">
                Current Plan
              </Badge>
            ) : (
              <FeaturedCheckout
                clinicId={clinicId}
                clinicName={clinic.title}
                tier="premium"
                currentTier={subscriptionData?.subscription?.tier as "basic" | "premium" | null}
                mode="subscribe"
              />
            )}
          </CardFooter>
        </Card>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">How does billing work?</h4>
            <p className="text-sm text-muted-foreground">
              You'll be charged monthly or annually depending on your chosen plan. You can cancel anytime and your featured status will remain active until the end of your billing period.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium">Can I upgrade or downgrade my plan?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! You can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the end of your current billing period.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards through our secure payment processor, Polar.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium">How quickly will my listing be featured?</h4>
            <p className="text-sm text-muted-foreground">
              Your listing will be featured immediately after successful payment. The featured badge and priority placement will be visible within minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
