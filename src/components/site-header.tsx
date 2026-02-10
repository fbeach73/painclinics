'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu } from 'lucide-react';
import { UserProfile } from '@/components/auth/user-profile';
import { SearchBar } from './search/search-bar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { ModeToggle } from './ui/mode-toggle';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './ui/navigation-menu';
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
      router.push(`/pain-management?q=${encodeURIComponent(value.trim())}`);
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
          className="container mx-auto px-4 py-4 flex items-center gap-4"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <h1 className="text-xl font-bold shrink-0">
            <Link
              href="/"
              className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors"
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

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/pain-tracking">
                    Pain Tracking
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/pain-relief-tool">
                    Pain Relief Tool
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[300px] gap-1 p-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/blog"
                          className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium">Blog</div>
                          <p className="text-xs text-muted-foreground">Latest articles on pain management</p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/clinics"
                          className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium">Browse Clinics</div>
                          <p className="text-xs text-muted-foreground">Find pain clinics near you</p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/treatment-options"
                          className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium">Treatment Options</div>
                          <p className="text-xs text-muted-foreground">Explore pain treatment methods</p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Desktop search bar - shrunk */}
          <div className="hidden md:flex flex-1 max-w-sm mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search clinics..."
              size="default"
              className="w-full"
            />
          </div>

          {/* Mobile Navigation Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild className="py-3">
                <Link href="/pain-tracking">Pain Tracking</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="py-3">
                <Link href="/pain-relief-tool">Pain Relief Tool</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="py-3">
                <Link href="/blog">Blog</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="py-3">
                <Link href="/clinics">Browse Clinics</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="py-3">
                <Link href="/treatment-options">Treatment Options</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="py-3">
                <Link href="/for-clinics" className="text-featured-foreground font-medium">
                  Get Featured
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Actions */}
          <div className="flex items-center gap-2" role="group" aria-label="User actions">
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
