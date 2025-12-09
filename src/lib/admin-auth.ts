import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export type AdminCheckResult =
  | { error: string; status: 401 | 403 }
  | {
      session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
      user: typeof schema.user.$inferSelect;
    };

/**
 * Check admin status for API routes.
 * Returns session and user if admin, or error object if not.
 */
export async function checkAdminApi(): Promise<AdminCheckResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
  });

  if (!user || user.role !== "admin") {
    return { error: "Forbidden - Admin access required", status: 403 };
  }

  return { session, user };
}

/**
 * Helper to create error response from admin check result.
 */
export function adminErrorResponse(result: { error: string; status: number }) {
  return new Response(JSON.stringify({ error: result.error }), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
}
