import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, emailUnsubscribes } from "@/lib/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email belongs to a user
    const userData = await db.query.user.findFirst({
      where: eq(user.email, normalizedEmail),
    });

    if (userData) {
      // Unsubscribe the user
      await db
        .update(user)
        .set({ emailUnsubscribedAt: new Date() })
        .where(eq(user.id, userData.id));

      return NextResponse.json({ success: true });
    }

    // Check if email exists in emailUnsubscribes table
    const existingRecord = await db.query.emailUnsubscribes.findFirst({
      where: eq(emailUnsubscribes.email, normalizedEmail),
    });

    if (existingRecord) {
      // Update existing record
      await db
        .update(emailUnsubscribes)
        .set({ unsubscribedAt: new Date() })
        .where(eq(emailUnsubscribes.id, existingRecord.id));
    } else {
      // Create new unsubscribe record for this email
      await db.insert(emailUnsubscribes).values({
        email: normalizedEmail,
        token: crypto.randomUUID(),
        unsubscribedAt: new Date(),
      });
    }

    // Always return success for privacy (don't reveal if email exists)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing unsubscribe:", error);
    return NextResponse.json(
      { error: "Failed to process unsubscribe" },
      { status: 500 }
    );
  }
}
