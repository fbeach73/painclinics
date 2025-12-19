import { desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { checkAdminApi } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { notFoundLogs } from "@/lib/schema";

export async function GET(request: Request) {
  try {
    const adminCheck = await checkAdminApi();
    if ("error" in adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Get total count and sum of hits
    const statsResult = await db
      .select({
        totalPaths: sql<number>`count(*)`,
        totalHits: sql<number>`sum(${notFoundLogs.hitCount})`,
      })
      .from(notFoundLogs);

    const stats = statsResult[0] || { totalPaths: 0, totalHits: 0 };

    // Get logs ordered by hit count
    const logs = await db
      .select()
      .from(notFoundLogs)
      .orderBy(desc(notFoundLogs.hitCount))
      .limit(limit)
      .offset(offset);

    // Get recent 404s (last 24 hours)
    const recentResult = await db
      .select({
        count: sql<number>`count(*)`,
        hits: sql<number>`sum(${notFoundLogs.hitCount})`,
      })
      .from(notFoundLogs)
      .where(sql`${notFoundLogs.lastSeenAt} > NOW() - INTERVAL '24 hours'`);

    const recent = recentResult[0] || { count: 0, hits: 0 };

    return NextResponse.json({
      stats: {
        totalPaths: Number(stats.totalPaths) || 0,
        totalHits: Number(stats.totalHits) || 0,
        recentPaths: Number(recent.count) || 0,
        recentHits: Number(recent.hits) || 0,
      },
      logs,
      total: Number(stats.totalPaths) || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching 404 stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch 404 stats" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const adminCheck = await checkAdminApi();
    if ("error" in adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const url = new URL(request.url);
    const path = url.searchParams.get("path");

    if (path) {
      // Delete specific path
      await db
        .delete(notFoundLogs)
        .where(sql`${notFoundLogs.path} = ${path}`);
    } else {
      // Clear all logs
      await db.delete(notFoundLogs);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting 404 logs:", error);
    return NextResponse.json(
      { error: "Failed to delete 404 logs" },
      { status: 500 }
    );
  }
}
