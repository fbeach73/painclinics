import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clinics, user, verification } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Require authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const token = body.token as string | undefined;

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  // Look up the token
  const [record] = await db
    .select()
    .from(verification)
    .where(
      and(
        sql`${verification.identifier} LIKE 'claim-invite:%'`,
        eq(verification.value, token)
      )
    )
    .limit(1);

  if (!record) {
    return NextResponse.json(
      { error: "Invalid or expired claim link" },
      { status: 400 }
    );
  }

  // Check expiry
  if (new Date() > record.expiresAt) {
    // Clean up expired token
    await db.delete(verification).where(eq(verification.id, record.id));
    return NextResponse.json(
      { error: "This claim link has expired" },
      { status: 400 }
    );
  }

  // Extract clinicId from identifier "claim-invite:{clinicId}"
  const clinicId = record.identifier.replace("claim-invite:", "");

  // Check clinic exists and isn't already claimed
  const [clinic] = await db
    .select({ id: clinics.id, ownerUserId: clinics.ownerUserId, title: clinics.title })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);

  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  if (clinic.ownerUserId) {
    // Clean up token since clinic is already claimed
    await db.delete(verification).where(eq(verification.id, record.id));
    return NextResponse.json(
      { error: "This clinic has already been claimed" },
      { status: 400 }
    );
  }

  const now = new Date();
  const userId = session.user.id;

  // Assign ownership in a transaction
  await db.transaction(async (tx) => {
    // Set clinic ownership
    await tx
      .update(clinics)
      .set({
        ownerUserId: userId,
        isVerified: true,
        claimedAt: now,
      })
      .where(eq(clinics.id, clinicId));

    // Update user role to clinic_owner if not admin
    const [currentUser] = await tx
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (currentUser && currentUser.role !== "admin") {
      await tx
        .update(user)
        .set({ role: "clinic_owner" })
        .where(eq(user.id, userId));
    }

    // Delete the token (single-use)
    await tx.delete(verification).where(eq(verification.id, record.id));
  });

  return NextResponse.json({
    success: true,
    clinicId,
    clinicTitle: clinic.title,
  });
}
