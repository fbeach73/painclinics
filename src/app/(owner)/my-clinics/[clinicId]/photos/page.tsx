import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClinicOwnership } from "@/lib/session";

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

  // Get all images from the clinic
  const images: string[] = [
    ...(clinic.featImage ? [clinic.featImage] : []),
    ...(clinic.imageUrl ? [clinic.imageUrl] : []),
    ...(clinic.imageFeatured ? [clinic.imageFeatured] : []),
    ...(clinic.clinicImageUrls || []),
  ].filter(Boolean);

  // Remove duplicates
  const uniqueImages = [...new Set(images)];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/my-clinics/${clinicId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Photos</h1>
          <p className="text-muted-foreground">
            Manage your clinic&apos;s photo gallery
          </p>
        </div>
      </div>

      <Alert>
        <ImagePlus className="h-4 w-4" />
        <AlertTitle>Photo Management Coming Soon</AlertTitle>
        <AlertDescription>
          The ability to upload and manage photos will be available in a future update.
          Currently showing existing photos imported from your listing.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Current Photos</CardTitle>
          <CardDescription>
            {uniqueImages.length} photo{uniqueImages.length !== 1 ? "s" : ""} in your gallery
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uniqueImages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImagePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No photos available for this clinic yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {uniqueImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
                >
                  <Image
                    src={imageUrl}
                    alt={`${clinic.title} photo ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                      Featured
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
