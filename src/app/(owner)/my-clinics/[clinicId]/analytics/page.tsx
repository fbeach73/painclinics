import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Crown, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClinicOwnership } from "@/lib/session";
import { AnalyticsDashboard } from "./analytics-dashboard";

export default async function ClinicAnalyticsPage({
  params,
}: {
  params: Promise<{ clinicId: string }>;
}) {
  const { clinicId } = await params;
  const { clinic } = await requireClinicOwnership(clinicId);

  if (!clinic) {
    notFound();
  }

  const isPremium = clinic.featuredTier === "premium";

  // If not premium, show upgrade prompt
  if (!isPremium) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/my-clinics/${clinicId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {clinic.title}
          </Link>
        </Button>

        {/* Upgrade Prompt */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-2xl">Premium Analytics</CardTitle>
            <CardDescription className="text-base">
              Detailed analytics are available exclusively for Premium subscribers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-medium text-center">What you get with Premium Analytics:</h3>
              <ul className="space-y-2 max-w-md mx-auto">
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>Daily page view tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>Unique visitor counts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>Traffic source breakdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>Period-over-period comparison</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>Up to 90 days of historical data</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col items-center gap-3 pt-4">
              <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700">
                <Link href={`/my-clinics/${clinicId}/featured`}>
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Starting at $99/month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/my-clinics/${clinicId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {clinic.title}
        </Link>
      </Button>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard clinicId={clinicId} clinicName={clinic.title} />
    </div>
  );
}
