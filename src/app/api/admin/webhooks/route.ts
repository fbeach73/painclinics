import { NextRequest, NextResponse } from "next/server"
import { desc, eq, sql, and, gte, lte } from "drizzle-orm"
import { db } from "@/lib/db"
import * as schema from "@/lib/schema"
import { checkAdminApi } from "@/lib/admin-auth"

/**
 * GET /api/admin/webhooks
 * Get webhook event history with optional filtering
 *
 * Query params:
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 * - status: "processed" | "received" | "failed" | "skipped" (optional)
 * - eventType: string (optional, e.g., "invoice.paid")
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 */
export async function GET(request: NextRequest) {
  const result = await checkAdminApi()
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
  const offset = parseInt(searchParams.get("offset") || "0")
  const status = searchParams.get("status")
  const eventType = searchParams.get("eventType")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  // Build where conditions
  const conditions = []
  if (status) {
    conditions.push(eq(schema.webhookEvents.status, status))
  }
  if (eventType) {
    conditions.push(eq(schema.webhookEvents.eventType, eventType))
  }
  if (startDate) {
    conditions.push(gte(schema.webhookEvents.createdAt, new Date(startDate)))
  }
  if (endDate) {
    conditions.push(lte(schema.webhookEvents.createdAt, new Date(endDate)))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Get events with pagination
  const events = await db.query.webhookEvents.findMany({
    where: whereClause,
    orderBy: [desc(schema.webhookEvents.createdAt)],
    limit,
    offset,
  })

  // Get total count for pagination
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.webhookEvents)
    .where(whereClause)

  const total = Number(countResult[0]?.count || 0)

  // Get summary stats
  const stats = await db
    .select({
      status: schema.webhookEvents.status,
      count: sql<number>`count(*)`,
    })
    .from(schema.webhookEvents)
    .groupBy(schema.webhookEvents.status)

  const summary = {
    processed: 0,
    received: 0,
    failed: 0,
    skipped: 0,
    total: 0,
  }

  for (const stat of stats) {
    const count = Number(stat.count)
    summary.total += count
    if (stat.status in summary) {
      summary[stat.status as keyof typeof summary] = count
    }
  }

  return NextResponse.json({
    events,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + events.length < total,
    },
    summary,
  })
}
