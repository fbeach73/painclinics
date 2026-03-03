import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { checkAdminApi } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { clinics, verification } from "@/lib/schema";
import { sendClaimInviteEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const { clinicId } = await params;

  // Get email from body or fall back to clinic's emails
  const body = await request.json().catch(() => ({}));
  let email = body.email as string | undefined;

  // Fetch clinic
  const [clinic] = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      permalink: clinics.permalink,
      emails: clinics.emails,
      ownerUserId: clinics.ownerUserId,
    })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);

  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  if (clinic.ownerUserId) {
    return NextResponse.json(
      { error: "Clinic already has an owner" },
      { status: 400 }
    );
  }

  // Use provided email or first clinic email
  if (!email) {
    email = clinic.emails?.[0];
  }

  if (!email) {
    return NextResponse.json(
      { error: "No email address provided or found for this clinic" },
      { status: 400 }
    );
  }

  // Generate token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Delete any existing invite tokens for this clinic
  const identifier = `claim-invite:${clinicId}`;
  await db.delete(verification).where(eq(verification.identifier, identifier));

  // Store token
  const { createId } = await import("@paralleldrive/cuid2");
  await db.insert(verification).values({
    id: createId(),
    identifier,
    value: token,
    expiresAt,
  });

  // Build URLs
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";
  const clinicUrl = `${baseUrl}/${clinic.permalink}`;
  const claimUrl = `${baseUrl}/claim-invite?token=${token}`;

  // Send email
  const result = await sendClaimInviteEmail(
    email,
    clinic.title,
    clinicUrl,
    claimUrl,
    { clinicId }
  );

  if (!result.success) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    email,
    messageId: result.messageId,
  });
}
