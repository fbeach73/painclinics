import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-demand revalidation API endpoint
 * Usage: POST /api/revalidate with { "path": "/pain-management/..." }
 * Requires secret token for security
 */
export async function POST(request: NextRequest) {
  try {
    const { path, secret } = await request.json();

    // Verify secret token
    const expectedSecret = process.env.REVALIDATE_SECRET || "painclinics-revalidate-2024";
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Revalidate the path
    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for simple revalidation via URL
 * Usage: GET /api/revalidate?path=/pain-management/...&secret=...
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get("path");
  const secret = searchParams.get("secret");

  const expectedSecret = process.env.REVALIDATE_SECRET || "painclinics-revalidate-2024";
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  if (!path) {
    return NextResponse.json({ error: "Path is required" }, { status: 400 });
  }

  try {
    revalidatePath(path);
    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
