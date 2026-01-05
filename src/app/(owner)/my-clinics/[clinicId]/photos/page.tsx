import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PHOTO_LIMITS } from "@/lib/constants/photo-limits";
import { requireClinicOwnership } from "@/lib/session";
import { PhotosClient } from "./photos-client";

export default async function PhotosManagementPage({
  params,
}: {
  params: Promise<{ clinicId: string }>;
}) {
  const { clinicId } = await params;
  const { clinic } = await requireClinicOwnership(clinicId);

  if (!clinic) {
    notFound();
  }

  // Get current photos (only from clinicImageUrls - these are owner-managed)
  const currentPhotos = clinic.clinicImageUrls || [];

  // Determine tier and limit
  const tier = (clinic.featuredTier || "none") as "none" | "basic" | "premium";
  const photoLimit = PHOTO_LIMITS[tier] || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/my-clinics/${clinicId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Photos</h1>
          <p className="text-muted-foreground">
            Manage your clinic&apos;s photo gallery
          </p>
        </div>
        {tier !== "none" && (
          <Badge
            variant="secondary"
            className="bg-featured text-featured-foreground border-featured-border"
          >
            {currentPhotos.length} / {photoLimit} photos
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Photo Gallery</CardTitle>
          <CardDescription>
            {tier === "none" ? (
              "Get a Featured subscription to upload photos"
            ) : tier === "basic" ? (
              `Upload up to ${photoLimit} photos with Basic. Upgrade to Premium for up to 50.`
            ) : (
              `Upload up to ${photoLimit} photos to showcase your clinic`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhotosClient
            clinicId={clinicId}
            initialPhotos={currentPhotos}
            maxPhotos={photoLimit}
            tier={tier}
          />
        </CardContent>
      </Card>
    </div>
  );
}
