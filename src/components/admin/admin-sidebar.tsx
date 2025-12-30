"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, Home, LayoutDashboard, Settings, Database, BarChart3, Grid3X3, Shield, CreditCard, Mail, FileText, PenSquare, Link2, Activity, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/import", label: "Data Import", icon: Upload },
  { href: "/admin/clinics", label: "Clinics", icon: Database },
  { href: "/admin/services", label: "Services", icon: Grid3X3 },
  { href: "/admin/url-validation", label: "URL Validation", icon: Link2 },
  { href: "/admin/blog/migration", label: "Blog Migration", icon: FileText },
  { href: "/admin/blog", label: "Blog Posts", icon: PenSquare },
  { href: "/admin/claims", label: "Claims", icon: Shield },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/stats", label: "Site Stats", icon: Activity },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/broadcasts", label: "Broadcasts", icon: Send },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-background border-r min-h-screen flex flex-col">
      <div className="p-6 border-b">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold">Admin Panel</span>
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
      <div className="p-4 border-t">
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
