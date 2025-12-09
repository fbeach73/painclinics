import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServiceByType } from '@/data/services';
import { cn } from '@/lib/utils';
import type { ServiceType } from '@/types/clinic';
import type { ClinicService, Service } from '@/types/service';
import { getServiceIcon, DynamicServiceIcon } from './service-icons';

// ============================================
// Legacy Component (for backward compatibility)
// ============================================

interface ClinicServicesLegacyProps {
  services: ServiceType[];
  className?: string;
}

export function ClinicServicesLegacy({ services, className }: ClinicServicesLegacyProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Services Offered</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((serviceType) => {
            const service = getServiceByType(serviceType);
            const Icon = getServiceIcon(serviceType);

            if (!service || !Icon) return null;

            return (
              <div
                key={serviceType}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg',
                  'bg-muted/50 hover:bg-muted transition-colors'
                )}
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{service.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {service.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// New Database-Driven Component
// ============================================

interface ClinicServicesProps {
  services: ClinicService[];
  className?: string;
}

/**
 * Display all services for a clinic from the database.
 * Shows services in a grid with icons, names, and descriptions.
 */
export function ClinicServices({ services, className }: ClinicServicesProps) {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Services Offered</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((clinicService) => {
            const service = clinicService.service;
            if (!service) return null;

            return (
              <ClinicServiceItem key={clinicService.id} service={service} />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface ClinicServiceItemProps {
  service: Service;
}

function ClinicServiceItem({ service }: ClinicServiceItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        'bg-muted/50 hover:bg-muted transition-colors'
      )}
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0">
        <DynamicServiceIcon service={service} size="lg" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm">{service.name}</p>
        {service.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {service.description}
          </p>
        )}
      </div>
    </div>
  );
}
