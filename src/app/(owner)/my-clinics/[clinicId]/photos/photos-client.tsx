"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoUpload } from "@/components/owner/photo-upload";

interface PhotosClientProps {
  clinicId: string;
  initialPhotos: string[];
  maxPhotos: number;
  tier: "none" | "basic" | "premium";
}

export function PhotosClient({
  clinicId,
  initialPhotos,
  maxPhotos,
  tier,
}: PhotosClientProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const router = useRouter();

  const handlePhotosChange = (newPhotos: string[]) => {
    setPhotos(newPhotos);
    // Refresh the page to update the badge count
    router.refresh();
  };

  return (
    <PhotoUpload
      clinicId={clinicId}
      currentPhotos={photos}
      maxPhotos={maxPhotos}
      tier={tier}
      onPhotosChange={handlePhotosChange}
    />
  );
}
