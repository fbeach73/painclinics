import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

type AdminCheckResult =
  | { error: string; status: number }
  | {
      session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
      user: typeof schema.user.$inferSelect;
    };

/**
 * Helper to check admin status for API routes
 */
async function checkAdmin(): Promise<AdminCheckResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
  });

  if (!user || user.role !== "admin") {
    return { error: "Forbidden - Admin access required", status: 403 };
  }

  return { session, user };
}

interface UrlIssue {
  clinicId: string;
  title: string;
  issue: string;
  actual: string;
  expected?: string;
}

interface ValidationResult {
  total: number;
  validCount: number;
  issueCount: number;
  categories: {
    missingPrefix: number;
    formatMismatch: number;
    duplicates: number;
    emptyPermalinks: number;
    trailingSlash: number;
    invalidCharacters: number;
  };
  issues: UrlIssue[];
  samplePermalinks: string[];
}

/**
 * GET /api/admin/validate-urls
 * Validate all clinic permalinks for SEO integrity
 */
export async function GET() {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const allClinics = await db
      .select({
        id: schema.clinics.id,
        title: schema.clinics.title,
        permalink: schema.clinics.permalink,
        city: schema.clinics.city,
        stateAbbreviation: schema.clinics.stateAbbreviation,
        postalCode: schema.clinics.postalCode,
      })
      .from(schema.clinics);

    const issues: UrlIssue[] = [];
    const permalinkCounts = new Map<string, string[]>();

    // Category counters
    let missingPrefix = 0;
    let formatMismatch = 0;
    let duplicates = 0;
    let emptyPermalinks = 0;
    let trailingSlash = 0;
    let invalidCharacters = 0;

    // Valid URL characters pattern (alphanumeric, hyphens, forward slashes)
    const validUrlPattern = /^[a-z0-9/-]+$/i;
    // Expected format: pain-management/slug-stateabbrev-zipcode
    const expectedPattern = /^pain-management\/[\w-]+-[a-z]{2}-\d{5}$/i;

    for (const clinic of allClinics) {
      const permalink = clinic.permalink || "";

      // Check for empty permalinks
      if (!permalink.trim()) {
        emptyPermalinks++;
        issues.push({
          clinicId: clinic.id,
          title: clinic.title,
          issue: "Empty permalink",
          actual: "(empty)",
          expected: `pain-management/generated-slug-${clinic.stateAbbreviation?.toLowerCase() || "xx"}-${clinic.postalCode || "00000"}`,
        });
        continue;
      }

      // Check for pain-management prefix
      if (!permalink.startsWith("pain-management/")) {
        missingPrefix++;
        issues.push({
          clinicId: clinic.id,
          title: clinic.title,
          issue: "Missing pain-management prefix",
          actual: permalink,
          expected: `pain-management/${permalink}`,
        });
      }

      // Check for trailing slashes (should not have them in database)
      if (permalink.endsWith("/")) {
        trailingSlash++;
        issues.push({
          clinicId: clinic.id,
          title: clinic.title,
          issue: "Permalink contains trailing slash (should be added by middleware)",
          actual: permalink,
          expected: permalink.slice(0, -1),
        });
      }

      // Check for invalid characters
      if (!validUrlPattern.test(permalink)) {
        invalidCharacters++;
        issues.push({
          clinicId: clinic.id,
          title: clinic.title,
          issue: "Permalink contains invalid URL characters",
          actual: permalink,
          expected:
            "Only lowercase letters, numbers, hyphens, and forward slashes allowed",
        });
      }

      // Check format pattern (only if prefix is correct)
      if (
        permalink.startsWith("pain-management/") &&
        !expectedPattern.test(permalink)
      ) {
        formatMismatch++;
        issues.push({
          clinicId: clinic.id,
          title: clinic.title,
          issue: "Permalink format does not match expected pattern",
          actual: permalink,
          expected: `pain-management/slug-${clinic.stateAbbreviation?.toLowerCase() || "xx"}-${clinic.postalCode || "00000"}`,
        });
      }

      // Track duplicates (case-insensitive)
      const lowerPermalink = permalink.toLowerCase();
      if (!permalinkCounts.has(lowerPermalink)) {
        permalinkCounts.set(lowerPermalink, []);
      }
      permalinkCounts.get(lowerPermalink)!.push(clinic.id);
    }

    // Report duplicates
    for (const [_permalink, ids] of permalinkCounts) {
      if (ids.length > 1) {
        const dupes = allClinics.filter((c) =>
          ids.includes(c.id)
        );
        for (const dupe of dupes) {
          duplicates++;
          issues.push({
            clinicId: dupe.id,
            title: dupe.title,
            issue: `Duplicate permalink (${ids.length} occurrences)`,
            actual: dupe.permalink,
          });
        }
      }
    }

    // Calculate valid count
    const validCount = allClinics.length - new Set(issues.map(i => i.clinicId)).size;

    const result: ValidationResult = {
      total: allClinics.length,
      validCount,
      issueCount: issues.length,
      categories: {
        missingPrefix,
        formatMismatch,
        duplicates,
        emptyPermalinks,
        trailingSlash,
        invalidCharacters,
      },
      // Limit issues to first 100 for response size
      issues: issues.slice(0, 100),
      samplePermalinks: allClinics.slice(0, 10).map((c) => c.permalink),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("URL validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate URLs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/validate-urls
 * Fix common URL issues automatically
 */
export async function POST(request: Request) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === "fix-prefix") {
      // Count affected rows before fix
      const countBefore = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.clinics)
        .where(
          sql`permalink IS NOT NULL AND permalink != '' AND permalink NOT LIKE 'pain-management/%'`
        );
      const rowsToFix = countBefore[0]?.count || 0;

      // Fix clinics missing pain-management prefix
      await db.execute(
        sql`UPDATE clinics
            SET permalink = 'pain-management/' || permalink
            WHERE permalink IS NOT NULL
            AND permalink != ''
            AND NOT permalink LIKE 'pain-management/%'`
      );

      return NextResponse.json({
        success: true,
        action: "fix-prefix",
        message: "Added pain-management prefix to permalinks",
        rowsAffected: rowsToFix,
      });
    }

    if (action === "remove-trailing-slash") {
      // Count affected rows before fix
      const countBefore = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.clinics)
        .where(sql`permalink LIKE '%/'`);
      const rowsToFix = countBefore[0]?.count || 0;

      // Remove trailing slashes from permalinks
      await db.execute(
        sql`UPDATE clinics
            SET permalink = RTRIM(permalink, '/')
            WHERE permalink LIKE '%/'`
      );

      return NextResponse.json({
        success: true,
        action: "remove-trailing-slash",
        message: "Removed trailing slashes from permalinks",
        rowsAffected: rowsToFix,
      });
    }

    if (action === "lowercase") {
      // Count affected rows before fix
      const countBefore = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.clinics)
        .where(sql`permalink != LOWER(permalink)`);
      const rowsToFix = countBefore[0]?.count || 0;

      // Convert all permalinks to lowercase
      await db.execute(
        sql`UPDATE clinics
            SET permalink = LOWER(permalink)
            WHERE permalink != LOWER(permalink)`
      );

      return NextResponse.json({
        success: true,
        action: "lowercase",
        message: "Converted permalinks to lowercase",
        rowsAffected: rowsToFix,
      });
    }

    return NextResponse.json(
      {
        error:
          "Invalid action. Supported actions: fix-prefix, remove-trailing-slash, lowercase",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("URL fix error:", error);
    return NextResponse.json(
      { error: "Failed to fix URLs" },
      { status: 500 }
    );
  }
}
