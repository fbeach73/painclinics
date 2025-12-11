import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, Phone, Star, Globe, Crown } from "lucide-react";
import { ClinicFeaturedTab } from "@/components/admin/clinics/clinic-featured-tab";
import { ClinicServicesTab } from "@/components/admin/clinics/clinic-services-tab";
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

  // Fetch clinic, services, and featured data in parallel
  const [clinic, clinicServices, allServices, featuredInfo] = await Promise.all([
    getClinicById(clinicId),
    getClinicServices(clinicId),
    getAllServices(true), // only active services
    getClinicFeaturedInfo(clinicId),
  ]);

  if (!clinic) {
    notFound();
  }

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
      <div className="grid gap-4 md:grid-cols-5">
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
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

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Information</CardTitle>
              <CardDescription>
                Basic information about this clinic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">ID</h4>
                  <p className="text-sm font-mono">{clinic.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Permalink</h4>
                  <p className="text-sm font-mono">/{clinic.permalink}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Full Address</h4>
                  <p className="text-sm">{clinic.detailedAddress || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Coordinates</h4>
                  <p className="text-sm">
                    {clinic.mapLatitude.toFixed(6)}, {clinic.mapLongitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Clinic Type</h4>
                  <p className="text-sm">{clinic.clinicType || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Place ID</h4>
                  <p className="text-sm font-mono truncate">{clinic.placeId || "N/A"}</p>
                </div>
              </div>

              {clinic.clinicHours ? (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Hours</h4>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                    {JSON.stringify(clinic.clinicHours as Record<string, unknown>, null, 2)}
                  </pre>
                </div>
              ) : null}

              {clinic.amenities && Array.isArray(clinic.amenities) && clinic.amenities.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Legacy Amenities
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {(clinic.amenities as string[]).map((amenity, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <ClinicFeaturedTab clinicId={clinic.id} initialData={featuredInfo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
