import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { checkAdminApi } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * GET /api/admin/import/batch
 * Get import status - recent batches and clinic count
 */
export async function GET() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    // Get recent import batches
    const batches = await db.query.importBatches.findMany({
      orderBy: (batches, { desc }) => [desc(batches.createdAt)],
      limit: 10,
    });

    // Get clinic count
    const clinicCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.clinics);
    const clinicCount = clinicCountResult[0]?.count || 0;

    return NextResponse.json({
      files: [],
      fileCount: 0,
      dataDirectory: "",
      recentBatches: batches,
      totalClinics: clinicCount,
    });
  } catch (error) {
    console.error("Error getting batch status:", error);
    return NextResponse.json(
      { error: "Failed to get batch status" },
      { status: 500 }
    );
  }
}
