import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  MapPin,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import BillingTogglePricing from "@/components/owner/billing-toggle-pricing";
import FeaturedCheckout from "@/components/owner/featured-checkout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getClinicWithSubscription } from "@/lib/owner-queries";
import { requireClinicOwnership } from "@/lib/session";

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

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-featured-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">Featured Listing</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Boost your visibility and attract more patients with a featured listing.
        </p>
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

      {/* Current Subscription */}
      {hasActiveSubscription && subscriptionData?.subscription && (
        <Card className="border-featured-border bg-featured">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-featured-foreground fill-featured-foreground" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium capitalize flex items-center gap-1">
                  {subscriptionData.subscription.tier === "premium" && (
                    <Sparkles className="h-4 w-4 text-featured-foreground" />
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
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-featured">
                <TrendingUp className="h-5 w-5 text-featured-foreground" />
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

      {/* Pricing Cards with Billing Toggle */}
      <BillingTogglePricing
        clinicId={clinicId}
        clinicName={clinic.title}
        currentTier={subscriptionData?.subscription?.tier as "basic" | "premium" | null}
        hasActiveSubscription={hasActiveSubscription}
      />

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
              We accept all major credit cards through our secure payment processor, Stripe.
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
