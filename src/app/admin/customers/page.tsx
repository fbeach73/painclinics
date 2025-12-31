import Link from "next/link";
import { Users, Search, Calendar, Star, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAllCustomers, getCustomerCounts } from "@/lib/admin-customer-queries";
import { CancelSubscriptionButton, ReverseClaimButton } from "./customer-actions";
import { CustomerFilterTabs } from "./customer-filter-tabs";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
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

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status || "all";

  const [customers, counts] = await Promise.all([
    getAllCustomers({ status: statusFilter }),
    getCustomerCounts(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage subscribers and clinic owners
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
            {counts.active} active
          </Badge>
          <Button asChild variant="outline" size="sm">
            <a
              href="https://dashboard.stripe.com/customers"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Stripe
            </a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Customer Subscriptions</CardTitle>
          </div>
          <CardDescription>
            View and manage featured listing subscriptions. Use the actions to cancel subscriptions or reverse claims.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerFilterTabs currentStatus={statusFilter} counts={counts} />

          {customers.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No {statusFilter === "all" ? "" : statusFilter} customers found.
              </p>
            </div>
          ) : (
            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.subscriptionId}>
                      <TableCell>
                        <Link
                          href={`/pain-management/${customer.clinicPermalink}`}
                          className="font-medium hover:underline block"
                          target="_blank"
                        >
                          {customer.clinicName}
                        </Link>
                        <span className="text-sm text-muted-foreground">
                          {customer.clinicCity}, {customer.clinicState}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={customer.ownerImage || undefined} />
                            <AvatarFallback>
                              {customer.ownerName?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{customer.ownerName || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">{customer.ownerEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(customer.tier)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="capitalize">
                            {customer.billingCycle || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(customer.startDate)}
                      </TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex items-center justify-end gap-1">
                            {customer.status === "active" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <CancelSubscriptionButton
                                      subscriptionId={customer.subscriptionId}
                                      clinicName={customer.clinicName}
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Cancel subscription</TooltipContent>
                              </Tooltip>
                            )}
                            {customer.claimedAt && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <ReverseClaimButton
                                      clinicId={customer.clinicId}
                                      clinicName={customer.clinicName}
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Reverse claim</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {customers.length > 50 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing first 50 of {customers.length} customers
            </p>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Managing Customers</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Cancel Subscription:</strong> Immediately cancels the subscription in Stripe and removes the featured status from the clinic. The owner will no longer be billed.
          </p>
          <p>
            <strong>Reverse Claim:</strong> Removes ownership from the clinic, marks it as unverified, and makes it available for new claims. Use this if a claim was fraudulent or the owner requests removal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
