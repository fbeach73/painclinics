"use client";

import * as React from "react";
import { List, X, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
}

interface TocListProps {
  items: TocItem[];
  activeId: string | null;
  onItemClick: (id: string) => void;
}

function TocList({ items, activeId, onItemClick }: TocListProps) {
  return (
    <nav aria-label="Table of contents">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onItemClick(item.id)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeId === item.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface FloatingTocProps {
  contentSelector?: string;
}

export function FloatingToc({ contentSelector = ".prose" }: FloatingTocProps) {
  const [tocItems, setTocItems] = React.useState<TocItem[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isVisible, setIsVisible] = React.useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const lastScrollY = React.useRef(0);

  // Extract H2 headings and add IDs on mount
  React.useEffect(() => {
    setIsMounted(true);

    const container = document.querySelector(contentSelector);
    if (!container) return;

    const headings = container.querySelectorAll("h2");
    const items: TocItem[] = [];

    headings.forEach((heading, index) => {
      // Generate ID if not present
      if (!heading.id) {
        const slug =
          heading.textContent
            ?.toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 50) || `section-${index}`;
        heading.id = slug;
      }

      items.push({
        id: heading.id,
        text: heading.textContent || `Section ${index + 1}`,
      });
    });

    setTocItems(items);
  }, [contentSelector]);

  // Track active section based on scroll position
  React.useEffect(() => {
    if (tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0% -70% 0%",
        threshold: 0,
      }
    );

    tocItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [tocItems]);

  // Hide/show on scroll direction
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Only hide/show after scrolling past 200px
      if (currentScrollY < 200) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Show when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current + 50) {
        // Add threshold to prevent flickering
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = React.useCallback(
    (id: string) => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80; // Account for fixed header
        const top =
          element.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
        setIsPopoverOpen(false);
        setIsSheetOpen(false);
      }
    },
    []
  );

  // Don't render until mounted and headings found
  if (!isMounted || tocItems.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40 transition-all duration-300",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-16 opacity-0 pointer-events-none"
      )}
    >
      {/* Desktop: Popover */}
      <div className="hidden md:block">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow border border-border/50"
              aria-label="Table of contents"
            >
              <List className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-72 p-0"
            sideOffset={12}
          >
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-sm">Contents</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsPopoverOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              <TocList
                items={tocItems}
                activeId={activeId}
                onItemClick={scrollToSection}
              />
            </div>
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setIsPopoverOpen(false);
                }}
              >
                <ChevronUp className="h-3 w-3 mr-1" />
                Back to top
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile: Sheet */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow border border-border/50"
              aria-label="Table of contents"
            >
              <List className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]">
            <SheetHeader>
              <SheetTitle>Contents</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto flex-1 py-4">
              <TocList
                items={tocItems}
                activeId={activeId}
                onItemClick={scrollToSection}
              />
            </div>
            <div className="border-t pt-4 pb-2">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setIsSheetOpen(false);
                }}
              >
                <ChevronUp className="h-4 w-4 mr-2" />
                Back to top
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
