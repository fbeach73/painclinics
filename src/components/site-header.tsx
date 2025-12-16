'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { UserProfile } from '@/components/auth/user-profile';
import { SearchBar } from './search/search-bar';
import { Button } from './ui/button';
import { ModeToggle } from './ui/mode-toggle';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';

export function SiteHeader() {
  const router = useRouter();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      router.push(`/clinics?q=${encodeURIComponent(value.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:rounded-md"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="banner">
        <nav
          className="container mx-auto px-4 py-3 flex items-center gap-4"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <h1 className="text-xl font-bold shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              aria-label="Pain Clinics - Go to homepage"
            >
              <Image
                src="/logo.png"
                alt="Pain Clinics"
                width={36}
                height={36}
                className="rounded-lg"
                priority
              />
              <span className="hidden sm:inline bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Pain Clinics
              </span>
            </Link>
          </h1>

          {/* Desktop search bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search clinics, services, or locations..."
              size="default"
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto" role="group" aria-label="User actions">
            {/* Mobile search button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <UserProfile />
            <ModeToggle />
          </div>
        </nav>
      </header>

      {/* Mobile search sheet */}
      <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <SheetContent side="top" className="h-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Search</SheetTitle>
            <SheetDescription>Search for pain clinics, services, or locations</SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search clinics, services, or locations..."
              size="large"
              className="w-full"
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
