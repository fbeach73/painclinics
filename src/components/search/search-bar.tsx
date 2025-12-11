'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, MapPin, Loader2, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  city: string;
  stateAbbreviation: string | null;
  permalink: string;
  rating: number | null;
  reviewCount: number | null;
  isFeatured: boolean | null;
}

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onLocationClick?: () => void;
  placeholder?: string;
  size?: 'default' | 'large';
  className?: string;
  isLoadingLocation?: boolean;
  showDropdown?: boolean;
}

export function SearchBar({
  value: controlledValue,
  onChange,
  onLocationClick,
  placeholder = 'Search clinics, services, or locations...',
  size = 'default',
  className,
  isLoadingLocation = false,
  showDropdown = true,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(controlledValue ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Search for results when value changes (after 3 characters)
  useEffect(() => {
    if (!showDropdown) return;

    const searchValue = value.trim();

    if (searchValue.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchValue)}`,
          { signal: controller.signal }
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setIsOpen((data.results || []).length > 0);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Search error:', error);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (e.key === 'Enter' && value.trim()) {
        setIsOpen(false);
        onChange?.(value);
      }
    },
    [value, onChange]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      } else {
        onChange?.(newValue);
      }
    },
    [controlledValue, onChange]
  );

  const handleResultClick = () => {
    setIsOpen(false);
  };

  const handleFocus = () => {
    if (results.length > 0 && value.trim().length >= 3) {
      setIsOpen(true);
    }
  };

  const inputHeight = size === 'large' ? 'h-12' : 'h-9';
  const iconSize = size === 'large' ? 'size-5' : 'size-4';
  const paddingLeft = size === 'large' ? 'pl-12' : 'pl-10';
  const paddingRight = size === 'large' ? 'pr-12' : 'pr-10';
  const textSize = size === 'large' ? 'text-base md:text-lg' : 'text-sm md:text-base';

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Search icon */}
      <div
        className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10',
          size === 'large' && 'left-4'
        )}
      >
        {isSearching ? (
          <Loader2 className={cn(iconSize, 'animate-spin')} />
        ) : (
          <Search className={iconSize} />
        )}
      </div>

      {/* Input */}
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={cn(inputHeight, paddingLeft, paddingRight, textSize)}
        autoComplete="off"
      />

      {/* Location button */}
      <div
        className={cn(
          'absolute right-1 top-1/2 -translate-y-1/2 z-10',
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

      {/* Dropdown results */}
      {showDropdown && isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-2 max-h-[400px] overflow-y-auto">
            {results.map((result) => (
              <Link
                key={result.id}
                href={`/${result.permalink}/`}
                onClick={handleResultClick}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {result.title}
                    </span>
                    {result.isFeatured && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {result.city}, {result.stateAbbreviation}
                    </span>
                    {result.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {result.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
              </Link>
            ))}
          </div>
          {value.trim().length >= 3 && (
            <div className="border-t border-border px-4 py-2">
              <Link
                href={`/clinics?q=${encodeURIComponent(value.trim())}`}
                onClick={handleResultClick}
                className="text-sm text-primary hover:underline"
              >
                See all results for &ldquo;{value.trim()}&rdquo;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
