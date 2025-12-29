import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, MessageSquare, Phone, Star, Globe, Crown, RefreshCw, Settings } from "lucide-react";
import { ClinicContentTab } from "@/components/admin/clinics/clinic-content-tab";
import { ClinicDetailsTab } from "@/components/admin/clinics/clinic-details-tab";
import { ClinicFAQTab } from "@/components/admin/clinics/clinic-faq-tab";
import { ClinicFeaturedTab } from "@/components/admin/clinics/clinic-featured-tab";
import { ClinicReviewsTab } from "@/components/admin/clinics/clinic-reviews-tab";
import { ClinicServicesTab } from "@/components/admin/clinics/clinic-services-tab";
import { ClinicStatusCard } from "@/components/admin/clinics/clinic-status-card";
import { ClinicSyncTab } from "@/components/admin/clinics/clinic-sync-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClinicFeaturedInfo } from "@/lib/admin-clinic-queries";
import { getClinicById } from "@/lib/clinic-queries";
import { getClinicServices } from "@/lib/clinic-services-queries";
import { getAllServices } from "@/lib/services-queries";

interface PageProps {
  params: Promise<{ clinicId: string }>;
}

export default async function ClinicDetailPage({ params }: PageProps) {
  const { clinicId } = await params;

  // Fetch clinic with relations, services, and featured data in parallel
  const [clinic, clinicServices, allServices, featuredInfo] = await Promise.all([
    getClinicById(clinicId, { includeRelations: true }),
    getClinicServices(clinicId),
    getAllServices(true), // only active services
    getClinicFeaturedInfo(clinicId),
  ]);

  if (!clinic) {
    notFound();
  }

  // Extract owner info from the clinic relations
  // Use type assertion since includeRelations: true includes the owner relation
  const clinicWithOwner = clinic as typeof clinic & {
    owner?: { id: string; name: string | null; email: string; image: string | null } | null;
  };
  const ownerInfo = clinicWithOwner.owner
    ? {
        id: clinicWithOwner.owner.id,
        name: clinicWithOwner.owner.name,
        email: clinicWithOwner.owner.email,
        image: clinicWithOwner.owner.image,
      }
    : null;

  // Calculate available services (those not already assigned)
  const assignedServiceIds = new Set(clinicServices.map((cs) => cs.serviceId));
  const availableServices = allServices.filter((s) => !assignedServiceIds.has(s.id));

  const featuredCount = clinicServices.filter((cs) => cs.isFeatured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clinics">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{clinic.title}</h1>
          <p className="text-muted-foreground">
            {clinic.city}, {clinic.stateAbbreviation}
          </p>
        </div>
        <Link href={`/${clinic.permalink}`} target="_blank">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Public Page
          </Button>
        </Link>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {clinic.streetAddress && `${clinic.streetAddress}, `}
                {clinic.city}, {clinic.stateAbbreviation} {clinic.postalCode}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {clinic.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{clinic.phone}</span>
                </div>
              )}
              {clinic.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={clinic.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {new URL(clinic.website).hostname}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-lg font-medium">
                {clinic.rating?.toFixed(1) ?? "N/A"}
              </span>
              <span className="text-sm text-muted-foreground">
                ({clinic.reviewCount ?? 0} reviews)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="default">{clinicServices.length} total</Badge>
              <Badge variant="secondary">{featuredCount} featured</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Featured Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {featuredInfo?.isFeatured ? (
                <>
                  {featuredInfo.featuredTier === "premium" ? (
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Basic
                    </Badge>
                  )}
                </>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Not Featured
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <ClinicStatusCard clinicId={clinic.id} initialStatus={clinic.status} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Sync
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Details
          </TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Services</CardTitle>
              <CardDescription>
                Select which services this clinic offers and mark up to 8 as featured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicServicesTab
                clinicId={clinic.id}
                clinicName={clinic.title}
                initialServices={clinicServices}
                availableServices={availableServices}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 data-[state=inactive]:hidden" forceMount>
          <ClinicContentTab clinicId={clinic.id} clinicName={clinic.title} />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <ClinicReviewsTab
            clinicId={clinic.id}
            clinicName={clinic.title}
            initialData={{
              reviewKeywords: clinic.reviewKeywords as { keyword: string; count: number }[] | null,
              reviewsPerScore: clinic.reviewsPerScore as Record<string, number> | null,
              featuredReviews: clinic.featuredReviews as { username: string | null; url: string | null; review: string | null; date: string | null; rating: number | null }[] | null,
              detailedReviews: clinic.detailedReviews as { review_id?: string; review_text?: string; review_rating?: number; author_title?: string; author_link?: string; review_datetime_utc?: string; owner_answer?: string; review_likes?: number }[] | null,
              allReviewsText: clinic.allReviewsText,
              rating: clinic.rating,
              reviewCount: clinic.reviewCount,
            }}
          />
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <ClinicFAQTab clinicId={clinic.id} clinicName={clinic.title} />
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <ClinicSyncTab
            clinicId={clinic.id}
            clinicName={clinic.title}
            initialPlaceId={clinic.placeId}
          />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <ClinicDetailsTab
            clinicId={clinic.id}
            initialData={{
              id: clinic.id,
              title: clinic.title,
              clinicType: clinic.clinicType,
              permalink: clinic.permalink,
              streetAddress: clinic.streetAddress,
              city: clinic.city,
              state: clinic.state,
              stateAbbreviation: clinic.stateAbbreviation,
              postalCode: clinic.postalCode,
              mapLatitude: clinic.mapLatitude,
              mapLongitude: clinic.mapLongitude,
              detailedAddress: clinic.detailedAddress,
              phone: clinic.phone,
              website: clinic.website,
              emails: clinic.emails as string[] | null,
              googleListingLink: clinic.googleListingLink,
              facebook: clinic.facebook,
              instagram: clinic.instagram,
              twitter: clinic.twitter,
              youtube: clinic.youtube,
              linkedin: clinic.linkedin,
              tiktok: clinic.tiktok,
              pinterest: clinic.pinterest,
              clinicHours: clinic.clinicHours,
              closedOn: clinic.closedOn,
              rating: clinic.rating,
              reviewCount: clinic.reviewCount,
              amenities: clinic.amenities as string[] | null,
            }}
            ownershipData={{
              ownerUserId: clinic.ownerUserId,
              isVerified: clinic.isVerified,
              claimedAt: clinic.claimedAt,
              owner: ownerInfo,
            }}
          />
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <ClinicFeaturedTab clinicId={clinic.id} initialData={featuredInfo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
