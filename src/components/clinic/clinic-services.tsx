import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServiceByType } from '@/data/services';
import { cn } from '@/lib/utils';
import type { ServiceType } from '@/types/clinic';
import { getServiceIcon } from './service-icons';

interface ClinicServicesProps {
  services: ServiceType[];
  className?: string;
}

export function ClinicServices({ services, className }: ClinicServicesProps) {
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
