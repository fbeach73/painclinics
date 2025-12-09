import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ClinicService, Service } from '@/types/service';
import { DynamicServiceIcon } from './service-icons';

interface FeaturedServicesProps {
  services: ClinicService[];
  className?: string;
  showDescriptions?: boolean;
}

/**
 * Display featured services for a clinic in a grid layout.
 * Shows large icons (64x64px) with name and optional description.
 * Used on clinic detail pages.
 */
export function FeaturedServices({
  services,
  className,
  showDescriptions = true,
}: FeaturedServicesProps) {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Featured Services</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((clinicService) => {
            const service = clinicService.service;
            if (!service) return null;

            return (
              <FeaturedServiceItem
                key={clinicService.id}
                service={service}
                showDescription={showDescriptions}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface FeaturedServiceItemProps {
  service: Service;
  showDescription?: boolean;
}

function FeaturedServiceItem({ service, showDescription = true }: FeaturedServiceItemProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center p-4 rounded-lg',
        'bg-muted/50 hover:bg-muted transition-colors'
      )}
    >
      <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-primary/10 text-primary mb-3">
        <DynamicServiceIcon service={service} size="xl" />
      </div>
      <h3 className="font-medium text-sm mb-1">{service.name}</h3>
      {showDescription && service.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {service.description}
        </p>
      )}
    </div>
  );
}

interface FeaturedServicesCompactProps {
  services: ClinicService[];
  className?: string;
  max?: number;
}

/**
 * Compact version of featured services for card displays.
 * Shows smaller icons in a horizontal layout.
 */
export function FeaturedServicesCompact({
  services,
  className,
  max = 4,
}: FeaturedServicesCompactProps) {
  if (!services || services.length === 0) {
    return null;
  }

  const displayedServices = services.slice(0, max);
  const remainingCount = services.length - max;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {displayedServices.map((clinicService) => {
        const service = clinicService.service;
        if (!service) return null;

        return (
          <DynamicServiceIcon
            key={clinicService.id}
            service={service}
            size="md"
          />
        );
      })}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
