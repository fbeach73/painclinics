"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Crown,
  Loader2,
  Star,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClinicFeaturedInfo } from "@/lib/admin-clinic-queries";

interface ClinicFeaturedTabProps {
  clinicId: string;
  initialData: ClinicFeaturedInfo | null;
}

export function ClinicFeaturedTab({ clinicId, initialData }: ClinicFeaturedTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [tier, setTier] = useState<"basic" | "premium">(
    (initialData?.featuredTier === "premium" ? "premium" : "basic")
  );
  const getDefaultExpirationDate = (): string => {
    if (initialData?.featuredUntil) {
      const parts = new Date(initialData.featuredUntil).toISOString().split("T");
      return parts[0] ?? "";
    }
    // Default to 1 month from now
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const parts = oneMonthFromNow.toISOString().split("T");
    return parts[0] ?? "";
  };
  const [expirationDate, setExpirationDate] = useState<string>(getDefaultExpirationDate);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isFeatured,
          featuredTier: tier,
          featuredUntil: isFeatured ? new Date(expirationDate).toISOString() : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update featured status");
      }

      toast.success(
        isFeatured
          ? `Clinic set as ${tier} featured until ${new Date(expirationDate).toLocaleDateString()}`
          : "Featured status removed"
      );

      router.refresh();
    } catch (error) {
      console.error("Failed to update featured status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update featured status"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFeatured = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/featured`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove featured status");
      }

      setIsFeatured(false);
      toast.success("Featured status removed");
      router.refresh();
    } catch (error) {
      console.error("Failed to remove featured status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove featured status"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check if featured status has expired
  const isExpired = initialData?.featuredUntil
    ? new Date(initialData.featuredUntil) <= new Date()
    : false;

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Current Featured Status
          </CardTitle>
          <CardDescription>
            View and manage this clinic&apos;s featured listing status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {initialData?.isFeatured && !isExpired ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-600 dark:text-green-400">Featured</span>
                  </>
                ) : isExpired ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">Expired</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">Not Featured</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Tier</Label>
              <div className="flex items-center gap-2 mt-1">
                {initialData?.featuredTier === "premium" ? (
                  <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                ) : initialData?.featuredTier === "basic" ? (
                  <Badge variant="secondary">
                    <Star className="h-3 w-3 mr-1" />
                    Basic
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Expiration Date</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className={isExpired ? "text-yellow-600 dark:text-yellow-400" : ""}>
                  {formatDate(initialData?.featuredUntil)}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Subscription</Label>
              <div className="mt-1">
                {initialData?.hasActiveSubscription ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Active ({initialData.subscriptionTier})
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">No active subscription</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Warning */}
      {initialData?.hasActiveSubscription && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Active Subscription Detected</AlertTitle>
          <AlertDescription>
            This clinic has an active Stripe subscription ({initialData.subscriptionTier} tier).
            Manual changes here will override the subscription settings. The subscription will
            continue to renew unless cancelled by the clinic owner.
          </AlertDescription>
        </Alert>
      )}

      {/* Admin Override Form */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Override</CardTitle>
          <CardDescription>
            Manually set featured status. This overrides any subscription-based settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Featured Toggle */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="isFeatured"
              checked={isFeatured}
              onCheckedChange={(checked) => setIsFeatured(checked === true)}
              disabled={isLoading}
            />
            <Label
              htmlFor="isFeatured"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enable Featured Status
            </Label>
          </div>

          {/* Tier Selection */}
          <div className="space-y-2">
            <Label htmlFor="tier">Featured Tier</Label>
            <Select
              value={tier}
              onValueChange={(value) => setTier(value as "basic" | "premium")}
              disabled={isLoading || !isFeatured}
            >
              <SelectTrigger id="tier" className="w-full">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span>Basic</span>
                  </div>
                </SelectItem>
                <SelectItem value="premium">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span>Premium</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Premium tier clinics appear above basic tier in search results and carousels.
            </p>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date</Label>
            <Input
              id="expirationDate"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              disabled={isLoading || !isFeatured}
              min={new Date().toISOString().split("T")[0]}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              The featured status will automatically expire after this date.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>

            {initialData?.isFeatured && (
              <Button
                variant="outline"
                onClick={handleRemoveFeatured}
                disabled={isLoading}
                className="text-destructive hover:text-destructive"
              >
                Remove Featured Status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How Featured Listings Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Featured clinics</strong> receive prominent placement throughout the site,
            including the homepage carousel, search results, and city/state pages.
          </p>
          <p>
            <strong>Premium tier</strong> clinics are shown above basic tier in all listings
            and receive the gold &quot;Premium&quot; badge.
          </p>
          <p>
            <strong>Admin overrides</strong> take precedence over subscription-based settings,
            but the subscription will continue to renew automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
