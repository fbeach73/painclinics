import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-demand revalidation API endpoint
 * Usage: POST /api/revalidate with { "path": "/pain-management/..." }
 * Requires secret token for security
 */
export async function POST(request: NextRequest) {
  try {
    // Verify secret token is configured
    const expectedSecret = process.env.REVALIDATE_SECRET;
    if (!expectedSecret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { path, secret } = await request.json();

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
  } catch {
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
  // Verify secret token is configured
  const expectedSecret = process.env.REVALIDATE_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get("path");
  const secret = searchParams.get("secret");

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
  } catch {
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
