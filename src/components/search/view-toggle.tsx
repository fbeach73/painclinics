'use client';

import { LayoutGrid, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'list' | 'map';

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-muted rounded-md', className)}>
      <Button
        variant={view === 'list' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className={cn(
          'h-7 px-2.5',
          view === 'list' && 'shadow-sm'
        )}
        title="List view"
      >
        <LayoutGrid className="size-4" />
        <span className="sr-only md:not-sr-only md:ml-1.5">List</span>
      </Button>
      <Button
        variant={view === 'map' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('map')}
        className={cn(
          'h-7 px-2.5',
          view === 'map' && 'shadow-sm'
        )}
        title="Map view"
      >
        <Map className="size-4" />
        <span className="sr-only md:not-sr-only md:ml-1.5">Map</span>
      </Button>
    </div>
  );
}
