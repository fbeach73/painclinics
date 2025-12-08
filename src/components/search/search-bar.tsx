'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onLocationClick?: () => void;
  placeholder?: string;
  size?: 'default' | 'large';
  className?: string;
  isLoadingLocation?: boolean;
}

export function SearchBar({
  value: controlledValue,
  onChange,
  onLocationClick,
  placeholder = 'Search clinics, services, or locations...',
  size = 'default',
  className,
  isLoadingLocation = false,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(controlledValue ?? '');
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Debounce the onChange callback
  useEffect(() => {
    if (!onChange) return;

    const timer = setTimeout(() => {
      onChange(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, onChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      // The actual onChange is debounced via useEffect
    },
    [controlledValue]
  );

  const inputHeight = size === 'large' ? 'h-12' : 'h-9';
  const iconSize = size === 'large' ? 'size-5' : 'size-4';
  const paddingLeft = size === 'large' ? 'pl-12' : 'pl-10';
  const paddingRight = size === 'large' ? 'pr-12' : 'pr-10';
  const textSize = size === 'large' ? 'text-base md:text-lg' : 'text-sm md:text-base';

  return (
    <div className={cn('relative w-full', className)}>
      {/* Search icon */}
      <div
        className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none',
          size === 'large' && 'left-4'
        )}
      >
        <Search className={iconSize} />
      </div>

      {/* Input */}
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(inputHeight, paddingLeft, paddingRight, textSize)}
      />

      {/* Location button */}
      <div
        className={cn(
          'absolute right-1 top-1/2 -translate-y-1/2',
          size === 'large' && 'right-1.5'
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size={size === 'large' ? 'default' : 'sm'}
          onClick={onLocationClick}
          disabled={isLoadingLocation}
          className="h-7 px-2"
          title="Use my location"
        >
          {isLoadingLocation ? (
            <Loader2 className={cn(iconSize, 'animate-spin')} />
          ) : (
            <MapPin className={iconSize} />
          )}
        </Button>
      </div>
    </div>
  );
}
