import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Edit,
  Eye,
  MapPin,
  Phone,
  Star,
  Globe,
  Image,
  Wrench,
  Mail,
  ExternalLink,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
} from "lucide-react";
import { ClinicAnalyticsWidget } from "@/components/owner/clinic-analytics-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getClinicWithSubscription } from "@/lib/owner-queries";
import { requireClinicOwnership } from "@/lib/session";

export default async function ClinicOverviewPage({
  params,
}: {
  params: Promise<{ clinicId: string }>;
}) {
  const { clinicId } = await params;
  const { session, clinic } = await requireClinicOwnership(clinicId);

  if (!clinic) {
    notFound();
  }

  // Get subscription info
  const subscriptionData = await getClinicWithSubscription(clinicId, session.user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{clinic.title}</h1>
            {clinic.isFeatured && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <Star className="h-3 w-3 mr-1" />
                {clinic.featuredTier === "premium" ? "Premium" : "Featured"}
              </Badge>
            )}
            {clinic.isVerified && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Verified
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {clinic.streetAddress && `${clinic.streetAddress}, `}
            {clinic.city}, {clinic.stateAbbreviation || clinic.state} {clinic.postalCode}
          </p>
        </div>
        <Button asChild>
          <Link href={`/pain-management/${clinic.permalink}`} target="_blank">
            <Eye className="h-4 w-4 mr-2" />
            View Public Listing
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href={`/my-clinics/${clinicId}/edit`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Edit Info</h3>
                <p className="text-sm text-muted-foreground">Contact, hours, etc.</p>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href={`/my-clinics/${clinicId}/photos`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium">Photos</h3>
                <p className="text-sm text-muted-foreground">Manage gallery</p>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href={`/my-clinics/${clinicId}/services`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900">
                <Wrench className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium">Services</h3>
                <p className="text-sm text-muted-foreground">Treatment offerings</p>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href={`/my-clinics/${clinicId}/featured`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900">
                <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-medium">Featured</h3>
                <p className="text-sm text-muted-foreground">
                  {clinic.isFeatured ? "Manage plan" : "Get featured"}
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Analytics Widget */}
      <ClinicAnalyticsWidget clinicId={clinicId} />

      {/* Clinic Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clinic.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{clinic.phone}</span>
              </div>
            )}
            {clinic.phones && clinic.phones.length > 0 && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="space-y-1">
                  {clinic.phones.map((phone, idx) => (
                    <div key={idx}>{phone}</div>
                  ))}
                </div>
              </div>
            )}
            {clinic.emails && clinic.emails.length > 0 && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="space-y-1">
                  {clinic.emails.map((email, idx) => (
                    <div key={idx}>{email}</div>
                  ))}
                </div>
              </div>
            )}
            {clinic.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={clinic.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {clinic.website}
                </a>
              </div>
            )}
            {!clinic.phone && !clinic.website && (!clinic.emails || clinic.emails.length === 0) && (
              <p className="text-muted-foreground text-sm">No contact information added yet.</p>
            )}
            <Separator />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/my-clinics/${clinicId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Contact Info
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Business Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clinic.clinicHours && Array.isArray(clinic.clinicHours) && clinic.clinicHours.length > 0 ? (
              <div className="space-y-2">
                {(clinic.clinicHours as Array<{ day: string; hours: string }>).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="font-medium capitalize">{item.day}</span>
                    <span className="text-muted-foreground">{item.hours}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No hours information added yet.</p>
            )}
            {clinic.closedOn && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Closed on:</span> {clinic.closedOn}
              </div>
            )}
            <Separator />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/my-clinics/${clinicId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Hours
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reviews & Ratings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                <span className="text-2xl font-bold">
                  {clinic.rating ? clinic.rating.toFixed(1) : "N/A"}
                </span>
              </div>
              <div className="text-muted-foreground">
                {clinic.reviewCount || 0} reviews
              </div>
            </div>
            {Boolean(clinic.reviewsPerScore) && Array.isArray(clinic.reviewsPerScore) && clinic.reviewsPerScore.length > 0 && (
              <div className="space-y-2">
                {(() => {
                  const scoreMap = new Map(
                    (clinic.reviewsPerScore as Array<{ score: number; count: number }>).map(
                      (item) => [item.score, item.count]
                    )
                  );
                  const total = clinic.reviewCount || 1;
                  return [5, 4, 3, 2, 1].map((score) => {
                    const count = scoreMap.get(score) || 0;
                    const percentage = (count / total) * 100;
                    return (
                      <div key={score} className="flex items-center gap-2 text-sm">
                        <span className="w-3">{score}</span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground w-8">{count}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Social Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {clinic.facebook && (
                <a
                  href={clinic.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md hover:bg-muted/80"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </a>
              )}
              {clinic.instagram && (
                <a
                  href={clinic.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md hover:bg-muted/80"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              )}
              {clinic.twitter && (
                <a
                  href={clinic.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md hover:bg-muted/80"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </a>
              )}
              {clinic.youtube && (
                <a
                  href={clinic.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md hover:bg-muted/80"
                >
                  <Youtube className="h-4 w-4" />
                  YouTube
                </a>
              )}
              {clinic.linkedin && (
                <a
                  href={clinic.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md hover:bg-muted/80"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
            </div>
            {!clinic.facebook && !clinic.instagram && !clinic.twitter && !clinic.youtube && !clinic.linkedin && (
              <p className="text-muted-foreground text-sm">No social media links added yet.</p>
            )}
            <Separator />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/my-clinics/${clinicId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Social Links
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Featured Status */}
      {subscriptionData?.subscription && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Featured Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium capitalize">{subscriptionData.subscription.tier}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {subscriptionData.subscription.status}
                </Badge>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
