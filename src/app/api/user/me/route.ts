import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userSchema } from "@/lib/schema";

/**
 * Get current user info including role.
 * Used by client components that need to check user role.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ user: null });
    }

    // Get user role from database
    const userData = await db
      .select({ id: userSchema.id, role: userSchema.role })
      .from(userSchema)
      .where(eq(userSchema.id, session.user.id))
      .limit(1);

    if (!userData[0]) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: userData[0].id,
        role: userData[0].role,
      },
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return NextResponse.json({ user: null });
  }
}
