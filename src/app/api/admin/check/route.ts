import { NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-auth";

/**
 * GET /api/admin/check
 * Check if the current user is an admin
 */
export async function GET() {
  const result = await checkAdminApi();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    },
  });
}
