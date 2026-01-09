import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, subscribed } = body;

    // Verify the user is updating their own preferences
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Update email preferences
    await db
      .update(user)
      .set({
        emailUnsubscribedAt: subscribed ? null : new Date(),
      })
      .where(eq(user.id, userId));

    return NextResponse.json({
      success: true,
      subscribed,
    });
  } catch (error) {
    console.error("Error updating email preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
