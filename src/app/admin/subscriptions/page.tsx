import Link from "next/link";
import { CreditCard, DollarSign, TrendingUp, Users, Star, Calendar, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllActiveSubscriptions, getSubscriptionSummary } from "@/lib/subscription-queries";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Active
        </Badge>
      );
    case "canceled":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Canceled
        </Badge>
      );
    case "past_due":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Past Due
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          Expired
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getTierBadge(tier: string) {
  switch (tier) {
    case "premium":
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
          <Star className="h-3 w-3 mr-1 fill-current" />
          Premium
        </Badge>
      );
    case "basic":
      return (
        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
          Basic
        </Badge>
      );
    default:
      return <Badge variant="outline">{tier}</Badge>;
  }
}

export default async function SubscriptionsPage() {
  const [summary, subscriptions] = await Promise.all([
    getSubscriptionSummary(),
    getAllActiveSubscriptions(),
  ]);

  // Calculate additional metrics
  const annualSubscriptions = subscriptions.filter((s) => s.billingCycle === "annual").length;
  const monthlySubscriptions = subscriptions.filter((s) => s.billingCycle === "monthly").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage featured listing subscriptions and revenue
          </p>
        </div>
        <Button asChild variant="outline">
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Stripe Dashboard
          </a>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.mrr)}</div>
            <p className="text-xs text-muted-foreground">
              MRR from {summary.totalActive} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalActive}</div>
            <p className="text-xs text-muted-foreground">
              {monthlySubscriptions} monthly, {annualSubscriptions} annual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Basic Tier</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalBasic}</div>
            <p className="text-xs text-muted-foreground">
              $99/mo or $990/yr
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Tier</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPremium}</div>
            <p className="text-xs text-muted-foreground">
              $199/mo or $1,990/yr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Active Subscriptions</CardTitle>
          </div>
          <CardDescription>
            Featured listing subscriptions managed through Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No active subscriptions yet.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Subscriptions will appear here when clinic owners purchase featured listings.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <Link
                          href={`/pain-management/${subscription.clinic?.state?.toLowerCase()}/${subscription.clinic?.permalink}`}
                          className="font-medium hover:underline"
                          target="_blank"
                        >
                          {subscription.clinic?.title || "Unknown Clinic"}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {subscription.clinic?.city}, {subscription.clinic?.state}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {subscription.user?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.user?.email}
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(subscription.tier)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="capitalize">
                            {subscription.billingCycle || "monthly"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(subscription.startDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(subscription.endDate)}
                      </TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Managing Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Subscriptions are managed through{" "}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Stripe
            </a>
            . To issue refunds, cancel subscriptions, or view detailed payment history,
            use the Stripe Dashboard.
          </p>
          <p>
            Featured listings are automatically updated when subscription status changes
            via webhooks. If a subscription is canceled, the featured status remains
            active until the end of the current billing period.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
