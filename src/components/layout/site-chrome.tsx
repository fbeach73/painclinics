"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Wraps site chrome (header, footer, ads) and hides it on standalone pages
 * like /consult that have their own full-screen UI.
 */
const HIDDEN_PATHS = ["/consult"];

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHidden = HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isHidden) return null;

  return <>{children}</>;
}
