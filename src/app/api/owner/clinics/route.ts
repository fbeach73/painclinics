import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getOwnedClinics } from "@/lib/owner-queries";

/**
 * GET /api/owner/clinics - List all clinics owned by the current user
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a clinic owner or admin
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, session.user.id),
    });

    if (!user || !["admin", "clinic_owner"].includes(user.role)) {
      return NextResponse.json(
        { error: "You must be a clinic owner to access this resource" },
        { status: 403 }
      );
    }

    const clinics = await getOwnedClinics(session.user.id);

    return NextResponse.json({ clinics });
  } catch (error) {
    console.error("Error fetching owned clinics:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinics" },
      { status: 500 }
    );
  }
}
