"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, FileIcon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Maximum file size: 5MB per file
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Maximum total attachments
const MAX_ATTACHMENTS = 5;

// Allowed file types
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".txt", ".csv", ".doc", ".docx"];

export interface Attachment {
  url: string;
  filename: string;
  size: number;
}

interface AttachmentUploaderProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}

export function AttachmentUploader({ attachments, onChange }: AttachmentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file extension icon class
  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "text-red-500";
      case "doc":
      case "docx":
        return "text-blue-500";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return "text-green-500";
      case "csv":
      case "txt":
        return "text-gray-500";
      default:
        return "text-muted-foreground";
    }
  };

  // Validate file
  const validateFile = useCallback(
    (file: File): string | null => {
      if (attachments.length >= MAX_ATTACHMENTS) {
        return `Maximum ${MAX_ATTACHMENTS} attachments allowed`;
      }

      if (file.size > MAX_FILE_SIZE) {
        return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
      }

      // Check for duplicate filename
      if (attachments.some((a) => a.filename === file.name)) {
        return "A file with this name is already attached";
      }

      return null;
    },
    [attachments]
  );

  // Upload file to storage
  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        // Use the dedicated broadcast upload endpoint
        const response = await fetch("/api/admin/broadcasts/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to upload file");
        }

        const data = await response.json();

        const newAttachment: Attachment = {
          url: data.url,
          filename: file.name,
          size: file.size,
        };

        onChange([...attachments, newAttachment]);
      } catch (err) {
        console.error("Upload error:", err);
        setError(err instanceof Error ? err.message : "Failed to upload file");
      } finally {
        setIsUploading(false);
      }
    },
    [attachments, onChange, validateFile]
  );

  // Handle file input change
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      // Upload first file (can extend to support multiple)
      const file = files[0];
      if (file) {
        uploadFile(file);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadFile]
  );

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0 && files[0]) {
        uploadFile(files[0]);
      }
    },
    [uploadFile]
  );

  // Remove attachment
  const removeAttachment = useCallback(
    (index: number) => {
      const newAttachments = attachments.filter((_, i) => i !== index);
      onChange(newAttachments);
    },
    [attachments, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isUploading && "opacity-50 pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading || attachments.length >= MAX_ATTACHMENTS}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachments.length >= MAX_ATTACHMENTS}
              >
                Click to upload
              </Button>
              <span className="text-sm text-muted-foreground">
                {" "}or drag and drop
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, images, Word, CSV, TXT (max {formatFileSize(MAX_FILE_SIZE)})
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Attachment list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileIcon className={cn("h-5 w-5 shrink-0", getFileIcon(attachment.filename))} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Attachment count */}
      <p className="text-xs text-muted-foreground text-right">
        {attachments.length} / {MAX_ATTACHMENTS} attachments
      </p>
    </div>
  );
}
