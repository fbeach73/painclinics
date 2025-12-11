'use client';

import Link from 'next/link';
import {
  Star,
  MapPin,
  Phone,
  Syringe,
  Activity,
  Pill,
  Zap,
  Cpu,
  Leaf,
  Target,
  Hand,
  Sparkles,
  Brain,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getServiceByType } from '@/data/services';
import type { ClinicWithDistance } from '@/types/clinic';

const iconMap: Record<string, LucideIcon> = {
  Syringe,
  Activity,
  Pill,
  Zap,
  Cpu,
  Leaf,
  Target,
  Hand,
  Sparkles,
  Brain,
};

interface ClinicDialogProps {
  clinic: ClinicWithDistance | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Dialog-based clinic details popup.
 * Renders as a centered modal to avoid clipping issues with map popups.
 */
export function ClinicDialog({ clinic, isOpen, onClose }: ClinicDialogProps) {
  if (!clinic) return null;

  const displayServices = clinic.services.slice(0, 4);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-left pr-8">
            <Link
              href={`/pain-management/${clinic.slug}/`}
              className="hover:text-primary transition-colors"
            >
              {clinic.name}
            </Link>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{clinic.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({clinic.reviewCount} reviews)
              </span>
            </div>
            <Badge variant="secondary">{clinic.distanceFormatted}</Badge>
          </div>

          {/* Address and Phone */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{clinic.address.formatted}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <a
                href={`tel:${clinic.phone}`}
                className="text-primary hover:underline"
              >
                {clinic.phone}
              </a>
            </div>
          </div>

          {/* Services */}
          {displayServices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displayServices.map((serviceType) => {
                const service = getServiceByType(serviceType);
                if (!service) return null;
                const IconComponent = iconMap[service.iconName];
                return (
                  <div
                    key={serviceType}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs"
                    title={service.name}
                  >
                    {IconComponent && (
                      <IconComponent className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-muted-foreground">{service.name}</span>
                  </div>
                );
              })}
              {clinic.services.length > 4 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{clinic.services.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button asChild className="flex-1">
              <Link href={`/pain-management/${clinic.slug}/`}>View Details</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href={`tel:${clinic.phone}`}>
                <Phone className="h-4 w-4 mr-2" />
                Call
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
