"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FeaturedImageUploadProps {
  imageUrl: string | null;
  imageAlt: string;
  onImageChange: (url: string | null, alt: string) => void;
  onUpload: (file: File) => Promise<string>;
}

export function FeaturedImageUpload({
  imageUrl,
  imageAlt,
  onImageChange,
  onUpload,
}: FeaturedImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be less than 10MB");
        return;
      }

      setError(null);
      setIsUploading(true);

      try {
        const url = await onUpload(file);
        onImageChange(url, imageAlt);
      } catch (err) {
        console.error("Failed to upload image:", err);
        setError("Failed to upload image. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, onImageChange, imageAlt]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemove = useCallback(() => {
    onImageChange(null, "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onImageChange]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Featured Image</label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {imageUrl ? (
        // Image preview
        <div className="space-y-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <Image
              src={imageUrl}
              alt={imageAlt || "Featured image preview"}
              fill
              className="object-cover"
              sizes="(max-width: 400px) 100vw, 400px"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove image</span>
            </Button>
          </div>

          {/* Alt text input */}
          <div className="space-y-2">
            <Label htmlFor="featured-image-alt" className="text-xs">
              Alt Text
            </Label>
            <Input
              id="featured-image-alt"
              value={imageAlt}
              onChange={(e) => onImageChange(imageUrl, e.target.value)}
              placeholder="Describe the image for accessibility"
              className="h-8 text-sm"
            />
          </div>

          {/* Replace button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            Replace Image
          </Button>
        </div>
      ) : (
        // Dropzone
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            isUploading && "pointer-events-none opacity-60"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                {isDragging ? (
                  <Upload className="h-6 w-6 text-primary" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isDragging ? "Drop image here" : "Click or drag to upload"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WebP up to 10MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
