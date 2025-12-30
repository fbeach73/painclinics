import { NextRequest, NextResponse } from "next/server";
import { sql, desc } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getBroadcast } from "@/lib/broadcast/broadcast-queries";
import { db } from "@/lib/db";
import { emailLogs, clinics } from "@/lib/schema";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/broadcasts/[id]/recipients
 * Get list of recipients with their email delivery status
 *
 * Query params: page, limit
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Check broadcast exists
    const broadcast = await getBroadcast(id);
    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    // Get email logs for this broadcast with clinic info
    // The metadata field contains { broadcastId, clinicId }
    const recipients = await db
      .select({
        logId: emailLogs.id,
        recipientEmail: emailLogs.recipientEmail,
        status: emailLogs.status,
        sentAt: emailLogs.sentAt,
        deliveredAt: emailLogs.deliveredAt,
        openedAt: emailLogs.openedAt,
        clickedAt: emailLogs.clickedAt,
        bouncedAt: emailLogs.bouncedAt,
        errorMessage: emailLogs.errorMessage,
        clinicId: sql<string>`${emailLogs.metadata}->>'clinicId'`,
        clinicName: clinics.title,
      })
      .from(emailLogs)
      .leftJoin(
        clinics,
        sql`${emailLogs.metadata}->>'clinicId' = ${clinics.id}`
      )
      .where(sql`${emailLogs.metadata}->>'broadcastId' = ${id}`)
      .orderBy(desc(emailLogs.sentAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emailLogs)
      .where(sql`${emailLogs.metadata}->>'broadcastId' = ${id}`);

    const total = countResult[0]?.count || 0;

    // Calculate stats
    const statsResult = await db
      .select({
        status: emailLogs.status,
        count: sql<number>`count(*)::int`,
      })
      .from(emailLogs)
      .where(sql`${emailLogs.metadata}->>'broadcastId' = ${id}`)
      .groupBy(emailLogs.status);

    const stats = {
      sent: total, // All logged emails were attempted
      queued: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0,
      failed: 0,
    };

    for (const row of statsResult) {
      if (row.status && row.status in stats) {
        stats[row.status as keyof typeof stats] = row.count;
      }
    }

    // Count opened and clicked separately (from timestamps)
    const openedResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emailLogs)
      .where(sql`${emailLogs.metadata}->>'broadcastId' = ${id} AND ${emailLogs.openedAt} IS NOT NULL`);

    const clickedResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emailLogs)
      .where(sql`${emailLogs.metadata}->>'broadcastId' = ${id} AND ${emailLogs.clickedAt} IS NOT NULL`);

    stats.opened = openedResult[0]?.count || 0;
    stats.clicked = clickedResult[0]?.count || 0;

    return NextResponse.json({
      recipients,
      stats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching recipients:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipients" },
      { status: 500 }
    );
  }
}
