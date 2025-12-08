import {
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
import { getServiceByType } from '@/data/services';
import { cn } from '@/lib/utils';
import type { ServiceType } from '@/types/clinic';

const serviceIconMap: Record<ServiceType, LucideIcon> = {
  'injection-therapy': Syringe,
  'physical-therapy': Activity,
  'medication-management': Pill,
  'nerve-blocks': Zap,
  'spinal-cord-stimulation': Cpu,
  'regenerative-medicine': Leaf,
  'acupuncture': Target,
  'chiropractic': Hand,
  'massage-therapy': Sparkles,
  'psychological-services': Brain,
};

interface ServiceIconProps {
  type: ServiceType;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function ServiceIcon({
  type,
  className,
  showLabel = false,
  size = 'md',
}: ServiceIconProps) {
  const Icon = serviceIconMap[type];
  const service = getServiceByType(type);

  if (!Icon || !service) return null;

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      title={service.name}
    >
      <Icon className={sizeClasses[size]} />
      {showLabel && <span className="text-sm">{service.name}</span>}
    </span>
  );
}

interface ServiceIconsProps {
  services: ServiceType[];
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export function ServiceIcons({
  services,
  max = 4,
  className,
  size = 'md',
  showLabels = false,
}: ServiceIconsProps) {
  const displayedServices = services.slice(0, max);
  const remainingCount = services.length - max;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {displayedServices.map((service) => (
        <ServiceIcon
          key={service}
          type={service}
          size={size}
          showLabel={showLabels}
        />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}

export function getServiceIcon(type: ServiceType): LucideIcon | undefined {
  return serviceIconMap[type];
}
