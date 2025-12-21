import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { checkAdminApi } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

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
    fourDigitZip: number;
    zipPlusFour: number;
    brokenUrl: number;
  };
  issues: UrlIssue[];
  samplePermalinks: string[];
}

/**
 * GET /api/admin/validate-urls
 * Validate all clinic permalinks for SEO integrity
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
    let fourDigitZip = 0;
    let zipPlusFour = 0;
    let brokenUrl = 0;

    // Valid URL characters pattern (alphanumeric, hyphens, forward slashes)
    const validUrlPattern = /^[a-z0-9/-]+$/i;
    // Expected format: pain-management/slug-[optional-state]-zipcode[-optional-suffix]
    // Accepts: pain-management/slug-XX-12345, pain-management/slug-12345, pain-management/slug-XX-12345-2
    const expectedPattern = /^pain-management\/[\w-]+(-[a-z]{2})?-\d{5}(-\d+)?$/i;
    // 4-digit zip pattern (missing leading zero) - with state code only
    const fourDigitZipPattern = /-[a-z]{2}-\d{4}$/i;
    // ZIP+4 pattern (9 digits) - with state code only
    const zipPlusFourPattern = /-[a-z]{2}-\d{9}$/i;
    // Broken URL patterns (WordPress URLs, query strings)
    const brokenUrlPattern = /(\?|painclinics\.com)/i;

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

      // Check for specific format issues (only if prefix is correct)
      if (permalink.startsWith("pain-management/")) {
        // Check for broken URLs (WordPress URLs, query strings)
        if (brokenUrlPattern.test(permalink)) {
          brokenUrl++;
          issues.push({
            clinicId: clinic.id,
            title: clinic.title,
            issue: "Broken URL (contains WordPress URL or query string)",
            actual: permalink,
            expected: `Regenerate from: ${clinic.title} + ${clinic.stateAbbreviation} + ${clinic.postalCode}`,
          });
        }
        // Check for 4-digit zip (missing leading zero)
        else if (fourDigitZipPattern.test(permalink)) {
          fourDigitZip++;
          const fixed = permalink.replace(/-([a-z]{2})-(\d{4})$/i, "-$1-0$2");
          issues.push({
            clinicId: clinic.id,
            title: clinic.title,
            issue: "4-digit ZIP (missing leading zero)",
            actual: permalink,
            expected: fixed,
          });
        }
        // Check for ZIP+4 codes (9 digits)
        else if (zipPlusFourPattern.test(permalink)) {
          zipPlusFour++;
          const fixed = permalink.replace(/-([a-z]{2})-(\d{5})\d{4}$/i, "-$1-$2");
          issues.push({
            clinicId: clinic.id,
            title: clinic.title,
            issue: "ZIP+4 code (should be 5 digits)",
            actual: permalink,
            expected: fixed,
          });
        }
        // General format mismatch (doesn't match expected pattern)
        else if (!expectedPattern.test(permalink)) {
          formatMismatch++;
          issues.push({
            clinicId: clinic.id,
            title: clinic.title,
            issue: "Format mismatch (missing state or other issue)",
            actual: permalink,
            expected: `pain-management/slug-${clinic.stateAbbreviation?.toLowerCase() || "xx"}-${String(clinic.postalCode || "00000").substring(0, 5).padStart(5, "0")}`,
          });
        }
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
        fourDigitZip,
        zipPlusFour,
        brokenUrl,
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
  const adminCheck = await checkAdminApi();
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

    if (action === "fix-4digit-zip") {
      // Fix permalinks ending with 4-digit zip (missing leading zero)
      // Pattern: pain-management/slug-XX-1234 -> pain-management/slug-XX-01234
      const countBefore = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.clinics)
        .where(sql`permalink ~ '-[a-zA-Z]{2}-[0-9]{4}$'`);
      const rowsToFix = countBefore[0]?.count || 0;

      await db.execute(
        sql`UPDATE clinics
            SET permalink = regexp_replace(permalink, '-([a-zA-Z]{2})-([0-9]{4})$', '-\\1-0\\2')
            WHERE permalink ~ '-[a-zA-Z]{2}-[0-9]{4}$'`
      );

      return NextResponse.json({
        success: true,
        action: "fix-4digit-zip",
        message: "Added leading zero to 4-digit ZIP codes in permalinks",
        rowsAffected: rowsToFix,
      });
    }

    if (action === "fix-zip4") {
      // Fix permalinks with ZIP+4 codes (9 digits) - truncate to 5 digits
      // Pattern: pain-management/slug-XX-123456789 -> pain-management/slug-XX-12345
      const countBefore = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.clinics)
        .where(sql`permalink ~ '-[a-zA-Z]{2}-[0-9]{9}$'`);
      const rowsToFix = countBefore[0]?.count || 0;

      await db.execute(
        sql`UPDATE clinics
            SET permalink = regexp_replace(permalink, '-([a-zA-Z]{2})-([0-9]{5})[0-9]{4}$', '-\\1-\\2')
            WHERE permalink ~ '-[a-zA-Z]{2}-[0-9]{9}$'`
      );

      return NextResponse.json({
        success: true,
        action: "fix-zip4",
        message: "Truncated ZIP+4 codes to 5-digit ZIP in permalinks",
        rowsAffected: rowsToFix,
      });
    }

    if (action === "check-wordpress") {
      // Fetch all slugs from WordPress and compare with DB
      const WP_API_BASE = "https://wordpress-1356334-4988742.cloudwaysapps.com/wp-json/wp/v2/pain-management";
      const PER_PAGE = 100;
      const wpSlugs: string[] = [];
      let page = 1;
      let hasMore = true;

      // Fetch all pages from WordPress API
      while (hasMore) {
        const res = await fetch(`${WP_API_BASE}?per_page=${PER_PAGE}&page=${page}&_fields=slug`);
        if (!res.ok) {
          if (res.status === 400) {
            // No more pages
            hasMore = false;
            break;
          }
          throw new Error(`WordPress API error: ${res.status}`);
        }
        const posts = await res.json() as { slug: string }[];
        if (posts.length === 0) {
          hasMore = false;
        } else {
          wpSlugs.push(...posts.map(p => p.slug));
          page++;
          // Safety limit
          if (page > 50) hasMore = false;
        }
      }

      // Get all permalinks from DB
      const dbClinics = await db
        .select({
          permalink: schema.clinics.permalink,
          title: schema.clinics.title,
        })
        .from(schema.clinics);

      // Create a set of DB slugs (extract the slug part from permalink)
      // DB format: pain-management/slug-state-zip
      const dbSlugs = new Set(
        dbClinics.map(c => {
          if (!c.permalink) return "";
          // Remove pain-management/ prefix and extract just the slug
          const slug = c.permalink.replace(/^pain-management\//, "");
          return slug.toLowerCase();
        })
      );

      // Find WordPress slugs not in DB
      const missingFromDb: string[] = [];
      for (const wpSlug of wpSlugs) {
        // Check if this slug exists in DB (exact match or partial match)
        const found = dbSlugs.has(wpSlug.toLowerCase()) ||
          [...dbSlugs].some(dbSlug => dbSlug.includes(wpSlug.toLowerCase()));

        if (!found) {
          missingFromDb.push(wpSlug);
        }
      }

      return NextResponse.json({
        success: true,
        action: "check-wordpress",
        message: `Found ${missingFromDb.length} WordPress URLs not in database`,
        wpTotal: wpSlugs.length,
        dbTotal: dbClinics.length,
        missingCount: missingFromDb.length,
        missingSlugs: missingFromDb, // Return all missing slugs
      });
    }

    if (action === "regenerate-broken") {
      // Regenerate permalinks that have WordPress URLs or missing state codes
      // This generates new slugs from title + state + postal_code
      const brokenClinics = await db
        .select({
          id: schema.clinics.id,
          title: schema.clinics.title,
          stateAbbreviation: schema.clinics.stateAbbreviation,
          postalCode: schema.clinics.postalCode,
        })
        .from(schema.clinics)
        .where(
          sql`permalink LIKE '%?%' OR permalink LIKE '%painclinics.com%' OR permalink !~ '-[a-zA-Z]{2}-[0-9]'`
        );

      let fixedCount = 0;
      for (const clinic of brokenClinics) {
        if (!clinic.title || !clinic.stateAbbreviation || !clinic.postalCode) {
          continue;
        }

        // Generate slug from title
        const slug = clinic.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .substring(0, 50);

        // Ensure postal code is 5 digits (pad with leading zeros if needed)
        const zip = clinic.postalCode.toString().substring(0, 5).padStart(5, "0");
        const state = clinic.stateAbbreviation.toLowerCase();

        const newPermalink = `pain-management/${slug}-${state}-${zip}`;

        await db
          .update(schema.clinics)
          .set({ permalink: newPermalink })
          .where(sql`id = ${clinic.id}`);

        fixedCount++;
      }

      return NextResponse.json({
        success: true,
        action: "regenerate-broken",
        message: "Regenerated broken permalinks from clinic data",
        rowsAffected: fixedCount,
      });
    }

    return NextResponse.json(
      {
        error:
          "Invalid action. Supported actions: fix-prefix, remove-trailing-slash, lowercase, fix-4digit-zip, fix-zip4, regenerate-broken",
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
