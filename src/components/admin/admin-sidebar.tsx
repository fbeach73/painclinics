"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Upload,
  Home,
  LayoutDashboard,
  Settings,
  Database,
  BarChart3,
  Grid3X3,
  Shield,
  CreditCard,
  Mail,
  PenSquare,
  Activity,
  Send,
  RotateCw,
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Megaphone,
  BookOpen,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/import", label: "Data Import", icon: Upload },
  { href: "/admin/clinics", label: "Clinics", icon: Database },
  { href: "/admin/services", label: "Services", icon: Grid3X3 },
  { href: "/admin/blog", label: "Blog Posts", icon: PenSquare },
  { href: "/admin/guides", label: "Guides", icon: BookOpen },
  { href: "/admin/claims", label: "Claims", icon: Shield },
  { href: "/admin/leads", label: "Leads", icon: MessageSquare },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/users", label: "User Activity", icon: UserCheck },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/ads", label: "Ads", icon: Megaphone },
  { href: "/admin/stats", label: "Site Stats", icon: Activity },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/broadcasts", label: "Broadcasts", icon: Send },
  { href: "/admin/rotation", label: "Rotation", icon: RotateCw },
  { href: "/admin/billing", label: "DB Billing", icon: DollarSign },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

function getStoredCollapsedState(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const storedCollapsed = useRef<boolean | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync with localStorage after mount
  useEffect(() => {
    const stored = getStoredCollapsedState();
    storedCollapsed.current = stored;
    if (stored !== isCollapsed) {
      setIsCollapsed(stored);
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCollapsed = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
  };

  // Avoid hydration mismatch - render expanded state initially
  if (!mounted) {
    return (
      <aside className="w-64 bg-background border-r min-h-screen flex flex-col">
        <div className="p-6 border-b">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 flex-shrink-0">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold">Admin Panel</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            Back to Site
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "bg-background border-r min-h-screen flex flex-col transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("p-6 border-b", isCollapsed && "p-4")}>
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 flex-shrink-0">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          {!isCollapsed && <span className="font-semibold">Admin Panel</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 p-4 space-y-1", isCollapsed && "p-2")}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn("p-4 border-t", isCollapsed && "p-2")}>
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Back to Site" : undefined}
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && "Back to Site"}
        </Link>
      </div>

      {/* Collapse toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapsed}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </aside>
  );
}
