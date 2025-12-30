"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  clinicId: string;
  currentPhotos: string[];
  maxPhotos: number;
  tier: "none" | "basic" | "premium";
  onPhotosChange: (photos: string[]) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

export function PhotoUpload({
  clinicId,
  currentPhotos,
  maxPhotos,
  tier,
  onPhotosChange,
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [deleteUrl, setDeleteUrl] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = maxPhotos - currentPhotos.length;
  const canUpload = tier !== "none" && remainingSlots > 0;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (canUpload) {
      setIsDragging(true);
    }
  }, [canUpload]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return "Invalid file type. Allowed: JPEG, PNG, GIF, WebP";
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return "File too large. Maximum size is 5MB";
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/owner/clinics/${clinicId}/photos`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      return data.url;
    } catch (err) {
      throw err;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);

    // Check how many files we can upload
    const availableSlots = maxPhotos - currentPhotos.length;
    if (fileArray.length > availableSlots) {
      setError(`Can only upload ${availableSlots} more photo${availableSlots !== 1 ? "s" : ""}`);
      return;
    }

    // Validate all files first
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Start uploading
    const uploadingFiles: UploadingFile[] = fileArray.map((file) => ({
      file,
      progress: 0,
    }));
    setUploading(uploadingFiles);

    const newPhotos: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      if (!file) continue;

      try {
        // Simulate progress (since fetch doesn't support progress)
        setUploading((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, progress: 50 } : item
          )
        );

        const url = await uploadFile(file);
        if (url) {
          newPhotos.push(url);
        }

        setUploading((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, progress: 100 } : item
          )
        );
      } catch (err) {
        setUploading((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, error: err instanceof Error ? err.message : "Upload failed" }
              : item
          )
        );
      }
    }

    // Update photos list
    if (newPhotos.length > 0) {
      onPhotosChange([...currentPhotos, ...newPhotos]);
    }

    // Clear uploading state after a delay
    setTimeout(() => {
      setUploading([]);
    }, 1000);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (!canUpload) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [canUpload, clinicId, currentPhotos, maxPhotos, onPhotosChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteUrl) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/owner/clinics/${clinicId}/photos?url=${encodeURIComponent(deleteUrl)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Delete failed");
      }

      onPhotosChange(currentPhotos.filter((url) => url !== deleteUrl));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete photo");
    } finally {
      setIsDeleting(false);
      setDeleteUrl(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      {canUpload && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <label
                htmlFor="photo-upload"
                className="text-primary hover:underline cursor-pointer font-medium"
              >
                Click to upload
              </label>
              <span className="text-muted-foreground"> or drag and drop</span>
            </div>
            <p className="text-sm text-muted-foreground">
              JPEG, PNG, GIF, or WebP (max 5MB)
            </p>
            <p className="text-sm text-muted-foreground">
              {remainingSlots} of {maxPhotos} slots available
            </p>
          </div>
        </div>
      )}

      {/* Upload not available message */}
      {tier === "none" && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center border-muted-foreground/25">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Photo uploads require a Featured subscription
            </p>
            <Button variant="outline" asChild>
              <a href={`/my-clinics/${clinicId}/featured`}>Get Featured</a>
            </Button>
          </div>
        </div>
      )}

      {/* Limit reached message */}
      {tier !== "none" && remainingSlots <= 0 && (
        <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Photo limit reached
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {tier === "basic"
                  ? "Upgrade to Premium for up to 50 photos"
                  : "Maximum photos reached. Delete some to upload more."}
              </p>
              {tier === "basic" && (
                <Button variant="link" className="h-auto p-0 mt-1" asChild>
                  <a href={`/my-clinics/${clinicId}/featured`}>Upgrade to Premium</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-auto p-1"
              onClick={() => setError(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Uploading files */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
            >
              <div className="flex-shrink-0">
                {item.error ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : item.progress < 100 ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{item.file.name}</p>
                {item.error ? (
                  <p className="text-xs text-red-500">{item.error}</p>
                ) : (
                  <Progress value={item.progress} className="h-1 mt-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo grid */}
      {currentPhotos.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {currentPhotos.map((imageUrl, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <Image
                src={imageUrl}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                  Featured
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteUrl(imageUrl)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {currentPhotos.length === 0 && tier !== "none" && (
        <div className="text-center py-8 text-muted-foreground">
          <ImagePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No photos uploaded yet. Add some photos to showcase your clinic!</p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteUrl} onOpenChange={() => setDeleteUrl(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
