'use client';

import { useState } from 'react';
import { ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ClinicGalleryProps {
  photos: string[];
  clinicName: string;
  className?: string;
}

export function ClinicGallery({ photos, clinicName, className }: ClinicGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Use placeholder images if no photos provided
  const displayPhotos = photos.length > 0 ? photos : Array(4).fill(null);

  const handlePrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + displayPhotos.length) % displayPhotos.length);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % displayPhotos.length);
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {displayPhotos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden',
                  'bg-muted hover:opacity-80 transition-opacity',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                )}
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt={`${clinicName} photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0" showCloseButton={false}>
          <DialogTitle className="sr-only">
            {clinicName} photo {selectedIndex !== null ? selectedIndex + 1 : ''}
          </DialogTitle>
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/20 hover:bg-black/40 text-white"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>

            {/* Image display */}
            <div className="aspect-video bg-muted flex items-center justify-center">
              {selectedIndex !== null && displayPhotos[selectedIndex] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayPhotos[selectedIndex]}
                  alt={`${clinicName} photo ${selectedIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-16 w-16" />
                  <span>Photo placeholder</span>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            {displayPhotos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                  <span className="sr-only">Previous photo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-6 w-6" />
                  <span className="sr-only">Next photo</span>
                </Button>
              </>
            )}

            {/* Photo counter */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
              {selectedIndex !== null ? selectedIndex + 1 : 0} / {displayPhotos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
