import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CostLevel } from '@/types/pain-relief';

interface CostIndicatorProps {
  cost: CostLevel;
  showLabel?: boolean;
  className?: string;
}

const costLabels: Record<CostLevel, string> = {
  $: 'Low cost',
  $$: 'Moderate cost',
  $$$: 'Higher cost',
};

export function CostIndicator({ cost, showLabel = false, className }: CostIndicatorProps) {
  const dollarCount = cost.length;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {[1, 2, 3].map((level) => (
          <DollarSign
            key={level}
            className={cn(
              'h-4 w-4 -mx-0.5',
              level <= dollarCount
                ? 'text-green-600 dark:text-green-500'
                : 'text-slate-300 dark:text-slate-600'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground ml-1">{costLabels[cost]}</span>
      )}
    </div>
  );
}
