'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DirectorySearchInputProps {
  initialQuery?: string | undefined;
}

export function DirectorySearchInput({ initialQuery }: DirectorySearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      router.push(`/pain-management?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    }
  }

  function handleClear() {
    setQuery('');
    router.push('/pain-management', { scroll: false });
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl mx-auto">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <Search className="h-5 w-5" />
      </div>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search clinics by name, city, or zip code..."
        className="h-12 pl-11 pr-20 text-base"
        autoComplete="off"
      />
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {query.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 w-8 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button type="submit" size="sm" className="h-8">
          Search
        </Button>
      </div>
    </form>
  );
}
