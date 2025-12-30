import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notFoundLogs } from "@/lib/schema";

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const body = await request.json();

    const { path, fullUrl, referrer } = body;

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    const userAgent = headersList.get("user-agent") || undefined;
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || undefined;

    // Check if this path already exists
    const existing = await db
      .select()
      .from(notFoundLogs)
      .where(eq(notFoundLogs.path, path))
      .limit(1);

    const existingRecord = existing[0];

    if (existingRecord) {
      // Update existing record - increment count and update lastSeenAt
      await db
        .update(notFoundLogs)
        .set({
          hitCount: sql`${notFoundLogs.hitCount} + 1`,
          lastSeenAt: new Date(),
          // Update referrer if we have a new one and didn't have one before
          referrer: referrer || existingRecord.referrer,
        })
        .where(eq(notFoundLogs.path, path));
    } else {
      // Create new record
      await db.insert(notFoundLogs).values({
        path,
        fullUrl,
        referrer,
        userAgent,
        ipAddress,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging 404:", error);
    return NextResponse.json(
      { error: "Failed to log 404" },
      { status: 500 }
    );
  }
}
