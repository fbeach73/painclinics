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
  Radio,
  Droplet,
  Bone,
  Circle,
  Waves,
  Scan,
  ClipboardList,
  Gauge,
  MessageCircle,
  Monitor,
  Moon,
  Briefcase,
  Spline,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { getServiceByType } from '@/data/services';
import { cn } from '@/lib/utils';
import type { ServiceType } from '@/types/clinic';
import type { Service, ClinicService } from '@/types/service';

// Map of icon names to Lucide icon components
// Supports all icons used in the services seed data
const iconNameMap: Record<string, LucideIcon> = {
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
  Radio,
  Droplet,
  Bone,
  Circle,
  Waves,
  Scan,
  ClipboardList,
  Gauge,
  MessageCircle,
  Monitor,
  Moon,
  Briefcase,
  Spline,
};

// Legacy mapping for ServiceType (backward compatibility)
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

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-8 w-8',
};

// ============================================
// Legacy Components (for backward compatibility)
// ============================================

interface ServiceIconProps {
  type: ServiceType;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

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
  size?: 'sm' | 'md' | 'lg' | 'xl';
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

// ============================================
// New Dynamic Components (database-driven)
// ============================================

/**
 * Get the Lucide icon component for a given icon name.
 * Falls back to HelpCircle if the icon is not found.
 */
export function getIconByName(iconName: string): LucideIcon {
  return iconNameMap[iconName] || HelpCircle;
}

interface DynamicServiceIconProps {
  service: Service;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Render an icon for a Service object from the database.
 */
export function DynamicServiceIcon({
  service,
  className,
  showLabel = false,
  size = 'md',
}: DynamicServiceIconProps) {
  // Get the icon component - using the map directly to avoid component creation during render
  const IconComponent = iconNameMap[service.iconName] || HelpCircle;

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      title={service.name}
    >
      <IconComponent className={sizeClasses[size]} />
      {showLabel && <span className="text-sm">{service.name}</span>}
    </span>
  );
}

interface DynamicServiceIconsProps {
  services: (Service | ClinicService)[];
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabels?: boolean;
}

/**
 * Render a list of service icons from database Service or ClinicService objects.
 * Handles both direct Service objects and ClinicService objects with nested service.
 */
export function DynamicServiceIcons({
  services,
  max = 4,
  className,
  size = 'md',
  showLabels = false,
}: DynamicServiceIconsProps) {
  const displayedServices = services.slice(0, max);
  const remainingCount = services.length - max;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {displayedServices.map((item) => {
        // Handle both Service and ClinicService types
        const service = 'service' in item && item.service ? item.service : (item as Service);
        if (!service || !service.iconName) return null;

        return (
          <DynamicServiceIcon
            key={service.id}
            service={service}
            size={size}
            showLabel={showLabels}
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
