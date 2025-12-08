'use client';

import Link from 'next/link';
import {
  X,
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
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
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

interface ClinicPopupProps {
  clinic: ClinicWithDistance;
  onClose: () => void;
}

export function ClinicPopup({ clinic, onClose }: ClinicPopupProps) {
  const displayServices = clinic.services.slice(0, 3);

  return (
    <Card className="w-72 shadow-lg">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link
              href={`/clinics/${clinic.slug}`}
              className="font-semibold text-sm hover:text-primary line-clamp-2"
            >
              {clinic.name}
            </Link>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{clinic.rating}</span>
              <span className="text-xs text-muted-foreground">
                ({clinic.reviewCount})
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{clinic.address.formatted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{clinic.phone}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {clinic.distanceFormatted}
          </Badge>
          <div className="flex items-center gap-1">
            {displayServices.map((serviceType) => {
              const service = getServiceByType(serviceType);
              if (!service) return null;
              const IconComponent = iconMap[service.iconName];
              if (!IconComponent) return null;
              return (
                <div
                  key={serviceType}
                  className="h-6 w-6 rounded-full bg-muted flex items-center justify-center"
                  title={service.name}
                >
                  <IconComponent className="h-3 w-3 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </div>

        <Button asChild className="w-full" size="sm">
          <Link href={`/clinics/${clinic.slug}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
