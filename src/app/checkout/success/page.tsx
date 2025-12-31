import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ExternalLink, Sparkles, Star } from "lucide-react";
import Stripe from "stripe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    })
  : null;

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;

  if (!session_id || !stripe) {
    redirect("/my-clinics");
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription"],
    });
  } catch (error) {
    console.error("[Checkout Success] Error retrieving session:", error);
    redirect("/my-clinics");
  }

  // Check if the session was successful
  if (session.payment_status !== "paid") {
    redirect("/my-clinics");
  }

  const clinicId = session.metadata?.clinicId;
  const plan = session.metadata?.plan;
  const tier = plan?.includes("premium") ? "Premium" : "Basic";
  const isPremium = tier === "Premium";

  // Get billing cycle from subscription
  const subscription = session.subscription as Stripe.Subscription | null;
  const billingCycle = subscription?.items?.data?.[0]?.price?.recurring?.interval === "year"
    ? "Annual"
    : "Monthly";

  // Create customer portal link
  let portalUrl: string | null = null;
  if (session.customer && typeof session.customer === "string") {
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: session.customer,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/my-clinics/${clinicId}`,
      });
      portalUrl = portalSession.url;
    } catch (error) {
      console.error("[Checkout Success] Error creating portal session:", error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/30 to-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>

          <CardTitle className="text-2xl">Thank you for subscribing!</CardTitle>
          <p className="text-muted-foreground mt-2">
            Your featured listing is now active.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Subscription Details */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <Badge
                variant={isPremium ? "default" : "secondary"}
                className={isPremium ? "bg-amber-500 hover:bg-amber-600" : ""}
              >
                {isPremium && <Sparkles className="h-3 w-3 mr-1" />}
                {tier}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Billing</span>
              <span className="font-medium">{billingCycle}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Active
              </Badge>
            </div>
          </div>

          {/* What's Next */}
          <div className="space-y-2">
            <h3 className="font-medium">What&apos;s next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Your clinic now has a Featured badge on all listings</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Priority placement in search results is active</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>A confirmation email has been sent to your inbox</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full">
              <Link href={clinicId ? `/my-clinics/${clinicId}` : "/my-clinics"}>
                Go to Your Clinic Dashboard
              </Link>
            </Button>

            {portalUrl && (
              <Button variant="outline" asChild className="w-full">
                <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                  Manage Subscription
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
