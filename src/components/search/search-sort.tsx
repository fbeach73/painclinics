'use client';

import { ArrowUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { SearchFilters } from '@/types/clinic';

type SortOption = SearchFilters['sortBy'];

interface SearchSortProps {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  className?: string;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'distance', label: 'Nearest' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name', label: 'A-Z' },
];

export function SearchSort({ sortBy, onSortChange, className }: SearchSortProps) {
  const currentLabel = sortOptions.find((opt) => opt.value === sortBy)?.label || 'Sort';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn('min-w-[120px]', className)}>
          <ArrowUpDown className="size-4 mr-2" />
          {currentLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className="flex items-center justify-between"
          >
            {option.label}
            {sortBy === option.value && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
