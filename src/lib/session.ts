import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * Protected routes that require authentication.
 * These are also configured in src/proxy.ts for optimistic redirects.
 */
export const protectedRoutes = ["/chat", "/dashboard", "/profile"];

/**
 * Admin-protected routes that require admin role.
 */
export const adminRoutes = ["/admin"];

/**
 * Checks if the current request is authenticated.
 * Should be called in Server Components for protected routes.
 *
 * @returns The session object if authenticated
 * @throws Redirects to home page if not authenticated
 */
export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  return session;
}

/**
 * Gets the current session without requiring authentication.
 * Returns null if not authenticated.
 *
 * @returns The session object or null
 */
export async function getOptionalSession() {
  return await auth.api.getSession({ headers: await headers() });
}

/**
 * Checks if a given path is a protected route.
 *
 * @param path - The path to check
 * @returns True if the path requires authentication
 */
export function isProtectedRoute(path: string): boolean {
  return protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

/**
 * Checks if a given path is an admin route.
 *
 * @param path - The path to check
 * @returns True if the path requires admin role
 */
export function isAdminRoute(path: string): boolean {
  return adminRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

/**
 * Checks if the current request is authenticated and has admin role.
 * Should be called in Server Components for admin-protected routes.
 *
 * @returns The session object with user data if admin
 * @throws Redirects to /unauthorized if not admin, or home if not authenticated
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  // Fetch user from database to get role
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
  });

  if (user?.role !== "admin") {
    redirect("/unauthorized");
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: user.role,
    },
  };
}
