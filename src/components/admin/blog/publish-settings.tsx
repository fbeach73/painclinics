"use client";

import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, RefreshCw, Link as LinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { generateSlug } from "@/lib/slug";

export type PostStatus = "draft" | "published" | "archived";

interface PublishSettingsProps {
  status: PostStatus;
  slug: string;
  publishedAt: Date | null;
  onStatusChange: (status: PostStatus) => void;
  onSlugChange: (slug: string) => void;
  onPublishedAtChange: (date: Date | null) => void;
  title: string; // For auto-generating slug
  isNewPost: boolean;
}

export function PublishSettings({
  status,
  slug,
  publishedAt,
  onStatusChange,
  onSlugChange,
  onPublishedAtChange,
  title,
  isNewPost,
}: PublishSettingsProps) {
  const [autoSlug, setAutoSlug] = useState(isNewPost);
  const [time, setTime] = useState(() => {
    if (publishedAt) {
      return format(publishedAt, "HH:mm");
    }
    return format(new Date(), "HH:mm");
  });

  // Auto-generate slug from title when enabled
  useEffect(() => {
    if (autoSlug && title) {
      onSlugChange(generateSlug(title));
    }
  }, [autoSlug, title, onSlugChange]);

  const handleSlugChange = useCallback(
    (value: string) => {
      setAutoSlug(false);
      // Sanitize slug as user types
      const sanitized = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-");
      onSlugChange(sanitized);
    },
    [onSlugChange]
  );

  const handleRegenerateSlug = useCallback(() => {
    if (title) {
      setAutoSlug(true);
      onSlugChange(generateSlug(title));
    }
  }, [title, onSlugChange]);

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        onPublishedAtChange(null);
        return;
      }

      // Combine date with current time
      const timeParts = time.split(":").map(Number);
      const hours = timeParts[0] ?? 0;
      const minutes = timeParts[1] ?? 0;
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      onPublishedAtChange(newDate);
    },
    [time, onPublishedAtChange]
  );

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = e.target.value;
      setTime(newTime);

      if (publishedAt && newTime) {
        const timeParts = newTime.split(":").map(Number);
        const hours = timeParts[0] ?? 0;
        const minutes = timeParts[1] ?? 0;
        const newDate = new Date(publishedAt);
        newDate.setHours(hours, minutes, 0, 0);
        onPublishedAtChange(newDate);
      }
    },
    [publishedAt, onPublishedAtChange]
  );

  // Determine if the post is scheduled
  const isScheduled =
    status === "published" && publishedAt && new Date(publishedAt) > new Date();

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        {isScheduled && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            This post is scheduled for future publication
          </p>
        )}
      </div>

      {/* Publish Date */}
      <div className="space-y-2">
        <Label>Publish Date</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !publishedAt && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {publishedAt ? format(publishedAt, "MMM d, yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={publishedAt || undefined}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            value={time}
            onChange={handleTimeChange}
            className="w-24"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Set a future date to schedule publication
        </p>
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>URL Slug</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleRegenerateSlug}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Regenerate
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground flex-shrink-0">
            <LinkIcon className="h-4 w-4 inline-block mr-1" />
            /blog/
          </span>
          <Input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="post-url-slug"
            className="font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}
