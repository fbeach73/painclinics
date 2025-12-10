"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileCheck, Home, LayoutDashboard, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/my-clinics", label: "My Clinics", icon: Building2 },
  { href: "/my-clinics/claims", label: "Claim Status", icon: FileCheck },
];

export function OwnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-background border-r min-h-screen flex flex-col">
      <div className="p-6 border-b">
        <Link href="/my-clinics" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold">Owner Dashboard</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t space-y-1">
        <Link
          href="/my-clinics"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-950/30 transition-colors"
        >
          <Star className="h-4 w-4" />
          Upgrade to Featured
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Site
        </Link>
      </div>
    </aside>
  );
}
