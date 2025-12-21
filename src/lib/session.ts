/**
 * Server Component Auth Helpers
 *
 * Use these functions in Server Components (pages, layouts) for:
 * - requireAuth() - Redirect to home if not authenticated
 * - requireAdmin() - Redirect if not admin
 * - requireOwner() - Redirect if not clinic owner or admin
 * - requireClinicOwnership() - Verify user owns specific clinic
 * - getOptionalSession() - Get session without requiring auth
 *
 * For API Routes, use @/lib/admin-auth instead.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
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
 * Owner-protected routes that require clinic_owner or admin role.
 */
export const ownerRoutes = ["/my-clinics"];

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

/**
 * Checks if a given path is an owner route.
 *
 * @param path - The path to check
 * @returns True if the path requires owner role
 */
export function isOwnerRoute(path: string): boolean {
  return ownerRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

/**
 * Checks if the current request is authenticated and has clinic_owner or admin role.
 * Should be called in Server Components for owner-protected routes.
 *
 * @returns The session object with user data if owner or admin
 * @throws Redirects to /unauthorized if not owner/admin, or home if not authenticated
 */
export async function requireOwner() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  // Fetch user from database to get role
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
  });

  if (!user || !["admin", "clinic_owner"].includes(user.role)) {
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

/**
 * Checks if the current request is authenticated and owns the specified clinic.
 * Admins can access any clinic.
 * Should be called in Server Components for clinic-specific owner routes.
 *
 * @param clinicId - The clinic ID to check ownership for
 * @returns The session object and clinic if authorized
 * @throws Redirects to /unauthorized if not owner of clinic, or home if not authenticated
 */
export async function requireClinicOwnership(clinicId: string) {
  const session = await requireOwner();

  const clinic = await db.query.clinics.findFirst({
    where: and(
      eq(schema.clinics.id, clinicId),
      eq(schema.clinics.ownerUserId, session.user.id)
    ),
  });

  // Admins can access any clinic
  if (!clinic && session.user.role !== "admin") {
    redirect("/unauthorized");
  }

  // If admin but not owner, fetch the clinic anyway
  const clinicData =
    clinic ||
    (await db.query.clinics.findFirst({
      where: eq(schema.clinics.id, clinicId),
    }));

  if (!clinicData) {
    redirect("/my-clinics");
  }

  return { session, clinic: clinicData };
}
